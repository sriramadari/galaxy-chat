import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { createMem0, addMemories, retrieveMemories } from "@mem0/vercel-ai-provider";
import dbConnect from "@/lib/db";
import Conversation from "@/models/conversation";
import Message from "@/models/message";

const mem0 = createMem0({
  provider: "google",
  mem0ApiKey: process.env.MEM0_API_KEY,
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

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

    try {
      const body = await req.json();
      conversationId = body.conversationId;
      userMessage = body.query; // The current user message to process
      const skipUserSave = body.skipUserSave; // Flag to skip saving user message (for re-ask scenarios)

      // Check if this is a new conversation (no conversationId provided)
      if (!conversationId) {
        isNewConversation = true;
        // Create new conversation
        const newConversation = new Conversation({
          userId,
          title: "New Conversation",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const savedConversation = await newConversation.save();
        conversationId = (savedConversation._id as any).toString();
      }

      // Save the current user message (don't duplicate existing ones)
      // Only save if this is a genuinely new message and not a re-ask
      if (!skipUserSave) {
        const existingMessage = await Message.findOne({
          conversationId,
          userId,
          role: "user",
          content: userMessage,
          createdAt: { $gte: new Date(Date.now() - 5000) }, // Within last 5 seconds
        });

        if (!existingMessage) {
          await Message.create({
            conversationId,
            userId,
            role: "user",
            content: userMessage,
          });
        }
      }
    } catch {
      return Response.json({ error: "Invalid request format" }, { status: 400 });
    }

    await addMemories([{ role: "user", content: [{ type: "text", text: userMessage }] }], {
      user_id: userId,
    });

    // Retrieve context from Mem0
    const memoryContext = await retrieveMemories("Current conversation context", {
      user_id: userId,
    });

    // Get all messages for conversation
    const allMessages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    const formattedMessages = allMessages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Build system message with clear objectives
    const systemMessage = {
      role: "system",
      content: `You are Galaxy AI, an intelligent and helpful assistant. Today is ${new Date().toLocaleDateString()}.

OBJECTIVES:
- Provide clear, accurate, and helpful responses
- When discussing code, use proper formatting and explain concepts clearly
- Be concise but thorough in your explanations
- Adapt your communication style to the user's technical level
- For complex topics, break down information into digestible parts

CONTEXT: ${memoryContext}

Remember: You can help with coding, explanations, problem-solving, creative tasks, and general questions. Always strive to be helpful and informative.`,
    };

    const messagesWithContext = [systemMessage, ...formattedMessages];

    // Stream Gemini response
    let result;
    try {
      result = await streamText({
        model: mem0("gemini-2.5-flash", { user_id: userId }),
        messages: messagesWithContext,
        temperature: 0.7,
      });
    } catch (error: any) {
      console.error("Error in doStream:", error);

      // Handle specific AI service errors
      if (error.statusCode === 503 || error.message?.includes("overloaded")) {
        return Response.json(
          {
            error: "The AI service is currently overloaded. Please try again in a few moments.",
          },
          { status: 503 }
        );
      } else if (error.statusCode >= 500) {
        return Response.json(
          {
            error: "AI service temporarily unavailable. Please try again later.",
          },
          { status: 503 }
        );
      } else {
        return Response.json(
          {
            error: "Failed to generate response. Please try again.",
          },
          { status: 500 }
        );
      }
    }

    // Create a readable stream for the client
    const stream = new ReadableStream({
      async start(controller) {
        let aiReply = "";

        try {
          for await (const chunk of result.textStream) {
            aiReply += chunk;
            // Send chunk to client immediately
            controller.enqueue(new TextEncoder().encode(chunk));
          }

          // Only save AI message to DB if we have content
          if (aiReply.trim()) {
            await Message.create({
              conversationId,
              userId,
              role: "assistant",
              content: aiReply,
            });

            // Add AI memory
            await addMemories([{ role: "assistant", content: [{ type: "text", text: aiReply }] }], {
              user_id: userId,
            });

            // Generate meaningful title for new conversations
            if (isNewConversation) {
              try {
                // Create a title generation request
                const titlePrompt = `Based on this conversation starter: "${userMessage}", generate a concise, descriptive title (max 6 words) that captures the main topic or intent. Return only the title, no quotes or extra text.`;

                const titleResult = await streamText({
                  model: mem0("gemini-2.5-flash", { user_id: userId }),
                  messages: [{ role: "user", content: titlePrompt }],
                  temperature: 0.3,
                });

                let generatedTitle = "";
                for await (const chunk of titleResult.textStream) {
                  generatedTitle += chunk;
                }

                // Clean and validate the title
                const cleanTitle = generatedTitle.trim().replace(/["']/g, "").slice(0, 60);
                const finalTitle =
                  cleanTitle || userMessage.split(" ").slice(0, 6).join(" ") + "...";

                await Conversation.findByIdAndUpdate(conversationId, {
                  title: finalTitle,
                  updatedAt: new Date(),
                });
              } catch (error) {
                console.error("Title generation failed:", error);
                // Fallback to user message excerpt
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
          console.error("Streaming failed or method not implemented.", error);
          controller.error(new Error("Streaming failed"));
        }
      },
    });

    // Return streaming response to client with proper headers for streaming
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
      {
        error: "Internal server error. Please try again later.",
      },
      { status: 500 }
    );
  }
}
