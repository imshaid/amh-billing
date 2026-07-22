import { useEffect, useRef, useState } from "react";
import DateField from "./DateField.jsx";
import styles from "./SessionDetailsModal.module.css";

/**
 * Shared modal body for collecting a Set's purchaseDate + orderedByPerson —
 * used by both NewSessionModal ("নতুন সেশন" on the landing page) and
 * EditSessionModal (the Previous Sessions screen's per-card overflow menu).
 * Both flows ask for exactly the same two fields with the same interaction
 * shape; only the title, confirm-button label, and starting values differ
 * between "creating" and "editing", so those are the only things the two
 * thin wrapper components actually pass in.
 *
 * Neither field is required — per an explicit design decision, this modal
 * must never block submission. The confirm button always works regardless
 * of what's filled in.
 *
 * Purchase date uses the same custom DateField used throughout the
 * document pages (dd/mm/yyyy display, Bangla calendar popup) instead of a
 * native `<input type="date">`, so the picker looks and behaves
 * identically everywhere in the app.
 *
 * Ordered-by person is a combobox: clicking/focusing the input opens a
 * dropdown of every previously-used name (see `previousPersons`), typing
 * filters that list live, and the user can also just type a brand new name
 * that's never been used before — same interaction shape as
 * EditableField's history-based autocomplete elsewhere in the app, just
 * backed by `previousPersons` instead of useFieldHistory since these names
 * come from other Sets, not a per-field IndexedDB history store (see
 * useOrderedByPersons.js).
 *
 * @param {{
 *   title: string,
 *   confirmLabel: string,
 *   initialPurchaseDate?: string|null,
 *   initialOrderedByPerson?: string|null,
 *   previousPersons: string[],   Unique orderedByPerson names from every
 *                                 other Set (see useOrderedByPersons),
 *                                 most-recent-first.
 *   onConfirm: (input: { purchaseDate: string|null, orderedByPerson: string|null }) => void,
 *   onCancel: () => void,
 * }} props
 */
export default function SessionDetailsModal({
  title,
  confirmLabel,
  initialPurchaseDate = "",
  initialOrderedByPerson = "",
  previousPersons,
  onConfirm,
  onCancel,
}) {
  const [purchaseDate, setPurchaseDate] = useState(initialPurchaseDate ?? "");
  const [orderedByPerson, setOrderedByPerson] = useState(
    initialOrderedByPerson ?? "",
  );
  const [isPersonDropdownOpen, setIsPersonDropdownOpen] = useState(false);
  const personWrapperRef = useRef(null);

  useEffect(() => {
    if (!isPersonDropdownOpen) return;
    function handleClickOutside(e) {
      if (!personWrapperRef.current?.contains(e.target)) {
        setIsPersonDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPersonDropdownOpen]);

  function handleSubmit(e) {
    e.preventDefault();
    onConfirm({
      purchaseDate: purchaseDate || null,
      orderedByPerson: orderedByPerson.trim() || null,
    });
  }

  function handlePickPerson(name) {
    setOrderedByPerson(name);
    setIsPersonDropdownOpen(false);
  }

  const filteredPersons = previousPersons.filter(
    (name) =>
      name.toLowerCase().includes(orderedByPerson.trim().toLowerCase()) &&
      name !== orderedByPerson,
  );
  const showPersonDropdown = isPersonDropdownOpen && filteredPersons.length > 0;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <form
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>
          সব ঘর ঐচ্ছিক — খালি রেখেও এগিয়ে যেতে পারবেন।
        </p>

        <label className={styles.field}>
          <span className={styles.label}>ক্রয়ের তারিখ (ঐচ্ছিক)</span>
          <DateField value={purchaseDate} onChange={setPurchaseDate} />
        </label>

        <div className={styles.field} ref={personWrapperRef}>
          <span className={styles.label}>অর্ডারকারীর নাম (ঐচ্ছিক)</span>
          <div className={styles.comboWrapper}>
            <input
              type="text"
              className={styles.input}
              value={orderedByPerson}
              onChange={(e) => {
                setOrderedByPerson(e.target.value);
                setIsPersonDropdownOpen(true);
              }}
              onFocus={() => setIsPersonDropdownOpen(true)}
              placeholder="নাম লিখুন অথবা তালিকা থেকে বেছে নিন"
            />
            {showPersonDropdown && (
              <ul className={styles.comboDropdown} role="listbox">
                {filteredPersons.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      className={styles.comboDropdownItem}
                      // onMouseDown (not onClick) fires before the input's
                      // onBlur, same reason as EditableField's suggestion
                      // dropdown — otherwise the input blurs and closes the
                      // dropdown before the click is registered.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handlePickPerson(name);
                      }}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
