import { Router } from "express";
import { renderPagesToPdf } from "../lib/pdfEngine.js";

/**
 * POST /api/generate-pdf
 *
 * Request body: { htmlDocuments: string[], filename?: string }
 *
 * `htmlDocuments` is an array of already-fully-rendered HTML documents —
 * one per Bill/Invoice/Summary page the user selected in the workspace.
 * Per an explicit design decision, the frontend builds this HTML itself
 * (from the exact same DOM already on screen, via each page's own
 * outerHTML plus its associated stylesheet text) rather than this backend
 * re-rendering the React components server-side. That keeps this service
 * a generic "HTML in, PDF out" renderer with zero knowledge of this app's
 * bill/invoice domain model, and guarantees the PDF matches pixel-for-
 * pixel what the user was just looking at, since it's the literal same
 * DOM, not a second independent render pass that could subtly drift.
 *
 * The user can request either a specific subset of pages or the whole Set
 * — both cases are identical from this endpoint's perspective, since the
 * frontend has already resolved "which pages" into a flat `htmlDocuments`
 * array before calling here. Either way the result is one combined
 * multi-page PDF, never a zip of separate files — see pdfEngine.js's own
 * doc comment for how that merge happens without needing all pages'
 * worth of rendered DOM in memory at once.
 */
const router = Router();

const MAX_PAGES_PER_REQUEST = 300;

router.post("/generate-pdf", async (req, res) => {
  const { htmlDocuments, filename } = req.body ?? {};

  if (!Array.isArray(htmlDocuments) || htmlDocuments.length === 0) {
    return res.status(400).json({
      error: "htmlDocuments অ্যারে আবশ্যক এবং খালি হতে পারবে না",
    });
  }

  if (htmlDocuments.some((doc) => typeof doc !== "string" || !doc.trim())) {
    return res.status(400).json({
      error: "প্রতিটা htmlDocuments এন্ট্রি একটা non-empty string হতে হবে",
    });
  }

  // A generous ceiling, not the expected case — this app's own sessions
  // (bill/invoice/summary pages for one hotel's billing) are nowhere near
  // this in practice. It exists purely to bound worst-case memory/time for
  // a single request, not to reflect a real, expected batch size.
  if (htmlDocuments.length > MAX_PAGES_PER_REQUEST) {
    return res.status(400).json({
      error: `একবারে সর্বোচ্চ ${MAX_PAGES_PER_REQUEST} পেজ জেনারেট করা যাবে`,
    });
  }

  try {
    const pdfBytes = await renderPagesToPdf(htmlDocuments);
    const safeFilename = (filename || "document").replace(
      /[^a-zA-Z0-9\u0980-\u09FF_.-]/g,
      "_",
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}.pdf"`,
    );
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("[generate-pdf] render failed:", err);
    res.status(500).json({ error: "PDF তৈরি করা যায়নি" });
  }
});

export default router;
