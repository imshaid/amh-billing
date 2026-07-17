import styles from "./SetListItem.module.css";

/**
 * One row in the Sidebar's Set list. Shows the Set's name and how many
 * pages it currently holds — `set.pageIds.length` is safe to read directly
 * here (no need to fetch the actual Page rows) since `resyncSetPageOrder`
 * (see sets.repository.js) keeps `pageIds` accurate whenever pages change.
 *
 * @param {{
 *   set: import('../../domain/models/Set.js').Set,
 *   isActive: boolean,
 *   onSelect: () => void,
 * }} props
 */
export default function SetListItem({ set, isActive, onSelect }) {
  const pageCount = set.pageIds.length;

  return (
    <li className={styles.item}>
      <button
        className={`${styles.button} ${isActive ? styles.buttonActive : ""}`}
        onClick={onSelect}
        aria-current={isActive ? "true" : undefined}
      >
        <span className={styles.name}>{set.name || "Untitled Session"}</span>
        <span className={styles.meta}>
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </span>
      </button>
    </li>
  );
}
