import React, { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

// Define our custom message type
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageItemProps {
  message: Message;
  // Parameter names match implementation in the parent component's handleEditMessage function
  // which requires these parameter names for proper functioning
  // eslint-disable-next-line no-unused-vars
  onEdit: (id: string, content: string) => void;
}

export default function MessageItem({ message, onEdit }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  // Using onEdit function that takes message.id and editedContent parameters

  const handleSave = () => {
    onEdit(message.id, editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800"
        }`}
      >
        {isEditing && isUser ? (
          <div className="flex flex-col space-y-2">
            <textarea
              className="border rounded p-2 bg-white text-black min-h-[100px]"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="inline-flex items-center text-sm py-2 px-3 rounded-md bg-transparent cursor-pointer"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </button>
              <button
                className="inline-flex items-center text-sm py-2 px-3 rounded-md bg-blue-500 text-white cursor-pointer"
                onClick={handleSave}
              >
                <Check className="h-4 w-4 mr-1" /> Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="whitespace-pre-wrap">{message.content}</div>
            {isUser && (
              <button
                className="inline-flex items-center text-xs py-1 px-2 mt-2 rounded-md bg-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
