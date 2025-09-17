import React from "react";
import { Button } from "../ui/Button";
import { Plus } from "lucide-react";

// Use a different name to avoid conflict with the model's Conversation type
interface ConversationItem {
  _id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  messages?: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt?: Date;
  }>;
}

interface SidebarProps {
  conversations: ConversationItem[] | null;
  activeConversationId?: string | null;
  // eslint-disable-next-line no-unused-vars
  onSelect: (id: string) => void; // Parameter name matches implementation
  onNew: () => void;
  isLoading?: boolean;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNew,
  isLoading = false,
}: SidebarProps) {
  return (
    <div className="w-64 h-full border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col">
      <Button className="w-full mb-4" onClick={onNew}>
        <Plus className="h-4 w-4 mr-2" /> New Chat
      </Button>

      <div className="flex-1 overflow-y-auto space-y-2">
        {conversations?.length === 0 && (
          <p className="text-center text-gray-500 mt-8">No conversations yet</p>
        )}

        {isLoading && (
          <div className="flex justify-center mt-8">
            <div className="h-6 w-6 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
          </div>
        )}

        {conversations?.map((conversation) => (
          <div
            key={conversation._id}
            className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
              activeConversationId === conversation._id ? "bg-gray-100 dark:bg-gray-800" : ""
            }`}
            onClick={() => onSelect(conversation._id)}
          >
            <h3 className="font-medium truncate">{conversation.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {conversation.messages && conversation.messages.length > 0
                ? conversation.messages[conversation.messages.length - 1].content.slice(0, 50)
                : "New conversation"}
            </p>
            <span className="text-xs text-gray-400 mt-1 block">
              {new Date(conversation.updatedAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
