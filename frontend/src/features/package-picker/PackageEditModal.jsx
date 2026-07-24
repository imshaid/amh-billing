import { useState } from "react";
import styles from "./PackageEditModal.module.css";

/**
 * Edit form for a single Package — name, category, rate, and its item
 * list, each item now with both English (`text`, printed on Bill/
 * Invoice/PDF) and Bangla (`textBn`, shown only in PackageItemsModal's
 * popup — see domain/models/Package.js's own note on this distinction).
 * Opened from PackagesScreen's "এডিট" button per package, or from its
 * "+ নতুন প্যাকেজ" button with `pkg: null` for a brand new one.
 *
 * Category is a dropdown of real Category rows (see
 * domain/models/Category.js and this project's own decision for fully
 * dynamic, user-managed categories) rather than a fixed enum — the
 * dropdown itself doesn't create new categories; that's a separate flow
 * (see PackagesScreen's own "+ নতুন ক্যাটাগরি" tab).
 *
 * Editing a Package only affects *future* line items created from it (see
 * Snapshot Policy in docs/data-model.md) — pages that already snapshotted
 * this package's items are unaffected, since those items were copied at
 * creation time, not live-bound.
 *
 * @param {{
 *   pkg: import('../../domain/models/Package.js').Package|null,
 *   categories: import('../../domain/models/Category.js').Category[],
 *   defaultCategoryId?: string|null,
 *   onSave: (changes: Partial<import('../../domain/models/Package.js').Package>) => void,
 *   onCancel: () => void,
 * }} props
 */
export default function PackageEditModal({
  pkg,
  categories,
  defaultCategoryId = null,
  onSave,
  onCancel,
}) {
  const [name, setName] = useState(pkg?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    pkg?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
  );
  const [rate, setRate] = useState(pkg?.rate ?? "");
  const [items, setItems] = useState(
    pkg ? pkg.items.map((item) => ({ ...item })) : [],
  );

  function updateItemText(itemId, text) {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, text } : item)),
    );
  }

  function updateItemTextBn(itemId, textBn) {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, textBn } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "", textBn: "" },
    ]);
  }

  function removeItem(itemId) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  function handleSave() {
    onSave({
      name: name.trim(),
      categoryId: categoryId || null,
      rate: rate === "" ? null : Number(rate),
      items: items
        .filter((item) => item.text.trim() !== "")
        .map((item) => ({
          ...item,
          textBn: item.textBn?.trim() || undefined,
        })),
    });
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.heading}>
          {pkg ? "প্যাকেজ এডিট করুন" : "নতুন প্যাকেজ"}
        </p>

        <div className={styles.field}>
          <label className={styles.label}>নাম</label>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>ক্যাটাগরি</label>
          <select
            className={styles.select}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
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
            <div key={item.id} className={styles.itemBlock}>
              <div className={styles.itemRow}>
                <input
                  type="text"
                  className={styles.itemInput}
                  placeholder="English"
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
              <input
                type="text"
                className={styles.itemInputBn}
                placeholder="বাংলা অনুবাদ (ঐচ্ছিক)"
                value={item.textBn ?? ""}
                onChange={(e) => updateItemTextBn(item.id, e.target.value)}
              />
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
            disabled={!name.trim()}
          >
            সেভ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
