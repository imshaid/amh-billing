import { numberToWords } from "../../domain/numberToWords.js";
import DocumentHeader from "../shared/DocumentHeader.jsx";
import styles from "./BillPage.module.css";

/**
 * Renders a single Bill page, matching the hotel's existing printed design
 * (see project files: main.tex, and the sample bill image in project
 * knowledge). This same markup is what the PDF service will render
 * headlessly later — see docs/data-model.md and backend/README.md — so
 * everything here must work as plain, self-contained HTML/CSS with no
 * client-only behavior baked in.
 *
 * @param {{ page: import('../../domain/models/Page.js').Page }} props
 */
export default function BillPage({ page }) {
  return (
    <div className={styles.page}>
      <DocumentHeader bannerText="বিল" page={page} rightFieldLabel="ক্রমিক" />

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
              <td className={styles.center}>{line.quantity ?? ""}</td>
              <td className={styles.center}>{formatNumber(line.rate)}</td>
              <td className={styles.right}>{formatNumber(line.amount)}</td>
            </tr>
          ))}
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
