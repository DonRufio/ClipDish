"use client";

// Shopping list — the merged, aisle-grouped, checkable shop built from your week.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CURRENT_LIST_ID, getList, saveList } from "@/lib/storage";
import { byCategory } from "@/lib/shopping";
import { listToText, shareOrCopy } from "@/lib/export";
import type { ShoppingItem, ShoppingList } from "@/lib/types";

// "1.5 pcs onion", "onion" (no qty), "200 g beef"
function label(item: ShoppingItem): string {
  const qty = item.quantity != null ? +item.quantity.toFixed(2) : "";
  return [qty, item.unit, item.name].filter(Boolean).join(" ");
}

// The signature: each aisle carries its own food-world colour, so the shop is
// scannable by colour. Matches the categories the extractor emits.
const AISLE: Record<string, string> = {
  produce: "#3fbf82",
  meat: "#ff6b6b",
  seafood: "#3fc7c0",
  dairy: "#6fb3f5",
  bakery: "#e0a15a",
  frozen: "#63cfe0",
  pantry: "#ffb53d",
  spices: "#e8804b",
  condiments: "#e0b23c",
  drinks: "#9c6be8",
  other: "#c2ab9e",
};
const aisleColor = (c: string) => AISLE[c.toLowerCase()] ?? AISLE.other;

export default function ListPage() {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [shared, setShared] = useState(false);

  async function share() {
    const how = await shareOrCopy(listToText(list?.items ?? []), "Shopping list");
    if (how === "copied") {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  useEffect(() => {
    getList(CURRENT_LIST_ID).then((l) => {
      setList(l ?? null);
      setLoaded(true);
    });
  }, []);

  function update(items: ShoppingItem[]) {
    const next: ShoppingList = {
      id: CURRENT_LIST_ID,
      items,
      createdAt: list?.createdAt ?? new Date().toISOString(),
    };
    setList(next);
    saveList(next);
  }

  // Identity by name+unit — the same key mergeItems consolidated on.
  const patch = (item: ShoppingItem, change: Partial<ShoppingItem>) =>
    update(
      (list?.items ?? []).map((x) =>
        x.name === item.name && x.unit === item.unit ? { ...x, ...change } : x,
      ),
    );

  const groups = useMemo(() => byCategory(list?.items ?? []), [list]);
  const remaining = (list?.items ?? []).filter((i) => !i.checked && !i.haveIt).length;
  const total = list?.items.length ?? 0;

  if (loaded && total === 0)
    return (
      <section className="mx-auto max-w-sm pt-10 text-center">
        <div className="clay p-8">
          <div className="text-5xl">🛒</div>
          <h1 className="mt-3 text-2xl font-extrabold">Your shop is empty</h1>
          <p className="mt-2 text-ink-soft">
            Pick this week&apos;s meals and we&apos;ll merge them into one aisle-grouped list.
          </p>
          <Link href="/week" className="clay-btn-primary mt-5 inline-block px-5 py-2.5 font-bold">
            Plan this week
          </Link>
        </div>
      </section>
    );

  const bought = total - remaining;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Shopping list</h1>
          <p className="mt-1 font-semibold text-ink-soft">
            <span className="text-tangerine">{remaining} to buy</span> · {total} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm print:hidden">
          <button onClick={share} className="clay-chip px-4 py-2 font-semibold">
            {shared ? "Copied ✓" : "Share"}
          </button>
          <button onClick={() => window.print()} className="clay-chip px-4 py-2 font-semibold">
            Print
          </button>
          <Link href="/week" className="clay-chip px-4 py-2 font-semibold">
            Edit week
          </Link>
          <button onClick={() => update([])} className="clay-chip px-4 py-2 font-semibold text-berry">
            Clear
          </button>
        </div>
      </div>

      {/* Progress — motivating while you shop. */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/60 shadow-[inset_0_2px_5px_rgba(150,90,60,0.16)] print:hidden">
        <div
          className="h-full rounded-full bg-basil transition-[width] duration-300"
          style={{ width: `${total ? (bought / total) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-5">
        {groups.map(([category, items]) => {
          const color = aisleColor(category);
          return (
            <section key={category}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden />
                <h2 className="text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color }}>
                  {category}
                </h2>
              </div>
              <ul className="clay divide-y divide-black/[0.06] p-1.5">
                {items.map((item) => {
                  const done = item.checked || item.haveIt;
                  return (
                    <li key={`${item.name} ${item.unit ?? ""}`} className="flex items-center gap-2 rounded-2xl px-2">
                      {/* whole label is the tap target — easy to tick one-handed */}
                      <label className="flex flex-1 cursor-pointer items-center gap-3 py-3">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => patch(item, { checked: e.target.checked })}
                          aria-label={`Bought ${item.name}`}
                          style={{ accentColor: color }}
                          className="h-6 w-6 shrink-0"
                        />
                        <span className={done ? "text-ink-soft/60 line-through" : "font-medium text-ink"}>
                          {label(item)}
                          {item.fromRecipeIds.length > 1 && (
                            <span className="ml-2 rounded-full bg-black/[0.06] px-1.5 py-0.5 align-middle text-[0.65rem] font-semibold text-ink-soft no-underline">
                              ×{item.fromRecipeIds.length}
                            </span>
                          )}
                        </span>
                      </label>
                      <button
                        onClick={() => patch(item, { haveIt: !item.haveIt })}
                        className={`shrink-0 px-3 py-1.5 text-xs font-bold print:hidden ${
                          item.haveIt
                            ? "rounded-full bg-basil text-white shadow-[0_6px_12px_-6px_rgba(63,191,130,0.7),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                            : "clay-chip"
                        }`}
                      >
                        Have it
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
