import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Message from "@/models/message";

export async function POST(req: Request) {
  await dbConnect();
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { conversationId, content, role } = await req.json();

    // Check if a message with identical content exists in the last 10 seconds
    const existingMessage = await Message.findOne({
      conversationId,
      role,
      content,
      createdAt: { $gte: new Date(Date.now() - 10000) }, // Within last 10 seconds
    });

    return Response.json({ isDuplicate: !!existingMessage });
  } catch (error) {
    console.error("Error checking duplicate:", error);
    return Response.json({ isDuplicate: false });
  }
}
