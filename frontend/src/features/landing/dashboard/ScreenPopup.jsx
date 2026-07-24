import styles from "./ScreenPopup.module.css";

/**
 * Wraps an existing full screen (PackagesScreen, PreviousSessionsScreen)
 * in a modal overlay — see this project's own decision: clicking the
 * "Total Packages"/"Total Sessions" KPI cards opens the actual
 * corresponding screen as a popup, reusing those screens' own components
 * rather than building separate summary views.
 *
 * @param {{
 *   onClose: () => void,
 *   children: React.ReactNode,
 * }} props
 */
export default function ScreenPopup({ onClose, children }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="বন্ধ করুন"
        >
          ×
        </button>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
