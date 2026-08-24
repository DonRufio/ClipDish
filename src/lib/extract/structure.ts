import type { Recipe } from "../types";
import type { LlmParts, SourceContent } from "./types";
import { jsonLdToParts } from "./map";
import { structure as anthropicStructure } from "./providers/anthropic";
import { structure as geminiStructure } from "./providers/gemini";

// Which LLM structures free text. Gemini for now (free tier while testing);
// flip to "anthropic" at go-live — no other code changes. Each provider returns
// the same LlmParts shape.
const PROVIDER = process.env.FOODIE_EXTRACT_PROVIDER ?? "gemini";

function structureWithLlm(text: string): Promise<LlmParts | undefined> {
  return PROVIDER === "anthropic" ? anthropicStructure(text) : geminiStructure(text);
}

// SourceContent → Recipe. Structured (JSON-LD) maps directly; free text goes to
// the configured LLM; nothing usable yields a shell flagged for review. Never throws.
export async function structureRecipe(content: SourceContent): Promise<Recipe> {
  const warnings: string[] = [...content.warnings];
  const base: Recipe = {
    id: crypto.randomUUID(),
    title: content.title ?? "",
    sourceUrl: content.sourceUrl,
    sourceThumbnail: content.thumbnail,
    creatorHandle: content.author,
    ingredients: [],
    steps: [],
    tags: [],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    warnings,
  };

  if (content.structured) {
    const p = jsonLdToParts(content.structured);
    return {
      ...base,
      title: p.title ?? base.title,
      ingredients: p.ingredients,
      steps: p.steps,
      tags: p.tags,
      cookTimeMins: p.cookTimeMins,
      servings: p.servings,
    };
  }

  if (content.text?.trim()) {
    try {
      const p = await structureWithLlm(content.text);
      if (p) {
        return {
          ...base,
          title: p.title || base.title,
          ingredients: p.ingredients,
          steps: p.steps,
          tags: p.tags,
          cookTimeMins: p.cookTimeMins,
          servings: p.servings,
          needsReview: p.ingredients.length === 0, // got text but found no recipe
        };
      }
      warnings.push("Couldn't auto-structure this one — fill in the details below.");
    } catch {
      warnings.push("Extraction failed — fill in the details below.");
    }
  }

  return { ...base, needsReview: true }; // shell: capture preserved, user completes it
}
