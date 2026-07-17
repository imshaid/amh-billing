import styles from "./ScopeConfirmDialog.module.css";

/**
 * Asks whether a just-made change should apply to every page in the Set or
 * only the page it was made on. Shown after committing a change to
 * buyerName, address, or a page's package/line-item list — these are the
 * fields most likely to be identical across an entire session's Bill/
 * Invoice/Summary pages (same buyer, same address, same standard order),
 * so silently applying only to one page would often mean re-typing the
 * same thing N times. Date and serialOrLogCode are deliberately excluded —
 * those legitimately differ per page and are never offered this prompt
 * (see CanvasArea's handleFieldChange, which only triggers this for
 * buyerName/address).
 *
 * @param {{
 *   message: string,
 *   onApplyToAll: () => void,
 *   onApplyToThisOnly: () => void,
 * }} props
 */
export default function ScopeConfirmDialog({
  message,
  onApplyToAll,
  onApplyToThisOnly,
}) {
  return (
    <div className={styles.overlay} onClick={onApplyToThisOnly}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.onlyThisButton}
            onClick={onApplyToThisOnly}
          >
            শুধু এই পেজে
          </button>
          <button
            type="button"
            className={styles.allPagesButton}
            onClick={onApplyToAll}
          >
            সব পেজে
          </button>
        </div>
      </div>
    </div>
  );
}
