// Run: node --experimental-strip-types src/lib/shopping.test.ts
import assert from "node:assert";
import { mergeItems, buildList, byCategory } from "./shopping.ts";
import type { Recipe } from "./types.ts";

const recipe = (id: string, ings: Recipe["ingredients"]): Recipe => ({
  id,
  title: id,
  sourceUrl: "",
  ingredients: ings,
  steps: [],
  tags: [],
  isFavorite: false,
  createdAt: "",
});

// Same name + unit from two recipes → one line, quantities summed, both sources.
const list = buildList([
  recipe("a", [{ original: "1 onion", name: "onion", quantity: 1, unit: "pcs", category: "produce" }]),
  recipe("b", [
    { original: "half an onion", name: "onion", quantity: 0.5, unit: "pcs", category: "produce" },
    { original: "200g beef", name: "beef", quantity: 200, unit: "g", category: "meat" },
  ]),
]);
const onion = list.find((i) => i.name === "onion")!;
assert.equal(onion.quantity, 1.5, `onion qty ${onion.quantity}`);
assert.deepEqual(onion.fromRecipeIds.sort(), ["a", "b"]);
assert.equal(list.length, 2, "onion merged, beef separate");

// Different units of the same name stay separate.
const twoUnits = mergeItems([
  { name: "milk", quantity: 200, unit: "ml", fromRecipeIds: ["a"], checked: false, haveIt: false },
  { name: "milk", quantity: 1, unit: "cup", fromRecipeIds: ["b"], checked: false, haveIt: false },
]);
assert.equal(twoUnits.length, 2, "different units not merged");

// No quantity anywhere (e.g. "salt to taste") stays undefined, not 0.
const salt = mergeItems([
  { name: "salt", fromRecipeIds: ["a"], checked: false, haveIt: false },
  { name: "salt", fromRecipeIds: ["b"], checked: false, haveIt: false },
]);
assert.equal(salt[0].quantity, undefined, "salt qty stays undefined");
assert.deepEqual(salt[0].fromRecipeIds.sort(), ["a", "b"]);

// Re-merge preserves checked / haveIt (adding a recipe never un-ticks).
const preserved = mergeItems([
  { name: "flour", unit: "g", quantity: 100, fromRecipeIds: ["a"], checked: true, haveIt: true },
  { name: "flour", unit: "g", quantity: 100, fromRecipeIds: ["b"], checked: false, haveIt: false },
]);
assert.equal(preserved[0].checked, true, "checked preserved");
assert.equal(preserved[0].haveIt, true, "haveIt preserved");
assert.equal(preserved[0].quantity, 200);

// Aisle grouping: produce before meat.
const grouped = byCategory(list);
assert.equal(grouped[0][0], "produce", "produce first");
assert.equal(grouped[1][0], "meat", "meat second");

console.log("shopping.test.ts OK");
