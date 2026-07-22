import DocumentHeader from "../shared/DocumentHeader.jsx";
import EditableField from "../shared/EditableField.jsx";
import LineItemActions from "../shared/LineItemActions.jsx";
import PackageRowMenu from "../shared/PackageRowMenu.jsx";
import styles from "./InvoicePage.module.css";

/**
 * Renders a single Invoice page, matching the hotel's existing printed
 * design (see project files: main.tex — the `invoicepage` environment).
 * Unlike Bill, Invoice only tracks quantity per package — no rate/amount/
 * total — and its meta box's right-hand field is "Log Code" rather than
 * "ক্রমিক". Everything else (header, hero row, buyer info) is identical to
 * Bill, hence the shared DocumentHeader component.
 *
 * A Summary page is mechanically this same component — see
 * docs/data-model.md "Summary Page" — with buyerName left as whatever
 * carried over from the page it was created under (see createSummaryPage)
 * and address/date/serialOrLogCode left blank by default; quantity values
 * are live-aggregated from the Set's Invoice pages (or Bill pages as a
 * fallback — see summaryCalculator.js) rather than typed in directly.
 * `onFieldChange`/`onLineChange`/`onAddAfterLine`/`onEditLine`/
 * `onDeleteLine` are still passed for a Summary page (its quantity
 * overrides use the same onLineChange path — see useRenderedPages' summary
 * aggregation for how `quantityIsOverridden` is respected).
 *
 * The table is exactly the original 4 columns (SL, Package, Items,
 * Quantity) — no extra column for the "+" button. Same technique as
 * BillPage (see its doc comment for the full rationale): the SL `<td>`
 * (.slCell) is `position: relative` and the "+" floats inside it via
 * `position: absolute` with a negative left offset, outside the table's
 * own left edge — it never occupies its own cell or changes colspan.
 *
 * Adding/editing/deleting packages has exactly two entry points, same as
 * BillPage: the floating "+" to the left of every row (inserts at that
 * position, and is the only control shown on a lone blank placeholder row
 * when lineItems is empty), and clicking a row's package name (Edit
 * replaces the package, Delete removes the row after confirmation).
 *
 * @param {{
 *   page: import('../../domain/models/Page.js').Page,
 *   onFieldChange: (field: string, value: string) => void,
 *   onLineChange: (lineId: string, field: "quantity"|"rate", value: string) => void,
 *   onAddAfterLine: (lineId: string|null) => void,
 *   onEditLine: (lineId: string) => void,
 *   onDeleteLine: (lineId: string) => void,
 * }} props
 */
export default function InvoicePage({
  page,
  onFieldChange,
  onLineChange,
  onAddAfterLine,
  onEditLine,
  onDeleteLine,
}) {
  return (
    <div className={styles.page}>
      <DocumentHeader
        bannerText="চালান"
        page={page}
        rightFieldLabel="Log Code"
        onFieldChange={onFieldChange}
      />

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colSl}>SL</th>
              <th className={styles.colPackage}>Package</th>
              <th className={styles.colItems}>Items</th>
              <th className={styles.colQty}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {page.lineItems.length === 0 ? (
              <tr>
                <td className={`${styles.center} ${styles.slCell}`}>
                  <span className={styles.floatingAddButton}>
                    <LineItemActions onAdd={() => onAddAfterLine(null)} />
                  </span>
                </td>
                <td className={styles.center}></td>
                <td></td>
                <td></td>
              </tr>
            ) : (
              page.lineItems.map((line) => (
                <tr key={line.id}>
                  <td className={`${styles.center} ${styles.slCell}`}>
                    <span className={styles.floatingAddButton}>
                      <LineItemActions onAdd={() => onAddAfterLine(line.id)} />
                    </span>
                    {line.sl}
                  </td>
                  <td className={styles.center}>
                    <PackageRowMenu
                      packageName={line.packageName}
                      onEdit={() => onEditLine(line.id)}
                      onDelete={() => onDeleteLine(line.id)}
                    />
                  </td>
                  <td>
                    <ol className={styles.itemsList}>
                      {line.items.map((item) => (
                        <li key={item.id}>{item.text}</li>
                      ))}
                    </ol>
                  </td>
                  <td className={styles.center}>
                    <EditableField
                      type="number"
                      value={line.quantity}
                      onChange={(v) => onLineChange(line.id, "quantity", v)}
                      align="center"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.signatureRow}>
        <span>Receiver's Signature</span>
        <span>Proprietor's Signature</span>
      </div>
    </div>
  );
}
