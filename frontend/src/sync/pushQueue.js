/**
 * Debounced, per-record push scheduling. This is a plain-JS equivalent of
 * hooks/useDebouncedCallback.js — that hook can't be used here because
 * pushes are triggered from db/*.repository.js (plain async functions
 * called from anywhere, not React components), not from inside a rendered
 * component's lifecycle.
 *
 * One timer per (table, id) pair, not one global timer — editing Page A's
 * quantity and Page B's rate in quick succession must debounce each page
 * independently; a single shared timer would keep resetting and could
 * starve a page that stops being edited while another keeps being edited.
 *
 * Debounce window: 2.5s. Chosen to sit comfortably above EditableField's
 * own save debounce (500ms, see useDebouncedCallback's default) so a
 * single field's autosave settling doesn't itself trigger a network push;
 * only genuine pauses in editing do. Short enough that "did my edit make
 * it to the cloud" resolves in a few seconds for the LWW-on-pull path
 * elsewhere in this app (see pull.js) to have fresh data to compare
 * against soon after an edit, not stale data from minutes ago.
 */

const DEBOUNCE_MS = 2500;

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const timers = new Map();
/** @type {Map<string, () => Promise<void>>} */
const pendingFns = new Map();

function runPush(key, pushFn) {
  pushFn().catch((err) => {
    // Sync failures must never surface as a broken UI — the write already
    // succeeded in IndexedDB (the local source of truth), so a push
    // failure here only means "not backed up to the cloud yet", not
    // "the user's edit was lost". Logged for visibility during
    // development; a future retry/backoff pass belongs here too, but is
    // out of scope for this initial sync implementation.
    console.warn(`[amh-billing] Supabase push failed for ${key}:`, err);
  });
}

/**
 * Schedules `pushFn` to run after the debounce window, replacing any
 * pending push already scheduled for this same key. `key` should uniquely
 * identify the record (e.g. `page:${id}`) so unrelated records never
 * cancel each other's pending push.
 *
 * @param {string} key
 * @param {() => Promise<void>} pushFn
 */
export function schedulePush(key, pushFn) {
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);

  pendingFns.set(key, pushFn);
  const timer = setTimeout(() => {
    timers.delete(key);
    pendingFns.delete(key);
    runPush(key, pushFn);
  }, DEBOUNCE_MS);

  timers.set(key, timer);
}

/**
 * If `key` has a push still waiting out its debounce window, runs it
 * immediately instead of waiting. Used before a delete — see
 * db/pages.repository.js's deletePage — so a delete can't race ahead of an
 * edit that was still debouncing when the delete happened (deleting the
 * Supabase row, then having the stale debounced edit re-insert it a moment
 * later, would resurrect a row the user just deleted).
 *
 * @param {string} key
 * @returns {Promise<void>}
 */
export async function flushPush(key) {
  const timer = timers.get(key);
  const pushFn = pendingFns.get(key);
  if (!timer || !pushFn) return;

  clearTimeout(timer);
  timers.delete(key);
  pendingFns.delete(key);
  await pushFn().catch((err) => {
    console.warn(`[amh-billing] Supabase flush push failed for ${key}:`, err);
  });
}

/**
 * Cancels any pending push for `key` without running it — used right
 * before deleting a record from Supabase, so a stale debounced write can
 * never fire *after* the delete and silently resurrect the row.
 *
 * @param {string} key
 */
export function cancelPush(key) {
  const timer = timers.get(key);
  if (timer) clearTimeout(timer);
  timers.delete(key);
  pendingFns.delete(key);
}
