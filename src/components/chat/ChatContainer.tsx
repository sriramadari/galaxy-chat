"use client";

import React, { useState, useRef, useEffect } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useUser } from "@clerk/nextjs";

// Define a basic message type
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatContainerProps {
  conversationId: string;
}

export default function ChatContainer({ conversationId }: ChatContainerProps) {
  // Using useUser hook for auth context without destructuring to avoid unused vars
  useUser();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    // Create a new message ID
    const messageId = Date.now().toString();

    // Add user message to state
    const newUserMessage: Message = {
      id: messageId,
      role: "user",
      content: userMessage,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Send API request to our chat endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          conversationId, // Include the conversation ID
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

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

  const handleEditMessage = (id: string, content: string) => {
    // Find the message to edit
    const index = messages.findIndex((m) => m.id === id);
    if (index === -1) return;

    // Only allow editing user messages
    if (messages[index].role !== "user") return;

    // Update the message
    const updatedMessages = [...messages.slice(0, index + 1)];
    updatedMessages[index] = {
      ...updatedMessages[index],
      content,
    };

    // Set the updated messages
    setMessages(updatedMessages);

    // Generate new response based on edited message
    sendMessage("Please respond to my edited message above");
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
