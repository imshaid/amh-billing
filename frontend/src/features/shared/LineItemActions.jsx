import styles from "./LineItemActions.module.css";

/**
 * "+" button shown to the left of every line-item row (and, when a page
 * has zero packages yet, a single blank placeholder row) — clicking it
 * opens the package picker to insert a new package at this row's position.
 * Editing or deleting an existing row's package instead happens via
 * clicking the package *name* itself, which is wrapped in PackageRowMenu
 * (Edit/Delete) — see BillPage/InvoicePage.
 *
 * Rendered inside a small floating wrapper positioned via CSS (see
 * BillPage.module.css's .floatingAddButton) — this component itself has no
 * layout assumptions and doesn't know it's floating.
 *
 * @param {{ onAdd: () => void }} props
 */
export default function LineItemActions({ onAdd }) {
  return (
    <button
      type="button"
      className={styles.addButton}
      onClick={onAdd}
      title="প্যাকেজ যোগ করুন"
      aria-label="প্যাকেজ যোগ করুন"
      // Marks this as workspace-only chrome to strip out of PDF exports —
      // see serializePageToHtml.js, which injects a
      // `[data-pdf-hide] { display: none }` rule when building the HTML
      // sent to the PDF backend. This "+" button has no meaning on a
      // printed document (there's no click to have on paper), so it must
      // never appear in an exported PDF the way it did before this fix.
      data-pdf-hide="true"
    >
      +
    </button>
  );
}
