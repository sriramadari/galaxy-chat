"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizontal, X, Paperclip } from "lucide-react";
import FileUpload from "../upload/FileUpload";

interface MessageInputProps {
  input: string;
  // These event parameters are required for function signature compatibility
  // with parent components even if not directly used in the function bodies
  // eslint-disable-next-line no-unused-vars
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  // eslint-disable-next-line no-unused-vars
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export default function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: MessageInputProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 160; // 10 lines approximately
      textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";
    }
  }, [input]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileClear = () => {
    setSelectedFile(null);
    setUploadedFileUrl(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setUploadedFileUrl(data.secure_url);

      // Close upload panel after successful upload
      setShowUpload(false);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If there's an uploaded file, append its URL to the message
    if (uploadedFileUrl) {
      const fileInput = input + (input ? "\n\n" : "") + `[Attached file](${uploadedFileUrl})`;

      // Call handleSubmit with the updated input value
      handleSubmit({
        ...e,
        preventDefault: () => {}, // Already called above
        currentTarget: {
          ...e.currentTarget,
          value: fileInput,
        },
      } as React.FormEvent<HTMLFormElement>);
      setSelectedFile(null);
      setUploadedFileUrl(null);
    } else {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full">
      {showUpload && (
        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Attach File</h3>
            <button
              onClick={() => setShowUpload(false)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <FileUpload
            onFileSelect={handleFileSelect}
            onFileClear={handleFileClear}
            selectedFile={selectedFile}
            isUploading={isUploading}
          />
          {selectedFile && !uploadedFileUrl && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="mt-3 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          )}
          {uploadedFileUrl && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
              ✓ File uploaded successfully
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        <div className="relative bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-sm hover:border-gray-400 dark:hover:border-gray-500 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 transition-all duration-200">
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none border-0 focus:outline-none focus:ring-0 px-4 py-4 pr-24 text-[15px] leading-6 min-h-[52px] max-h-40"
            placeholder="Message Galaxy AI..."
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading && (input.trim() || uploadedFileUrl)) {
                  handleFormSubmit(e as any);
                }
              }
            }}
          />

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUpload(!showUpload)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isLoading}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-blue-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200 disabled:hover:text-gray-400 dark:disabled:hover:bg-gray-700 transition-all duration-200 shadow-sm"
              disabled={isLoading || (!input.trim() && !uploadedFileUrl)}
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>

      <div className="flex justify-center mt-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Galaxy AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
