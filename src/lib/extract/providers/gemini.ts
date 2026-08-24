import type { LlmParts } from "../types";
import { EXTRACT_SYSTEM } from "./prompt";

// Google AI Studio (Gemini) via plain REST — generous free tier for testing.
// No SDK: it's a single POST. responseMimeType forces JSON; the shape comes from
// EXTRACT_SYSTEM. Get a key at aistudio.google.com → GEMINI_API_KEY.
const MODEL = process.env.FOODIE_GEMINI_MODEL ?? "gemini-3.6-flash";

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export async function structure(text: string): Promise<LlmParts | undefined> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return undefined; // runs keyless in dev

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: EXTRACT_SYSTEM }] },
        contents: [{ parts: [{ text }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) return undefined;

  const data = (await res.json()) as GeminiResponse;
  const out = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) return undefined;
  return JSON.parse(out) as LlmParts;
}
