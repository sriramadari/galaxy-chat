import mongoose, { Schema } from "mongoose";

export interface IMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface IConversation {
  title: string;
  userId: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  id: { type: String, required: true },
  role: { type: String, required: true, enum: ["user", "assistant"] },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new Schema<IConversation>({
  title: { type: String, required: true },
  userId: { type: String, required: true },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Delete and update timestamps
conversationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Conversation =
  mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", conversationSchema);
