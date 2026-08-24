"use client";

// This week — pick the meals you're cooking, then build one consolidated shop.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CURRENT_LIST_ID,
  getRecipes,
  getWeek,
  saveWeek,
  saveList,
} from "@/lib/storage";
import { buildList } from "@/lib/shopping";
import type { Recipe } from "@/lib/types";

export default function WeekPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getRecipes(), getWeek()]).then(([r, week]) => {
      setRecipes(r.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      // drop ids of recipes that no longer exist
      setPicked(week.filter((id) => r.some((x) => x.id === id)));
      setLoaded(true);
    });
  }, []);

  function toggle(id: string) {
    setPicked((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      saveWeek(next);
      return next;
    });
  }

  async function buildShop() {
    const chosen = recipes.filter((r) => picked.includes(r.id));
    await saveList({
      id: CURRENT_LIST_ID,
      items: buildList(chosen),
      createdAt: new Date().toISOString(),
    });
    router.push("/list");
  }

  if (loaded && recipes.length === 0)
    return (
      <section className="mx-auto max-w-sm pt-10 text-center">
        <div className="clay p-8">
          <div className="text-5xl">📅</div>
          <h1 className="mt-3 text-2xl font-extrabold">This week</h1>
          <p className="mt-2 text-ink-soft">Capture a few recipes first, then plan your week from them.</p>
          <Link href="/" className="clay-btn-primary mt-5 inline-block px-5 py-2.5 font-bold">
            Paste a link
          </Link>
        </div>
      </section>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">This week</h1>
          <p className="mt-1 text-ink-soft">
            Tick the meals you&apos;re cooking — we&apos;ll merge them into one shop.
          </p>
        </div>
        <button
          onClick={buildShop}
          disabled={picked.length === 0}
          className="clay-btn-primary px-5 py-2.5 font-bold"
        >
          Build shopping list{picked.length > 0 ? ` (${picked.length})` : ""}
        </button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => {
          const on = picked.includes(r.id);
          return (
            <li key={r.id}>
              <button
                onClick={() => toggle(r.id)}
                aria-pressed={on}
                className={`clay flex w-full items-center gap-3 p-3 text-left transition-transform duration-150 hover:-translate-y-0.5 ${
                  on ? "ring-2 ring-tangerine" : ""
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-xl text-sm font-bold text-white ${
                    on
                      ? "bg-tangerine shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                      : "bg-[#f7ece3] shadow-[inset_0_2px_4px_rgba(150,90,60,0.2)]"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#ffe0c8,#ffd0dd)]">
                  {r.sourceThumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.sourceThumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-ink">{r.title || "Untitled recipe"}</span>
                  <span className="text-xs font-medium text-ink-soft">{r.ingredients.length} ingredients</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
