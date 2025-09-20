import mongoose, { Schema, Document } from "mongoose";

interface IAttachment {
  id: string;
  type: "image" | "file";
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  publicId?: string; // Cloudinary public_id for deletion
}

interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: string;
  role: "user" | "assistant";
  content: string;
  attachments?: IAttachment[];
  createdAt: Date;
  edited?: boolean;
}

const AttachmentSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ["image", "file"], required: true },
  url: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: Number },
  mimeType: { type: String },
  publicId: { type: String }, // For Cloudinary cleanup
});

const MessageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  userId: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  attachments: [AttachmentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  edited: { type: Boolean, default: false },
});

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
