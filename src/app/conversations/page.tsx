"use client";

import { Bot } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ConversationsPage() {
  const router = useRouter();

  const handleNewConversation = () => {
    router.push("/conversations/new");
  };

  return (
    <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 mx-auto mb-6 bg-green-600 rounded-sm flex items-center justify-center shadow-lg">
          <Bot className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
          Welcome to Galaxy Chat
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Start a new conversation to begin chatting with your AI assistant.
        </p>
        <button
          onClick={handleNewConversation}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          Start New Conversation
        </button>
      </div>
    </div>
  );
}
