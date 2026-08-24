import type { Ingredient } from "../types";
import type { RecipeJsonLd } from "./types";

// ISO 8601 duration → minutes. "PT25M" → 25, "PT1H30M" → 90. Undefined if unparseable.
export function parseDuration(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const m = /^P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?/.exec(iso);
  if (!m) return undefined;
  const mins = (m[1] ? +m[1] * 60 : 0) + (m[2] ? +m[2] : 0);
  return mins || undefined;
}

function toArray(v: unknown): string[] {
  if (v == null) return [];
  return (Array.isArray(v) ? v : [v]).map(String).map((s) => s.trim()).filter(Boolean);
}

// The recipe fields we can lift straight out of JSON-LD, no LLM. Ingredient
// quantities aren't parsed here (JSON-LD gives the human line only) — the user
// can fix amounts, and Phase 3 consolidation normalizes names.
export function jsonLdToParts(r: RecipeJsonLd): {
  title?: string;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  cookTimeMins?: number;
  servings?: number;
} {
  const ingredients: Ingredient[] = toArray(r.recipeIngredient).map((line) => ({
    original: line,
    name: line.toLowerCase(),
  }));

  let steps: string[] = [];
  const ri = r.recipeInstructions;
  if (typeof ri === "string") {
    steps = ri.split(/\r?\n+/).map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(ri)) {
    steps = ri
      .map((s) => (typeof s === "string" ? s : (s?.text ?? s?.name ?? "")))
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const tags = [
    ...toArray(r.keywords),
    ...toArray(r.recipeCuisine),
    ...toArray(r.recipeCategory),
  ];

  const yieldRaw = Array.isArray(r.recipeYield) ? r.recipeYield[0] : r.recipeYield;
  const servings = yieldRaw != null ? parseInt(String(yieldRaw), 10) || undefined : undefined;

  return {
    title: r.name,
    ingredients,
    steps,
    tags: [...new Set(tags)],
    cookTimeMins: parseDuration(r.totalTime),
    servings,
  };
}
