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
 * Generation happens exactly once per "শেয়ার করুন"/"ডাউনলোড করুন" click —
 * whichever the user clicks first calls the backend and caches the
 * resulting File in `pdfFile` state; if they then click the OTHER button
 * afterward (e.g. download it too after already sharing it), that second
 * click reuses the cached File instead of re-generating the same PDF
 * against the backend a second time. The cache is keyed implicitly by
 * component lifetime, not by pageIds/filename — PdfDownloadModal always
 * unmounts and remounts fresh (see its own `isPdfModalOpen &&` guard in
 * AppRouter.jsx) between separate export attempts, so there's no risk of
 * serving a stale PDF for a different page selection.
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

  async function downloadPdf(pageIds, filename) {
    setStatus("generating");
    setErrorMessage(null);

    try {
      const file = await ensurePdfFile(pageIds, filename);
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setStatus("idle");
      return true;
    } catch (err) {
      console.error("[usePdfDownload] download failed:", err);
      setErrorMessage(err.message || "PDF তৈরি করা যায়নি");
      setStatus("error");
      return false;
    }
  }

  /**
   * Opens the OS-native share sheet via the Web Share API (`navigator
   * .share`) with the generated PDF attached — this is what actually lets
   * a user hand the file to WhatsApp/Telegram/email/etc without this app
   * needing (or being able to — see this function's own fallback comment)
   * a direct integration with any one of them. Real file sharing this way
   * only works where `navigator.canShare({ files })` reports true, which
   * in practice today means mobile Chrome/Safari/Edge — NOT desktop
   * browsers, which either lack `navigator.share` entirely or only
   * support sharing plain text/URLs, never files. There is no
   * feature-testable way around that gap: WhatsApp/Telegram/etc don't
   * offer a "share a file directly from a website" API of their own for
   * security reasons (a page silently pushing a file into a messaging app
   * would itself be a security problem), so the OS share sheet is the
   * only real integration point that exists — on platforms where the OS
   * doesn't expose one to the browser, sharing a file just isn't possible
   * from a web page, and this falls back to a plain download instead so
   * the user isn't left with silent failure and can still forward the
   * file manually from wherever it downloaded to.
   */
  async function sharePdf(pageIds, filename) {
    setStatus("generating");
    setErrorMessage(null);

    try {
      const file = await ensurePdfFile(pageIds, filename);

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: file.name,
        });
        setStatus("idle");
        return true;
      }

      // No file-sharing support on this platform (typically desktop) —
      // fall back to a normal download rather than doing nothing, so the
      // click still produces a usable result the user can forward
      // manually.
      return await downloadPdf(pageIds, filename);
    } catch (err) {
      // A user cancelling the native share sheet throws an AbortError —
      // that's a deliberate "never mind", not a real failure, so it
      // shouldn't surface as an error message the way an actual network/
      // server failure should.
      if (err.name === "AbortError") {
        setStatus("idle");
        return false;
      }
      console.error("[usePdfDownload] share failed:", err);
      setErrorMessage(err.message || "শেয়ার করা যায়নি");
      setStatus("error");
      return false;
    }
  }

  return { status, errorMessage, downloadPdf, sharePdf };
}
