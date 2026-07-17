import { useState } from "react";
import styles from "./PackageEditModal.module.css";

const CATEGORY_OPTIONS = [
  { value: "", label: "সাধারণ" },
  { value: "Snacks", label: "নাস্তা" },
  { value: "Lunch", label: "লাঞ্চ" },
  { value: "Iftar", label: "ইফতার" },
];

/**
 * Edit form for a single Package — name, category, rate, and its item list
 * (each item is one printed line under the package on a Bill/Invoice, see
 * domain/models/Package.js's PackageItem). Opened from PackagesScreen's
 * "এডিট" button per package.
 *
 * Editing a Package only affects *future* line items created from it (see
 * Snapshot Policy in docs/data-model.md) — pages that already snapshotted
 * this package's items are unaffected, since those items were copied at
 * creation time, not live-bound.
 *
 * @param {{
 *   pkg: import('../../domain/models/Package.js').Package,
 *   onSave: (changes: Partial<import('../../domain/models/Package.js').Package>) => void,
 *   onCancel: () => void,
 * }} props
 */
export default function PackageEditModal({ pkg, onSave, onCancel }) {
  const [name, setName] = useState(pkg.name);
  const [category, setCategory] = useState(pkg.category ?? "");
  const [rate, setRate] = useState(pkg.rate ?? "");
  const [items, setItems] = useState(pkg.items.map((item) => ({ ...item })));

  function updateItemText(itemId, text) {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, text } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), text: "" }]);
  }

  function removeItem(itemId) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  function handleSave() {
    onSave({
      name: name.trim(),
      category: category || null,
      rate: rate === "" ? null : Number(rate),
      items: items.filter((item) => item.text.trim() !== ""),
    });
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.heading}>প্যাকেজ এডিট করুন</p>

        <div className={styles.field}>
          <label className={styles.label}>নাম</label>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>ক্যাটাগরি</label>
          <select
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>রেট (৳)</label>
          <input
            type="number"
            className={styles.input}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>আইটেমসমূহ</label>
          {items.map((item) => (
            <div key={item.id} className={styles.itemRow}>
              <input
                type="text"
                className={styles.itemInput}
                value={item.text}
                onChange={(e) => updateItemText(item.id, e.target.value)}
              />
              <button
                type="button"
                className={styles.removeItemButton}
                onClick={() => removeItem(item.id)}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.addItemButton}
            onClick={addItem}
          >
            + আইটেম যোগ করুন
          </button>
        </div>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            বাতিল
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
          >
            সেভ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
