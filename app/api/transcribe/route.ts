import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 30;

const MODEL = "gemini-flash-latest";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const audio = body?.audio;
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "audio/webm";

  if (typeof audio !== "string" || !audio) {
    return NextResponse.json({ error: "audio is required" }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Transcribe this audio exactly, then lightly clean up grammar and punctuation for readability. Return ONLY the cleaned transcript text, nothing else — no preamble, no quotes.",
            },
            { inlineData: { mimeType, data: audio } },
          ],
        },
      ],
    });

    const text = response.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Could not transcribe audio" }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 502 }
    );
  }
}
