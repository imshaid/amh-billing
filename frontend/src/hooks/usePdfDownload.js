import { useState } from "react";
import { serializePageToHtmlDocument } from "../domain/pdf/serializePageToHtml.js";

const PDF_SERVICE_URL = import.meta.env.VITE_PDF_SERVICE_URL;
const PDF_API_KEY = import.meta.env.VITE_PDF_API_KEY;

/**
 * Drives the "PDF ডাউনলোড" flow — takes the page ids the user selected in
 * PdfDownloadModal, serializes each one's actual rendered DOM (see
 * serializePageToHtml.js) into a standalone HTML document, and POSTs the
 * whole batch to the Cloud Run PDF backend in one request. The backend
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
 * @param {(pageId: string) => HTMLElement|null} getPageElement
 */
export function usePdfDownload(getPageElement) {
  const [status, setStatus] = useState("idle"); // idle | generating | error
  const [errorMessage, setErrorMessage] = useState(null);

  async function downloadPdf(pageIds, filename) {
    setStatus("generating");
    setErrorMessage(null);

    try {
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
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setStatus("idle");
      return true;
    } catch (err) {
      console.error("[usePdfDownload] failed:", err);
      setErrorMessage(err.message || "PDF তৈরি করা যায়নি");
      setStatus("error");
      return false;
    }
  }

  return { status, errorMessage, downloadPdf };
}
