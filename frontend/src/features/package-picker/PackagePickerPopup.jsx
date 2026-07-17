import { useState } from "react";
import { usePackages } from "../../hooks/usePackages.js";
import PackageChip from "./PackageChip.jsx";
import styles from "./PackagePickerPopup.module.css";

/**
 * Popup opened by a page's row-level "+ যোগ করুন" button (see BillPage/
 * InvoicePage's onAddRow). Picking a package here always targets the page
 * that triggered it — the caller (CanvasArea) tracks which page id opened
 * the popup and passes the resulting package back to that page's own
 * add-line-item handler; this component itself is page-agnostic.
 *
 * `existingPackageIds` — the packageId set already present as line items on
 * the target page — disables (and visually dims, see PackageChip) any
 * package already added, enforcing "no duplicate packages in a table"
 * without a separate confirmation step.
 *
 * A search box live-filters the grid by name as the user types, since with
 * 35+ packages across categories, scrolling to find one by eye doesn't
 * scale as well as typing a few letters.
 *
 * @param {{
 *   onPick: (pkg: import('../../domain/models/Package.js').Package) => void,
 *   onClose: () => void,
 *   existingPackageIds: Set<string>,
 * }} props
 */
export default function PackagePickerPopup({
  onPick,
  onClose,
  existingPackageIds,
}) {
  const { groupedPackages, status } = usePackages();
  const [query, setQuery] = useState("");

  const filteredGroups = groupedPackages
    .map(({ category, label, packages }) => ({
      category,
      label,
      packages: query.trim()
        ? packages.filter((pkg) =>
            pkg.name.toLowerCase().includes(query.trim().toLowerCase()),
          )
        : packages,
    }))
    .filter((g) => g.packages.length > 0);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <p className={styles.heading}>প্যাকেজ বেছে নিন</p>

        <input
          type="text"
          className={styles.searchInput}
          placeholder="প্যাকেজের নাম দিয়ে খুঁজুন…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {status === "loading" && (
          <p className={styles.emptyState}>লোড হচ্ছে…</p>
        )}

        {status === "ready" && filteredGroups.length === 0 && (
          <p className={styles.emptyState}>কোনো প্যাকেজ পাওয়া যায়নি।</p>
        )}

        {status === "ready" &&
          filteredGroups.map(({ category, label, packages }) => (
            <div key={category} className={styles.categoryGroup}>
              <p className={styles.categoryLabel}>{label}</p>
              <div className={styles.chipGrid}>
                {packages.map((pkg) => (
                  <PackageChip
                    key={pkg.id}
                    pkg={pkg}
                    onClick={() => onPick(pkg)}
                    disabled={existingPackageIds.has(pkg.id)}
                  />
                ))}
              </div>
            </div>
          ))}

        <button className={styles.closeButton} onClick={onClose}>
          বাতিল
        </button>
      </div>
    </div>
  );
}
