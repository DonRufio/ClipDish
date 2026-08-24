import type { SourceContent } from "../types";
import { parseMeta } from "../jsonld";
import { fetchJson, fetchText } from "./http";
import { fetchYoutubeTranscript } from "./youtube-transcript";

interface OEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

// The full, untruncated description from the watch page's player JSON.
// ponytail: scrapes YouTube's internal "shortDescription" field — if YouTube
// changes its markup this returns undefined and we fall back to og:description.
function fullDescription(html: string): string | undefined {
  const m = /"shortDescription":"((?:[^"\\]|\\.)*)"/.exec(html);
  if (!m) return undefined;
  try {
    return JSON.parse(`"${m[1]}"`);
  } catch {
    return undefined;
  }
}

function videoId(url: string): string | undefined {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || undefined;
    return u.searchParams.get("v") ?? undefined;
  } catch {
    return undefined;
  }
}

// YouTube: keyless oEmbed for title/author/thumbnail, the full description for
// ingredients, and the transcript for the spoken method (steps). Descriptions
// often list ingredients but no steps; the transcript fills that in (§8 escalation).
export async function fromYoutube(url: string): Promise<SourceContent> {
  const warnings: string[] = [];
  const id = videoId(url);

  const [oembed, html, transcript] = await Promise.all([
    fetchJson<OEmbed>(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`),
    fetchText(url),
    id ? fetchYoutubeTranscript(id) : Promise.resolve(undefined),
  ]);

  const description = html ? fullDescription(html) ?? parseMeta(html, "og:description") : undefined;

  // Feed both, clearly labelled: ingredients come from the description (accurate
  // amounts), the method from the transcript.
  const parts: string[] = [];
  if (description) parts.push(`INGREDIENTS & NOTES (from the video description):\n${description}`);
  if (transcript)
    parts.push(`SPOKEN WALKTHROUGH (auto-generated transcript, may be imperfect):\n${transcript}`);
  const text = parts.join("\n\n") || undefined;

  if (!text) warnings.push("Couldn't read the video's description or transcript — add the recipe yourself.");
  else if (!transcript) warnings.push("No transcript available — steps may be missing; add them yourself.");

  return {
    platform: "youtube",
    sourceUrl: url,
    title: oembed?.title,
    author: oembed?.author_name,
    thumbnail: oembed?.thumbnail_url,
    text,
    warnings,
  };
}
