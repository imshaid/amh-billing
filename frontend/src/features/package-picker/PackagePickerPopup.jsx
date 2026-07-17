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
 * @param {{ onPick: (pkg: import('../../domain/models/Package.js').Package) => void, onClose: () => void }} props
 */
export default function PackagePickerPopup({ onPick, onClose }) {
  const { groupedPackages, status } = usePackages();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <p className={styles.heading}>প্যাকেজ বেছে নিন</p>

        {status === "loading" && <p>লোড হচ্ছে…</p>}

        {status === "ready" &&
          groupedPackages.map(({ category, label, packages }) => (
            <div key={category}>
              <p className={styles.categoryLabel}>{label}</p>
              <div className={styles.chipGrid}>
                {packages.map((pkg) => (
                  <PackageChip
                    key={pkg.id}
                    pkg={pkg}
                    onClick={() => onPick(pkg)}
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
