import styles from "./AnalyticsScreen.module.css";

/**
 * Placeholder for the landing page's "অ্যানালিটিক্স" card. Per
 * docs/data-model.md's own roadmap, "Analytics dashboard + পরের দিনের
 * reminder card" is listed as the very last item to build — this screen is
 * just the destination the card needs to exist right now (per the decision
 * to make Analytics clickable rather than disabled), with real charts
 * (features/analytics/charts/, currently empty) to follow later.
 */
export default function AnalyticsScreen() {
  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">
          📊
        </span>
        <p className={styles.heading}>অ্যানালিটিক্স শীঘ্রই আসছে</p>
        <p className={styles.description}>
          সেশন সংখ্যা, মোট আয়, আর প্রবণতা এখানে দেখা যাবে।
        </p>
      </div>
    </div>
  );
}
