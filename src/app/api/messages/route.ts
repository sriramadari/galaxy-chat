import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import { Message } from "@/models/message";

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { conversationId, userId, role, content } = body;
  if (!conversationId || !userId || !role || !content) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }
  const message = await Message.create({ conversationId, userId, role, content });
  return Response.json(message);
}

export async function PUT(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { messageId, content } = body;
  if (!messageId || !content) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }
  const updated = await Message.findByIdAndUpdate(
    messageId,
    { content, edited: true },
    { new: true }
  );
  return Response.json(updated);
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { messageId } = body;
  if (!messageId) {
    return Response.json({ error: "Missing messageId" }, { status: 400 });
  }
  const deleted = await Message.findByIdAndDelete(messageId);
  if (!deleted) {
    return Response.json({ error: "Message not found" }, { status: 404 });
  }
  return Response.json({ success: true });
}
