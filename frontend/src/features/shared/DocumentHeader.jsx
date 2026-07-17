import styles from "./DocumentHeader.module.css";
import EditableField from "./EditableField.jsx";

import logo from "../../assets/images/logo.png";
import goat from "../../assets/images/goat.png";
import chicken from "../../assets/images/chicken.png";
import fish from "../../assets/images/fish.png";

/**
 * The header block shared by every printed page type (Bill, Invoice,
 * Summary) — logo/goat/hotel-name/chicken/fish hero row, proprietor badge,
 * tagline/address/phone, and the buyer-info meta box. Only the top banner
 * text ("বিল" / "চালান") and the meta box's right-hand field label
 * ("ক্রমিক" / "Log Code") differ between page types, so those are the only
 * two things this component parameterizes.
 *
 * Meta box fields (buyerName/serialOrLogCode/address/date) are inline
 * editable via EditableField — `onFieldChange(field, value)` is called with
 * debounced auto-save already handled inside EditableField; this component
 * just forwards which field changed up to whoever owns the write (see
 * CanvasArea, which calls `updateDraftPage`).
 *
 * Pulled out of BillPage so the hard-won visual fixes (dotted underline
 * rendering, hero-row layout, hotel-name overflow, etc — see project
 * history) live in exactly one place and apply to every page type at once.
 *
 * @param {{
 *   bannerText: string,
 *   page: import('../../domain/models/Page.js').Page,
 *   rightFieldLabel: string,
 *   onFieldChange: (field: "buyerName"|"address"|"date"|"serialOrLogCode", value: string) => void,
 * }} props
 */
export default function DocumentHeader({
  bannerText,
  page,
  rightFieldLabel,
  onFieldChange,
}) {
  return (
    <>
      <div className={styles.headerBar}>
        <span className={styles.headerBarText}>{bannerText}</span>
      </div>

      <div className={styles.heroRow}>
        <div className={styles.heroLeft}>
          <img src={logo} alt="AMH" className={styles.logo} />
          <img src={goat} alt="" className={styles.goat} aria-hidden="true" />
        </div>

        <h1 className={styles.hotelNameWrap}>
          <span className={styles.hotelName}>আদর্শ মুন্সির হোটেল</span>
        </h1>

        <div className={styles.heroRight}>
          <img
            src={chicken}
            alt=""
            className={styles.chicken}
            aria-hidden="true"
          />
          <img src={fish} alt="" className={styles.fish} aria-hidden="true" />
        </div>
      </div>

      <div className={styles.proprietorWrap}>
        <span className={styles.proprietorBadge}>
          প্রো:- মোঃ জিয়াউর রহমান (জিয়া)
        </span>
      </div>

      <p className={styles.tagline}>
        এখানে উন্নতমানের খাবার পরিবেশন করা হয় ও যেকোনো অনুষ্ঠানের অর্ডার নেওয়া
        হয়।
      </p>
      <p className={styles.addressLine}>ঠাকুরগাঁও রোড, ঠাকুরগাঁও</p>
      <p className={styles.phoneLine}>০১৭১৫-২০৪২২৪, ০১৯৩৭-৫৮১২৯৮</p>

      <div className={styles.metaBox}>
        <div className={styles.metaRow}>
          <span className={styles.metaRowLeft}>
            <strong>ক্রেতার নাম:</strong>
            <span className={styles.valueLine}>
              <EditableField
                value={page.buyerName}
                onChange={(v) => onFieldChange("buyerName", v)}
              />
            </span>
          </span>
          <span className={styles.metaRowRight}>
            <strong>{rightFieldLabel}:</strong>
            <span className={styles.valueLine}>
              <EditableField
                value={page.serialOrLogCode}
                onChange={(v) => onFieldChange("serialOrLogCode", v)}
              />
            </span>
          </span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaRowLeft}>
            <strong>ঠিকানা:</strong>
            <span className={styles.valueLine}>
              <EditableField
                value={page.address}
                onChange={(v) => onFieldChange("address", v)}
              />
            </span>
          </span>
          <span className={styles.metaRowRight}>
            <strong>তারিখ:</strong>
            <span className={styles.valueLine}>
              <EditableField
                type="date"
                value={page.date}
                onChange={(v) => onFieldChange("date", v)}
              />
            </span>
          </span>
        </div>
      </div>
    </>
  );
}
