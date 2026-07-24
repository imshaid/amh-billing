import { useState } from "react";
import styles from "./PackageEditModal.module.css";

/**
 * Minimal single-field modal for creating a new Category — see
 * domain/models/Category.js and this project's own decision to support
 * fully dynamic, user-managed categories. Reuses PackageEditModal's own
 * CSS module (same overlay/modal/field/button look) rather than
 * duplicating those styles for a form this small.
 *
 * @param {{
 *   onSave: (name: string) => void,
 *   onCancel: () => void,
 * }} props
 */
export default function CategoryAddModal({ onSave, onCancel }) {
  const [name, setName] = useState("");

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.heading}>নতুন ক্যাটাগরি</p>

        <div className={styles.field}>
          <label className={styles.label}>নাম</label>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="যেমন: ডেজার্ট"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
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
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!name.trim()}
          >
            যোগ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
