import DocumentHeader from "../shared/DocumentHeader.jsx";
import EditableField from "../shared/EditableField.jsx";
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
 * docs/data-model.md "Summary Page" — with buyerName/address/date/
 * serialOrLogCode left blank by default and quantity values that are
 * live-aggregated from the Set's Invoice pages rather than typed in
 * directly. `onFieldChange`/`onLineChange`/`onAddRow` are still passed for
 * a Summary page (its quantity overrides use the same onLineChange path —
 * see useActivePage's summary aggregation for how `quantityIsOverridden`
 * is respected).
 *
 * @param {{
 *   page: import('../../domain/models/Page.js').Page,
 *   onFieldChange: (field: string, value: string) => void,
 *   onLineChange: (lineId: string, field: "quantity"|"rate", value: string) => void,
 *   onAddRow: () => void,
 * }} props
 */
export default function InvoicePage({
  page,
  onFieldChange,
  onLineChange,
  onAddRow,
}) {
  return (
    <div className={styles.page}>
      <DocumentHeader
        bannerText="চালান"
        page={page}
        rightFieldLabel="Log Code"
        onFieldChange={onFieldChange}
      />

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
            </tr>
          ))}
          <tr>
            <td colSpan={4} className={styles.addRowCell}>
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
      </table>

      <div className={styles.signatureRow}>
        <span>Receiver's Signature</span>
        <span>Proprietor's Signature</span>
      </div>
    </div>
  );
}
