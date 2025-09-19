import React, { useState, useRef } from "react";
import { Button } from "../ui/Button";
import { Send, Paperclip, X, Upload, Image as ImageIcon, FileText } from "lucide-react";

interface Attachment {
  id: string;
  type: "image" | "file";
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface MessageInputProps {
  input: string;
  handleInputChange: (_e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (_e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  attachments?: Attachment[];
  onAttachmentsChange: (_attachments: Attachment[]) => void;
}

export default function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  attachments = [],
  onAttachmentsChange,
}: MessageInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: Attachment[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        // Debug: log FormData contents
        for (const [key, value] of formData.entries()) {
          console.log("FormData entry:", key, value);
        }

        // --- Replace with actual upload API call ---
        // const response = await fetch('/api/upload', { method: 'POST', body: formData });
        // const { attachment } = await response.json();
        const response = {
          success: true,
          attachment: {
            id: Math.random().toString(36).slice(2),
            type: file.type.startsWith("image") ? "image" : "file",
            url: "https://res.cloudinary.com/dkilulg3q/image/upload/v1758224162/h4sxuz2oo9bhqcvhmfnv.jpg",
            name: file.name,
            size: file.size,
            mimeType: file.type,
            publicId: "h4sxuz2oo9bhqcvhmfnv",
          },
        };
        const { attachment } = response;
        const fixedAttachment = {
          ...attachment,
          type: attachment.mimeType.startsWith("image/") ? "image" : "file",
        } as Attachment;
        newAttachments.push(fixedAttachment);
      }
      if (onAttachmentsChange) {
        console.log("newAttachments pushed:", newAttachments);
        onAttachmentsChange(newAttachments);
      }
    } catch (error) {
      console.error("Failed to upload files:", error);
      alert(`Failed to upload files: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (attachmentId: string) => {
    if (onAttachmentsChange) {
      onAttachmentsChange(attachments.filter((att) => att.id !== attachmentId));
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-2 pl-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative group bg-gray-100 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 flex items-center gap-2 max-w-xs"
              >
                <div className="flex-shrink-0">
                  {attachment.type === "image" ? (
                    <ImageIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                    {attachment.name}
                  </p>
                  {attachment.size && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.size)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit({ ...e, attachments } as any);
        }}
        className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-1 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <button
          type="button"
          onClick={openFileDialog}
          disabled={isLoading || isUploading}
          className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 disabled:opacity-50"
          title="Attach file or image"
        >
          {isUploading ? (
            <Upload className="h-5 w-5 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => {
            handleFileSelect(e);
          }}
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.js,.css,.html,.json,.xml"
          className="hidden"
        />
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 border-none outline-none resize-none px-2 py-2 min-h-[44px] max-h-[160px] rounded-xl focus:ring-0 placeholder-gray-500 dark:placeholder-gray-400"
          rows={1}
          style={{ minHeight: "44px", maxHeight: "160px", height: "auto" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit({ ...e, attachments } as any);
            }
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 160) + "px";
          }}
          disabled={isLoading || isUploading}
        />
        <Button
          type="submit"
          disabled={(!input.trim() && attachments.length === 0) || isLoading || isUploading}
          className="h-11 w-11 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl flex items-center justify-center transition-colors duration-200"
          title="Send message"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-xl flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Upload className="h-5 w-5 animate-spin" />
            Uploading files...
          </div>
        </div>
      )}
    </div>
  );
}

// NOTE: Attachments will only show after upload if the parent component updates its state
// and passes the new attachments prop to MessageInput. Example parent usage:
//
// const [attachments, setAttachments] = useState<Attachment[]>([]);
// <MessageInput
//   ...otherProps
//   attachments={attachments}
//   onAttachmentsChange={setAttachments}
// />
//
// If you do this, attachments will update and display correctly.
