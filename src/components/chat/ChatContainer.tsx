"use client";

import React, { useState, useRef, useEffect } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useUser } from "@clerk/nextjs";
import { v4 as uuidv4 } from "uuid";

// Define a basic message type
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatContainerProps {
  conversationId: string;
}

export default function ChatContainer({
  conversationId: initialConversationId,
}: ChatContainerProps) {
  const { user } = useUser();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>(initialConversationId || "");

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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading || !conversationId) return;
    const messageId = uuidv4();
    const newUserMessage: Message = {
      id: messageId,
      role: "user",
      content: userMessage,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);
    try {
      // Save message to DB
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          userId: user?.id,
          role: "user",
          content: userMessage,
        }),
      });
      // Send API request to chat endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          conversationId,
          query: userMessage,
        }),
      });
      if (!response.ok) throw new Error("Failed to get response");

      // Process the streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is empty");

      // Create a temporary buffer for the AI response
      let aiResponseBuffer = "";
      const aiResponseId = Date.now().toString() + "1"; // Unique ID

      // Add an empty AI message that will be updated
      setMessages((prev) => [...prev, { id: aiResponseId, role: "assistant", content: "" }]);

      // Process the stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk and add to buffer
        const chunk = new TextDecoder().decode(value);
        aiResponseBuffer += chunk;

        // Update the AI message with the accumulated text
        setMessages((prev) => {
          // Find and update the last AI message
          const updated = [...prev];
          const aiMessageIndex = updated.length - 1;
          if (updated[aiMessageIndex]?.role === "assistant") {
            updated[aiMessageIndex] = {
              ...updated[aiMessageIndex],
              content: aiResponseBuffer,
            };
          }
          return updated;
        });
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleEditMessage = async (id: string, content: string) => {
    const index = messages.findIndex((m) => m.id === id);
    if (index === -1 || messages[index].role !== "user") return;
    const updatedMessages = [...messages.slice(0, index + 1)];
    updatedMessages[index] = { ...updatedMessages[index], content };
    setMessages(updatedMessages);
    // Update message in DB
    await fetch("/api/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content }),
    });
    // Re-ask for response
    sendMessage(content);
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="flex-grow overflow-auto p-4">
        <MessageList messages={messages} isLoading={isLoading} onEditMessage={handleEditMessage} />
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 p-4">
        <MessageInput
          input={inputValue}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
    </div>
  );
}
