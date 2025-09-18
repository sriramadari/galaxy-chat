"use client";

import React, { useState } from "react";
import MessageInput from "@/components/chat/MessageInput";
import { useRouter } from "next/navigation";
import { useConversationUpdates } from "@/hooks/useConversationUpdates";

export default function NewConversationPage() {
  const router = useRouter();
  const { emitConversationCreated } = useConversationUpdates();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      // Send to chat endpoint without conversationId (will create new conversation)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      // Get conversation ID from response headers
      const conversationId = response.headers.get("X-Conversation-ID");

      if (conversationId) {
        // Emit conversation created event
        emitConversationCreated(conversationId);
        // Navigate to the new conversation
        router.push(`/conversations/${conversationId}`);
      } else {
        throw new Error("Failed to create conversation");
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
      setInputValue("");
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Welcome Message */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-6">🚀</div>
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Start a New Conversation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Ask me anything! I can help with coding, explanations, creative tasks, problem-solving,
            and much more.
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
              <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">📚 Learning</h3>
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
    </div>
  );
}
