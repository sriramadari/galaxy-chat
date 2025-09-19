"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useUser } from "@clerk/nextjs";
import { useConversationUpdates } from "@/hooks/useConversationUpdates";

// Define a basic message type
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Attachment {
  id: string;
  type: "image" | "file";
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface ChatContainerProps {
  conversationId: string;
}

export default function ChatContainer({
  conversationId: initialConversationId,
}: ChatContainerProps) {
  const { user } = useUser();
  const { emitConversationCreated } = useConversationUpdates();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>(initialConversationId || "");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // On mount, create a new conversation if none exists
  useEffect(() => {
    async function initConversation() {
      if (!conversationId && user) {
        // Create new conversation in DB
        const resp = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            title: `Chat with ${user.firstName || user.username}`,
          }),
        });
        const data = await resp.json();
        setConversationId(data._id);
        // Feed user info to memory
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: `My name is ${user.firstName || user.username}` }],
            conversationId: data._id,
            query: `My name is ${user.firstName || user.username}`,
          }),
        });
      }
    }
    initConversation();
  }, [conversationId, user]);

  // Load messages when conversation changes
  useEffect(() => {
    async function loadMessages() {
      if (conversationId) {
        try {
          const response = await fetch(`/api/messages/${conversationId}`);
          if (response.ok) {
            const messagesData = await response.json();
            const formattedMessages: Message[] = messagesData.map((msg: any) => ({
              id: msg._id,
              role: msg.role,
              content: msg.content,
            }));
            setMessages(formattedMessages);
          }
        } catch (error) {
          console.error("Error loading messages:", error);
        }
      } else {
        setMessages([]);
      }
    }
    loadMessages();
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (userMessage: string, currentAttachments: Attachment[] = []) => {
      if ((!userMessage.trim() && currentAttachments.length === 0) || isLoading) return;

      setInputValue("");
      setIsLoading(true);
      setError(null);

      try {
        // Optimistically add user message
        const tempUserMessage = {
          id: `temp-user-${Date.now()}`,
          role: "user" as const,
          content: userMessage,
          createdAt: new Date().toISOString(),
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

        // Send to chat endpoint with attachments
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversationId === "new" ? undefined : conversationId,
            query: userMessage,
            attachments: currentAttachments, // <-- send attachments here
          }),
        });

        if (!response.ok) throw new Error("Failed to get response");

        // Get conversation ID from response headers (for new conversations)
        const newConversationId = response.headers.get("X-Conversation-ID");
        let actualConversationId = conversationId;

        if (newConversationId && conversationId === "new") {
          actualConversationId = newConversationId;
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

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempAiMessage.id ? { ...msg, content: aiResponse } : msg
              )
            );
          }
        }

        // Refresh messages from DB
        const res = await fetch(`/api/messages/${actualConversationId}`);
        const data = await res.json();
        const mapped = data.map((msg: any) => ({
          id: msg._id || msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        }));
        setMessages(mapped);

        // Trigger conversation list refresh if this was a new conversation
        if (newConversationId && conversationId === "new") {
          emitConversationCreated(newConversationId);
        }
      } catch (error: any) {
        console.error("Failed to send message:", error);
        setError(error.message || "An error occurred");
        setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
        setInputValue(userMessage);
      } finally {
        setIsLoading(false);
        setAttachments([]); // <-- clear attachments after sending
      }
    },
    [conversationId, isLoading, emitConversationCreated]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue, attachments); // <-- pass attachments
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleEditMessage = async (id: string, content: string) => {
    const index = messages.findIndex((m) => m.id === id);
    if (index === -1 || messages[index].role !== "user") return;

    // Remove all messages after the edited message (including AI responses)
    const updatedMessages = [...messages.slice(0, index + 1)];
    updatedMessages[index] = { ...updatedMessages[index], content };
    setMessages(updatedMessages);

    try {
      // Update message in DB instead of creating a new one
      await fetch(`/api/messages/${conversationId}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      // Delete subsequent messages from the database using bulk delete
      await fetch(`/api/messages/${conversationId}/delete-after`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ afterMessageId: id }),
      });

      // Set loading state for re-generation
      setIsLoading(true);

      // Re-generate AI response with the new content
      await generateAIResponse(content, updatedMessages);
    } catch (error) {
      console.error("Error updating message:", error);
      setError("Failed to update message");
      setIsLoading(false);
    }
  };

  const handleReAskMessage = async (id: string) => {
    const messageIndex = messages.findIndex((m) => m.id === id);

    if (messageIndex === -1 || messages[messageIndex].role !== "user") {
      return;
    }

    const userMessage = messages[messageIndex];

    // Remove all messages after this one (including subsequent AI responses)
    const updatedMessages = [...messages.slice(0, messageIndex + 1)];

    // Update the messages state immediately to show the loading state
    setMessages(updatedMessages);

    // Clear any existing errors
    setError(null);

    try {
      // Delete subsequent messages from the database using bulk delete
      await fetch(`/api/messages/${conversationId}/delete-after`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ afterMessageId: id }),
      });

      // Set loading state for re-generation
      setIsLoading(true);

      // Re-generate AI response
      console.log("regerenrating");
      await generateAIResponse(userMessage.content, updatedMessages);
    } catch (error) {
      console.error("Error in re-ask:", error);
      setError("Failed to re-ask message");
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userContent: string, currentMessages: Message[]) => {
    if (!conversationId) return;

    // isLoading is already set in sendMessage, don't set it again here
    setError(null);

    try {
      // Send API request to chat endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages,
          conversationId,
          query: userContent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get response: ${response.status} ${errorText}`);
      }

      // Process the streaming response with simplified approach
      const reader = response.body?.getReader();
      console.log(reader);
      if (!reader) throw new Error("Response body is empty");

      // Create a unique ID for the AI response
      const aiResponseId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      let aiResponseBuffer = "";

      // Add an empty AI message that will be updated during streaming
      setMessages((prev) => [...prev, { id: aiResponseId, role: "assistant", content: "" }]);

      // Simple streaming with immediate updates
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          aiResponseBuffer += chunk;

          // Update the UI immediately with the complete buffer
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === aiResponseId ? { ...msg, content: aiResponseBuffer } : msg
            )
          );
        }
      } finally {
        reader.releaseLock();
      }

      // Save the complete AI response to the database
      if (aiResponseBuffer.trim()) {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            userId: user?.id,
            role: "assistant",
            content: aiResponseBuffer.trim(),
          }),
        });
        console.log("saved");
      }
    } catch (err: any) {
      console.error("AI Response Error:", err);
      setError(err.message || "An error occurred while generating the response");

      // Remove any partial AI response that might have been added
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === "assistant" && !lastMessage.content.trim()) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onEditMessage={handleEditMessage}
          onReAskMessage={handleReAskMessage}
        />
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <MessageInput
            input={inputValue}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
