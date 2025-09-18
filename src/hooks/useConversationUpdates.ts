"use client";

import { useCallback } from "react";

// Define the event types
export interface ConversationCreatedEvent {
  type: "conversationCreated";
  conversationId: string;
}

export interface ConversationUpdatedEvent {
  type: "conversationUpdated";
  conversationId: string;
  updates: {
    title?: string;
    updatedAt?: string;
  };
}

export interface ConversationDeletedEvent {
  type: "conversationDeleted";
  conversationId: string;
}

export type ConversationEvent =
  | ConversationCreatedEvent
  | ConversationUpdatedEvent
  | ConversationDeletedEvent;

// Custom event dispatcher for conversation updates
export const useConversationUpdates = () => {
  const emitConversationCreated = useCallback((conversationId: string) => {
    const event = new CustomEvent<ConversationCreatedEvent>("conversationUpdate", {
      detail: {
        type: "conversationCreated",
        conversationId,
      },
    });
    window.dispatchEvent(event);
  }, []);

  const emitConversationUpdated = useCallback(
    (conversationId: string, updates: { title?: string; updatedAt?: string }) => {
      const event = new CustomEvent<ConversationUpdatedEvent>("conversationUpdate", {
        detail: {
          type: "conversationUpdated",
          conversationId,
          updates,
        },
      });
      window.dispatchEvent(event);
    },
    []
  );

  const emitConversationDeleted = useCallback((conversationId: string) => {
    const event = new CustomEvent<ConversationDeletedEvent>("conversationUpdate", {
      detail: {
        type: "conversationDeleted",
        conversationId,
      },
    });
    window.dispatchEvent(event);
  }, []);

  const subscribeToConversationUpdates = useCallback(
    (callback: (event: ConversationEvent) => void) => {
      console.log("Setting up conversation updates subscription");

      const handleConversationUpdate = (e: Event) => {
        const customEvent = e as CustomEvent<ConversationEvent>;
        console.log("Received conversation update event:", customEvent.detail);
        callback(customEvent.detail);
      };

      window.addEventListener("conversationUpdate", handleConversationUpdate);
      console.log("Conversation update listener attached");

      return () => {
        console.log("Removing conversation update listener");
        window.removeEventListener("conversationUpdate", handleConversationUpdate);
      };
    },
    []
  );

  return {
    emitConversationCreated,
    emitConversationUpdated,
    emitConversationDeleted,
    subscribeToConversationUpdates,
  };
};
