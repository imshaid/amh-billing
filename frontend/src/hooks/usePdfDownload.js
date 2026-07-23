import { useState } from "react";
import { serializePageToHtmlDocument } from "../domain/pdf/serializePageToHtml.js";

const PDF_SERVICE_URL = import.meta.env.VITE_PDF_SERVICE_URL;
const PDF_API_KEY = import.meta.env.VITE_PDF_API_KEY;

/**
 * Drives the "PDF ডাউনলোড"/"শেয়ার করুন" flow — takes the page ids the user
 * selected in PdfDownloadModal, serializes each one's actual rendered DOM
 * (see serializePageToHtml.js) into a standalone HTML document, and POSTs
 * the whole batch to the Cloud Run PDF backend in one request. The backend
 * itself decides how to chunk/render multi-page batches (see
 * backend/src/lib/pdfEngine.js) — this hook's only job is building the
 * HTML and handling the resulting file/error/loading states for the UI.
 *
 * `getPageElement` is passed in (from the scroll-api ref CanvasArea
 * exposes — see AppRouter.jsx) rather than this hook reaching into
 * CanvasArea itself, keeping this hook decoupled from the workspace's own
 * component tree; it just needs a way to resolve a pageId to its current
 * DOM node.
 *
 * Three-part API, used in two steps by PdfDownloadModal:
 *   1. `generatePdf(pageIds, filename)` — async, hits the backend, caches
 *      the resulting File in `pdfFile` state.
 *   2. Once that resolves, `downloadPdf()` and `sharePdf()` — both
 *      synchronous, no network/await involved, just acting on the already-
 *      cached `pdfFile`.
 * This split exists because of a hard Web Share API requirement:
 * `navigator.share()` must be called synchronously from within a user
 * gesture (a click handler), with no `await` anywhere before it in the
 * same call chain — an earlier version of this hook awaited PDF generation
 * and called `navigator.share()` right after, which the browser rejected
 * with "Must be handling a user gesture to perform a share request." (an
 * `await` breaks the gesture context even though it's still the same
 * click's handler function). Separating generation from share/download is
 * what makes `sharePdf()` able to call `navigator.share()` with nothing
 * asynchronous in front of it.
 *
 * @param {(pageId: string) => HTMLElement|null} getPageElement
 */
export function usePdfDownload(getPageElement) {
  const [status, setStatus] = useState("idle"); // idle | generating | error
  const [errorMessage, setErrorMessage] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  /**
   * Returns a cached File from an earlier call in this same component
   * lifetime, or generates a fresh one via the backend if this is the
   * first call. Both `downloadPdf` and `sharePdf` go through this rather
   * than duplicating the fetch/serialize logic themselves.
   */
  async function ensurePdfFile(pageIds, filename) {
    if (pdfFile) return pdfFile;

    const htmlDocuments = pageIds
      .map((id) => getPageElement(id))
      .filter(Boolean)
      .map((el) => serializePageToHtmlDocument(el));

    if (htmlDocuments.length === 0) {
      throw new Error("কোনো পেজ পাওয়া যায়নি — আবার চেষ্টা করুন");
    }

    const response = await fetch(`${PDF_SERVICE_URL}/api/generate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PDF_API_KEY}`,
      },
      body: JSON.stringify({ htmlDocuments, filename }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `সার্ভার ত্রুটি (${response.status})`);
    }

    const blob = await response.blob();
    const file = new File([blob], `${filename || "document"}.pdf`, {
      type: "application/pdf",
    });
    setPdfFile(file);
    return file;
  }

  /**
   * Generates the PDF and caches it — call this first (e.g. on a
   * "PDF তৈরি করুন" button) before either download or share. Kept separate
   * from `downloadPdf`/`sharePdf` themselves specifically so `sharePdf` can
   * call `navigator.share()` completely synchronously, with no `await`
   * anywhere before it — see `sharePdf`'s own doc comment for why that's
   * not just a style preference but a hard browser requirement.
   */
  async function generatePdf(pageIds, filename) {
    setStatus("generating");
    setErrorMessage(null);
    try {
      await ensurePdfFile(pageIds, filename);
      setStatus("idle");
      return true;
    } catch (err) {
      console.error("[usePdfDownload] generate failed:", err);
      setErrorMessage(err.message || "PDF তৈরি করা যায়নি");
      setStatus("error");
      return false;
    }
  }

  function downloadPdf() {
    if (!pdfFile) return false;
    const url = URL.createObjectURL(pdfFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = pdfFile.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  }

  /**
   * Opens the OS-native share sheet via the Web Share API (`navigator
   * .share`) with the already-generated PDF attached — this is what
   * actually lets a user hand the file to WhatsApp/Telegram/email/etc
   * without this app needing (or being able to — see below) a direct
   * integration with any one of them.
   *
   * MUST be called synchronously, directly from a click handler, with no
   * `await` anywhere in the call chain before it — this is not a style
   * choice but a hard Web Share API requirement (browsers reject
   * `navigator.share()` with a `NotAllowedError` — "Must be handling a
   * user gesture" — the moment any `await` breaks the direct link between
   * the click event and the call). An earlier version of this function
   * awaited PDF generation first and called `navigator.share()` after —
   * exactly the pattern that request is rejected for, since by the time
   * generation finished the browser no longer considered the call to be
   * happening "during" the click. That's why generation is a separate,
   * earlier step (`generatePdf`, called from a "PDF তৈরি করুন" button) —
   * `pdfFile` must already exist by the time this runs, so this function
   * itself does no awaiting before its own `navigator.share()` call.
   *
   * Real file sharing this way only works where `navigator.canShare({
   * files })` reports true, which in practice today means mobile Chrome/
   * Safari/Edge — NOT desktop browsers, which either lack
   * `navigator.share` entirely or only support sharing plain text/URLs,
   * never files. There is no feature-testable way around that gap:
   * WhatsApp/Telegram/etc don't offer a "share a file directly from a
   * website" API of their own for security reasons (a page silently
   * pushing a file into a messaging app would itself be a security
   * problem), so the OS share sheet is the only real integration point
   * that exists.
   */
  function sharePdf() {
    if (!pdfFile) return;

    navigator.share({ files: [pdfFile], title: pdfFile.name }).catch((err) => {
      // A user cancelling the native share sheet throws an AbortError —
      // that's a deliberate "never mind", not a real failure, so it
      // shouldn't surface as an error message the way an actual failure
      // should.
      if (err.name === "AbortError") return;
      console.error("[usePdfDownload] share failed:", err);
      setErrorMessage(err.message || "শেয়ার করা যায়নি");
      setStatus("error");
    });
  }

  return {
    status,
    errorMessage,
    pdfFile,
    generatePdf,
    downloadPdf,
    sharePdf,
  };
}
