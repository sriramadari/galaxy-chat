import { useCallback } from "react";

// Global event emitter for conversation updates
type ConversationUpdateType = "created" | "titleUpdated" | "deleted";

interface ConversationUpdateEvent {
  type: ConversationUpdateType;
  conversationId?: string;
  title?: string;
}

class ConversationEventEmitter {
  private listeners: ((_event: ConversationUpdateEvent) => void)[] = [];

  subscribe(listener: (_event: ConversationUpdateEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(_event: ConversationUpdateEvent) {
    this.listeners.forEach((listener) => listener(_event));
  }
}

const conversationEventEmitter = new ConversationEventEmitter();

export function useConversationUpdates() {
  const emitConversationCreated = useCallback((conversationId: string) => {
    conversationEventEmitter.emit({ type: "created", conversationId });
  }, []);

  const emitTitleUpdated = useCallback((conversationId: string, title: string) => {
    conversationEventEmitter.emit({ type: "titleUpdated", conversationId, title });
  }, []);

  const emitConversationDeleted = useCallback((conversationId: string) => {
    conversationEventEmitter.emit({ type: "deleted", conversationId });
  }, []);

  const subscribe = useCallback((listener: (_event: ConversationUpdateEvent) => void) => {
    return conversationEventEmitter.subscribe(listener);
  }, []);

  return {
    emitConversationCreated,
    emitTitleUpdated,
    emitConversationDeleted,
    subscribe,
  };
}
