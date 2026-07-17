import DocumentHeader from "../shared/DocumentHeader.jsx";
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
 * directly. That aggregation happens before this component ever sees the
 * Page, so no separate SummaryPage markup is needed.
 *
 * @param {{ page: import('../../domain/models/Page.js').Page }} props
 */
export default function InvoicePage({ page }) {
  return (
    <div className={styles.page}>
      <DocumentHeader
        bannerText="চালান"
        page={page}
        rightFieldLabel="Log Code"
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
              <td className={styles.center}>{line.quantity ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.signatureRow}>
        <span>Receiver's Signature</span>
        <span>Proprietor's Signature</span>
      </div>
    </div>
  );
}
