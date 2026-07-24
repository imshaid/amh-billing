import { supabase } from "./supabaseClient.js";
import { categoryToRow, rowToCategory } from "./rowMapping.js";
import { createCategory } from "../domain/models/Category.js";

/**
 * All reads/writes to Categories go through this file, straight to
 * Supabase — same Supabase-direct pattern as every other
 * db/*.repository.js (see packages.repository.js's own doc comment for
 * the full reasoning: no IndexedDB, no debounce, no LWW merge).
 *
 * Categories exist so the person can create/rename/delete their own
 * package categories (see this project's own decision) — replacing the
 * previous fixed Snacks/Lunch/Iftar/null enum baked directly into
 * Package.category.
 */

/** @returns {Promise<import('../domain/models/Category.js').Category[]>} */
export async function getAllCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToCategory);
}

/** @returns {Promise<import('../domain/models/Category.js').Category|undefined>} */
export async function getCategoryById(id) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToCategory(data) : undefined;
}

/**
 * Creates a new Category, placed after every existing one by display
 * order (appended to the end of the tab strip — see
 * features/package-picker/PackagesScreen.jsx) unless the caller
 * explicitly provides a `displayOrder`.
 *
 * @param {Partial<import('../domain/models/Category.js').Category>} input
 */
export async function addCategory(input) {
  let displayOrder = input.displayOrder;
  if (displayOrder == null) {
    const existing = await getAllCategories();
    displayOrder =
      existing.length === 0
        ? 0
        : Math.max(...existing.map((c) => c.displayOrder)) + 1;
  }

  const category = createCategory({ ...input, displayOrder });
  const { error } = await supabase
    .from("categories")
    .insert(categoryToRow(category));
  if (error) throw error;
  return category;
}

/**
 * @param {string} id
 * @param {Partial<import('../domain/models/Category.js').Category>} changes
 */
export async function updateCategory(id, changes) {
  const existing = await getCategoryById(id);
  if (!existing) {
    throw new Error(`Category not found: ${id}`);
  }
  const updated = {
    ...existing,
    ...changes,
    id,
    updatedAt: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("categories")
    .update(categoryToRow(updated))
    .eq("id", id);
  if (error) throw error;
  return updated;
}

/**
 * Deletes a Category AND every Package under it — per this project's own
 * decision: deleting a category with packages in it deletes those
 * packages too (with a confirmation warning shown before this is called,
 * see PackagesScreen.jsx's own ConfirmDialog usage). Relies on
 * `packages.category_id ... on delete cascade` (see
 * supabase_add_categories_table.sql) to do the actual package cleanup —
 * Postgres removes the Package rows as part of the same delete, and
 * subscribeToPackages' whole-table Realtime subscription (see
 * packages.repository.js) picks up each resulting delete individually.
 *
 * @param {string} id
 */
export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Subscribes to live Category changes via Supabase Realtime — see
 * packages.repository.js's subscribeToPackages for the full reasoning
 * (row-level live sync across devices, not keystroke-level).
 *
 * @param {() => void} onChange
 * @returns {() => void} unsubscribe
 */
export function subscribeToCategories(onChange) {
  const channel = supabase
    .channel(`categories-changes-${crypto.randomUUID()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "categories" },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
