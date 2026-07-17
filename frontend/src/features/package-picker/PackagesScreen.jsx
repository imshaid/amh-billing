import { usePackages } from "../../hooks/usePackages.js";
import styles from "./PackagesScreen.module.css";

/**
 * Reached from the landing page's "প্যাকেজ" card. Currently read-only —
 * reuses `usePackages` (the same grouping hook PackagesTab uses inside the
 * workspace) to list every seeded Package by category. A full CRUD editor
 * (create/edit/delete a Package, per docs/data-model.md's "Packages are
 * user-editable") is separate, not-yet-built work; this screen exists so
 * the landing page's card has a real destination in the meantime rather
 * than a dead placeholder, and the create/edit UI can be added here later
 * without changing where this screen lives.
 */
export default function PackagesScreen() {
  const { groupedPackages, status } = usePackages();

  return (
    <div className={styles.screen}>
      <h2 className={styles.heading}>প্যাকেজ</h2>
      <p className={styles.subheading}>
        হোটেলের মেনু প্যাকেজের তালিকা। সম্পাদনার সুবিধা শীঘ্রই আসছে।
      </p>

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
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
