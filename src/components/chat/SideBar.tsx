import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Plus, Trash2, X, Edit2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

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
  activeId: string | null;

  onSelect: (_id: string) => void; // Parameter name matches implementation
  onNew: () => void;
  onDelete: (_id: string) => void;
  onUpdateTitle?: (_id: string, _title: string) => Promise<boolean>;
  isLoading?: boolean;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onUpdateTitle,
  isLoading = false,
  isMobileOpen = false,
  onMobileToggle,
}: SidebarProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      onDelete(conversationId);
    }
  };

  const startEditing = (e: React.MouseEvent, conversation: ConversationItem) => {
    e.stopPropagation();
    setEditingId(conversation._id);
    setEditingTitle(conversation.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const saveTitle = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!editingTitle.trim() || !onUpdateTitle) return;

    setIsUpdating(true);
    try {
      const success = await onUpdateTitle(conversationId, editingTitle.trim());
      if (success) {
        setEditingId(null);
        setEditingTitle("");
      }
    } catch (error) {
      console.error("Failed to update title:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent, conversationId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle(e as any, conversationId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  const handleSelect = (conversationId: string) => {
    onSelect(conversationId);
    router.push(`/conversations/${conversationId}`);
    // Close mobile sidebar after selection
    if (onMobileToggle && isMobileOpen) {
      onMobileToggle();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50
        transition-transform duration-300 ease-in-out
        w-64 md:w-64
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Conversations</h2>
          <button
            onClick={onMobileToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col h-full">
          <Button className="w-full mb-4" onClick={onNew} title="New Chat (Ctrl+Shift+N)">
            <Plus className="h-4 w-4 mr-2" /> New Chat
          </Button>

          <div className="flex-1 overflow-y-auto space-y-2 pb-16 md:pb-4">
            {conversations?.length === 0 && !isLoading && (
              <p className="text-center text-gray-500 mt-8">No conversations yet</p>
            )}

            {isLoading && (
              <div className="flex justify-center mt-8">
                <div className="h-6 w-6 border-2 border-t-blue-500 border-gray-200 dark:border-gray-600 rounded-full animate-spin"></div>
              </div>
            )}

            {conversations?.map((conversation) => (
              <div
                key={conversation._id}
                className={`p-3 rounded-lg cursor-pointer group relative transition-colors ${
                  activeId === conversation._id
                    ? "bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => editingId !== conversation._id && handleSelect(conversation._id)}
              >
                <div className="pr-20">
                  {editingId === conversation._id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => handleTitleKeyDown(e, conversation._id)}
                      className="w-full bg-transparent border-b border-blue-300 dark:border-blue-600 outline-none text-sm font-medium text-gray-900 dark:text-gray-100"
                      autoFocus
                      disabled={isUpdating}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3
                      className={`font-medium truncate ${
                        activeId === conversation._id
                          ? "text-blue-900 dark:text-blue-100"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {conversation.title}
                    </h3>
                  )}
                  <span
                    className={`text-xs mt-1 block ${
                      activeId === conversation._id
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-400"
                    }`}
                  >
                    {new Date(conversation.updatedAt).toLocaleString()}
                  </span>
                </div>

                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  {editingId === conversation._id ? (
                    <>
                      <button
                        className="p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200"
                        onClick={(e) => saveTitle(e, conversation._id)}
                        title="Save title"
                        disabled={isUpdating}
                      >
                        <Check className="h-3 w-3 text-green-600" />
                      </button>
                      <button
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditing();
                        }}
                        title="Cancel"
                        disabled={isUpdating}
                      >
                        <X className="h-3 w-3 text-gray-500" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200"
                        onClick={(e) => startEditing(e, conversation)}
                        title="Edit title"
                      >
                        <Edit2 className="h-3 w-3 text-blue-500" />
                      </button>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                        onClick={(e) => handleDelete(e, conversation._id)}
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
