// Shared extraction instruction. Spells out the exact JSON shape so providers
// that don't take a formal schema (Gemini) still return the right keys; the
// Anthropic provider additionally constrains with a json_schema.
export const EXTRACT_SYSTEM =
  "You extract a cooking recipe from free text (a video caption, description, or transcript). " +
  "Return ONLY a JSON object with these keys: " +
  "title (string), " +
  "ingredients (array of objects with: original — the creator's exact wording; name — a normalized lowercase name; " +
  "quantity — a number, only when stated; unit — a string, only when stated; category — an aisle like Produce/Dairy, when obvious), " +
  "steps (array of strings, in order), " +
  "tags (array of strings — cuisine, diet, meal type, only when clear), " +
  "cookTimeMins (integer, optional), servings (integer, optional). " +
  "Preserve exact wording in `original`. Do NOT guess amounts — omit quantity/unit when the text doesn't state them. " +
  "If the text contains no recipe, return empty ingredients and steps.";
