import React, { useRef, useState } from "react";
import { Paperclip, X, Upload, Image, FileText, Film } from "lucide-react";

interface Attachment {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  originalName: string;
}

interface FileUploadProps {
  onFilesSelected: (attachments: Attachment[]) => void;
  onRemoveFile: (index: number) => void;
  attachments: Attachment[];
  disabled?: boolean;
}

export default function FileUpload({
  onFilesSelected,
  onRemoveFile,
  attachments,
  disabled,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        const result = await response.json();
        return {
          ...result,
          originalName: file.name,
        };
      } catch (error) {
        console.error("Upload failed for", file.name, ":", error);
        throw error;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      onFilesSelected([...attachments, ...results]);
    } catch (error) {
      alert("Some files failed to upload. Please try again.");
    } finally {
      setUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getFileIcon = (resourceType: string, format: string) => {
    if (resourceType === "image") return <Image className="h-4 w-4" />;
    if (resourceType === "video") return <Film className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="relative">
      {/* Upload Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
        title="Attach files"
      >
        {uploading ? (
          <div className="h-5 w-5 border-2 border-t-blue-500 border-gray-200 dark:border-gray-600 rounded-full animate-spin" />
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Attached Files Preview */}
      {attachments.length > 0 && (
        <div className="absolute bottom-12 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-h-40 overflow-y-auto">
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
              >
                <div className="flex-shrink-0 text-blue-500">
                  {getFileIcon(attachment.resourceType, attachment.format)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {attachment.originalName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.bytes)} • {attachment.format.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
