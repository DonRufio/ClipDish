// Run: node --experimental-strip-types src/lib/export.test.ts
import assert from "node:assert";
import { recipeToText, listToText } from "./export.ts";
import type { Recipe, ShoppingItem } from "./types.ts";

const recipe: Recipe = {
  id: "r", title: "Garlic Noodles", sourceUrl: "https://x.test/v",
  ingredients: [
    { original: "3 cloves garlic", name: "garlic", quantity: 3, unit: "cloves" },
    { original: "", name: "noodles", quantity: 200, unit: "g" }, // no original → composed
  ],
  steps: ["Boil noodles", "Fry garlic"], tags: [], isFavorite: false, createdAt: "",
};
const txt = recipeToText(recipe);
assert.ok(txt.startsWith("Garlic Noodles"), txt);
assert.ok(txt.includes("- 3 cloves garlic"), txt);
assert.ok(txt.includes("- 200 g noodles"), "composed line from name/qty/unit");
assert.ok(txt.includes("1. Boil noodles"), txt);
assert.ok(txt.includes("Source: https://x.test/v"), txt);

const items: ShoppingItem[] = [
  { name: "onion", quantity: 1.5, unit: "pcs", category: "produce", fromRecipeIds: ["a"], checked: false, haveIt: false },
  { name: "salt", category: "spices", fromRecipeIds: ["a"], checked: false, haveIt: true },
];
const list = listToText(items);
assert.ok(list.includes("PRODUCE"), list);
assert.ok(list.includes("- 1.5 pcs onion"), list);
assert.ok(list.includes("- (have) salt"), "haveIt marked, no phantom qty");

console.log("export.test.ts OK");
