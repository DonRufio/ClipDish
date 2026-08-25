# ClipDish 🥘

Clip cooking videos into recipes. Paste a YouTube / TikTok / Instagram link or a
recipe web page, and ClipDish extracts a clean, editable recipe — ingredients,
steps, time, tags — then helps you build a consolidated weekly shopping list.

## Features

- **Capture** — paste a link; extraction pulls structured data (schema.org
  JSON-LD when present, else an LLM reads the video description + transcript).
- **Library** — search, filter by tag/time, favourite, and delete recipes.
- **Shopping list** — merges ingredients across the meals you pick for the week,
  grouped and colour-coded by aisle, with check-off and a "have it" pantry toggle.
- **This week** — choose meals, build one shop.
- **PWA** — installable, offline-aware, mobile-first (claymorphism UI).
- **Share / export** — copy or print a recipe or the shopping list.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4. Data lives in
`localStorage` behind an async storage layer (`src/lib/storage.ts`) so a real
backend can drop in without touching call sites.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the keys below
npm run dev                  # http://localhost:3000
```

Unit checks (no framework — plain assert files):

```bash
node --experimental-strip-types src/lib/shopping.test.ts
```

## Environment variables

See [.env.example](.env.example). The essentials:

| Variable | Needed | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | required | LLM extraction (default provider). Get one at [aistudio.google.com](https://aistudio.google.com/apikey). |
| `SCRAPER_API_KEY` | required **in the cloud** | Routes server fetches through residential IPs. YouTube and recipe sites block datacenter IPs, so hosted extraction needs this. Blank locally = direct fetch. |

## Deploying

Host on a platform that runs Next.js server code (the extraction lives in the
`/api/extract` route) — e.g. **Vercel**. Set both env vars above in the host's
**Production** environment, then deploy. GitHub Pages / static hosts can't run
the extraction API.
