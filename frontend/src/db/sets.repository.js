import { getDB } from './client.js'
import { STORE } from './schema.js'
import { createSet } from '../domain/models/Set.js'
import { getPagesBySet } from './pages.repository.js'

/** @returns {Promise<import('../domain/models/Set.js').Set|undefined>} */
export async function getSetById(id) {
  const db = await getDB()
  return db.get(STORE.SETS, id)
}

/** @returns {Promise<import('../domain/models/Set.js').Set[]>} */
export async function getAllSets() {
  const db = await getDB()
  return db.getAll(STORE.SETS)
}

/**
 * @param {Partial<import('../domain/models/Set.js').Set>} input
 */
export async function addSet(input) {
  const db = await getDB()
  const set = createSet(input)
  await db.add(STORE.SETS, set)
  return set
}

/**
 * @param {string} id
 * @param {Partial<import('../domain/models/Set.js').Set>} changes
 */
export async function updateSet(id, changes) {
  const db = await getDB()
  const existing = await db.get(STORE.SETS, id)
  if (!existing) {
    throw new Error(`Set not found: ${id}`)
  }
  const updated = {
    ...existing,
    ...changes,
    id,
    updatedAt: new Date().toISOString(),
  }
  await db.put(STORE.SETS, updated)
  return updated
}

/**
 * Re-derives `pageIds` from the actual Page rows (ordered by date — see
 * `getPagesBySet`) and persists it back onto the Set. Call this after adding
 * a page or changing a page's date, so `Set.pageIds` never drifts out of
 * sync with reality.
 *
 * @param {string} setId
 */
export async function resyncSetPageOrder(setId) {
  const pages = await getPagesBySet(setId)
  return updateSet(setId, { pageIds: pages.map((p) => p.id) })
}

/** @param {string} id */
export async function deleteSet(id) {
  const db = await getDB()
  await db.delete(STORE.SETS, id)
}
