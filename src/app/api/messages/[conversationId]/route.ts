import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/models/message";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  await dbConnect();
  const { conversationId } = await context.params;
  if (!conversationId) {
    return Response.json({ error: "Missing conversationId" }, { status: 400 });
  }
  const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
  return Response.json(messages);
}
