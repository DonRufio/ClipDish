"use client";

// Home / Paste link — entry point. Paste a link → extract → review in recipe view.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveDraft } from "@/lib/storage";
import type { Recipe } from "@/lib/types";

export default function Home() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"auto" | "video" | "web">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, kind: mode === "auto" ? undefined : mode }),
      });
      if (!res.ok) throw new Error("extract failed");
      const recipe = (await res.json()) as Recipe;
      await saveDraft(recipe); // persist immediately — never lose the capture (§8)
      router.push(`/recipe/${recipe.id}`);
    } catch {
      setError("Couldn't read that link. Check it and try again.");
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl pt-4 text-center sm:pt-10">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-tangerine">Capture anything</p>
      <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] sm:text-5xl">
        Paste a link.
        <br />
        Get a real recipe.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-ink-soft">
        Turn a cooking reel, TikTok, or recipe page into a clean, editable recipe — ingredients, steps and all.
      </p>

      {/* The capture bar — the signature clay object. */}
      <div className="clay mt-8 p-4 text-left sm:p-5">
        <form onSubmit={go} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="clay-sunk min-w-0 flex-1 px-4 py-3 text-base"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            className="clay-btn-primary px-6 py-3 font-bold"
            disabled={loading || !url.trim()}
          >
            {loading ? "Reading…" : "Get recipe"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {(["auto", "video", "web"] as const).map((m) => {
            const on = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={on}
                className={
                  on
                    ? "rounded-full bg-tangerine px-4 py-1.5 text-xs font-bold capitalize text-white shadow-[0_6px_14px_-6px_rgba(255,90,40,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                    : "clay-chip px-4 py-1.5 text-xs font-semibold capitalize"
                }
              >
                {m === "web" ? "Web page" : m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Extraction takes a few seconds (reading the video + asking an LLM). */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 flex items-center justify-center gap-3 text-sm font-medium text-ink-soft"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-[3px] border-white/70 border-t-tangerine" />
          Reading that link — this can take a few seconds.
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-berry/12 px-4 py-2.5 text-sm font-medium text-berry">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs text-ink-soft/80">
        Auto-detects from the link — override above if it guesses wrong.
      </p>
    </section>
  );
}
