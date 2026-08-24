import type { Ingredient } from "../types";

// What an LLM provider returns after structuring free text. Every provider
// (Anthropic, Gemini, …) returns this exact shape, so the rest of the pipeline
// never knows or cares which LLM ran.
export interface LlmParts {
  title: string;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  cookTimeMins?: number;
  servings?: number;
}

// schema.org/Recipe, the fields we use. Present on many recipe web pages as
// JSON-LD — when we have this, we map directly and skip the LLM.
export interface RecipeJsonLd {
  name?: string;
  image?: string | string[] | { url?: string };
  recipeIngredient?: string[];
  recipeInstructions?: string | Array<string | { text?: string; name?: string }>;
  recipeYield?: string | number | (string | number)[];
  totalTime?: string; // ISO 8601 duration, e.g. "PT25M"
  keywords?: string | string[];
  recipeCuisine?: string | string[];
  recipeCategory?: string | string[];
  author?: string | { name?: string };
}

// What every adapter returns — normalized so structure.ts doesn't care which
// platform it came from.
export interface SourceContent {
  platform: string;
  sourceUrl: string;
  title?: string;
  author?: string; // creator handle
  thumbnail?: string;
  text?: string; // caption/description/transcript — free text for the LLM
  structured?: RecipeJsonLd; // already-structured (web pages) → skips the LLM
  warnings: string[];
}
