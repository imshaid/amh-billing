import { useState } from "react";
import styles from "./NewSessionModal.module.css";

/**
 * Modal shown on "নতুন সেশন" click (see LandingPage.jsx), collecting the
 * three fields that used to only exist per-page and get asked for one at a
 * time inline: buyer name, purchase date, and who placed the order.
 *
 * Nothing here is required — per an explicit design decision, this modal
 * must never block session creation. Buyer name has a text input but an
 * empty value is accepted (it already defaults to "" elsewhere, e.g.
 * createPage); purchase date and ordered-by person are both fully optional
 * and can be left blank. "শুরু করুন" always works regardless of what's
 * filled in — there is no validation path that disables it.
 *
 * Leaving purchase date blank does NOT mean "no date" forever — the caller
 * (LandingPage) still needs to fall back to the first Invoice page's date
 * once one exists (see PreviousSessionsScreen's month-grouping, which reads
 * `purchaseDate ?? <first invoice's date> ?? createdAt`). This modal only
 * ever writes what the user actually typed; it does not guess a date on
 * their behalf.
 *
 * @param {{
 *   previousPersons: string[],   Unique orderedByPerson names from every
 *                                 other Set (see useOrderedByPersons),
 *                                 most-recent-first, shown as quick-select
 *                                 chips above the free-text input.
 *   onConfirm: (input: { buyerName: string, purchaseDate: string|null, orderedByPerson: string|null }) => void,
 *   onCancel: () => void,
 * }} props
 */
export default function NewSessionModal({
  previousPersons,
  onConfirm,
  onCancel,
}) {
  const [buyerName, setBuyerName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [orderedByPerson, setOrderedByPerson] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onConfirm({
      buyerName: buyerName.trim(),
      purchaseDate: purchaseDate || null,
      orderedByPerson: orderedByPerson.trim() || null,
    });
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <form
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className={styles.title}>নতুন সেশন</h2>
        <p className={styles.subtitle}>
          সব ঘর ঐচ্ছিক — খালি রেখেও এগিয়ে যেতে পারবেন।
        </p>

        <label className={styles.field}>
          <span className={styles.label}>ক্রেতার নাম</span>
          <input
            type="text"
            className={styles.input}
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="যেমন: Thakurgaon AP World Vision"
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>ক্রয়ের তারিখ (ঐচ্ছিক)</span>
          <input
            type="date"
            className={styles.input}
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.label}>অর্ডারকারীর নাম (ঐচ্ছিক)</span>
          {previousPersons.length > 0 && (
            <div className={styles.chipRow}>
              {previousPersons.slice(0, 8).map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`${styles.chip} ${
                    orderedByPerson === name ? styles.chipActive : ""
                  }`}
                  onClick={() =>
                    setOrderedByPerson((current) =>
                      current === name ? "" : name,
                    )
                  }
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            className={styles.input}
            value={orderedByPerson}
            onChange={(e) => setOrderedByPerson(e.target.value)}
            placeholder="নতুন নাম লিখুন অথবা উপর থেকে বেছে নিন"
          />
        </div>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            বাতিল
          </button>
          <button type="submit" className={styles.confirmButton}>
            শুরু করুন
          </button>
        </div>
      </form>
    </div>
  );
}
