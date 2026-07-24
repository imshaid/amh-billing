import styles from "./PackageItemsModal.module.css";

/**
 * Shows one Package's full item list in both Bangla and English — opened
 * either by clicking the info icon on a PackageChip (see PackageChip.jsx,
 * inside the package picker) or by clicking a package row on
 * PackagesScreen. In the picker, this is a pure read-only reference view
 * — `onEdit`/`onDelete` are omitted there, so those buttons don't render.
 * On PackagesScreen, both are supplied, turning this into the same
 * "view details, then act" modal used for management. Either way, this
 * has no bearing on what actually gets printed on the Bill/Invoice/PDF,
 * which continues to use each item's `text` (English) only — see this
 * project's own decision and domain/models/Package.js's doc comment on
 * `textBn`.
 *
 * Renders as its own overlay layered on top of whatever opened it (see
 * .module.css's z-index) rather than replacing it — closing this modal
 * (via its own close button, backdrop click, or picking a different
 * item) should land the person back on the still-open picker/screen, not
 * dismiss it. `stopPropagation` on the inner click keeps a click inside
 * this modal from bubbling up and triggering the parent's own
 * backdrop-click-to-close handler.
 *
 * `textBn` is optional per item (older/edited Packages may not have a
 * Bangla translation yet — see domain/models/Package.js) — falls back to
 * a muted placeholder rather than an empty line, so a missing translation
 * still holds its place in the list clearly rather than reading as a
 * layout glitch.
 *
 * @param {{
 *   pkg: import('../../domain/models/Package.js').Package,
 *   categoryLabel?: string,
 *   onClose: () => void,
 *   onEdit?: () => void,
 *   onDelete?: () => void,
 * }} props
 */
export default function PackageItemsModal({
  pkg,
  categoryLabel,
  onClose,
  onEdit,
  onDelete,
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <p className={styles.heading}>{pkg.name}</p>
            <p className={styles.metaLine}>
              {categoryLabel && <span>{categoryLabel}</span>}
              {categoryLabel && pkg.rate != null && <span> · </span>}
              {pkg.rate != null && <span>৳{pkg.rate}</span>}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeIconButton}
            onClick={onClose}
            aria-label="বন্ধ করুন"
          >
            <CloseIcon />
          </button>
        </div>

        <ul className={styles.itemList}>
          {pkg.items.map((item) => (
            <li key={item.id} className={styles.itemRow}>
              <p className={styles.itemBn}>
                {item.textBn ?? (
                  <span className={styles.noTranslation}>বাংলা অনুবাদ নেই</span>
                )}
              </p>
              <p className={styles.itemEn}>{item.text}</p>
            </li>
          ))}
        </ul>

        {(onEdit || onDelete) && (
          <div className={styles.actionRow}>
            {onEdit && (
              <button
                type="button"
                className={styles.editButton}
                onClick={onEdit}
              >
                এডিট
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={onDelete}
              >
                ডিলিট
              </button>
            )}
          </div>
        )}

        <button className={styles.closeButton} onClick={onClose}>
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
