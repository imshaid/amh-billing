import { useState } from "react";
import styles from "./MonthYearNavigator.module.css";

const MONTH_NAMES_BN = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

/**
 * Month/Year navigator — ◄ Month Year ► with a click-to-pick dropdown.
 * Two independent instances of this exist on the dashboard (see this
 * project's own decision): one drives every card except the Yearly
 * Order/Revenue chart and the Daily Order Table, the other lives inside
 * the Daily Order Table itself with day-granularity (see
 * DailyOrderDetail.jsx, which uses the existing DateField calendar
 * instead of this component — this one is specifically for month-level
 * navigation, not day-level).
 *
 * The dropdown (opened by clicking the "Month Year" label itself) is a
 * simple month+year select pair — deliberately not a full calendar
 * picker, since jumping to an arbitrary month by scrolling a calendar
 * month-by-month would defeat the point of having click-to-pick at all.
 *
 * @param {{
 *   yearMonth: string,  "YYYY-MM"
 *   onChange: (yearMonth: string) => void,
 * }} props
 */
export default function MonthYearNavigator({ yearMonth, onChange }) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [year, month] = yearMonth.split("-").map(Number);

  function shift(delta) {
    const d = new Date(year, month - 1 + delta, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.arrowButton}
        onClick={() => shift(-1)}
        aria-label="আগের মাস"
      >
        ‹
      </button>

      <button
        type="button"
        className={styles.label}
        onClick={() => setIsPickerOpen((v) => !v)}
      >
        {MONTH_NAMES_BN[month - 1]} {year}
      </button>

      <button
        type="button"
        className={styles.arrowButton}
        onClick={() => shift(1)}
        aria-label="পরের মাস"
      >
        ›
      </button>

      {isPickerOpen && (
        <div className={styles.picker}>
          <select
            className={styles.select}
            value={month}
            onChange={(e) => {
              onChange(
                `${year}-${String(Number(e.target.value)).padStart(2, "0")}`,
              );
            }}
          >
            {MONTH_NAMES_BN.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={year}
            onChange={(e) => {
              onChange(`${e.target.value}-${String(month).padStart(2, "0")}`);
            }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setIsPickerOpen(false)}
          >
            ঠিক আছে
          </button>
        </div>
      )}
    </div>
  );
}
