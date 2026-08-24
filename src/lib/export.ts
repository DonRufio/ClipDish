// Getting recipes and lists out of the app as plain text — paste into a message,
// a note, or the native share sheet. Link-sharing needs the backend (Phase 5);
// this is device-local text.

import type { Recipe, ShoppingItem } from "./types";

function itemLine(item: ShoppingItem): string {
  const qty = item.quantity != null ? +item.quantity.toFixed(2) : "";
  return [qty, item.unit, item.name].filter(Boolean).join(" ");
}

export function recipeToText(r: Recipe): string {
  const lines: string[] = [r.title || "Untitled recipe", ""];
  if (r.ingredients.length) {
    lines.push("Ingredients:");
    for (const i of r.ingredients) lines.push(`- ${i.original || itemLine({ ...i, fromRecipeIds: [], checked: false, haveIt: false })}`);
    lines.push("");
  }
  if (r.steps.length) {
    lines.push("Method:");
    r.steps.forEach((s, n) => lines.push(`${n + 1}. ${s}`));
    lines.push("");
  }
  if (r.sourceUrl) lines.push(`Source: ${r.sourceUrl}`);
  return lines.join("\n").trim();
}

export function listToText(items: ShoppingItem[]): string {
  // Items arrive already aisle-sorted (mergeItems), so group in encounter order.
  const groups = new Map<string, ShoppingItem[]>();
  for (const item of items) {
    const c = item.category?.trim() || "other";
    (groups.get(c) ?? groups.set(c, []).get(c)!).push(item);
  }
  const lines: string[] = ["Shopping list", ""];
  for (const [category, group] of groups) {
    lines.push(category.toUpperCase());
    for (const item of group) lines.push(`- ${item.haveIt ? "(have) " : ""}${itemLine(item)}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

// Native share sheet on mobile, clipboard everywhere else. Returns how it went
// so the UI can flash the right confirmation.
export async function shareOrCopy(text: string, title: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return "shared";
    }
  } catch {
    // user cancelled the share sheet, or it failed — fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
