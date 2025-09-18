import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { storeConversation, retrieveConversation, searchMemory } from "@/lib/memory-fallback";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get messages and conversation ID from the request
    const { messages, conversationId, query } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Retrieve past conversation context if conversationId is provided
    let contextualMemories = [];
    if (conversationId) {
      contextualMemories = await retrieveConversation(userId, conversationId);
    }

    // If there's a specific query, search for relevant memories
    let relevantMemories: any[] = [];
    if (query) {
      relevantMemories = await searchMemory(userId, query);
    }

    // Build system message with contextual information
    const systemMessage = {
      role: "system",
      content: `You are a helpful assistant named Galaxy AI. Today is ${new Date().toLocaleDateString()}.`,
    };

    // Add relevant memories as context if found
    if (relevantMemories && relevantMemories.length > 0) {
      systemMessage.content += `\n\nRelevant information from previous conversations:\n${relevantMemories
        .map((mem: any) => `- ${mem.text}`)
        .join("\n")}`;
    }

    // Combine everything for the model
    const messagesWithContext = [systemMessage, ...contextualMemories, ...messages];

    // Use Vercel AI SDK streamText for chat
    const result = await streamText({
      model: google("gemini-2.5-flash"),
      messages: messagesWithContext,
      temperature: 0.7,
    });

    // Store the updated conversation (do this asynchronously)
    if (userId && conversationId) {
      // We can't await the complete text here as it would block the response
      // Instead, we store the messages we sent to the API
      storeConversation(userId, conversationId, messages);
    }

    // Return streaming response
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Error generating response:", error);

    // Always return a Response object, even in error cases
    return Response.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
