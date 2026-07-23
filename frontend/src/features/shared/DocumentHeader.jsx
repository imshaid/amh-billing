import styles from "./DocumentHeader.module.css";
import EditableField from "./EditableField.jsx";
import DateField from "./DateField.jsx";

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
 * Meta box fields: buyerName/address use EditableField with
 * `autocompleteField` on (suggestions from every past session — see
 * useFieldHistory), serialOrLogCode uses plain EditableField (a log code is
 * rarely reused verbatim), and date uses the dedicated DateField (dd/mm/yyyy
 * display + calendar popup, not the native `<input type="date">`).
 * `onFieldChange(field, value)` is called on debounced commit; this
 * component just forwards which field changed up to whoever owns the write
 * (see CanvasArea, which calls `updateDraftPage`).
 *
 * Pulled out of BillPage so the hard-won visual fixes (dotted underline
 * rendering, hero-row layout, hotel-name overflow, etc — see project
 * history) live in exactly one place and apply to every page type at once.
 *
 * The dotted underline under each field is a literal repeated "." text
 * character (see DOT_LEADER below), not a CSS background-image/gradient —
 * every earlier version of this (a CSS radial-gradient, then an inline SVG
 * data-URI background) rendered fine in the live workspace but came out
 * blurry or missing entirely once round-tripped through
 * serializePageToHtml.js into the PDF backend's separate browser instance;
 * a plain text node sidesteps that category of bug completely — there is
 * no CSS parsing, data-URI decoding, or background-image network fetch
 * involved at all, so there's nothing about the PDF export path that can
 * drop or corrupt it. It's exactly as reliable as any other text on the
 * page, which every other piece of real content already proved out.
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
            <ValueLine>
              <EditableField
                value={page.buyerName}
                onChange={(v) => onFieldChange("buyerName", v)}
                autocompleteField="buyerName"
              />
            </ValueLine>
          </span>
          <span className={styles.metaRowRight}>
            <strong>{rightFieldLabel}:</strong>
            <ValueLine>
              <EditableField
                value={page.serialOrLogCode}
                onChange={(v) => onFieldChange("serialOrLogCode", v)}
              />
            </ValueLine>
          </span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaRowLeft}>
            <strong>ঠিকানা:</strong>
            <ValueLine>
              <EditableField
                value={page.address}
                onChange={(v) => onFieldChange("address", v)}
                autocompleteField="address"
              />
            </ValueLine>
          </span>
          <span className={styles.metaRowRight}>
            <strong>তারিখ:</strong>
            <ValueLine>
              <DateField
                value={page.date}
                onChange={(v) => onFieldChange("date", v)}
              />
            </ValueLine>
          </span>
        </div>
      </div>
    </>
  );
}

// A long, fixed run of dot characters — longer than any field could ever
// need visually, since `overflow: hidden` on .valueLine (see
// DocumentHeader.module.css) always clips it back down to the field's
// actual width. Generated once at module scope (not per-render) so every
// DocumentHeader instance on the page shares the same string instead of
// re-allocating it per field.
const DOT_LEADER = ".".repeat(300);

/**
 * Renders the dotted underline behind a field as a real, literal repeated
 * "." text node (see this file's own doc comment for why a text node
 * instead of any CSS background trick), layered behind the field's own
 * value via `position: relative`/`position: absolute` (see
 * DocumentHeader.module.css's `.valueLine`/`.dotLeader`/
 * `.valueLineContent`), with `letter-spacing` spacing the dots out and
 * `font-size` sizing them — all ordinary CSS properties with no
 * rasterization step of their own to blur or silently fail to load in a
 * separate browser instance.
 */
function ValueLine({ children }) {
  return (
    <span className={styles.valueLine}>
      <span className={styles.dotLeader} aria-hidden="true">
        {DOT_LEADER}
      </span>
      <span className={styles.valueLineContent}>{children}</span>
    </span>
  );
}
