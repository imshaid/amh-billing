import { useMemo, useState } from "react";
import { usePdfDownload } from "../../hooks/usePdfDownload.js";
import styles from "./PdfDownloadModal.module.css";

const TYPE_LABELS = { bill: "বিল", invoice: "চালান", summary: "সামারি" };

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
function toBanglaDigits(n) {
  return String(n)
    .split("")
    .map((d) => BN_DIGITS[Number(d)] ?? d)
    .join("");
}

/**
 * Modal opened from GlobalTopBar's "PDF ডাউনলোড" button — lets the user
 * pick which of the current Set's pages to include (or "সবকিছু সিলেক্ট")
 * before generating one combined multi-page PDF via the Cloud Run backend
 * (see usePdfDownload.js). Per an explicit design decision, this is always
 * a single merged PDF regardless of how many/which pages are selected —
 * never a zip of separate files — matching how the backend's own
 * /api/generate-pdf endpoint always returns one PDF for a whole batch (see
 * that route's own doc comment).
 *
 * Also offers a "শেয়ার করুন" button alongside "ডাউনলোড করুন" — see
 * usePdfDownload.js's own `sharePdf` doc comment for how that hands the
 * generated PDF to the OS's native share sheet (WhatsApp/Telegram/email/
 * etc, whatever the user has installed) via the Web Share API. Only shown
 * where the platform actually supports it (`canShareFiles` below) — in
 * practice, mobile browsers only; see that same doc comment for why
 * there's no way to offer a same-looking button that "just works" on
 * desktop too. Both buttons generate against the backend only once each
 * per pageIds selection (cached in usePdfDownload's own state), so
 * clicking one and then the other doesn't hit the backend twice for an
 * identical export.
 *
 * Pages are listed in the same order CanvasArea itself renders them (see
 * `pages` prop — already sorted by sortPagesForDisplay upstream), grouped
 * by type with a "১, ২, ৩..." index per group, mirroring PageCountNav's
 * own numbering convention so a user picking "চালান ৩" here means the
 * same thing it means everywhere else in this app.
 *
 * @param {{
 *   pages: import('../../domain/models/Page.js').Page[],
 *   activeSetName?: string|null,
 *   getPageElement: (pageId: string) => HTMLElement|null,
 *   onClose: () => void,
 * }} props
 */
export default function PdfDownloadModal({
  pages,
  activeSetName,
  getPageElement,
  onClose,
}) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const { status, errorMessage, downloadPdf, sharePdf } =
    usePdfDownload(getPageElement);

  // "শেয়ার করুন" only makes sense to offer where the OS actually exposes a
  // file-sharing share sheet to the browser — see usePdfDownload.js's own
  // doc comment on `sharePdf` for why that's mobile-only in practice. On
  // desktop this button is simply not shown at all (rather than shown
  // disabled, or shown and silently falling back to a download indistinct
  // from the "ডাউনলোড করুন" button right next to it) since a same-looking
  // button that secretly does something else on some browsers would be
  // more confusing than just not offering it where it can't do its one
  // job.
  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function";

  // Grouped the same way PageCountNav numbers pages — per type, in
  // whatever order `pages` already arrives (sortPagesForDisplay upstream).
  const groups = useMemo(() => {
    const byType = { bill: [], invoice: [], summary: [] };
    for (const page of pages) {
      byType[page.type]?.push(page);
    }
    return ["bill", "invoice", "summary"]
      .map((type) => ({ type, label: TYPE_LABELS[type], pages: byType[type] }))
      .filter((g) => g.pages.length > 0);
  }, [pages]);

  const allSelected = pages.length > 0 && selectedIds.size === pages.length;

  function toggleOne(pageId) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(pages.map((p) => p.id)));
  }

  function getOrderedSelectedIds() {
    // `pages.filter(...)` (not `[...selectedIds]`) is what keeps the PDF's
    // page order matching the canonical বিল → চালান → সামারি order the
    // workspace itself always shows (see `pages`'s own upstream
    // sortPagesForDisplay). A Set's iteration order is *insertion* order —
    // whichever sequence the user happened to click checkboxes in (or,
    // for "সবকিছু সিলেক্ট", whatever order `pages` itself arrived in) —
    // which is what previously produced an out-of-order PDF (e.g.
    // summary, then bill, then invoices) whenever the user's click order
    // didn't happen to match. Filtering the already-correctly-ordered
    // `pages` array by membership in `selectedIds` (an O(1) lookup) keeps
    // the order intent-independent of how selection happened. Shared by
    // both handleDownload and handleShare so the two actions can never
    // disagree on ordering.
    return pages.filter((p) => selectedIds.has(p.id)).map((p) => p.id);
  }

  async function handleDownload() {
    const filename = (activeSetName || "document").replace(/\s+/g, "_");
    const succeeded = await downloadPdf(getOrderedSelectedIds(), filename);
    if (succeeded) onClose();
  }

  async function handleShare() {
    const filename = (activeSetName || "document").replace(/\s+/g, "_");
    const succeeded = await sharePdf(getOrderedSelectedIds(), filename);
    if (succeeded) onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>PDF ডাউনলোড</h2>
        <p className={styles.subtitle}>যে পেজগুলো PDF করতে চান বেছে নিন।</p>

        <label className={styles.selectAllRow}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          <span>সবকিছু সিলেক্ট করুন</span>
        </label>

        <div className={styles.groupList}>
          {groups.map((group) => (
            <div key={group.type} className={styles.group}>
              <h3 className={styles.groupHeading}>{group.label}</h3>
              {group.pages.map((page, i) => (
                <label key={page.id} className={styles.pageRow}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(page.id)}
                    onChange={() => toggleOne(page.id)}
                  />
                  <span>
                    {group.label} {toBanglaDigits(i + 1)}
                    {page.buyerName && (
                      <span className={styles.pageMeta}>
                        {" — "}
                        {page.buyerName}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>

        {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={status === "generating"}
          >
            বাতিল
          </button>
          {canShareFiles && (
            <button
              type="button"
              className={styles.shareButton}
              onClick={handleShare}
              disabled={selectedIds.size === 0 || status === "generating"}
            >
              {status === "generating" ? "তৈরি হচ্ছে…" : "শেয়ার করুন"}
            </button>
          )}
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleDownload}
            disabled={selectedIds.size === 0 || status === "generating"}
          >
            {status === "generating"
              ? "তৈরি হচ্ছে…"
              : `ডাউনলোড করুন (${toBanglaDigits(selectedIds.size)})`}
          </button>
        </div>
      </div>
    </div>
  );
}
