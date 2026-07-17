import { numberToWords } from "../../domain/numberToWords.js";
import DocumentHeader from "../shared/DocumentHeader.jsx";
import EditableField from "../shared/EditableField.jsx";
import styles from "./BillPage.module.css";

/**
 * Renders a single Bill page, matching the hotel's existing printed design
 * (see project files: main.tex, and the sample bill image in project
 * knowledge). This same markup is what the PDF service will render
 * headlessly later — see docs/data-model.md and backend/README.md.
 *
 * Inline-editable: header fields via DocumentHeader's onFieldChange,
 * quantity/rate per line via EditableField (onLineChange). `onAddRow` is
 * rendered as a row below the table — clicking it is meant to open the
 * package picker for this specific page (see CanvasArea, which owns that
 * popup so it can target whichever page it was triggered from).
 *
 * @param {{
 *   page: import('../../domain/models/Page.js').Page,
 *   onFieldChange: (field: string, value: string) => void,
 *   onLineChange: (lineId: string, field: "quantity"|"rate", value: string) => void,
 *   onAddRow: () => void,
 * }} props
 */
export default function BillPage({
  page,
  onFieldChange,
  onLineChange,
  onAddRow,
}) {
  return (
    <div className={styles.page}>
      <DocumentHeader
        bannerText="বিল"
        page={page}
        rightFieldLabel="ক্রমিক"
        onFieldChange={onFieldChange}
      />

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
          {page.lineItems.map((line) => (
            <tr key={line.id}>
              <td className={styles.center}>{line.sl}</td>
              <td className={styles.center}>{line.packageName}</td>
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
                  fill={false}
                />
              </td>
              <td className={styles.center}>
                <EditableField
                  type="number"
                  value={line.rate}
                  onChange={(v) => onLineChange(line.id, "rate", v)}
                  align="center"
                  fill={false}
                />
              </td>
              <td className={styles.right}>{formatNumber(line.amount)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={6} className={styles.addRowCell}>
              <button
                type="button"
                className={styles.addRowButton}
                onClick={onAddRow}
              >
                + যোগ করুন
              </button>
            </td>
          </tr>
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
