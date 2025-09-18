import { Memory } from "mem0ai/oss";
import { addMemories, retrieveMemories, getMemories } from "@mem0/vercel-ai-provider";

let memoryInstance: Memory | null = null;
let initializationError: Error | null = null;
let isInitialized = false;

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
console.log("GOOGLE_GENERATIVE_AI_API_KEY:", process.env.GOOGLE_GENERATIVE_AI_API_KEY);
// Defensive check before initializing Memory
if (typeof apiKey === "string" && apiKey.length > 0) {
  try {
    memoryInstance = new Memory({
      version: "v1.1",
      embedder: {
        provider: "google",
        config: {
          apiKey,
          model: "text-embedding-004",
        },
      },
      vectorStore: {
        provider: "memory",
        config: {
          collectionName: "memories",
          dimension: 768,
        },
      },
      llm: {
        provider: "gemini",
        config: {
          apiKey,
          model: "gemini-2.0-flash-001",
        },
      },
      historyDbPath: "memory.db",
    });
    isInitialized = true;
    console.log("Memory system initialized successfully");
  } catch (error) {
    initializationError = error as Error;
    console.error("Failed to initialize memory:", error);
  }
} else {
  initializationError = new Error("Missing or invalid GOOGLE_GENERATIVE_AI_API_KEY");
  console.error("Memory initialization skipped:", initializationError.message);
}

export const isMemoryConfigured = () => !!memoryInstance && isInitialized;

export const getMemoryStatus = () => ({
  isInitialized,
  hasInstance: !!memoryInstance,
  errorMessage: initializationError?.message,
  errorStack: initializationError?.stack,
});

// Store conversation messages in memory
export async function storeConversation(userId: string, conversationId: string, messages: any[]) {
  if (!userId || !conversationId || !messages || !Array.isArray(messages)) {
    console.error("Invalid parameters for storeConversation", {
      userId,
      conversationId,
      messageCount: messages?.length,
    });
    return false;
  }

  if (!memoryInstance) {
    console.error("Cannot store conversation: Memory system not initialized");
    return false;
  }

  try {
    await memoryInstance.add(messages, {
      userId,
      metadata: { conversationId },
    });
    return true;
  } catch (error) {
    console.error("Failed to store conversation:", error);
    return false;
  }
}

// Retrieve conversation context
export async function retrieveConversation(userId: string, conversationId?: string) {
  if (!userId) {
    console.error("Missing userId in retrieveConversation");
    return [];
  }

  if (!memoryInstance) {
    console.error("Cannot retrieve conversation: Memory system not initialized");
    return [];
  }

  try {
    const options: any = { userId };

    // Add conversationId filter if provided
    if (conversationId) {
      options.metadata = { conversationId };
    }

    const allMemories = await memoryInstance.getAll(options);

    // Ensure we return an array
    if (Array.isArray(allMemories)) {
      return allMemories;
    } else {
      // Handle potential object response by extracting data
      const memoryResults = allMemories as any;
      return memoryResults?.results || memoryResults?.messages || [];
    }
  } catch (error) {
    console.error("Failed to retrieve conversation:", error);
    return [];
  }
}

// Search for relevant memory based on user query
export async function searchMemory(userId: string, query: string) {
  if (!userId || !query) {
    console.error("Missing userId or query in searchMemory");
    return [];
  }

  if (!memoryInstance) {
    console.error("Cannot search memory: Memory system not initialized");
    return [];
  }

  try {
    const results = await memoryInstance.search(query, { userId });

    if (Array.isArray(results)) {
      return results;
    } else if (results && results.results && Array.isArray(results.results)) {
      return results.results;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Failed to search memory:", error);
    return [];
  }
}

// Update other methods similarly
export async function clearConversation(userId: string) {
  if (!memoryInstance) return false;

  try {
    await memoryInstance.deleteAll({ userId });
    return true;
  } catch (error) {
    console.error("Failed to clear conversation:", error);
    return false;
  }
}

export async function updateMemory(memoryId: string, content: string) {
  if (!memoryInstance) return false;

  try {
    await memoryInstance.update(memoryId, content);
    return true;
  } catch (error) {
    console.error("Failed to update memory:", error);
    return false;
  }
}

export async function getMemoryHistory(memoryId: string) {
  if (!memoryInstance) return null;

  try {
    const history = await memoryInstance.history(memoryId);
    return history;
  } catch (error) {
    console.error("Failed to get memory history:", error);
    return null;
  }
}

export async function resetAllMemories() {
  if (!memoryInstance) return false;

  try {
    await memoryInstance.reset();
    return true;
  } catch (error) {
    console.error("Failed to reset memories:", error);
    return false;
  }
}

// Test Mem0 integration
export async function testMem0Integration(userId: string, messages: any[]) {
  try {
    // const mem0 = createMem0({
    //   provider: "google",
    //   mem0ApiKey: process.env.MEM0_API_KEY,
    //   apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    //   mem0Config: { user_id: userId },
    // });

    // Add memories
    await addMemories(messages, { user_id: userId });
    console.log("Memories added successfully");

    // Retrieve memories (system prompt)
    const systemPrompt = await retrieveMemories("Test prompt", { user_id: userId });
    console.log("Retrieved system prompt:", systemPrompt);

    // Get raw memories
    const rawMemories = await getMemories("Test prompt", { user_id: userId });
    console.log("Raw memories:", rawMemories);

    return { systemPrompt, rawMemories };
  } catch (error) {
    console.error("Mem0 integration test failed:", error);
    return null;
  }
}
