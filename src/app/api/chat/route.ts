import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { storeConversation, retrieveConversation, searchMemory } from "@/lib/memory";

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
    let contextualMemories: any[] = [];
    if (conversationId) {
      contextualMemories = await retrieveConversation(userId, conversationId);
    }

    // If there's a specific query, search for relevant memories
    let relevantMemories: any[] = [];
    if (query) {
      const searchResults = await searchMemory(userId, query);
      // Convert search results to the format we need
      relevantMemories = Array.isArray(searchResults) ? searchResults : searchResults || [];
    }

    // Build system message with contextual information
    const systemMessage = {
      role: "system",
      content: `You are a helpful assistant named Galaxy AI. Today is ${new Date().toLocaleDateString()}.`,
    };

    // Add relevant memories as context if found
    if (relevantMemories && relevantMemories.length > 0) {
      // Extract text content from memory results
      const memoryTexts = relevantMemories.map((mem: any) => {
        // Handle different memory result formats
        const content =
          mem.text ||
          mem.content ||
          (mem.message ? mem.message.content : null) ||
          JSON.stringify(mem);
        return `- ${content}`;
      });

      systemMessage.content += `\n\nRelevant information from previous conversations:\n${memoryTexts.join("\n")}`;
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
      // Use Promise.resolve to handle this asynchronously without awaiting
      Promise.resolve(storeConversation(userId, conversationId, messages)).catch((err) =>
        console.error("Error storing conversation:", err)
      );
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
