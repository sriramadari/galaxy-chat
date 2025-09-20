"use client";

import React, { useEffect, useState, useCallback } from "react";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import { useConversationUpdates } from "@/hooks/useConversationUpdates";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  type: "image" | "file";
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export default function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ initialMessage?: string }>;
}) {
  const { emitConversationCreated } = useConversationUpdates();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] = useState(false);
  const paramObj = React.use(params);
  const searchParamsObj = React.use(searchParams);
  const conversationId = paramObj.conversationId;
  const initialMessage = searchParamsObj.initialMessage;
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    async function fetchMessages() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        const data = await res.json();
        // Map _id to id for MessageList compatibility
        const mapped = data.map((msg: any) => ({
          id: msg._id || msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
          attachments: msg.attachments,
        }));
        setMessages(mapped);
      } catch (error: any) {
        console.error("Failed to load messages:", error);
        setError("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMessages();
  }, [conversationId]);

  const sendMessage = useCallback(
    async (userMessage: string, currentAttachments: Attachment[]) => {
      if (!userMessage.trim() || isLoading) return;

      // Clear input immediately and show user message
      setInputValue("");
      setIsLoading(true);
      setError(null);

      try {
        // Immediately add user message to UI
        const tempUserMessage = {
          id: `temp-user-${Date.now()}`,
          role: "user" as const,
          content: userMessage,
          createdAt: new Date().toISOString(),
          attachments: currentAttachments,
        };
        setMessages((prev) => [...prev, tempUserMessage]);

        // Add empty AI message for streaming
        const tempAiMessage = {
          id: `temp-ai-${Date.now()}`,
          role: "assistant" as const,
          content: "",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempAiMessage]);

        // Send to chat endpoint (it will handle saving both messages)
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversationId === "new" ? undefined : conversationId,
            query: userMessage,
            attachments: currentAttachments,
          }),
        });

        if (!response.ok) throw new Error("Failed to get response");

        // Get conversation ID from response headers (for new conversations)
        const newConversationId = response.headers.get("X-Conversation-ID");
        let actualConversationId = conversationId;

        if (newConversationId && conversationId === "new") {
          actualConversationId = newConversationId;
          // Update URL without page reload
          window.history.replaceState(null, "", `/conversations/${newConversationId}`);
        }

        // Stream AI response
        let aiResponse = "";
        const reader = response.body?.getReader();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = new TextDecoder().decode(value);
            aiResponse += chunk;

            // Update the AI message in real-time for streaming effect
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAiMessage.id ? { ...msg, content: aiResponse } : msg
              )
            );
          }
        }

        // After streaming is complete, fetch fresh data from DB to ensure consistency
        const res = await fetch(`/api/messages/${actualConversationId}`);
        const data = await res.json();
        const mapped = data.map((msg: any) => ({
          id: msg._id || msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
          attachments: msg.attachments,
        }));
        setMessages(mapped);

        // Trigger conversation list refresh if this was a new conversation
        if (newConversationId && conversationId === "new") {
          emitConversationCreated(newConversationId);
        }
        setAttachments([]);
      } catch (error: any) {
        console.error("Failed to send message:", error);
        setError(error.message || "An error occurred");
        // Remove the optimistic messages on error and restore input
        setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
        setInputValue(userMessage);
      } finally {
        setIsLoading(false);
        setAttachments([]);
      }
    },
    [conversationId, isLoading, emitConversationCreated]
  );

  // Handle initial message from URL parameter
  useEffect(() => {
    if (initialMessage && !hasProcessedInitialMessage && messages.length === 0 && !isLoading) {
      setHasProcessedInitialMessage(true);
      // Clear the URL parameter
      window.history.replaceState(null, "", `/conversations/${conversationId}`);
      // Send the initial message
      sendMessage(initialMessage, attachments);
    }
  }, [
    initialMessage,
    hasProcessedInitialMessage,
    messages.length,
    isLoading,
    conversationId,
    sendMessage,
  ]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!inputValue.trim() && attachments.length === 0) return;
    const currentAttachments = attachments;
    setAttachments([]); // Clear attachments immediately
    sendMessage(inputValue, currentAttachments);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleEditMessage = async (
    messageId: string,
    newContent: string,
    shouldReAsk: boolean = false
  ) => {
    try {
      setError(null);
      // Update the message in the database
      const response = await fetch("/api/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          content: newContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update message");
      }

      // Update the local state
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === messageId ? { ...msg, content: newContent } : msg))
      );

      // If shouldReAsk is true, trigger re-ask after updating
      if (shouldReAsk) {
        // Wait a bit to ensure the state is updated, then trigger re-ask
        setTimeout(() => {
          handleReAskMessage(messageId);
        }, 100);
      }
    } catch (err: any) {
      setError(err.message || "Failed to edit message");
    }
  };

  const handleReAskMessage = async (messageId: string) => {
    try {
      setError(null);
      setIsLoading(true);

      // Find the user message that we want to re-ask
      const messageToReAsk = messages.find((msg) => msg.id === messageId);
      if (!messageToReAsk || messageToReAsk.role !== "user") {
        throw new Error("Invalid message to re-ask");
      }

      // Use the bulk delete API to remove all messages after this one
      const response = await fetch(`/api/messages/${conversationId}/delete-after`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ afterMessageId: messageId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete subsequent messages");
      }

      // Update local state to show only messages up to the re-asked one
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      const messagesToKeep = messages.slice(0, messageIndex + 1);
      setMessages(messagesToKeep);

      const lastMessageAttachments = messagesToKeep[messagesToKeep.length - 1]?.attachments;

      // Add empty AI message for streaming
      const tempAiMessage = {
        id: `temp-ai-${Date.now()}`,
        role: "assistant" as const,
        content: "",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempAiMessage]);

      // Send to chat endpoint for a new AI response with skipUserSave flag
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          query: messageToReAsk.content,
          attachments: lastMessageAttachments,
          skipUserSave: true, // Don't save the user message again
        }),
      });

      if (!chatResponse.ok) throw new Error("Failed to get response");

      // Stream AI response in real-time
      let aiResponse = "";
      const reader = chatResponse.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          aiResponse += chunk;

          // Update the AI message in real-time for streaming effect
          setMessages((prev) =>
            prev.map((msg) => (msg.id === tempAiMessage.id ? { ...msg, content: aiResponse } : msg))
          );
        }
      }

      // Refresh messages from database to get the final saved state
      const messagesResponse = await fetch(`/api/messages/${conversationId}`);
      const data = await messagesResponse.json();
      const mapped = data.map((msg: any) => ({
        id: msg._id || msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        attachments: msg.attachments,
      }));
      setMessages(mapped);
    } catch (err: any) {
      setError(err.message || "Failed to re-ask message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onEditMessage={handleEditMessage}
          onReAskMessage={handleReAskMessage}
        />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <MessageInput
            input={inputValue}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
          {error && <div className="text-red-500 text-sm mt-2 text-center">{error}</div>}
        </div>
      </div>
    </div>
  );
}
