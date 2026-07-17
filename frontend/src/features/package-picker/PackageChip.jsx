import styles from "./PackageChip.module.css";

/**
 * A single clickable Package card in the picker grid. Clicking it is meant
 * to add a new LineItem to the active Page (see `createLineItemFromPackage`
 * in domain/models/Page.js) — the actual add-to-page logic lives in
 * PackagePickerPopup, this component only renders the card and reports the click.
 *
 * `disabled` is set by the caller when this package is already a line item
 * on the target page — per the "no duplicate packages in a table" rule, a
 * package already added shows dimmed and un-clickable rather than silently
 * allowing a second identical row.
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
        {disabled
          ? "আগেই যোগ করা হয়েছে"
          : pkg.rate != null
            ? `৳${pkg.rate}`
            : "রেট নেই"}
      </span>
    </button>
  );
}
