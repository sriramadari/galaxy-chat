import { Memory } from "mem0ai/oss";

// Initialize the Memory instance
const memory = new Memory({
  version: "v1.1",
  embedder: {
    provider: "google",
    config: {
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
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
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
      model: "gemini-2.0-flash-001",
    },
  },
  historyDbPath: "memory.db",
});

// Store conversation messages in memory
export async function storeConversation(userId: string, conversationId: string, messages: any[]) {
  try {
    await memory.add(messages, {
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
  try {
    const options: any = { userId };

    // Add conversationId filter if provided
    if (conversationId) {
      options.metadata = { conversationId };
    }

    const allMemories = await memory.getAll(options);

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
  try {
    const results = await memory.search(query, { userId });

    // Process search results to ensure we return an array
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

// Clear conversation memory
export async function clearConversation(userId: string) {
  try {
    // Delete all memories for this specific user
    await memory.deleteAll({
      userId,
    });
    return true;
  } catch (error) {
    console.error("Failed to clear conversation:", error);
    return false;
  }
}

// Update a specific memory
export async function updateMemory(memoryId: string, content: string) {
  try {
    await memory.update(memoryId, content);
    return true;
  } catch (error) {
    console.error("Failed to update memory:", error);
    return false;
  }
}

// Get memory history
export async function getMemoryHistory(memoryId: string) {
  try {
    const history = await memory.history(memoryId);
    return history;
  } catch (error) {
    console.error("Failed to get memory history:", error);
    return null;
  }
}

// Reset all memories (use with caution)
export async function resetAllMemories() {
  try {
    await memory.reset();
    return true;
  } catch (error) {
    console.error("Failed to reset memories:", error);
    return false;
  }
}
