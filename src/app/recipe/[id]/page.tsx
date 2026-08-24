"use client";

// Recipe view — the hub. Every field is editable (§4); extraction is never perfect,
// so editing turns failures into minor annoyances. Loads a saved recipe by id, or
// falls back to the just-captured draft.
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getRecipe,
  getDraft,
  saveRecipe,
  clearDraft,
  getList,
  saveList,
  CURRENT_LIST_ID,
} from "@/lib/storage";
import { addRecipeToItems } from "@/lib/shopping";
import { recipeToText, shareOrCopy } from "@/lib/export";
import type { Ingredient, Recipe } from "@/lib/types";

export default function RecipePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [wasDraft, setWasDraft] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    (async () => {
      let r = await getRecipe(params.id);
      let draft = false;
      if (!r) {
        const d = await getDraft();
        if (d?.id === params.id) {
          r = d;
          draft = true;
        }
      }
      setRecipe(r ?? null);
      setWasDraft(draft);
      setLoaded(true);
    })();
  }, [params.id]);

  // --- edit helpers ---
  function patch(p: Partial<Recipe>) {
    setRecipe((r) => (r ? { ...r, ...p } : r));
  }
  function patchIngredient(i: number, p: Partial<Ingredient>) {
    setRecipe((r) =>
      r ? { ...r, ingredients: r.ingredients.map((ing, idx) => (idx === i ? { ...ing, ...p } : ing)) } : r,
    );
  }
  function addIngredient() {
    setRecipe((r) =>
      r ? { ...r, ingredients: [...r.ingredients, { original: "", name: "" }] } : r,
    );
  }
  function removeIngredient(i: number) {
    setRecipe((r) => (r ? { ...r, ingredients: r.ingredients.filter((_, idx) => idx !== i) } : r));
  }
  function patchStep(i: number, val: string) {
    setRecipe((r) => (r ? { ...r, steps: r.steps.map((s, idx) => (idx === i ? val : s)) } : r));
  }
  function addStep() {
    setRecipe((r) => (r ? { ...r, steps: [...r.steps, ""] } : r));
  }
  function removeStep(i: number) {
    setRecipe((r) => (r ? { ...r, steps: r.steps.filter((_, idx) => idx !== i) } : r));
  }

  async function save() {
    if (!recipe) return;
    setSaving(true);
    await saveRecipe(recipe);
    if (wasDraft) await clearDraft();
    router.push("/recipes");
  }

  // Merge this recipe's ingredients into the current shop. Persist a draft first
  // so its ingredients aren't lost and the list's recipe reference is real.
  async function addToList() {
    if (!recipe) return;
    setSaving(true);
    if (wasDraft) {
      await saveRecipe(recipe);
      await clearDraft();
    }
    const existing = (await getList(CURRENT_LIST_ID))?.items ?? [];
    // Already on the list? Don't re-add — merging again would double its amounts.
    const alreadyThere = existing.some((i) => i.fromRecipeIds.includes(recipe.id));
    if (!alreadyThere)
      await saveList({
        id: CURRENT_LIST_ID,
        items: addRecipeToItems(existing, recipe),
        createdAt: new Date().toISOString(),
      });
    router.push("/list");
  }

  async function share() {
    if (!recipe) return;
    const how = await shareOrCopy(recipeToText(recipe), recipe.title || "Recipe");
    if (how === "copied") {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  if (!loaded) return <p className="pt-10 text-center text-ink-soft">Loading…</p>;
  if (!recipe)
    return (
      <div className="mx-auto max-w-sm pt-10 text-center">
        <div className="clay p-8">
          <div className="text-5xl">🤔</div>
          <p className="mt-3 font-bold text-ink">That recipe isn&apos;t here.</p>
          <Link href="/" className="clay-btn-primary mt-4 inline-block px-5 py-2.5 font-bold">
            Paste a new link
          </Link>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Extraction warnings — we couldn't read everything automatically (§8) */}
      {(recipe.needsReview || recipe.warnings?.length) && (
        <div className="rounded-[1.25rem] bg-honey/20 px-5 py-4 text-sm font-medium text-[#8a5a12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
          {recipe.warnings?.length ? (
            <ul className="list-disc space-y-1 pl-4">
              {recipe.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : (
            <p>We couldn&apos;t fully read this one — check the details below before saving.</p>
          )}
        </div>
      )}

      {/* Title + source */}
      <header className="clay space-y-3 p-5">
        <input
          value={recipe.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Recipe title"
          className="w-full bg-transparent text-3xl font-extrabold tracking-tight placeholder:text-ink-soft/50 focus:outline-none"
        />
        <div className="flex items-start gap-4">
          <div className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#ffe0c8,#ffd0dd)]">
            {recipe.sourceThumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={recipe.sourceThumbnail} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-sm">
            <input
              value={recipe.sourceUrl}
              onChange={(e) => patch({ sourceUrl: e.target.value })}
              placeholder="Source link"
              className="clay-sunk w-full px-3 py-2"
            />
            {recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-semibold text-tangerine hover:underline"
              >
                Open original {recipe.creatorHandle ? `· ${recipe.creatorHandle}` : ""}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Ingredients */}
      <section className="clay p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-extrabold">Ingredients</h2>
          <span className="text-xs text-ink-soft">Double-check amounts — they&apos;re the weak spot</span>
        </div>
        <ul className="mt-3 space-y-2">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <input
                value={ing.original}
                onChange={(e) => patchIngredient(i, { original: e.target.value })}
                placeholder="e.g. 400g spaghetti"
                className="min-w-0 flex-[3] clay-sunk px-3 py-2"
              />
              <input
                type="number"
                value={ing.quantity ?? ""}
                onChange={(e) =>
                  patchIngredient(i, { quantity: e.target.value === "" ? undefined : Number(e.target.value) })
                }
                placeholder="qty"
                className="w-16 clay-sunk px-3 py-2"
              />
              <input
                value={ing.unit ?? ""}
                onChange={(e) => patchIngredient(i, { unit: e.target.value || undefined })}
                placeholder="unit"
                className="w-20 clay-sunk px-3 py-2"
              />
              <input
                value={ing.name}
                onChange={(e) => patchIngredient(i, { name: e.target.value })}
                placeholder="name"
                className="w-28 clay-sunk px-3 py-2"
              />
              <button
                onClick={() => removeIngredient(i)}
                className="px-2 text-lg text-ink-soft hover:text-berry"
                aria-label="Remove ingredient"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <button onClick={addIngredient} className="clay-chip mt-3 px-4 py-1.5 text-sm font-semibold">
          + Add ingredient
        </button>
      </section>

      {/* Steps */}
      <section className="clay p-5">
        <h2 className="text-xl font-extrabold">Steps</h2>
        <ol className="mt-3 space-y-2">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-tangerine/15 text-xs font-bold text-tangerine">{i + 1}</span>
              <textarea
                value={step}
                onChange={(e) => patchStep(i, e.target.value)}
                rows={2}
                className="flex-1 clay-sunk px-3 py-2"
              />
              <button
                onClick={() => removeStep(i)}
                className="px-2 text-lg text-ink-soft hover:text-berry"
                aria-label="Remove step"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
        <button onClick={addStep} className="clay-chip mt-3 px-4 py-1.5 text-sm font-semibold">
          + Add step
        </button>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-1">
        <button onClick={save} disabled={saving} className="clay-btn-primary px-5 py-2.5 font-bold">
          {saving ? "Saving…" : wasDraft ? "Save to my recipes" : "Save changes"}
        </button>
        <button
          onClick={addToList}
          disabled={saving || recipe.ingredients.length === 0}
          className="clay-btn px-5 py-2.5 font-semibold disabled:opacity-50"
        >
          Add to shopping list
        </button>
        <button onClick={share} className="clay-btn px-5 py-2.5 font-semibold">
          {shared ? "Copied ✓" : "Share"}
        </button>
      </div>
    </div>
  );
}
