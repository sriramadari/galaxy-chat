import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Conversation from "@/models/conversation";
import { streamText } from "ai";
import { createMem0 } from "@mem0/vercel-ai-provider";

const mem0 = createMem0({
  provider: "google",
  mem0ApiKey: process.env.MEM0_API_KEY,
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

interface GenerateTitleRequest {
  conversationId: string;
  firstMessage: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { conversationId, firstMessage }: GenerateTitleRequest = await req.json();

    if (!conversationId || !firstMessage?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the conversation belongs to the user
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Generate title using AI
    const titlePrompt = `Generate a short, descriptive title (max 4-5 words) for this conversation based on the user's message. Only respond with the title, no quotes or extra text: "${firstMessage.trim()}"`;

    let cleanTitle = "";

    try {
      // Check if we have API credentials
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY || !process.env.MEM0_API_KEY) {
        throw new Error("Missing API credentials");
      }

      const result = await streamText({
        model: mem0("gemini-2.0-flash-exp", { user_id: userId }),
        messages: [{ role: "user", content: titlePrompt }],
        temperature: 0.3, // Lower temperature for more consistent titles
      });

      let titleContent = "";
      for await (const chunk of result.textStream) {
        if (chunk) {
          titleContent += chunk;
        }
      }

      if (titleContent.trim()) {
        // Clean up the title (remove quotes, extra spaces, etc.)
        cleanTitle = titleContent
          .trim()
          .replace(/['"]/g, "") // Remove quotes
          .replace(/\.$/, "") // Remove trailing period
          .replace(/^Title:\s*/i, "") // Remove "Title:" prefix if present
          .substring(0, 50); // Limit length
      }
    } catch (aiError: any) {
      console.error("AI title generation failed:", aiError);
      // Use fallback immediately
      cleanTitle = "";
    }

    // If AI failed or returned empty, use fallback title
    if (!cleanTitle || cleanTitle === "New Conversation") {
      const words = firstMessage.trim().split(" ").slice(0, 4);
      cleanTitle = words.join(" ") + (firstMessage.trim().split(" ").length > 4 ? "..." : "");
    }

    const finalTitle = cleanTitle || "New Conversation";

    // Update the conversation in the database
    await Conversation.findByIdAndUpdate(conversationId, {
      title: finalTitle,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      title: finalTitle,
      success: true,
    });
  } catch (error: any) {
    console.error("Generate title error:", error);
    return NextResponse.json(
      { error: "Failed to generate title", title: "New Conversation" },
      { status: 500 }
    );
  }
}
