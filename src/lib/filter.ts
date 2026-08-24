import type { Recipe } from "./types";

export interface RecipeFilter {
  query?: string; // matches title or any ingredient name
  tags?: string[]; // recipe must include ALL of these (narrowing)
  maxCookTime?: number; // minutes; recipes with unknown time are excluded when set
  favoritesOnly?: boolean;
}

// Pure filter — the one bit of real logic in Phase 2, so it's unit-tested (filter.test.ts).
export function filterRecipes(recipes: Recipe[], f: RecipeFilter): Recipe[] {
  const q = f.query?.trim().toLowerCase();
  return recipes.filter((r) => {
    if (f.favoritesOnly && !r.isFavorite) return false;
    if (f.tags?.length && !f.tags.every((t) => r.tags.includes(t))) return false;
    if (f.maxCookTime != null && (r.cookTimeMins == null || r.cookTimeMins > f.maxCookTime))
      return false;
    if (q) {
      const inTitle = r.title.toLowerCase().includes(q);
      const inIngredients = r.ingredients.some((i) => i.name.toLowerCase().includes(q));
      if (!inTitle && !inIngredients) return false;
    }
    return true;
  });
}
