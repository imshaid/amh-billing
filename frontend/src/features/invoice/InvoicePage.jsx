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
 * domain/aggregation/summaryCalculator.js's top doc comment for the current
 * (corrected) model: buyerName carries over from whatever page it was
 * created under (see createSummaryPage), address/date/serialOrLogCode start
 * blank, its package list stays synced to the Set's Bill page exactly like
 * Invoice's does, and its quantity is additionally overwritten every render
 * by summing the Set's Invoice pages — see `sumInvoiceQuantities`. Unlike
 * the old model, there is no "quantityIsOverridden" escape hatch anymore;
 * Summary's quantity is always a live total, same as any other page's
 * quantity field is always directly editable, it just gets recomputed
 * continuously.
 *
 * `canManagePackages` — false whenever a Bill page exists in the Set (Bill
 * is then the sole source of truth for packages — see CanvasArea, which
 * computes this) or whenever this is a Summary page (Summary never gets
 * direct package control, since it cannot exist without a Bill or Invoice
 * already present to summarize). True only for a standalone Invoice in a
 * Set with no Bill page at all. When false, the floating "+" and
 * PackageRowMenu (Edit/Delete) don't render — package name shows as plain
 * text — but the quantity field stays directly editable regardless.
 *
 * The table is exactly the original 4 columns (SL, Package, Items,
 * Quantity) — no extra column for the "+" button. Same technique as
 * BillPage (see its doc comment for the full rationale): the SL `<td>`
 * (.slCell) is `position: relative` and the "+" floats inside it via
 * `position: absolute` with a negative left offset, outside the table's
 * own left edge — it never occupies its own cell or changes colspan.
 *
 * @param {{
 *   page: import('../../domain/models/Page.js').Page,
 *   onFieldChange: (field: string, value: string) => void,
 *   onLineChange: (lineId: string, field: "quantity"|"rate", value: string) => void,
 *   canManagePackages: boolean,
 *   onAddAfterLine: (lineId: string|null) => void,
 *   onEditLine: (lineId: string) => void,
 *   onDeleteLine: (lineId: string) => void,
 * }} props
 */
export default function InvoicePage({
  page,
  onFieldChange,
  onLineChange,
  canManagePackages,
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
              canManagePackages ? (
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
              ) : null
            ) : (
              page.lineItems.map((line) => (
                <tr key={line.id}>
                  <td className={`${styles.center} ${styles.slCell}`}>
                    {canManagePackages && (
                      <span className={styles.floatingAddButton}>
                        <LineItemActions
                          onAdd={() => onAddAfterLine(line.id)}
                        />
                      </span>
                    )}
                    {line.sl}
                  </td>
                  <td className={styles.center}>
                    {canManagePackages ? (
                      <PackageRowMenu
                        packageName={line.packageName}
                        onEdit={() => onEditLine(line.id)}
                        onDelete={() => onDeleteLine(line.id)}
                      />
                    ) : (
                      line.packageName
                    )}
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
