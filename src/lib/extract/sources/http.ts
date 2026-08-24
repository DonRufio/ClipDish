// Server-side fetch with a browser-ish UA and a timeout. Returns undefined on
// any failure — adapters never throw, so a blocked page degrades to "partial"
// rather than a 500 (CLAUDE.md §8).
export async function fetchText(url: string, timeoutMs = 8000): Promise<string | undefined> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        // Some sites serve OG tags only to a real-looking browser.
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return undefined;
    return await res.text();
  } catch {
    return undefined;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T | undefined> {
  const text = await fetchText(url, timeoutMs);
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}
