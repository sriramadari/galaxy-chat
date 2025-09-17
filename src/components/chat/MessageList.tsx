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
}

export default function MessageList({ messages, isLoading, onEditMessage }: MessageListProps) {
  return (
    <div className="flex flex-col gap-6">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} onEdit={onEditMessage} />
      ))}
      {isLoading && (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
      )}
    </div>
  );
}
