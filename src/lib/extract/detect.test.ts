// Run: node --experimental-strip-types src/lib/extract/detect.test.ts
import assert from "node:assert";
import { detect } from "./detect.ts";

assert.equal(detect("https://www.youtube.com/watch?v=abc"), "youtube");
assert.equal(detect("https://youtu.be/abc"), "youtube");
assert.equal(detect("https://www.tiktok.com/@user/video/123"), "tiktok");
assert.equal(detect("https://www.instagram.com/reel/abc/"), "generic");
assert.equal(detect("https://www.facebook.com/watch/?v=1"), "generic");
assert.equal(detect("https://cooking.nytimes.com/recipes/123-soup"), "webpage");
assert.equal(detect("not a url"), "webpage");

console.log("detect.test.ts OK");
