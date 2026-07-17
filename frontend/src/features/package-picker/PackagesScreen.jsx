import { useState } from "react";
import { usePackages } from "../../hooks/usePackages.js";
import { updatePackage, deletePackage } from "../../db/packages.repository.js";
import PackageEditModal from "./PackageEditModal.jsx";
import ConfirmDialog from "../shared/ConfirmDialog.jsx";
import styles from "./PackagesScreen.module.css";

/**
 * Reached from the landing page's "প্যাকেজ" card. Lists every seeded
 * Package by category (via `usePackages`, the same grouping hook the
 * package-picker popup uses in the workspace) with per-package "এডিট" and
 * "ডিলিট" buttons. "এডিট" opens PackageEditModal (name/category/rate/items);
 * "ডিলিট" opens a ConfirmDialog before actually removing the package, per
 * the "confirm before any delete" requirement.
 *
 * Editing/deleting a Package never touches pages that already snapshotted
 * its items onto a line — see Snapshot Policy in docs/data-model.md — only
 * future "+ যোগ করুন" picks are affected.
 */
export default function PackagesScreen() {
  const { groupedPackages, status, refresh } = usePackages();
  const [editingPkg, setEditingPkg] = useState(null);
  const [deletingPkg, setDeletingPkg] = useState(null);

  async function handleSaveEdit(changes) {
    if (!editingPkg) return;
    await updatePackage(editingPkg.id, changes);
    await refresh();
    setEditingPkg(null);
  }

  async function handleConfirmDelete() {
    if (!deletingPkg) return;
    await deletePackage(deletingPkg.id);
    await refresh();
    setDeletingPkg(null);
  }

  return (
    <div className={styles.screen}>
      <h2 className={styles.heading}>প্যাকেজ</h2>
      <p className={styles.subheading}>হোটেলের মেনু প্যাকেজের তালিকা।</p>

      {status === "loading" && <p className={styles.subheading}>লোড হচ্ছে…</p>}

      {status === "ready" &&
        groupedPackages.map(({ category, label, packages }) => (
          <div key={category} className={styles.categoryGroup}>
            <p className={styles.categoryLabel}>{label}</p>
            <div className={styles.packageList}>
              {packages.map((pkg) => (
                <div key={pkg.id} className={styles.packageRow}>
                  <span className={styles.packageName}>{pkg.name}</span>
                  <span className={styles.packageRate}>
                    {pkg.rate != null ? `৳${pkg.rate}` : "রেট নেই"}
                  </span>
                  <span className={styles.packageActions}>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => setEditingPkg(pkg)}
                    >
                      এডিট
                    </button>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => setDeletingPkg(pkg)}
                    >
                      ডিলিট
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

      {editingPkg && (
        <PackageEditModal
          pkg={editingPkg}
          onSave={handleSaveEdit}
          onCancel={() => setEditingPkg(null)}
        />
      )}

      {deletingPkg && (
        <ConfirmDialog
          message={`"${deletingPkg.name}" প্যাকেজটা ডিলিট করতে চান? এটা আর ফেরানো যাবে না।`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingPkg(null)}
        />
      )}
    </div>
  );
}
