import { useEffect, useState } from "react";
import { usePackages } from "../../hooks/usePackages.js";
import {
  addPackage,
  updatePackage,
  deletePackage,
} from "../../db/packages.repository.js";
import { addCategory, deleteCategory } from "../../db/categories.repository.js";
import PackageEditModal from "./PackageEditModal.jsx";
import PackageItemsModal from "./PackageItemsModal.jsx";
import CategoryAddModal from "./CategoryAddModal.jsx";
import ConfirmDialog from "../shared/ConfirmDialog.jsx";
import styles from "./PackagesScreen.module.css";

/**
 * Reached from the landing page's "প্যাকেজ" card. Redesigned (see this
 * project's own decision) around a horizontal category tab strip rather
 * than one long page listing every category's packages stacked
 * vertically — with categories now a real, user-managed table (see
 * domain/models/Category.js) rather than a fixed enum, tabs are what
 * make browsing scale as categories are added.
 *
 * Three modals, opened from here:
 *   - PackageItemsModal (view details — click any package card; carries
 *     onEdit/onDelete here, unlike its read-only use in the picker popup)
 *   - PackageEditModal (add new / edit existing — same form either way,
 *     `pkg: null` signals "new")
 *   - CategoryAddModal (add a new tab)
 *
 * Deleting a Category cascades to delete every Package under it (see
 * db/categories.repository.js's deleteCategory and
 * supabase_add_categories_table.sql's `on delete cascade`) — the
 * ConfirmDialog message makes that explicit before it happens, per this
 * project's own decision.
 *
 * Editing/deleting a Package never touches pages that already snapshotted
 * its items onto a line — see Snapshot Policy in docs/data-model.md — only
 * future "+ যোগ করুন" picks are affected.
 */
export default function PackagesScreen() {
  const { groupedPackages, categories, status, refresh } = usePackages();
  const [activeCategoryId, setActiveCategoryId] = useState(undefined);
  const [viewingPkg, setViewingPkg] = useState(null);
  const [editingPkg, setEditingPkg] = useState(null); // null = closed, {} = "new", Package = "edit"
  const [addingCategory, setAddingCategory] = useState(false);
  const [deletingPkg, setDeletingPkg] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  // Pick a default active tab once data first loads, and keep it valid if
  // the active category is deleted out from under the user (falls back
  // to the first remaining tab rather than showing a blank pane).
  useEffect(() => {
    if (status !== "ready") return;
    const stillExists = groupedPackages.some(
      (g) => g.categoryId === activeCategoryId,
    );
    if (activeCategoryId === undefined || !stillExists) {
      setActiveCategoryId(groupedPackages[0]?.categoryId ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, groupedPackages]);

  const activeGroup = groupedPackages.find(
    (g) => g.categoryId === activeCategoryId,
  );

  async function handleSavePackage(changes) {
    if (editingPkg?.id) {
      await updatePackage(editingPkg.id, changes);
    } else {
      await addPackage({ ...changes, categoryId: activeCategoryId });
    }
    await refresh();
    setEditingPkg(null);
  }

  async function handleConfirmDeletePackage() {
    if (!deletingPkg) return;
    await deletePackage(deletingPkg.id);
    await refresh();
    setDeletingPkg(null);
    setViewingPkg(null);
  }

  async function handleSaveCategory(name) {
    const created = await addCategory({ name });
    await refresh();
    setAddingCategory(false);
    setActiveCategoryId(created.id);
  }

  async function handleConfirmDeleteCategory() {
    if (!deletingCategoryId) return;
    await deleteCategory(deletingCategoryId);
    await refresh();
    setDeletingCategoryId(null);
  }

  const deletingCategoryLabel = groupedPackages.find(
    (g) => g.categoryId === deletingCategoryId,
  )?.label;
  const deletingCategoryPackageCount =
    groupedPackages.find((g) => g.categoryId === deletingCategoryId)?.packages
      .length ?? 0;

  return (
    <div className={styles.screen}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.heading}>প্যাকেজ</h2>
          <p className={styles.subheading}>হোটেলের মেনু প্যাকেজের তালিকা।</p>
        </div>
      </div>

      {status === "loading" && <p className={styles.subheading}>লোড হচ্ছে…</p>}

      {status === "ready" && (
        <>
          <div className={styles.tabStrip}>
            {groupedPackages.map((group) => (
              <button
                key={group.categoryId ?? "uncategorized"}
                type="button"
                className={`${styles.tab} ${
                  group.categoryId === activeCategoryId ? styles.tabActive : ""
                }`}
                onClick={() => setActiveCategoryId(group.categoryId)}
              >
                {group.label}
                <span className={styles.tabCount}>{group.packages.length}</span>
              </button>
            ))}
            <button
              type="button"
              className={styles.addTabButton}
              onClick={() => setAddingCategory(true)}
              aria-label="নতুন ক্যাটাগরি যোগ করুন"
              title="নতুন ক্যাটাগরি যোগ করুন"
            >
              +
            </button>
          </div>

          {activeGroup && (
            <div className={styles.paneHeader}>
              {activeCategoryId != null && (
                <button
                  type="button"
                  className={styles.deleteCategoryButton}
                  onClick={() => setDeletingCategoryId(activeCategoryId)}
                >
                  এই ক্যাটাগরি ডিলিট করুন
                </button>
              )}
              <button
                type="button"
                className={styles.addPackageButton}
                onClick={() => setEditingPkg({})}
              >
                + নতুন প্যাকেজ
              </button>
            </div>
          )}

          <div className={styles.cardGrid}>
            {activeGroup?.packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                className={styles.card}
                onClick={() => setViewingPkg(pkg)}
              >
                <span className={styles.cardName}>{pkg.name}</span>
                <span className={styles.cardMeta}>
                  {pkg.rate != null ? `৳${pkg.rate}` : "রেট নেই"} ·{" "}
                  {pkg.items.length} আইটেম
                </span>
              </button>
            ))}
            {activeGroup && activeGroup.packages.length === 0 && (
              <p className={styles.emptyState}>
                এই ক্যাটাগরিতে এখনো কোনো প্যাকেজ নেই।
              </p>
            )}
          </div>
        </>
      )}

      {viewingPkg && (
        <PackageItemsModal
          pkg={viewingPkg}
          categoryLabel={activeGroup?.label}
          onClose={() => setViewingPkg(null)}
          onEdit={() => {
            setEditingPkg(viewingPkg);
            setViewingPkg(null);
          }}
          onDelete={() => setDeletingPkg(viewingPkg)}
        />
      )}

      {editingPkg && (
        <PackageEditModal
          pkg={editingPkg.id ? editingPkg : null}
          categories={categories}
          defaultCategoryId={activeCategoryId}
          onSave={handleSavePackage}
          onCancel={() => setEditingPkg(null)}
        />
      )}

      {addingCategory && (
        <CategoryAddModal
          onSave={handleSaveCategory}
          onCancel={() => setAddingCategory(false)}
        />
      )}

      {deletingPkg && (
        <ConfirmDialog
          message={`"${deletingPkg.name}" প্যাকেজটা ডিলিট করতে চান? এটা আর ফেরানো যাবে না।`}
          onConfirm={handleConfirmDeletePackage}
          onCancel={() => setDeletingPkg(null)}
        />
      )}

      {deletingCategoryId && (
        <ConfirmDialog
          message={
            deletingCategoryPackageCount > 0
              ? `"${deletingCategoryLabel}" ক্যাটাগরি ডিলিট করতে চান? এর ভেতরের ${deletingCategoryPackageCount}টা প্যাকেজও একসাথে ডিলিট হয়ে যাবে। এটা আর ফেরানো যাবে না।`
              : `"${deletingCategoryLabel}" ক্যাটাগরি ডিলিট করতে চান? এটা আর ফেরানো যাবে না।`
          }
          onConfirm={handleConfirmDeleteCategory}
          onCancel={() => setDeletingCategoryId(null)}
        />
      )}
    </div>
  );
}
