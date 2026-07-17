import styles from "./FeatureCard.module.css";

/**
 * One card in the landing page's grid. Deliberately minimal (small icon,
 * title, one-line description) rather than a large colorful launcher tile —
 * matches tokens.css's stated "UI chrome stays quiet/neutral" philosophy,
 * which this landing hub is still part of even though it's the first thing
 * the user sees. Personality stays reserved for the Bill/Invoice preview
 * itself (see DocumentHeader.module.css).
 *
 * @param {{
 *   icon: string,
 *   title: string,
 *   description: string,
 *   onClick: () => void,
 *   disabled?: boolean,
 * }} props
 */
export default function FeatureCard({
  icon,
  title,
  description,
  onClick,
  disabled = false,
}) {
  return (
    <button
      type="button"
      className={styles.card}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
    </button>
  );
}
