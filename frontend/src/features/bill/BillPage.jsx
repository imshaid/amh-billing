import { numberToWords } from "../../domain/numberToWords.js";
import DocumentHeader from "../shared/DocumentHeader.jsx";
import EditableField from "../shared/EditableField.jsx";
import LineItemActions from "../shared/LineItemActions.jsx";
import PackageRowMenu from "../shared/PackageRowMenu.jsx";
import styles from "./BillPage.module.css";

/**
 * Renders a single Bill page, matching the hotel's existing printed design
 * (see project files: main.tex, and the sample bill image in project
 * knowledge). This same markup is what the PDF service will render
 * headlessly later — see docs/data-model.md and backend/README.md.
 *
 * The table is exactly the original 6 columns (SL, Package, Items,
 * Quantity, Rate, Amount) — no extra column was added for the "+" button.
 * The SL `<td>` (.slCell) is `position: relative`, and the "+"
 * (LineItemActions, wrapped in .floatingAddButton) is `position: absolute`
 * inside it with a negative left offset — floating outside the table's
 * own left edge entirely. It does not occupy its own `<td>`/`<th>` and
 * does not affect colspan/column widths anywhere. This was a deliberate,
 * explicit design requirement: the printed table structure must never
 * change shape for an editing affordance.
 *
 * Inline-editable: header fields via DocumentHeader's onFieldChange,
 * quantity/rate per line via EditableField (onLineChange).
 *
 * Adding/editing/deleting packages has exactly two entry points, both
 * always visible, no separate "append to end" button:
 *   - The floating "+" to the left of every row (onAddAfterLine) — inserts
 *     a new package at that row's position. When the page has zero
 *     lineItems, a single blank placeholder row still renders with this
 *     button so there's always somewhere to start from.
 *   - Clicking a row's package name (PackageRowMenu) — opens Edit (replace
 *     this row's package) / Delete (remove this row, after confirmation).
 * Both are owned by CanvasArea, which tracks which page/line triggered them
 * and owns the actual package-picker popup and delete confirmation.
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
export default function BillPage({
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
        bannerText="বিল"
        page={page}
        rightFieldLabel="ক্রমিক"
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
              <th className={styles.colRate}>Rate</th>
              <th className={styles.colAmount}>Amount</th>
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
                  <td className={styles.center}>
                    <EditableField
                      type="number"
                      value={line.rate}
                      onChange={(v) => onLineChange(line.id, "rate", v)}
                      align="center"
                    />
                  </td>
                  <td className={styles.right}>{formatNumber(line.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className={styles.totalLabel}>
                Total: {page.total != null ? numberToWords(page.total) : ""}
              </td>
              <td className={styles.totalAmount}>{formatNumber(page.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className={styles.signatureRow}>
        <span>Receiver's Signature</span>
        <span>Proprietor's Signature</span>
      </div>
    </div>
  );
}

function formatNumber(value) {
  if (value == null) return "";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
