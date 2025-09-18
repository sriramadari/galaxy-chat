import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Message from "@/models/message";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  await dbConnect();
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { afterMessageId } = await req.json();
    const { conversationId } = await params;

    // Find the reference message
    const referenceMessage = await Message.findOne({
      _id: afterMessageId,
      conversationId,
      userId,
    });

    if (!referenceMessage) {
      return Response.json({ error: "Reference message not found" }, { status: 404 });
    }

    // Delete all messages created after the reference message
    const deleteResult = await Message.deleteMany({
      conversationId,
      userId,
      createdAt: { $gt: referenceMessage.createdAt },
    });

    return Response.json({
      success: true,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting subsequent messages:", error);
    return Response.json({ error: "Failed to delete messages" }, { status: 500 });
  }
}
