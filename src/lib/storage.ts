// Storage layer — the ONLY place that knows where data lives.
// Phases 1–4: browser localStorage. Phase 5: rewrite these bodies to hit a
// backend; callers and signatures stay identical. Functions are async so that
// swap doesn't change a single call site (CLAUDE.md §7, §11).

import type { Recipe, ShoppingList } from "./types";

const RECIPES_KEY = "foodie.recipes";
const LISTS_KEY = "foodie.lists";
const DRAFT_KEY = "foodie.draft";
const WEEK_KEY = "foodie.week";

// There's one shopping list in the UI — "this week's shop". The multi-list
// storage stays (Phase 5 backend may want history); the app just uses this id.
export const CURRENT_LIST_ID = "current";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return []; // SSR: no localStorage
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return []; // corrupt data shouldn't crash the app
  }
}

function write<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// upsert helper: replace by id, else append
function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const next = [...list];
  next[i] = item;
  return next;
}

// --- Recipes ---

export async function getRecipes(): Promise<Recipe[]> {
  return read<Recipe>(RECIPES_KEY);
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  return read<Recipe>(RECIPES_KEY).find((r) => r.id === id);
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  write(RECIPES_KEY, upsert(read<Recipe>(RECIPES_KEY), recipe));
}

export async function deleteRecipe(id: string): Promise<void> {
  write(
    RECIPES_KEY,
    read<Recipe>(RECIPES_KEY).filter((r) => r.id !== id),
  );
}

// --- Shopping lists ---

export async function getLists(): Promise<ShoppingList[]> {
  return read<ShoppingList>(LISTS_KEY);
}

export async function getList(id: string): Promise<ShoppingList | undefined> {
  return read<ShoppingList>(LISTS_KEY).find((l) => l.id === id);
}

export async function saveList(list: ShoppingList): Promise<void> {
  write(LISTS_KEY, upsert(read<ShoppingList>(LISTS_KEY), list));
}

export async function deleteList(id: string): Promise<void> {
  write(
    LISTS_KEY,
    read<ShoppingList>(LISTS_KEY).filter((l) => l.id !== id),
  );
}

// --- This week ---
// The recipe ids picked for this week's meals. Persisted so the plan survives a
// reload and can be tweaked before building the shop.

export async function getWeek(): Promise<string[]> {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(WEEK_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export async function saveWeek(ids: string[]): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WEEK_KEY, JSON.stringify(ids));
}

// --- Draft ---
// A single unsaved capture, persisted so a half-failed extraction is never lost
// (CLAUDE.md §8). "Save" promotes it into the recipes library; then it's cleared.

export async function getDraft(): Promise<Recipe | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const v = window.localStorage.getItem(DRAFT_KEY);
    return v ? (JSON.parse(v) as Recipe) : undefined;
  } catch {
    return undefined;
  }
}

export async function saveDraft(recipe: Recipe): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(recipe));
}

export async function clearDraft(): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}
