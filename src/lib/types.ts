// Core data shapes — CLAUDE.md §10. Refine as phases need.

export interface Ingredient {
  original: string; // creator's exact wording, always preserved
  name: string; // normalized, for consolidation ("onion")
  quantity?: number;
  unit?: string;
  category?: string; // aisle grouping (produce, dairy, ...)
}

export interface Recipe {
  id: string;
  title: string;
  sourceUrl: string;
  sourceThumbnail?: string;
  creatorHandle?: string;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[]; // cuisine, diet, meal type
  cookTimeMins?: number;
  servings?: number;
  isFavorite: boolean;
  createdAt: string;
  needsReview?: boolean; // extraction was partial/uncertain — nudge the user to check
  warnings?: string[]; // what couldn't be read automatically
}

export interface ShoppingItem {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  fromRecipeIds: string[]; // which recipes contributed (for merge display)
  checked: boolean;
  haveIt: boolean; // pantry / already-have toggle
}

export interface ShoppingList {
  id: string;
  items: ShoppingItem[];
  createdAt: string;
}
