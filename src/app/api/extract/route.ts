import { NextResponse } from "next/server";
import { detect, type SourceKind } from "@/lib/extract/detect";
import { fromWebpage } from "@/lib/extract/sources/webpage";
import { fromYoutube } from "@/lib/extract/sources/youtube";
import { fromGeneric } from "@/lib/extract/sources/generic";
import { structureRecipe } from "@/lib/extract/structure";
import type { SourceContent } from "@/lib/extract/types";

// Extraction endpoint — the ONE place extraction happens (server-side, §8).
// detect → adapter → structure → Recipe. Content failures never 500: they come
// back as a usable Recipe shell so the capture is never lost.

function adapterFor(kind: SourceKind): (url: string) => Promise<SourceContent> {
  switch (kind) {
    case "youtube":
      return fromYoutube;
    case "webpage":
      return fromWebpage;
    default:
      return fromGeneric; // tiktok + generic both use the OG-meta fallback
  }
}

export async function POST(req: Request) {
  let url: unknown;
  let kindOverride: unknown;
  try {
    ({ url, kind: kindOverride } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "A link is required" }, { status: 400 });
  }

  // 'video' | 'web' from the Home toggle can override hostname detection.
  let kind = detect(url.trim());
  if (kindOverride === "web") kind = "webpage";
  if (kindOverride === "video" && kind === "webpage") kind = "generic";

  const content = await adapterFor(kind)(url.trim());
  const recipe = await structureRecipe(content);
  return NextResponse.json(recipe);
}
