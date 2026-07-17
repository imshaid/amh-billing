import { usePackages } from "../../hooks/usePackages.js";
import { updateDraftPage } from "../../db/pages.repository.js";
import { createLineItemFromPackage } from "../../domain/models/Page.js";
import PackageChip from "../../features/package-picker/PackageChip.jsx";
import styles from "./PackagesTab.module.css";

/**
 * Clicking a Package chip appends a new LineItem (snapshotted from that
 * Package — see Snapshot Policy in docs/data-model.md) to the currently
 * active Page. Disabled entirely when no Page is active, since there is
 * nothing to add a line item *to*.
 *
 * `pages` is read from AppShell's shared `usePages` (threaded through
 * BottomPanel) rather than fetched again here, so the line-item count used
 * for `sl` matches exactly what CanvasArea is currently showing. After the
 * write, `refreshPages()` is called so that shared state — and therefore
 * CanvasArea's preview — updates immediately.
 *
 * @param {{
 *   activeSetId: string|null,
 *   activePageId: string|null,
 *   pages: import('../../domain/models/Page.js').Page[]|null,
 *   refreshPages: () => Promise<void>,
 * }} props
 */
export default function PackagesTab({ activePageId, pages, refreshPages }) {
  const { groupedPackages, status } = usePackages();

  async function handleAddPackage(pkg) {
    if (!activePageId) return;

    const page = pages?.find((p) => p.id === activePageId);
    if (!page) {
      console.error(`[PackagesTab] active page ${activePageId} not found`);
      return;
    }

    const nextSl = page.lineItems.length + 1;
    const newLine = createLineItemFromPackage(pkg, { sl: nextSl });
    await updateDraftPage(activePageId, {
      lineItems: [...page.lineItems, newLine],
    });
    await refreshPages();
  }

  if (status === "loading") {
    return <p className={styles.emptyState}>Loading packages…</p>;
  }

  if (!activePageId) {
    return (
      <p className={styles.emptyState}>
        Select or create a page to start adding packages.
      </p>
    );
  }

  return (
    <div className={styles.tab}>
      {groupedPackages.map(({ category, packages }) => (
        <div key={category} className={styles.categoryGroup}>
          <p className={styles.categoryLabel}>{category}</p>
          <div className={styles.chipGrid}>
            {packages.map((pkg) => (
              <PackageChip key={pkg.id} pkg={pkg} onClick={() => handleAddPackage(pkg)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
