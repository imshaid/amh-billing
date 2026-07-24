import { supabase } from "./supabaseClient.js";
import { fieldHistoryToRow, rowToFieldHistory } from "./rowMapping.js";

const MAX_HISTORY_PER_FIELD = 20;

/**
 * All reads/writes to field_history go through this file, straight to
 * Supabase — no IndexedDB, no debounce (see this project's own decision
 * to remove the IndexedDB caching layer entirely — see
 * packages.repository.js's own doc comment for the full reasoning).
 */

/**
 * Returns the recently-used values for a given field (newest first), or an
 * empty array if nothing has been recorded yet. Used to populate the
 * autocomplete dropdown on inputs like buyerName/address — see
 * features/shared/EditableField.jsx.
 *
 * @param {string} fieldName  e.g. "buyerName", "address"
 * @returns {Promise<string[]>}
 */
export async function getFieldHistory(fieldName) {
  const { data, error } = await supabase
    .from("field_history")
    .select("*")
    .eq("field_name", fieldName)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToFieldHistory(data).values : [];
}

/**
 * Records a value as recently used for a field. Call this once a value is
 * actually committed (i.e. after EditableField's debounced save fires, not
 * on every keystroke) — see CanvasArea's field-change handler.
 *
 * Empty/whitespace-only values are ignored (nothing to remember). Existing
 * occurrences of the same value are moved to the front rather than
 * duplicated, so the list stays a small set of distinct recent values, most
 * recent first, capped at MAX_HISTORY_PER_FIELD.
 *
 * @param {string} fieldName
 * @param {string} value
 */
export async function recordFieldValue(fieldName, value) {
  const trimmed = value?.trim();
  if (!trimmed) return;

  const previousValues = await getFieldHistory(fieldName);

  const nextValues = [
    trimmed,
    ...previousValues.filter((v) => v !== trimmed),
  ].slice(0, MAX_HISTORY_PER_FIELD);

  const entry = {
    fieldName,
    values: nextValues,
    updatedAt: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("field_history")
    .upsert(fieldHistoryToRow(entry), { onConflict: "field_name" });
  if (error) throw error;
}
