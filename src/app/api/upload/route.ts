import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadToCloudinary, validateFile, getFileType } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    try {
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file);

      // Create attachment object
      const attachment = {
        id: crypto.randomUUID(),
        type: getFileType(file.type),
        url: uploadResult.secure_url,
        name: uploadResult.original_filename || file.name,
        size: uploadResult.bytes,
        mimeType: file.type,
        publicId: uploadResult.public_id,
      };

      return NextResponse.json({
        success: true,
        attachment,
      });
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload endpoint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
