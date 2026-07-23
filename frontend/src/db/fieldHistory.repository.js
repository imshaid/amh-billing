import { getDB } from "./client.js";
import { STORE } from "./schema.js";
import { schedulePush } from "../sync/pushQueue.js";
import { pushFieldHistory } from "../sync/syncEngine.js";

const MAX_HISTORY_PER_FIELD = 20;

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
  const db = await getDB();
  const row = await db.get(STORE.FIELD_HISTORY, fieldName);
  return row?.values ?? [];
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

  const db = await getDB();
  const existing = await db.get(STORE.FIELD_HISTORY, fieldName);
  const previousValues = existing?.values ?? [];

  const nextValues = [
    trimmed,
    ...previousValues.filter((v) => v !== trimmed),
  ].slice(0, MAX_HISTORY_PER_FIELD);

  // `updatedAt` added alongside sync wiring — field_history predates this
  // field (see this store's original schema.js entry, which only ever
  // stored { fieldName, values }), but LWW merge on pull (see
  // sync/syncEngine.js's pickNewer) needs a timestamp to compare like
  // every other synced table.
  const entry = {
    fieldName,
    values: nextValues,
    updatedAt: new Date().toISOString(),
  };
  await db.put(STORE.FIELD_HISTORY, entry);
  schedulePush(`field_history:${fieldName}`, () => pushFieldHistory(entry));
}
