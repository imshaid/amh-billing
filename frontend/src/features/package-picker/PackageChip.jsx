import styles from "./PackageChip.module.css";

/**
 * A single clickable Package card in the picker grid. Clicking it is meant
 * to add a new LineItem to the active Page (see `createLineItemFromPackage`
 * in domain/models/Page.js) — the actual add-to-page logic lives in
 * PackagesTab, this component only renders the card and reports the click.
 *
 * @param {{
 *   pkg: import('../../domain/models/Package.js').Package,
 *   onClick: () => void,
 *   disabled?: boolean,
 * }} props
 */
export default function PackageChip({ pkg, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={styles.chip}
      onClick={onClick}
      disabled={disabled}
      title={pkg.items.map((item) => item.text).join("\n")}
    >
      <span className={styles.name}>{pkg.name}</span>
      <span className={styles.rate}>
        {pkg.rate != null ? `৳${pkg.rate}` : "রেট নেই"}
      </span>
    </button>
  );
}
