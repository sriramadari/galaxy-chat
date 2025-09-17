import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import { Conversation } from "@/models/conversation";

// Get a specific conversation
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const conversation = await Conversation.findOne({
      _id: params.id,
      userId,
    });

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    return Response.json(conversation);
  } catch (error: any) {
    console.error("Error fetching conversation:", error);
    return Response.json(
      { error: error.message || "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

// Update a specific conversation
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const { title, messages } = await req.json();

    const conversation = await Conversation.findOneAndUpdate(
      { _id: params.id, userId },
      {
        ...(title && { title }),
        ...(messages && { messages }),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    return Response.json(conversation);
  } catch (error: any) {
    console.error("Error updating conversation:", error);
    return Response.json(
      { error: error.message || "Failed to update conversation" },
      { status: 500 }
    );
  }
}

// Delete a specific conversation
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: params.id,
      userId,
    });

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting conversation:", error);
    return Response.json(
      { error: error.message || "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
