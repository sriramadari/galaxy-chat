"use client";

import React, { useState } from "react";
import MessageInput from "@/components/chat/MessageInput";
import MessageList from "@/components/chat/MessageList";
import { useConversationUpdates } from "@/hooks/useConversationUpdates";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function NewConversationPage() {
  const { emitConversationCreated } = useConversationUpdates();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    // Clear input immediately and show user message
    setInputValue("");
    setIsLoading(true);
    setError(null);
    setHasStartedConversation(true);

    try {
      // Immediately add user message to UI
      const tempUserMessage = {
        id: `temp-user-${Date.now()}`,
        role: "user" as const,
        content: userMessage,
        createdAt: new Date().toISOString(),
      };
      setMessages([tempUserMessage]);

      // Add empty AI message for streaming
      const tempAiMessage = {
        id: `temp-ai-${Date.now()}`,
        role: "assistant" as const,
        content: "",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempAiMessage]);

      // Send to chat endpoint (it will create the conversation and handle both messages)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: undefined, // This will create a new conversation
          query: userMessage,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);

        if (response.status === 503) {
          throw new Error(
            "The AI service is currently overloaded. Please try again in a few moments."
          );
        } else if (response.status >= 500) {
          throw new Error("Server error occurred. Please try again later.");
        } else {
          throw new Error(`Failed to get response: ${response.status}`);
        }
      }

      // Get conversation ID from response headers
      const newConversationId = response.headers.get("X-Conversation-ID");

      if (newConversationId) {
        setConversationId(newConversationId);
        // Update URL without page reload to reflect the conversation ID
        window.history.replaceState(null, "", `/conversations/${newConversationId}`);
        // Emit conversation created event for sidebar update
        emitConversationCreated(newConversationId);
      }

      // Stream AI response
      let aiResponse = "";
      const reader = response.body?.getReader();

      if (reader) {
        try {
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
        } catch (streamError) {
          console.error("Streaming error:", streamError);
          // If streaming fails, show an error message in the AI response
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAiMessage.id
                ? {
                    ...msg,
                    content:
                      "Sorry, I encountered an error while generating the response. The AI service might be overloaded. Please try again in a moment.",
                  }
                : msg
            )
          );
          throw new Error("AI service is temporarily unavailable. Please try again.");
        }
      }

      // Only fetch fresh data if we have a conversation ID and got some response
      if (newConversationId && aiResponse.trim()) {
        try {
          const res = await fetch(`/api/messages/${newConversationId}`);
          if (res.ok) {
            const data = await res.json();
            const mapped = data.map((msg: any) => ({
              id: msg._id || msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: msg.createdAt,
            }));
            setMessages(mapped);
          }
        } catch (fetchError) {
          console.error("Failed to fetch fresh messages:", fetchError);
          // Continue with the current messages if fetching fails
        }
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);

      // Provide more specific error messages
      let errorMessage = "An error occurred";
      if (error.message.includes("AI service is temporarily unavailable")) {
        errorMessage = error.message;
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message.includes("overloaded")) {
        errorMessage = "The AI service is currently overloaded. Please try again in a few moments.";
      } else {
        errorMessage = error.message || "An unexpected error occurred";
      }

      setError(errorMessage);

      // Remove the optimistic messages on error and restore input
      setMessages([]);
      setInputValue(userMessage);
      setHasStartedConversation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleEditMessage = async (
    messageId: string,
    newContent: string,
    shouldReAsk: boolean = false
  ) => {
    if (!conversationId) return;

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
    if (!conversationId) return;

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
          skipUserSave: true, // Don't save the user message again
        }),
      });

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error("Re-ask API Error:", chatResponse.status, errorText);

        if (chatResponse.status === 503) {
          throw new Error(
            "The AI service is currently overloaded. Please try again in a few moments."
          );
        } else if (chatResponse.status >= 500) {
          throw new Error("Server error occurred. Please try again later.");
        } else {
          throw new Error(`Failed to get response: ${chatResponse.status}`);
        }
      }

      // Stream AI response in real-time
      let aiResponse = "";
      const reader = chatResponse.body?.getReader();
      if (reader) {
        try {
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
        } catch (streamError) {
          console.error("Re-ask streaming error:", streamError);
          // If streaming fails, show an error message in the AI response
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempAiMessage.id
                ? {
                    ...msg,
                    content:
                      "Sorry, I encountered an error while generating the response. The AI service might be overloaded. Please try again in a moment.",
                  }
                : msg
            )
          );
          throw new Error("AI service is temporarily unavailable. Please try again.");
        }
      }

      // Refresh messages from database to get the final saved state (only if we got some response)
      if (aiResponse.trim()) {
        try {
          const messagesResponse = await fetch(`/api/messages/${conversationId}`);
          if (messagesResponse.ok) {
            const data = await messagesResponse.json();
            const mapped = data.map((msg: any) => ({
              id: msg._id || msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: msg.createdAt,
            }));
            setMessages(mapped);
          }
        } catch (fetchError) {
          console.error("Failed to fetch fresh messages after re-ask:", fetchError);
          // Continue with current messages if fetching fails
        }
      }
    } catch (err: any) {
      console.error("Failed to re-ask message:", err);

      // Provide more specific error messages
      let errorMessage = "Failed to re-ask message";
      if (err.message.includes("AI service is temporarily unavailable")) {
        errorMessage = err.message;
      } else if (err.message.includes("overloaded")) {
        errorMessage = "The AI service is currently overloaded. Please try again in a few moments.";
      } else if (err.message.includes("Server error")) {
        errorMessage = err.message;
      } else {
        errorMessage = err.message || "An unexpected error occurred while re-asking";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {!hasStartedConversation ? (
        <>
          {/* Welcome Message */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-2xl">
              <div className="text-6xl mb-6">🚀</div>
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Start a New Conversation
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Ask me anything! I can help with coding, explanations, creative tasks,
                problem-solving, and much more.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-xl mx-auto mb-8">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">
                    💻 Development
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Code reviews, debugging, architecture advice, and learning new technologies.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">
                    📚 Learning
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Explanations, tutorials, concept clarification, and study assistance.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-purple-600 dark:text-purple-400">
                    🎨 Creative
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Writing, brainstorming, design ideas, and creative problem-solving.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-orange-600 dark:text-orange-400">
                    🔧 Problem Solving
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Troubleshooting, analysis, optimization, and finding solutions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto">
              <MessageInput
                input={inputValue}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
              />
              {error && <div className="text-red-500 text-sm mt-2 text-center">{error}</div>}
            </div>
          </div>
        </>
      ) : (
        <>
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
              />
              {error && <div className="text-red-500 text-sm mt-2 text-center">{error}</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
