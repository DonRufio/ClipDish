// Run: node --experimental-strip-types src/lib/extract/map.test.ts
import assert from "node:assert";
import { parseDuration, jsonLdToParts } from "./map.ts";

assert.equal(parseDuration("PT25M"), 25);
assert.equal(parseDuration("PT1H30M"), 90);
assert.equal(parseDuration("PT2H"), 120);
assert.equal(parseDuration(undefined), undefined);
assert.equal(parseDuration("garbage"), undefined);

const parts = jsonLdToParts({
  name: "Onion Soup",
  recipeIngredient: ["2 onions", "1L stock"],
  recipeInstructions: [{ text: "Chop onions" }, { text: "Simmer" }],
  keywords: "french, dinner",
  recipeCuisine: ["French"],
  totalTime: "PT45M",
  recipeYield: "4 servings",
});
assert.equal(parts.title, "Onion Soup");
assert.equal(parts.ingredients.length, 2);
assert.equal(parts.ingredients[0].original, "2 onions");
assert.equal(parts.ingredients[0].name, "2 onions"); // lowercased line
assert.deepEqual(parts.steps, ["Chop onions", "Simmer"]);
assert.equal(parts.cookTimeMins, 45);
assert.equal(parts.servings, 4);
assert.ok(parts.tags.includes("French"));

// string instructions split on newlines; keywords as array
const p2 = jsonLdToParts({
  name: "Toast",
  recipeInstructions: "Toast bread\nButter it",
  keywords: ["quick", "breakfast"],
});
assert.deepEqual(p2.steps, ["Toast bread", "Butter it"]);
assert.deepEqual(p2.tags, ["quick", "breakfast"]);
assert.equal(p2.cookTimeMins, undefined);

console.log("map.test.ts OK");
