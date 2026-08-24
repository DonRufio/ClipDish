import type { SourceContent } from "../types";
import { parseRecipeJsonLd, parseMeta } from "../jsonld";
import { fetchText } from "./http";

// Recipe web pages: prefer schema.org/Recipe JSON-LD (structured → no LLM),
// fall back to OG title/description/image as free text for the LLM.
export async function fromWebpage(url: string): Promise<SourceContent> {
  const html = await fetchText(url);
  if (!html) {
    return { platform: "webpage", sourceUrl: url, warnings: ["Couldn't load that page."] };
  }

  const structured = parseRecipeJsonLd(html);
  const title = parseMeta(html, "og:title") ?? parseMeta(html, "twitter:title");
  const thumbnail = parseMeta(html, "og:image");
  const description = parseMeta(html, "og:description") ?? parseMeta(html, "description");

  return {
    platform: "webpage",
    sourceUrl: url,
    title: structured?.name ?? title,
    thumbnail,
    structured,
    text: structured ? undefined : description,
    warnings: [],
  };
}
