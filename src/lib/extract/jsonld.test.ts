// Run: node --experimental-strip-types src/lib/extract/jsonld.test.ts
import assert from "node:assert";
import { parseRecipeJsonLd, parseMeta } from "./jsonld.ts";

// bare Recipe object
const bare = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Recipe","name":"Soup","recipeIngredient":["2 onions"]}
</script>`;
assert.equal(parseRecipeJsonLd(bare)?.name, "Soup");

// @graph wrapper with a Recipe among other nodes
const graph = `<script type="application/ld+json">
{"@graph":[{"@type":"WebPage"},{"@type":["Recipe"],"name":"Stew","totalTime":"PT90M"}]}
</script>`;
const g = parseRecipeJsonLd(graph);
assert.equal(g?.name, "Stew");
assert.equal(g?.totalTime, "PT90M");

// array at top level
const arr = `<script type='application/ld+json'>[{"@type":"Organization"},{"@type":"Recipe","name":"Pie"}]</script>`;
assert.equal(parseRecipeJsonLd(arr)?.name, "Pie");

// a broken block before a good one shouldn't stop the search
const broken = `<script type="application/ld+json">{ not json }</script>
<script type="application/ld+json">{"@type":"Recipe","name":"Bread"}</script>`;
assert.equal(parseRecipeJsonLd(broken)?.name, "Bread");

// no recipe present
assert.equal(parseRecipeJsonLd(`<html>nothing here</html>`), undefined);

// OG meta, both attribute orders + entity decode
assert.equal(parseMeta(`<meta property="og:title" content="Fish &amp; Chips">`, "og:title"), "Fish & Chips");
assert.equal(parseMeta(`<meta content="A caption" property="og:description">`, "og:description"), "A caption");
assert.equal(parseMeta(`<meta name="og:image" content="http://x/i.jpg">`, "og:image"), "http://x/i.jpg");
assert.equal(parseMeta(`<html></html>`, "og:title"), undefined);

console.log("jsonld.test.ts OK");
