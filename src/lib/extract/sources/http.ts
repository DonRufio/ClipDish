// Server-side fetch with a browser-ish UA and a timeout. Returns undefined on
// any failure — adapters never throw, so a blocked page degrades to "partial"
// rather than a 500 (CLAUDE.md §8).
//
// In the cloud, sites like YouTube and allrecipes block datacenter IPs. If
// SCRAPER_API_KEY is set we route every request through ScraperAPI, which
// fetches from residential IPs. No key (e.g. local dev) = direct fetch, so
// behaviour is unchanged locally.
// ponytail: hard-wired to ScraperAPI's URL format; swap the one line in
// proxify() for ScrapingBee etc. if you change providers.

const SCRAPER_KEY = process.env.SCRAPER_API_KEY;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

function proxify(url: string): string {
  return SCRAPER_KEY
    ? `https://api.scraperapi.com/?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(url)}`
    : url;
}

// The single outbound-request chokepoint. Every adapter goes through here so the
// proxy toggle is one env var. Returns the Response, or undefined on failure.
export async function proxiedFetch(
  url: string,
  init?: RequestInit,
  timeoutMs?: number,
): Promise<Response | undefined> {
  // Proxied requests are slower (a residential hop); give them more room.
  const timeout = timeoutMs ?? (SCRAPER_KEY ? 25000 : 8000);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(proxify(url), { ...init, signal: ctrl.signal });
  } catch {
    return undefined;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchText(url: string, timeoutMs?: number): Promise<string | undefined> {
  const res = await proxiedFetch(
    url,
    {
      redirect: "follow",
      headers: {
        // Some sites serve OG tags only to a real-looking browser.
        "user-agent": BROWSER_UA,
        accept: "text/html,application/xhtml+xml",
      },
    },
    timeoutMs,
  );
  if (!res?.ok) return undefined;
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}

export async function fetchJson<T>(url: string, timeoutMs?: number): Promise<T | undefined> {
  const text = await fetchText(url, timeoutMs);
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}
