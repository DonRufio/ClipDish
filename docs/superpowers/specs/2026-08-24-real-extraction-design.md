# Real Extraction — Design

Status: approved 2026-08-24. Replaces the Phase 1 stub in `/api/extract`.

## Goal

Turn a pasted URL (YouTube / recipe web page first; TikTok / Instagram /
Facebook partially) into a structured `Recipe`, using the cheapest signal that
works and never losing the capture on failure (CLAUDE.md §8).

## Pipeline

```
src/lib/extract/
  detect.ts      url → 'youtube' | 'tiktok' | 'webpage' | 'generic'  (hostname)
  sources/
    webpage.ts   fetch HTML → schema.org/Recipe JSON-LD (structured) or OG-meta text
    youtube.ts   keyless oEmbed + description scrape
    generic.ts   OG-meta fallback (partial for TikTok/IG: title, thumb, caption)
  structure.ts   SourceContent → Recipe  (map JSON-LD directly, OR call Claude)
  jsonld.ts      pure: parse schema.org Recipe from HTML → RecipeJsonLd
```

`/api/extract` orchestrates: `detect → adapter.fetch → structure → Recipe`.
Request/response shape unchanged (URL in, Recipe out) so the frontend barely moves.

## Normalizing interface

```ts
interface SourceContent {
  platform: string; sourceUrl: string;
  title?: string; author?: string; thumbnail?: string;
  text?: string;              // caption/description — free text for Claude
  structured?: RecipeJsonLd;  // already-structured (web pages) → skips the LLM
  warnings: string[];
}
```

## Cost lever

- `structured` present → map straight to Recipe, **no LLM call**.
- else `text` present → **one** Claude Messages call, structured via tool-schema.
- else → Recipe shell (title/thumb/url) flagged `needsReview`.

Claude call uses the official `@anthropic-ai/sdk` (per the claude-api skill:
default to the SDK when one exists — also gives retries + typed errors +
structured-output helpers), reading `ANTHROPIC_API_KEY` from env. Missing key →
degrade to shell + warning (dev runs keyless). Model defaults to `claude-opus-5`
(skill default), overridable via `FOODIE_EXTRACT_MODEL` — a cheaper model
(Haiku 4.5 / Sonnet 5) is the likely right call for this high-volume path.
HTML/JSON-LD/OG parsing is regex, no cheerio/jsdom. One new package: the SDK.

## Never lose the capture

- Adapters never throw; network/block failure → partial `SourceContent` + warning.
- Route 500s never on content failure; only a malformed URL is a 400. Always
  returns a usable Recipe (200) → user lands in the editable recipe view.
- `Recipe` gains optional `needsReview?: boolean` and `warnings?: string[]`,
  shown as a banner in the recipe view. Backward-compatible with saved recipes.

## Frontend

- Home: auto-detect source from URL; small `Auto / Video / Web page` override toggle.
- Recipe view: warnings banner + existing "double-check amounts" hint.

## Testing

- `detect()` hostname routing — unit test.
- `jsonld.ts` parse + its Recipe mapping — unit test (the meatiest pure logic).
- Live adapters + Claude call — verified against real URLs in the browser.
- Pattern: `node --experimental-strip-types src/lib/**/*.test.ts`.

## Deferred (YAGNI)

- Dedicated Instagram/Facebook adapters (need a Meta token; generic OG fallback
  catches what's public).
- Transcript / OCR escalation (description/caption covers most first).
- Third-party scraping API (Approach C) — later, for IG/FB specifically.
