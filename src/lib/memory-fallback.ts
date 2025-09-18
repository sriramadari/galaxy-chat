/**
 * Fallback memory implementation that doesn't use the mem0ai library
 * Use this when the main memory implementation fails
 */

// Simple in-memory storage
const memoryStore: Record<string, any[]> = {};

export const isMemoryConfigured = () => {
  return true; // This implementation always works
};

export async function storeConversation(userId: string, conversationId: string, messages: any[]) {
  try {
    const key = `${userId}:${conversationId}`;
    memoryStore[key] = memoryStore[key] || [];
    memoryStore[key].push(...messages);
    return true;
  } catch (error) {
    console.error("Failed to store conversation in fallback memory:", error);
    return false;
  }
}

export async function retrieveConversation(userId: string, conversationId?: string) {
  try {
    if (!conversationId) return [];
    const key = `${userId}:${conversationId}`;
    return memoryStore[key] || [];
  } catch (error) {
    console.error("Failed to retrieve conversation from fallback memory:", error);
    return [];
  }
}

export async function searchMemory(userId: string, query: string) {
  try {
    // Simple implementation that just returns all messages for this user
    const userKeys = Object.keys(memoryStore).filter((key) => key.startsWith(`${userId}:`));
    const allUserMessages = userKeys.flatMap((key) => memoryStore[key]);
    return allUserMessages.filter(
      (message) =>
        message.content &&
        typeof message.content === "string" &&
        message.content.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error("Failed to search memory in fallback implementation:", error);
    return [];
  }
}

export async function clearConversation(userId: string) {
  try {
    const userKeys = Object.keys(memoryStore).filter((key) => key.startsWith(`${userId}:`));
    userKeys.forEach((key) => delete memoryStore[key]);
    return true;
  } catch (error) {
    console.error("Failed to clear conversation in fallback memory:", error);
    return false;
  }
}

export async function updateMemory(_memoryId: string, _content: string) {
  // Not implemented in fallback
  return false;
}
