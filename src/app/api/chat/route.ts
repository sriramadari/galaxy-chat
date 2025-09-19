import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { createMem0, addMemories, retrieveMemories } from "@mem0/vercel-ai-provider";
import dbConnect from "@/lib/db";
import Conversation from "@/models/conversation";
import Message from "@/models/message";
import { google } from "@ai-sdk/google";
import MemoryClient, { Message as MemMessage, MemoryOptions } from "mem0ai";

const mem0 = createMem0({
  provider: "google",
  mem0ApiKey: process.env.MEM0_API_KEY,
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const memoryClient = new MemoryClient({ apiKey: process.env.MEM0_API_KEY || "" });

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let conversationId: string;
    let userMessage: string;
    let isNewConversation = false;
    let attachments: any[] = [];

    try {
      const body = await req.json();
      conversationId = body.conversationId;
      userMessage = body.query;
      attachments = body.attachments || [];
      const skipUserSave = body.skipUserSave;

      if (!conversationId) {
        isNewConversation = true;
        const newConversation = new Conversation({
          userId,
          title: "New Conversation",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const savedConversation = await newConversation.save();
        conversationId = (savedConversation._id as any).toString();
      }

      if (!skipUserSave) {
        const existingMessage = await Message.findOne({
          conversationId,
          userId,
          role: "user",
          content: userMessage,
          createdAt: { $gte: new Date(Date.now() - 5000) },
        });

        if (!existingMessage) {
          await Message.create({
            conversationId,
            userId,
            role: "user",
            content: userMessage,
            attachments: attachments.length ? [attachments[0]] : [],
          });
        }
      }
    } catch {
      return Response.json({ error: "Invalid request format" }, { status: 400 });
    }

    // -------- MEMORY HANDLING --------
    let memoryContext: any;
    if (attachments.length > 0) {
      // Use MemoryClient
      const memMessages: MemMessage[] = [{ role: "user", content: userMessage }];
      const memOptions: MemoryOptions = { user_id: userId };
      await memoryClient.add(memMessages, memOptions);

      const filters = {
        AND: [
          {
            user_id: userId,
          },
        ],
      };

      memoryContext = await memoryClient.search(userMessage, { version: "v2", filters });
    } else {
      // Use old mem0 addMemories/retrieveMemories
      await addMemories([{ role: "user", content: [{ type: "text", text: userMessage }] }], {
        user_id: userId,
      });
      memoryContext = await retrieveMemories("Current conversation context", { user_id: userId });
    }

    // -------- Build messages --------
    const allMessages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    const formattedMessages = allMessages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    const systemMessage = {
      role: "system",
      content: `You are **Galaxy AI**, a highly intelligent and helpful assistant.
      Today is ${new Date().toLocaleDateString()}.

      ---
      OBJECTIVES:
      - Always address the user with name (can get from memory context given) when responding, when it feels natural.
      - Provide clear, accurate, and helpful answers across technical and non-technical topics.
      - For code-related queries:
          • Use proper code formatting (markdown blocks).
          • Explain the logic step by step in simple language.
          • Suggest improvements or best practices when relevant.
      - Be concise but thorough in explanations.
      - Adapt your tone and detail level to user’s technical background.
      - For complex topics, break them down into easy-to-follow parts.

      ---
      ATTACHMENTS HANDLING:
      - If user provides attachments (images, PDFs, documents, etc.):
          • First, describe what the attachment contains (if possible).
          • Then, process and integrate its content into the answer.
          • Always connect insights from the attachment with the ongoing conversation/context.
          • If the attachment is unclear or corrupted, politely ask user for clarification.

      ---
      CONTEXT:
      ${memoryContext}
      
      ---
      BEHAVIOR:
      - Stay polite, professional, and encouraging.
      - Always aim to provide practical value, whether it’s technical help, explanations, or suggestions.
      - Proactively suggest related ideas if they might help user, but keep the main focus on his query.
      `,
    };

    const messagesWithContext: any[] = [systemMessage, ...formattedMessages];

    if (attachments.length > 0) {
      // With attachment: build user content with file
      const file = attachments[0];
      const userContent = [
        { type: "text", text: userMessage },
        {
          type: "file",
          mediaType: file.mimeType,
          data: file.url,
          filename: file.name,
        },
      ];
      messagesWithContext.push({ role: "user", content: userContent });
    }

    // -------- Model selection --------
    let result;
    try {
      if (attachments.length > 0) {
        // With attachments → google model directly
        result = await streamText({
          model: google("gemini-2.5-flash"),
          messages: messagesWithContext,
          temperature: 0.7,
        });
      } else {
        // Normal query → mem0 wrapper
        result = await streamText({
          model: mem0("gemini-2.5-flash", { user_id: userId }),
          messages: messagesWithContext,
          temperature: 0.7,
        });
      }
    } catch (error: any) {
      console.error("Error in doStream:", error);
      return Response.json(
        { error: "AI service temporarily unavailable. Please try again later." },
        { status: error.statusCode || 500 }
      );
    }

    // -------- Streaming response --------
    const stream = new ReadableStream({
      async start(controller) {
        let aiReply = "";
        try {
          for await (const chunk of result.textStream) {
            aiReply += chunk;
            controller.enqueue(new TextEncoder().encode(chunk));
          }

          if (aiReply.trim()) {
            await Message.create({
              conversationId,
              userId,
              role: "assistant",
              content: aiReply,
            });

            if (attachments.length > 0) {
              await memoryClient.add([{ role: "assistant", content: aiReply }], {
                user_id: userId,
              });
            } else {
              await addMemories(
                [{ role: "assistant", content: [{ type: "text", text: aiReply }] }],
                {
                  user_id: userId,
                }
              );
            }

            if (isNewConversation) {
              try {
                const titlePrompt = `Based on this conversation starter: "${userMessage}", generate a concise, descriptive title (max 6 words). Return only the title.`;
                const titleResult = await streamText({
                  model:
                    attachments.length > 0
                      ? google("gemini-1.5-flash")
                      : mem0("gemini-2.5-flash", { user_id: userId }),
                  messages: [{ role: "user", content: titlePrompt }],
                  temperature: 0.3,
                });

                let generatedTitle = "";
                for await (const chunk of titleResult.textStream) {
                  generatedTitle += chunk;
                }

                const cleanTitle = generatedTitle.trim().replace(/["']/g, "").slice(0, 60);
                const finalTitle =
                  cleanTitle || userMessage.split(" ").slice(0, 6).join(" ") + "...";

                await Conversation.findByIdAndUpdate(conversationId, {
                  title: finalTitle,
                  updatedAt: new Date(),
                });
              } catch (error) {
                console.error("Title generation failed:", error);
                const fallbackTitle = userMessage.split(" ").slice(0, 6).join(" ") + "...";
                await Conversation.findByIdAndUpdate(conversationId, {
                  title: fallbackTitle,
                  updatedAt: new Date(),
                });
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error("Streaming failed:", error);
          controller.error(new Error("Streaming failed"));
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Conversation-ID": conversationId,
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
