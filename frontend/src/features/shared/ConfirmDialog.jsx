import styles from "./ConfirmDialog.module.css";

/**
 * Reusable confirmation modal for any destructive action (deleting a page,
 * deleting a package, etc) — per the requirement that every delete gets a
 * confirmation step first, not just the ones that happened to have one
 * already. Callers own their own open/closed state; this component just
 * renders when mounted and calls `onConfirm`/`onCancel`.
 *
 * @param {{
 *   message: string,
 *   confirmLabel?: string,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export default function ConfirmDialog({
  message,
  confirmLabel = "ডিলিট",
  onConfirm,
  onCancel,
}) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <p className={styles.message}>{message}</p>
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
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
