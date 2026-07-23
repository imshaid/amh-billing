import { useState } from "react";
import PackageItemsModal from "./PackageItemsModal.jsx";
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
 * Every card is a fixed height/width (see PackageChip.module.css) — before
 * this, a category with mostly one-line names sitting next to a handful of
 * two-line ones (e.g. "Testy Treat / Well Food / Fulkoli / Bonoful / Al
 * Arabian Vegetable Roll - 1 pc" from BillPage.module.css's own kind of
 * long names) produced a visibly uneven grid, since each card's height
 * only ever matched its own name's line count. Fixing the height and
 * letting the name area itself clip/scroll if needed (rather than
 * reflowing the whole card) keeps every row of the grid visually level
 * regardless of name length.
 *
 * The info icon button (bottom-right, next to the price — see .module.css)
 * opens PackageItemsModal showing this package's full item list in Bangla
 * and English. It's a nested `<button>`-adjacent element rather than a
 * child of the outer `<button>` itself — nesting an interactive element
 * inside another interactive element is invalid HTML and unreliable for
 * click handling (the outer button's own onClick would also fire) — see
 * this component's render for how the two are kept as siblings inside a
 * non-interactive wrapper, with `stopPropagation` on the icon's own click
 * so opening the info modal never also triggers `onClick`/onPick as if
 * the person had picked this package.
 *
 * @param {{
 *   pkg: import('../../domain/models/Package.js').Package,
 *   onClick: () => void,
 *   disabled?: boolean,
 * }} props
 */
export default function PackageChip({ pkg, onClick, disabled = false }) {
  const [showItemsModal, setShowItemsModal] = useState(false);

  return (
    <>
      <div className={`${styles.chip} ${disabled ? styles.chipDisabled : ""}`}>
        <button
          type="button"
          className={styles.chipButton}
          onClick={onClick}
          disabled={disabled}
        >
          <span className={styles.name}>{pkg.name}</span>
        </button>

        <div className={styles.footer}>
          <span className={styles.rate}>
            {disabled
              ? "আগেই যোগ করা হয়েছে"
              : pkg.rate != null
                ? `৳${pkg.rate}`
                : "রেট নেই"}
          </span>
          <button
            type="button"
            className={styles.infoButton}
            onClick={(e) => {
              e.stopPropagation();
              setShowItemsModal(true);
            }}
            aria-label={`${pkg.name} — আইটেম দেখুন`}
            title="আইটেম দেখুন"
          >
            <InfoIcon />
          </button>
        </div>
      </div>

      {showItemsModal && (
        <PackageItemsModal pkg={pkg} onClose={() => setShowItemsModal(false)} />
      )}
    </>
  );
}

function InfoIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
