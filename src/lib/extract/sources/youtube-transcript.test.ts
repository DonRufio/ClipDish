// Run: node --experimental-strip-types src/lib/extract/sources/youtube-transcript.test.ts
import assert from "node:assert";
import { parseTimedText } from "./youtube-transcript.ts";

const xml = `<?xml version="1.0"?><timedtext format="3">
<head><ws id="0"/></head>
<body>
<p t="0" d="1500"><s>Heat</s><s> the</s><s> oil &amp; garlic</s></p>
<p t="1500" d="1000">then add chicken</p>
</body></timedtext>`;

const text = parseTimedText(xml);
// head content (ws tag) must be excluded; body text joined and entity-decoded
assert.ok(!text.includes("ws"), text);
assert.ok(text.includes("Heat the oil & garlic"), text);
assert.ok(text.includes("then add chicken"), text);

console.log("youtube-transcript.test.ts OK");
