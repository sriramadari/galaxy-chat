import React from "react";
import MessageItem from "./MessageItem";

// Define our custom message type
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  // Parameter names match implementation in the parent component's handleEditMessage function
  // which requires these parameter names for proper functioning
  // eslint-disable-next-line no-unused-vars
  onEditMessage: (id: string, content: string) => void;
  // eslint-disable-next-line no-unused-vars
  onReAskMessage?: (id: string) => void;
}

export default function MessageList({
  messages,
  isLoading,
  onEditMessage,
  onReAskMessage,
}: MessageListProps) {
  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      {messages.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
          <p className="text-sm">Ask me anything and I'll do my best to help!</p>
        </div>
      )}

      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onEdit={onEditMessage}
          onReAsk={onReAskMessage}
        />
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div
                className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
