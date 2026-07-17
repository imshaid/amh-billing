import { useEffect, useRef, useState } from "react";
import styles from "./DateField.module.css";

const WEEKDAY_LABELS = ["র", "সো", "ম", "বু", "বৃ", "শু", "শ"];
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const MONTH_LABELS = [
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

function toBanglaDigits(n) {
  return String(n)
    .split("")
    .map((d) => BN_DIGITS[Number(d)] ?? d)
    .join("");
}

/** @param {string} isoDate  "YYYY-MM-DD" */
function formatDisplay(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return null;
  return `${toBanglaDigits(Number(d))}/${toBanglaDigits(Number(m))}/${toBanglaDigits(Number(y))}`;
}

/**
 * Custom dd/mm/yyyy date field replacing the native `<input type="date">`,
 * whose display format follows browser locale (mm/dd/yyyy in this
 * environment) and can't be forced to dd/mm/yyyy — see the workspace
 * feedback that flagged this. Value is still stored as a plain ISO date
 * string ("YYYY-MM-DD", per Page.date in docs/data-model.md); only the
 * display and picker UI are custom.
 *
 * Renders as a click-to-open calendar popup (month grid, prev/next
 * navigation, "আজ" shortcut) rather than a native date input, matching the
 * rest of the workspace's design system instead of the OS/browser widget.
 *
 * @param {{ value: string, onChange: (isoDate: string) => void }} props
 */
export default function DateField({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() =>
    value ? new Date(value) : new Date(),
  );
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function openPicker() {
    setViewDate(value ? new Date(value) : new Date());
    setIsOpen(true);
  }

  function handlePickDay(day) {
    const y = viewDate.getFullYear();
    const m = String(viewDate.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  }

  function handleToday() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  }

  function shiftMonth(delta) {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedDay =
    value &&
    new Date(value).getFullYear() === year &&
    new Date(value).getMonth() === month
      ? new Date(value).getDate()
      : null;

  const display = formatDisplay(value);

  return (
    <span className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""}`}
        onClick={openPicker}
      >
        {display ?? <span className={styles.placeholder}>দিন/মাস/বছর</span>}
      </button>

      {isOpen && (
        <div className={styles.calendarPopup}>
          <div className={styles.calendarHeader}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <span className={styles.monthYearLabel}>
              {MONTH_LABELS[month]} {toBanglaDigits(year)}
            </span>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>

          <div className={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((w, i) => (
              <span key={i} className={styles.weekdayCell}>
                {w}
              </span>
            ))}
          </div>

          <div className={styles.daysGrid}>
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`empty-${i}`} className={styles.dayCellEmpty} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                type="button"
                className={`${styles.dayCell} ${day === selectedDay ? styles.dayCellSelected : ""}`}
                onClick={() => handlePickDay(day)}
              >
                {toBanglaDigits(day)}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.todayButton}
            onClick={handleToday}
          >
            আজ
          </button>
        </div>
      )}
    </span>
  );
}
