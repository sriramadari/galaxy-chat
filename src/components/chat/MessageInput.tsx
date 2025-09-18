"use client";

import { useState } from "react";
import { Upload, SendHorizontal, X } from "lucide-react";
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
        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Upload File</h3>
            <button
              onClick={() => setShowUpload(false)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
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
              className="mt-3 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          )}
          {uploadedFileUrl && (
            <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-sm">
              ✓ File uploaded successfully
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 pr-12 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[54px] max-h-[160px]"
            placeholder="Message Galaxy AI..."
            value={input}
            onChange={handleInputChange}
            rows={1}
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
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="absolute right-2 bottom-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            disabled={isLoading}
          >
            <Upload className="h-5 w-5" />
          </button>
        </div>
        <button
          type="submit"
          className="p-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
          disabled={isLoading || (!input.trim() && !uploadedFileUrl)}
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
