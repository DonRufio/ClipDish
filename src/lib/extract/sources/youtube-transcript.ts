// YouTube transcript via the InnerTube player API. The direct timedtext URLs
// on the watch page now return empty (PoToken-gated); the Android client's
// player response still yields caption tracks that serve content.
// ponytail: YouTube-internal + a public API key — genuinely fragile, expect it
// to need maintenance. Any failure returns undefined and the caller degrades
// (recipe still extracts from the description, just without spoken steps).

// YouTube's long-standing public InnerTube web key (shipped in youtube.com HTML;
// not a secret).
const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const MAX_CHARS = 15000; // bound LLM input cost; enough for a full recipe method

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
}
interface PlayerResponse {
  captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } };
}

export async function fetchYoutubeTranscript(videoId: string): Promise<string | undefined> {
  try {
    const player = (await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          videoId,
          context: {
            client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 30, hl: "en" },
          },
        }),
      },
    ).then((r) => (r.ok ? r.json() : undefined))) as PlayerResponse | undefined;

    const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks?.length) return undefined;
    const track = tracks.find((t) => t.languageCode?.startsWith("en")) ?? tracks[0];

    const xml = await fetch(track.baseUrl).then((r) => (r.ok ? r.text() : undefined));
    if (!xml) return undefined;
    const text = parseTimedText(xml);
    return text ? text.slice(0, MAX_CHARS) : undefined;
  } catch {
    return undefined;
  }
}

// Strip timedtext XML to plain text. Exported for testing.
export function parseTimedText(xml: string): string {
  const start = xml.indexOf("<body>");
  const body = start === -1 ? xml : xml.slice(start);
  return body
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
