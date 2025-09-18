import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    console.log("Testing direct Gemini API");
    console.log("API Key exists:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    // Simple system message
    const systemMessage = {
      role: "system",
      content: "You are a helpful assistant named Galaxy AI.",
    };

    // Combine messages
    const allMessages = [systemMessage, ...messages];

    // Use Gemini directly
    const result = await streamText({
      model: google("gemini-2.5-flash"),
      messages: allMessages,
      temperature: 0.7,
    });

    // Return streaming response
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Direct Gemini API error:", error);
    return Response.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
