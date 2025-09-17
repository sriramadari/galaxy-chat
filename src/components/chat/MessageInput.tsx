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
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Upload File</h3>
            <button onClick={() => setShowUpload(false)}>
              <X size={18} />
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
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 pr-12 resize-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] max-h-[200px]"
            placeholder="Message Galaxy AI..."
            value={input}
            onChange={handleInputChange}
            rows={1}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="absolute right-2 bottom-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Upload className="h-5 w-5" />
          </button>
        </div>
        <button
          type="submit"
          className="p-2 rounded-lg bg-blue-500 text-white disabled:opacity-50"
          disabled={isLoading || (!input.trim() && !uploadedFileUrl)}
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
