import React from "react";
import MessageItem from "./MessageItem";
import { Bot } from "lucide-react";

// Define our custom message type
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onEditMessage: (_id: string, _content: string) => void;
  onReAskMessage?: (_id: string) => void;
}

export default function MessageList({
  messages,
  isLoading,
  onEditMessage,
  onReAskMessage,
}: MessageListProps) {
  return (
    <div className="w-full min-h-full">
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-6 bg-green-600 rounded-sm flex items-center justify-center shadow-lg">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              How can I help you today?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              I'm your AI assistant. I can help with writing, analysis, math, coding, creative
              tasks, and much more.
            </p>
          </div>
        </div>
      )}

      <div className="pb-6">
        {messages.map((message, index) => {
          // Check if this is the last assistant message and we're loading
          const isLastAssistantMessage =
            message.role === "assistant" && index === messages.length - 1;
          const isStreaming = isLoading && isLastAssistantMessage;

          return (
            <MessageItem
              key={message.id}
              message={message}
              onEdit={onEditMessage}
              onReAsk={onReAskMessage}
              isStreaming={isStreaming}
            />
          );
        })}

        {/* Show loading indicator when loading and no AI message is being streamed */}
        {isLoading && !messages.some((m) => m.role === "assistant" && m.content === "") && (
          <div className="w-full bg-gray-50/80 dark:bg-gray-800/50">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-sm flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"
                      style={{ animationDelay: "0.15s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
