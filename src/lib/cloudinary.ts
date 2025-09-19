import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  bytes: number;
  original_filename: string;
}

export const uploadToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  const formData = new FormData();
  formData.append("file", file);

  // Use a simple unsigned preset for testing
  const isImage = file.type.startsWith("image/");
  const uploadPreset = isImage ? "galaxy_images" : "galaxy_files";
  formData.append("upload_preset", uploadPreset);

  // Minimal test: do NOT add extra fields
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${isImage ? "image" : "raw"}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Cloudinary upload error response:", errorText);
    throw new Error("Failed to upload file to Cloudinary");
  }

  return response.json();
};

export const getFileType = (mimeType: string): "image" | "file" => {
  return mimeType.startsWith("image/") ? "image" : "file";
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // File size limit: 10MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 10MB" };
  }

  // Allowed file types
  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Documents
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
    // Code files
    "text/javascript",
    "text/css",
    "text/html",
    "application/json",
    "text/xml",
    "application/xml",
  ];

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "File type not supported" };
  }

  return { isValid: true };
};

export default cloudinary;
