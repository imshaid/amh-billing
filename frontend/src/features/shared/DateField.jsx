import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./DateField.module.css";

/** Full Bangla weekday names, without the "বার" suffix per the workspace
 * feedback ("রবি" not "রবিবার") — starts Sunday to match JS's
 * Date.getDay() (0 = Sunday), same order as the grid below. */
const WEEKDAY_LABELS = [
  "রবি",
  "সোম",
  "মঙ্গল",
  "বুধ",
  "বৃহস্পতি",
  "শুক্র",
  "শনি",
];
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

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
function toBanglaDigits(n) {
  return String(n)
    .split("")
    .map((d) => BN_DIGITS[Number(d)] ?? d)
    .join("");
}

/** @param {string} isoDate  "YYYY-MM-DD" */
function formatDisplay(isoDate) {
  // Dates in the field itself are English digits per the workspace
  // feedback ("only dates are in english, month and day in bangla") — this
  // is the compact dd/mm/yyyy shown in the trigger button, not the popup's
  // month/weekday labels (those stay Bangla, see MONTH_LABELS/WEEKDAY_LABELS).
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return null;
  return `${d}/${m}/${y}`;
}

/** Same breakpoint used throughout the workspace chrome (see
 * --breakpoint-mobile in tokens.css) — matched here in JS because deciding
 * "anchored under the trigger" vs "centered overlay" is a layout *mode*
 * choice, not something CSS media queries alone can express when the
 * position is computed from getBoundingClientRect() in JS. */
const MOBILE_BREAKPOINT = 768;

function isMobileViewport() {
  return (
    typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT
  );
}

/** Local Y-M-D key, used to compare two dates by calendar day without any
 * timezone-conversion surprises from Date's own equality/comparison. */
function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Custom dd/mm/yyyy date field replacing the native `<input type="date">`,
 * whose display format follows browser locale (mm/dd/yyyy in this
 * environment) and can't be forced to dd/mm/yyyy — see the workspace
 * feedback that flagged this. Value is still stored as a plain ISO date
 * string ("YYYY-MM-DD", per Page.date in docs/data-model.md); only the
 * display and picker UI are custom.
 *
 * Display language split, per explicit feedback: the compact dd/mm/yyyy in
 * the trigger button and the day numbers in the calendar grid are English
 * digits; month names and weekday labels stay full Bangla words (e.g.
 * "জুলাই ২০২৬", "রবি") — not abbreviated to a single letter, and without
 * the "বার" suffix.
 *
 * The day grid always renders 6 rows (42 cells) regardless of how many
 * weeks the current month actually spans, padding with invisible cells at
 * both ends — this keeps the popup a fixed height across every month
 * (28/29/30/31-day months and different starting weekdays would otherwise
 * each need 4, 5, or 6 rows, resizing the popup every time the month
 * changes, which was reported as a bug).
 *
 * The calendar popup is rendered through a React portal into
 * `document.body` — required because DateField lives inside
 * DocumentHeader's `.valueLine` (see DocumentHeader.module.css), which has
 * `overflow: hidden` for the dotted-underline background trick; without
 * the portal the popup would be invisibly clipped rather than failing to
 * open. Positioned via the trigger button's `getBoundingClientRect()`.
 *
 * @param {{ value: string, onChange: (isoDate: string) => void }} props
 */
export default function DateField({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() =>
    value ? new Date(value) : new Date(),
  );
  const [popupPosition, setPopupPosition] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      const clickedTrigger = triggerRef.current?.contains(e.target);
      const clickedPopup = popupRef.current?.contains(e.target);
      if (!clickedTrigger && !clickedPopup) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Keep the popup pinned under the trigger if the page scrolls/resizes
  // while it's open (e.g. the workspace canvas's own scroll — see
  // CanvasArea), since position is computed once from getBoundingClientRect
  // rather than following the trigger via normal document flow. On mobile
  // this also re-checks whether the viewport has crossed the breakpoint
  // (e.g. device rotation) and switches positioning mode accordingly.
  useEffect(() => {
    if (!isOpen) return;
    function updatePosition() {
      setIsMobile(isMobileViewport());
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setPopupPosition({ top: rect.bottom + 4, left: rect.left });
      }
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  function openPicker() {
    setViewDate(value ? new Date(value) : new Date());
    setIsMobile(isMobileViewport());
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPopupPosition({ top: rect.bottom + 4, left: rect.left });
    }
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

  function handleClear() {
    onChange("");
    setIsOpen(false);
  }

  function shiftMonth(delta) {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  }

  function handleYearSelect(e) {
    const nextYear = Number(e.target.value);
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setFullYear(nextYear);
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

  const today = new Date();
  const todayKey = dateKey(today);

  // A ±5 year window around the current year — plenty for a billing app;
  // if a page's existing date happens to fall outside that window (an old
  // imported record, say), it's added to the list too so the dropdown
  // always includes whatever's actually selected.
  const yearOptions = (() => {
    const base = today.getFullYear();
    const range = [];
    for (let y = base - 5; y <= base + 5; y++) range.push(y);
    if (!range.includes(year)) range.push(year);
    return range.sort((a, b) => a - b);
  })();

  const display = formatDisplay(value);

  // Always exactly 42 cells (6 full weeks) so the grid — and therefore the
  // whole popup — is the same height in every month. Leading cells before
  // day 1 and trailing cells after the month's last day are rendered empty
  // (invisible, not just blank) rather than omitted.
  const totalCells = 42;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNumber = i - firstWeekday + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) return null;
    return dayNumber;
  });

  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        ref={triggerRef}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""}`}
        onClick={openPicker}
      >
        {display ?? (
          <span className={styles.placeholder} data-pdf-hide="true">
            দিন/মাস/বছর
          </span>
        )}
      </button>

      {isOpen &&
        popupPosition &&
        createPortal(
          isMobile ? (
            <div
              className={styles.mobileOverlay}
              onClick={() => setIsOpen(false)}
            >
              <div
                ref={popupRef}
                className={`${styles.calendarPopup} ${styles.calendarPopupMobile}`}
                onClick={(e) => e.stopPropagation()}
              >
                {renderCalendarBody()}
              </div>
            </div>
          ) : (
            <div
              ref={popupRef}
              className={styles.calendarPopup}
              style={{
                position: "fixed",
                top: popupPosition.top,
                left: popupPosition.left,
              }}
            >
              {renderCalendarBody()}
            </div>
          ),
          document.body,
        )}
    </span>
  );

  function renderCalendarBody() {
    return (
      <>
        <div className={styles.calendarHeader}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => shiftMonth(-1)}
          >
            ‹
          </button>
          <span className={styles.monthYearLabel}>
            {MONTH_LABELS[month]}{" "}
            <select
              className={styles.yearSelect}
              value={year}
              onChange={handleYearSelect}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {toBanglaDigits(y)}
                </option>
              ))}
            </select>
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
          {cells.map((day, i) => {
            if (day === null) {
              return (
                <span key={`empty-${i}`} className={styles.dayCellEmpty} />
              );
            }
            const isToday = dateKey(new Date(year, month, day)) === todayKey;
            return (
              <button
                key={day}
                type="button"
                className={`${styles.dayCell} ${day === selectedDay ? styles.dayCellSelected : ""} ${
                  isToday && day !== selectedDay ? styles.dayCellToday : ""
                }`}
                onClick={() => handlePickDay(day)}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className={styles.bottomRow}>
          <button
            type="button"
            className={styles.todayButton}
            onClick={handleToday}
          >
            আজ
          </button>
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            disabled={!value}
          >
            মুছুন
          </button>
        </div>
      </>
    );
  }
}
