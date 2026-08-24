import type { SourceContent } from "../types";
import { parseMeta } from "../jsonld";
import { fetchText } from "./http";

// OG-meta fallback for TikTok/Instagram/Facebook and anything else. Grabs
// whatever Open Graph tags are public (title, caption, thumbnail). Instagram
// and Facebook usually gate this behind a login wall — when they do, we still
// return the sourceUrl so the capture lands in the editable view (§8).
export async function fromGeneric(url: string): Promise<SourceContent> {
  const html = await fetchText(url);
  if (!html) {
    return {
      platform: "generic",
      sourceUrl: url,
      warnings: ["Couldn't read that link automatically — add the recipe details yourself."],
    };
  }

  const title = parseMeta(html, "og:title");
  const description = parseMeta(html, "og:description");
  const thumbnail = parseMeta(html, "og:image");
  const warnings: string[] = [];
  if (!description && !title)
    warnings.push("This platform hides its content from us — add the recipe details yourself.");

  return {
    platform: "generic",
    sourceUrl: url,
    title,
    thumbnail,
    text: description,
    warnings,
  };
}
