import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import { Conversation } from "@/models/conversation";

// List conversations for the current user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const conversations = await Conversation.find(
      { userId },
      { title: 1, updatedAt: 1, createdAt: 1 } // Only return these fields
    ).sort({ updatedAt: -1 });

    return Response.json(conversations);
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return Response.json(
      { error: error.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// Create a new conversation
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const { title } = await request.json();

    const conversation = await Conversation.create({
      title: title || "New Conversation",
      userId,
      messages: [],
    });

    return Response.json(conversation);
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return Response.json(
      { error: error.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}
