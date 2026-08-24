import Anthropic from "@anthropic-ai/sdk";
import type { LlmParts } from "../types";
import { EXTRACT_SYSTEM } from "./prompt";

// Haiku 4.5 by choice (cost) — see FOODIE_ANTHROPIC_MODEL to override.
const MODEL = process.env.FOODIE_ANTHROPIC_MODEL ?? "claude-haiku-4-5";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          original: { type: "string" },
          name: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          category: { type: "string" },
        },
        required: ["original", "name"],
      },
    },
    steps: { type: "array", items: { type: "string" } },
    tags: { type: "array", items: { type: "string" } },
    cookTimeMins: { type: "integer" },
    servings: { type: "integer" },
  },
  required: ["title", "ingredients", "steps", "tags"],
} as const;

export async function structure(text: string): Promise<LlmParts | undefined> {
  if (!process.env.ANTHROPIC_API_KEY) return undefined; // runs keyless in dev
  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: EXTRACT_SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: text }],
  });
  if (res.stop_reason === "refusal") return undefined;
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return undefined;
  return JSON.parse(block.text) as LlmParts;
}
