export type SourceKind = "youtube" | "tiktok" | "webpage" | "generic";

// Route a URL to an adapter by hostname. 'generic' is the OG-meta fallback
// (covers Instagram/Facebook/anything with Open Graph tags). A caller may
// override the guess (the Video/Web toggle on Home).
export function detect(url: string): SourceKind {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "webpage"; // not a URL we can parse; let the webpage adapter try
  }
  if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com"))
    return "youtube";
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
  if (host === "instagram.com" || host === "facebook.com" || host.endsWith(".instagram.com") || host.endsWith(".facebook.com"))
    return "generic"; // no keyless caption access; OG fallback grabs what's public
  return "webpage";
}
