import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Message from "@/models/message";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  await dbConnect();
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content } = await req.json();
    const { conversationId, messageId } = await params;

    // Update the message
    const updatedMessage = await Message.findOneAndUpdate(
      { _id: messageId, conversationId, userId },
      { content, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedMessage) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    // Remove all subsequent messages in this conversation after this message
    await Message.deleteMany({
      conversationId,
      createdAt: { $gt: updatedMessage.createdAt },
    });

    return Response.json(updatedMessage);
  } catch (error) {
    console.error("Error updating message:", error);
    return Response.json({ error: "Failed to update message" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  await dbConnect();
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId, messageId } = await params;

    // Delete the message
    const deletedMessage = await Message.findOneAndDelete({
      _id: messageId,
      conversationId,
      userId,
    });

    if (!deletedMessage) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    return Response.json({ success: true, deletedMessage });
  } catch (error) {
    console.error("Error deleting message:", error);
    return Response.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
