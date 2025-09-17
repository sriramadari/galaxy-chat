"use client";

import { useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import Image from "next/image"; // Used for displaying images

interface FileUploadProps {
  // Parameter name matches implementation in handleFileSelect which passes a File object
  // eslint-disable-next-line no-unused-vars
  onFileSelect: (selectedFile: File) => void;
  onFileClear: () => void;
  selectedFile: File | null;
  isUploading: boolean;
}

export default function FileUpload({
  onFileSelect,
  onFileClear,
  selectedFile,
  isUploading,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const isImage = selectedFile?.type.startsWith("image/");
  const fileURL = selectedFile ? URL.createObjectURL(selectedFile) : null;

  return (
    <div className="w-full">
      {selectedFile ? (
        <div className="relative border border-gray-300 dark:border-gray-700 rounded-lg p-2">
          <button
            onClick={onFileClear}
            className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm"
          >
            <X size={16} />
          </button>
          {isImage ? (
            <div className="relative h-32 w-full">
              <Image src={fileURL!} alt="Preview" fill className="object-contain rounded" />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2">
              <FileText size={24} />
              <span className="text-sm truncate">{selectedFile.name}</span>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
              <div className="h-5 w-5 border-2 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 transition-colors ${
            dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag & drop a file here, or click to select
            </p>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => document.getElementById("file-upload")?.click()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
            >
              Select File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
