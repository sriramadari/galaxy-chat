import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import { Conversation } from "@/models/conversation";
import Message from "@/models/message";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { conversationId } = await context.params;

  try {
    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting conversation:", error);
    return Response.json(
      { error: error.message || "Failed to delete conversation" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { conversationId } = await context.params;

  try {
    const { title } = await request.json();

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId },
      { title: title.trim(), updatedAt: new Date() },
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
