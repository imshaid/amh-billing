/**
 * Builds a standalone HTML document string from a rendered page's DOM
 * node — used when sending pages to the PDF backend (see
 * PdfDownloadModal.jsx and the backend's own generatePdf.js route doc
 * comment on why the backend expects fully-formed HTML rather than
 * rendering React itself).
 *
 * The tricky part is CSS: this app's Bill/Invoice/Summary pages are
 * styled entirely through Vite CSS Modules, which at runtime inject their
 * actual rules into the document via `<style>` tags (dev) or a bundled
 * stylesheet (prod) — none of that lives on the DOM nodes themselves as
 * inline `style` attributes, so a plain `element.outerHTML` alone would
 * render as unstyled HTML once handed to a separate browser instance on
 * the backend with no idea which stylesheet used to apply. This function
 * fixes that by walking every stylesheet the current page has loaded
 * (`document.styleSheets`) and copying every CSS rule's text verbatim
 * into one `<style>` block, then prepending that block to the page's own
 * markup inside a minimal `<html><head>...</head><body>...</body></html>`
 * wrapper — the result is a fully self-contained document that looks
 * identical with zero dependency on anything else being loaded.
 *
 * Cross-origin stylesheets (e.g. a Google Fonts `<link>`) throw a
 * SecurityError when their `.cssRules` is accessed from JS — this is
 * expected and silently skipped rather than failing the whole export,
 * since this app's own CSS Modules are always same-origin and are what
 * actually matters for layout; a missing web-font falls back to the
 * platform's default serif/sans-serif rather than breaking the page.
 *
 * @param {HTMLElement} pageElement - The rendered page's root DOM node
 *   (what CanvasArea's own `pageRefs` map already holds per page id).
 * @returns {string} A complete, self-contained HTML document.
 */
export function serializePageToHtmlDocument(pageElement) {
  const cssText = collectAllStylesheetText();

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${cssText}</style>
</head>
<body>
${pageElement.outerHTML}
</body>
</html>`;
}

/**
 * Concatenates the CSS text of every same-origin stylesheet currently
 * loaded in the document. See `serializePageToHtmlDocument`'s own doc
 * comment for why this is necessary (CSS Modules apply via injected
 * stylesheets, not inline styles) and why cross-origin stylesheets are
 * silently skipped rather than erroring.
 */
function collectAllStylesheetText() {
  const chunks = [];

  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        chunks.push(rule.cssText);
      }
    } catch {
      // Cross-origin stylesheet — .cssRules is unreadable by design (CORS).
      // Skipped rather than thrown, since this only ever loses a web-font
      // or similar external rule, not this app's own layout CSS.
    }
  }

  return chunks.join("\n");
}
