// Run: node --experimental-strip-types src/lib/filter.test.ts
import assert from "node:assert";
import { filterRecipes } from "./filter.ts";
import type { Recipe } from "./types.ts";

const mk = (p: Partial<Recipe>): Recipe => ({
  id: "x",
  title: "",
  sourceUrl: "",
  ingredients: [],
  steps: [],
  tags: [],
  isFavorite: false,
  createdAt: "",
  ...p,
});

const pasta = mk({ title: "Garlic Pasta", tags: ["Italian", "Vegetarian"], cookTimeMins: 20, isFavorite: true, ingredients: [{ original: "", name: "garlic" }] });
const stew = mk({ title: "Beef Stew", tags: ["Dinner"], cookTimeMins: 90, ingredients: [{ original: "", name: "beef" }] });
const all = [pasta, stew];

// query matches title
assert.deepEqual(filterRecipes(all, { query: "pasta" }), [pasta]);
// query matches ingredient name
assert.deepEqual(filterRecipes(all, { query: "beef" }), [stew]);
// tags AND-narrow
assert.deepEqual(filterRecipes(all, { tags: ["Italian", "Vegetarian"] }), [pasta]);
assert.deepEqual(filterRecipes(all, { tags: ["Italian", "Dinner"] }), []);
// cook time cap, unknown-time excluded
assert.deepEqual(filterRecipes(all, { maxCookTime: 30 }), [pasta]);
assert.deepEqual(filterRecipes([mk({ title: "no time" })], { maxCookTime: 30 }), []);
// favorites only
assert.deepEqual(filterRecipes(all, { favoritesOnly: true }), [pasta]);
// empty filter returns all
assert.equal(filterRecipes(all, {}).length, 2);

console.log("filter.test.ts OK");
