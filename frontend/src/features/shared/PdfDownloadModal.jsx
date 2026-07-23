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

// English/ASCII-only, e.g. "26-January-2026" — used as the actual
// downloaded/shared file's name. Per an explicit design decision, this is
// the moment-of-export date (today, whenever the user actually clicks "PDF
// তৈরি করুন"), NOT the Set's own name or its purchaseDate — two documents
// exported a week apart should get two different filenames even if
// nothing in the Set itself changed. Deliberately NOT Bengali despite
// every other user-facing string in this app being Bengali: a Bengali
// filename round-tripped through some sharing surfaces (e.g. WhatsApp's
// share-sheet on some platforms) came back as visibly mojibake'd
// (garbled) text — filenames pass through more non-browser software than
// almost anything else this app produces (OS file pickers, messaging
// apps' own attachment renderers, etc), several of which don't reliably
// treat a filename as UTF-8. The PDF's own CONTENT stays fully Bengali
// throughout, exactly as before — only this one string, the file's own
// name, is ASCII to sidestep that specific class of platform bug.
function formatExportFilename() {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleDateString("en-US", { month: "long" });
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Modal opened from GlobalTopBar's "PDF ডাউনলোড" button — lets the user
 * pick which of the current Set's pages to include (or "সবকিছু সিলেক্ট"),
 * then generates one combined multi-page PDF via the Cloud Run backend
 * (see usePdfDownload.js). Per an explicit design decision, this is always
 * a single merged PDF regardless of how many/which pages are selected —
 * never a zip of separate files — matching how the backend's own
 * /api/generate-pdf endpoint always returns one PDF for a whole batch (see
 * that route's own doc comment).
 *
 * Two-step flow, not one button that does everything: "PDF তৈরি করুন" first
 * (talks to the backend, caches the result), then — once that's ready —
 * separate "ডাউনলোড করুন"/"শেয়ার করুন" buttons that act on the already-
 * generated file with no further backend call. This split exists because
 * of a hard Web Share API requirement, not a UX preference: `navigator
 * .share()` must be called synchronously within a user gesture, so it
 * can't be the same click that also waits on an async PDF generation
 * request — see usePdfDownload.js's own top-level doc comment for the
 * full explanation, including what broke when an earlier version tried to
 * do both in one click.
 *
 * "শেয়ার করুন" hands the generated PDF to the OS's native share sheet
 * (WhatsApp/Telegram/email/etc, whatever the user has installed) via the
 * Web Share API — see usePdfDownload.js's own `sharePdf` doc comment. Only
 * shown where the platform actually supports it (`canShareFiles` below) —
 * in practice, mobile browsers only; there's no way to offer a same-
 * looking button that "just works" on desktop too.
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
  const { status, errorMessage, pdfFile, generatePdf, downloadPdf, sharePdf } =
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
    // the order intent-independent of how selection happened.
    return pages.filter((p) => selectedIds.has(p.id)).map((p) => p.id);
  }

  async function handleGenerate() {
    const filename = formatExportFilename();
    await generatePdf(getOrderedSelectedIds(), filename);
  }

  // Both of these run with no `await` before their own action — see
  // usePdfDownload.js's own doc comment on why `sharePdf` in particular
  // needs that (a hard Web Share API requirement, not a style choice).
  // `downloadPdf`/`sharePdf` themselves are synchronous now; `pdfFile` is
  // guaranteed to already exist by the time these buttons are even
  // rendered (see the `pdfFile ? (...) : (...)` branch below), so there's
  // nothing left to wait on here.
  function handleDownload() {
    downloadPdf();
    onClose();
  }

  function handleShare() {
    sharePdf();
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

        {pdfFile && (
          <p className={styles.readyText}>
            PDF তৈরি হয়ে গেছে — এখন নিচের অপশন থেকে বেছে নিন।
          </p>
        )}

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={status === "generating"}
          >
            বাতিল
          </button>

          {pdfFile ? (
            // Step 2 — PDF already generated and cached (see usePdfDownload
            // .js's `pdfFile`); both remaining actions are synchronous,
            // acting on that same file, no further backend calls.
            <>
              {canShareFiles && (
                <button
                  type="button"
                  className={styles.shareButton}
                  onClick={handleShare}
                >
                  শেয়ার করুন
                </button>
              )}
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleDownload}
              >
                ডাউনলোড করুন
              </button>
            </>
          ) : (
            // Step 1 — nothing generated yet; this is the only button that
            // actually talks to the backend.
            <button
              type="button"
              className={styles.confirmButton}
              onClick={handleGenerate}
              disabled={selectedIds.size === 0 || status === "generating"}
            >
              {status === "generating"
                ? "তৈরি হচ্ছে…"
                : `PDF তৈরি করুন (${toBanglaDigits(selectedIds.size)})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
