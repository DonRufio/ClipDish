import type { RecipeJsonLd } from "./types";

// Pull schema.org/Recipe out of a page's JSON-LD <script> blocks. Handles the
// three common shapes: a bare Recipe object, an array of objects, and an
// { "@graph": [...] } wrapper. Returns the first Recipe found, or undefined.
// Regex, not a DOM parser — we only need the <script type="application/ld+json"> text.
export function parseRecipeJsonLd(html: string): RecipeJsonLd | undefined {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    let data: unknown;
    try {
      data = JSON.parse(m[1].trim());
    } catch {
      continue; // one bad block shouldn't stop us finding a good one
    }
    const found = findRecipe(data);
    if (found) return found;
  }
  return undefined;
}

function isRecipe(o: unknown): o is RecipeJsonLd {
  if (!o || typeof o !== "object") return false;
  const t = (o as { "@type"?: unknown })["@type"];
  const types = Array.isArray(t) ? t : [t];
  return types.includes("Recipe");
}

function findRecipe(data: unknown): RecipeJsonLd | undefined {
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = findRecipe(item);
      if (r) return r;
    }
    return undefined;
  }
  if (data && typeof data === "object") {
    if (isRecipe(data)) return data as RecipeJsonLd;
    const graph = (data as { "@graph"?: unknown })["@graph"];
    if (graph) return findRecipe(graph);
  }
  return undefined;
}

// Grab an Open Graph / meta property from raw HTML. Order-insensitive to
// property/content attribute order.
export function parseMeta(html: string, property: string): string | undefined {
  const esc = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${esc}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = re.exec(html);
    if (m) return decodeEntities(m[1]);
  }
  return undefined;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}
