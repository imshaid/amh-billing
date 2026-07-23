import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { writeFile, unlink, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * The core PDF-generation engine for this service. Three deliberate design
 * choices here, each addressing a specific failure mode researched before
 * building this:
 *
 * 1. ONE PERSISTENT BROWSER, reused across every request (see
 *    `getBrowser()`) — not a fresh `chromium.launch()` per request. Cold
 *    Chromium launch alone costs several hundred ms to a few seconds; on a
 *    Cloud Run instance that's paying per-second for CPU/memory, launching
 *    a whole browser per PDF would multiply cost and latency for no
 *    benefit. The browser is launched lazily on first request and kept
 *    alive for the lifetime of the container instance (Cloud Run reuses
 *    warm instances across requests when traffic allows).
 *
 * 2. HTML IS WRITTEN TO A TEMP FILE AND LOADED VIA `file://`, never passed
 *    to `page.setContent()`/navigated as an inline data URL. Large HTML
 *    payloads sent directly over the Chrome DevTools Protocol can hit a
 *    real transfer-size ceiling (documented CDP/WebSocket limits around
 *    256MB, and even well under that, large synchronous CDP payloads add
 *    measurable overhead) — see the research this backend's design is
 *    based on. Writing to disk and navigating to it sidesteps that
 *    entirely regardless of how big a single Bill/Invoice/Summary page's
 *    HTML gets.
 *
 * 3. MULTI-PAGE BATCHES ARE RENDERED IN CHUNKS AND MERGED WITH `pdf-lib`,
 *    not rendered as one giant multi-page HTML document in a single
 *    Chromium tab. Chromium's own memory footprint scales with total DOM
 *    size — one page's worth of Bill/Invoice HTML is trivial, but 100+
 *    concatenated pages in a single tab is a very different memory
 *    profile, and Cloud Run's memory is not unlimited even at a generous
 *    allocation. Rendering CHUNK_SIZE pages at a time, producing a small
 *    PDF per chunk, and only holding those already-compact PDF buffers in
 *    memory (not 100+ pages of live DOM at once) keeps peak memory well
 *    below whatever the container's limit is, regardless of how many pages
 *    are requested in total.
 */

const CHUNK_SIZE = 15;

let browserPromise = null;

/**
 * Returns the shared Chromium instance, launching it on first call. Reused
 * for the lifetime of the process — see this file's own doc comment for
 * why a per-request launch would be wasteful here.
 */
function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: [
        // Reduces Chromium's own baseline overhead for a server context
        // that never needs a real display, GPU compositing, or
        // extensions — every one of these trims idle memory/CPU a bit,
        // which matters when Cloud Run bills for exactly what's used.
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-sandbox",
      ],
    });
  }
  return browserPromise;
}

/**
 * Renders a single chunk of HTML documents to one merged PDF buffer, using
 * one browser page (tab) per document, opened and closed in turn — never
 * more than one page open at a time within a chunk, keeping this chunk's
 * own peak memory to roughly "one rendered page's worth" regardless of
 * CHUNK_SIZE.
 *
 * @param {string[]} htmlDocuments - Full HTML documents (each one already
 *   containing <html>/<head>/<body> and any inline <style>, produced by
 *   the frontend from its own rendered Bill/Invoice/Summary DOM — see
 *   this project's frontend PDF-trigger code for how that HTML is built).
 * @returns {Promise<Uint8Array>} A single merged PDF for this chunk.
 */
async function renderChunk(htmlDocuments) {
  const browser = await getBrowser();
  const context = await browser.newContext();
  const mergedPdf = await PDFDocument.create();

  try {
    for (const html of htmlDocuments) {
      const tempDir = await mkdtemp(path.join(tmpdir(), "amh-pdf-"));
      const tempFile = path.join(tempDir, "page.html");
      await writeFile(tempFile, html, "utf-8");

      const page = await context.newPage();
      try {
        await page.goto(`file://${tempFile}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        // Explicit wait for every <img> to finish loading (or fail) —
        // `networkidle` only guarantees no in-flight request for 500ms; a
        // slightly slower fetch to this app's own domain can still be
        // mid-flight right at that boundary and get missed, leaving
        // images broken even with an absolute src.
        await page.evaluate(async () => {
          const imgs = Array.from(document.images);
          await Promise.all(
            imgs.map((img) =>
              img.complete
                ? Promise.resolve()
                : new Promise((resolve) => {
                    img.addEventListener("load", resolve, { once: true });
                    img.addEventListener("error", resolve, { once: true });
                  }),
            ),
          );
        });
        const pdfBytes = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "0", right: "0", bottom: "0", left: "0" },
        });

        const sourcePdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(
          sourcePdf,
          sourcePdf.getPageIndices(),
        );
        copiedPages.forEach((p) => mergedPdf.addPage(p));
      } finally {
        await page.close();
        await unlink(tempFile).catch(() => {});
      }
    }
  } finally {
    await context.close();
  }

  return mergedPdf.save();
}

/**
 * Public entry point — renders any number of HTML documents (each one
 * page's worth) into a single combined multi-page PDF, chunking
 * internally so total memory use stays bounded regardless of how many
 * pages are requested. See this file's own doc comment for the full
 * rationale behind chunking + pdf-lib merge.
 *
 * @param {string[]} htmlDocuments
 * @returns {Promise<Uint8Array>}
 */
export async function renderPagesToPdf(htmlDocuments) {
  if (htmlDocuments.length === 0) {
    throw new Error("No pages to render");
  }

  const chunkPdfBuffers = [];
  for (let i = 0; i < htmlDocuments.length; i += CHUNK_SIZE) {
    const chunk = htmlDocuments.slice(i, i + CHUNK_SIZE);
    chunkPdfBuffers.push(await renderChunk(chunk));
  }

  // Single-chunk fast path — most sessions (a handful of Bill/Invoice/
  // Summary pages) never need a second merge pass at all.
  if (chunkPdfBuffers.length === 1) {
    return chunkPdfBuffers[0];
  }

  const finalPdf = await PDFDocument.create();
  for (const buffer of chunkPdfBuffers) {
    const chunkDoc = await PDFDocument.load(buffer);
    const copiedPages = await finalPdf.copyPages(
      chunkDoc,
      chunkDoc.getPageIndices(),
    );
    copiedPages.forEach((p) => finalPdf.addPage(p));
  }

  return finalPdf.save();
}

/**
 * Graceful shutdown — closes the shared browser if one was ever launched.
 * Wired to SIGTERM in server.js so Cloud Run's container-stop signal
 * doesn't leave an orphaned Chromium process (harmless once the container
 * itself is torn down, but cleaner to close it explicitly).
 */
export async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}
