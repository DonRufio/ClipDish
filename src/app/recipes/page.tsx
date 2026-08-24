"use client";

// My recipes — library. Saved recipes, favorite toggle, search + filter (§4).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getRecipes, saveRecipe, deleteRecipe } from "@/lib/storage";
import { filterRecipes } from "@/lib/filter";
import type { Recipe } from "@/lib/types";

const COOK_TIMES = [15, 30, 60];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [maxCookTime, setMaxCookTime] = useState<number | undefined>();
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    getRecipes().then((r) => {
      setRecipes(r.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoaded(true);
    });
  }, []);

  // Tag chips come from whatever tags the saved recipes actually have — no fixed taxonomy.
  const allTags = useMemo(
    () => [...new Set(recipes.flatMap((r) => r.tags))].sort(),
    [recipes],
  );
  const shown = useMemo(
    () => filterRecipes(recipes, { query, tags, maxCookTime, favoritesOnly }),
    [recipes, query, tags, maxCookTime, favoritesOnly],
  );

  function toggleTag(t: string) {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }
  async function toggleFavorite(r: Recipe) {
    const updated = { ...r, isFavorite: !r.isFavorite };
    await saveRecipe(updated);
    setRecipes((cur) => cur.map((x) => (x.id === r.id ? updated : x)));
  }
  async function removeRecipe(id: string) {
    await deleteRecipe(id);
    setRecipes((cur) => cur.filter((x) => x.id !== id));
    setConfirmId(null);
  }

  if (loaded && recipes.length === 0)
    return (
      <section className="mx-auto max-w-sm pt-10 text-center">
        <div className="clay p-8">
          <div className="text-5xl">🍲</div>
          <h1 className="mt-3 text-2xl font-extrabold">No recipes yet</h1>
          <p className="mt-2 text-ink-soft">Paste a cooking-video link to capture your first one.</p>
          <Link href="/" className="clay-btn-primary mt-5 inline-block px-5 py-2.5 font-bold">
            Paste a link
          </Link>
        </div>
      </section>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">My recipes</h1>

      {/* Controls */}
      <div className="space-y-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or ingredient…"
          className="clay-sunk w-full px-4 py-3"
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => setFavoritesOnly((v) => !v)}
            className={
              favoritesOnly
                ? "rounded-full bg-honey px-4 py-1.5 font-bold text-ink shadow-[0_6px_14px_-6px_rgba(255,181,61,0.7),inset_0_1px_1px_rgba(255,255,255,0.5)]"
                : "clay-chip px-4 py-1.5 font-semibold"
            }
          >
            ★ Favorites
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={
                tags.includes(t)
                  ? "rounded-full bg-tangerine px-4 py-1.5 font-bold text-white shadow-[0_6px_14px_-6px_rgba(255,90,40,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  : "clay-chip px-4 py-1.5 font-semibold"
              }
            >
              {t}
            </button>
          ))}
          <select
            value={maxCookTime ?? ""}
            onChange={(e) => setMaxCookTime(e.target.value ? Number(e.target.value) : undefined)}
            className="clay-sunk px-4 py-1.5 font-semibold text-ink-soft"
          >
            <option value="">Any time</option>
            {COOK_TIMES.map((t) => (
              <option key={t} value={t}>
                ≤ {t} min
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {shown.length === 0 ? (
        <p className="py-8 text-center text-ink-soft">Nothing matches those filters.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <li key={r.id} className="clay group relative p-3 transition-transform duration-150 hover:-translate-y-1">
              <button
                onClick={() => toggleFavorite(r)}
                aria-label={r.isFavorite ? "Unfavorite" : "Favorite"}
                className={`absolute right-4 top-4 z-10 text-xl drop-shadow ${r.isFavorite ? "text-honey" : "text-white/90 hover:text-honey"}`}
              >
                {r.isFavorite ? "★" : "☆"}
              </button>
              <button
                onClick={() => setConfirmId(r.id)}
                aria-label="Delete recipe"
                className="absolute left-4 top-4 z-10 text-white/90 drop-shadow transition-colors hover:text-berry"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
                </svg>
              </button>

              {confirmId === r.id && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[1.75rem] bg-white/95 p-4 text-center backdrop-blur">
                  <p className="font-bold text-ink">Delete this recipe?</p>
                  <p className="-mt-1 text-sm text-ink-soft">This can&apos;t be undone.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => removeRecipe(r.id)}
                      className="rounded-full bg-berry px-4 py-2 text-sm font-bold text-white shadow-[0_6px_14px_-6px_rgba(255,92,138,0.7),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                    >
                      Delete
                    </button>
                    <button onClick={() => setConfirmId(null)} className="clay-chip px-4 py-2 text-sm font-semibold">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div className="mb-3 h-28 overflow-hidden rounded-[1.25rem] bg-[linear-gradient(135deg,#ffe0c8,#ffd0dd)]">
                {r.sourceThumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.sourceThumbnail} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <Link href={`/recipe/${r.id}`} className="block px-1 pr-6 font-bold text-ink hover:text-tangerine">
                {r.title || "Untitled recipe"}
              </Link>
              <div className="mt-1.5 flex flex-wrap gap-1.5 px-1 text-xs">
                {r.cookTimeMins != null && (
                  <span className="rounded-full bg-basil/15 px-2 py-0.5 font-semibold text-basil">
                    {r.cookTimeMins} min
                  </span>
                )}
                {r.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-grape/12 px-2 py-0.5 font-medium text-grape">
                    {t}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
