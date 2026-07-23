/**
 * Builds a standalone HTML document string from a rendered page's DOM
 * node — used when sending pages to the PDF backend (see
 * PdfDownloadModal.jsx and the backend's own generatePdf.js route doc
 * comment on why the backend expects fully-formed HTML rather than
 * rendering React itself).
 *
 * Several things need fixing up between "what's on screen in the
 * workspace" and "what a printed document should look like" — none of
 * which change anything the user is actually editing, since every fix
 * below operates on a `cloneNode(true)` clone, never the live page:
 *
 * 1. CSS — this app's pages are styled entirely through Vite CSS Modules,
 *    which inject their actual rules into the document via `<style>` tags
 *    at runtime — none of that lives on the DOM nodes as inline `style`
 *    attributes, so a plain `outerHTML` alone renders unstyled once
 *    handed to a separate browser instance with no idea which stylesheet
 *    used to apply. Fixed by walking every same-origin stylesheet
 *    (`document.styleSheets`) and copying its rules verbatim into one
 *    `<style>` block.
 *
 * 2. WEB FONTS — this app loads Noto Serif Bengali from a Google Fonts
 *    `<link>` tag (see index.html) rather than a bundled/same-origin
 *    stylesheet. That `<link>` is cross-origin, so step 1 above can't read
 *    its `.cssRules` (a browser security restriction) and always skipped
 *    it — which is exactly why an earlier PDF export came out in a
 *    fallback system font instead of matching the workspace/LaTeX
 *    reference design. The fix is different from step 1: rather than
 *    trying to read the stylesheet's rules, the `<link>` ELEMENT itself
 *    is copied into the new document's `<head>` — the backend's browser
 *    then fetches the real font over the network from Google Fonts'
 *    actual URL, the same way any browser normally would.
 *
 * 3. IMAGES — `<img>` src values in this app's markup (logo.png,
 *    goat.png, etc — see DocumentHeader.jsx) are relative paths, only
 *    meaningful against this app's own origin. The backend renders this
 *    HTML in a headless browser navigated to a local `file://` temp file
 *    (see pdfEngine.js), where a relative path resolves against the temp
 *    file's own location instead — every image would silently 404 and
 *    render broken. Fixed by reading each `<img>`'s `.src` DOM property
 *    (always the browser's already-resolved absolute URL, regardless of
 *    how the attribute was originally written) and writing that back as
 *    the attribute.
 *
 * 4. INPUT VALUES — a React-controlled `<input>`'s current text lives
 *    only as a live DOM property, never as the `value=""` HTML attribute
 *    `outerHTML` serializes — so every EditableField-driven field (buyer
 *    name, address, quantity, rate, ...) would silently come out BLANK
 *    once re-parsed as HTML in a fresh browser, regardless of what the
 *    user actually typed. Fixed by copying each `<input>`'s live `.value`
 *    property into the `value` attribute before serializing.
 *
 * 5. WORKSPACE-ONLY UI CHROME — editing affordances that make sense on
 *    screen (a package-name's dotted underline hinting "click to edit",
 *    the floating "+" button to insert a row, an empty date field's
 *    "দিন/মাস/বছর" placeholder text) have no place on a printed page —
 *    there's no click to hint at on paper, and an unfilled field should
 *    read as blank (matching this app's original LaTeX output), not as
 *    placeholder instruction text. Rather than threading a "print mode"
 *    prop through every one of these components, the components
 *    themselves just mark their own workspace-only parts with
 *    `data-pdf-hide="true"` (fully removed) or `data-pdf-plain="true"`
 *    (kept, but stripped of its edit-affordance styling) — see
 *    LineItemActions.jsx, DateField.jsx, and PackageRowMenu.jsx for where
 *    those attributes are set. This function only needs to inject the two
 *    corresponding CSS rules; it has no per-component knowledge itself.
 *
 * 6. ZOOM — CanvasArea sets a `zoom` inline style directly on this same
 *    element for on-screen viewing (see CanvasArea.jsx), which reflects
 *    whatever zoom level the user's workspace happens to be at (e.g. a
 *    narrow phone screen defaulting to 50% — see useZoom.js). That inline
 *    style survives `cloneNode(true)` like any other attribute, so
 *    without explicitly clearing it, an export taken while zoomed out
 *    would shrink the whole page's content inside the PDF's still-
 *    full-size A4 canvas — small, corner-anchored content on an otherwise
 *    blank page. See `buildPrintReadyHtml`'s own comment for where that
 *    reset happens.
 *
 * @param {HTMLElement} pageElement - The rendered page's root DOM node
 *   (what CanvasArea's own `pageRefs` map already holds per page id).
 * @returns {string} A complete, self-contained HTML document.
 */
export function serializePageToHtmlDocument(pageElement) {
  const cssText = collectAllStylesheetText();
  const fontLinkTags = collectFontLinkTags();
  const html = buildPrintReadyHtml(pageElement);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${fontLinkTags}
<style>
${cssText}

/* Injected for PDF export only — see this file's own doc comment,
   point 5, for why these two rules exist and what marks an element for
   each. Neither rule exists anywhere in this app's own shipped CSS; both
   are generated here so the workspace's real stylesheets stay completely
   untouched by PDF-export concerns. */
[data-pdf-hide] {
  display: none !important;
}
[data-pdf-plain] {
  text-decoration: none !important;
  cursor: default !important;
}
</style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * Produces `pageElement`'s outerHTML with every fix from points 3 and 4 of
 * this file's own doc comment applied (absolute image URLs, real input
 * values) — everything that needs actual DOM manipulation before
 * serializing, as opposed to points 1/2/5 which only add extra `<head>`
 * content or CSS rules alongside the untouched markup.
 *
 * Also strips the `zoom` inline style CanvasArea sets on this exact
 * element for on-screen viewing (see CanvasArea.jsx's `style={{ zoom }}`)
 * — the PDF must always render at the page's true 100%/A4 size regardless
 * of whatever zoom level the user happened to have the workspace set to
 * (e.g. a phone defaulting to 50% zoom on a narrow screen — see useZoom
 * .js's own initial-zoom logic). Left in place, that same `zoom: 0.5`
 * would carry straight through cloneNode(true) into the exported HTML,
 * shrinking the whole page's content inside the still-A4-sized PDF canvas
 * (see backend/src/lib/pdfEngine.js's `page.pdf({ format: "A4" })`) —
 * exactly what produced small, corner-anchored content on a mostly-blank
 * page when exporting from a zoomed-out mobile view.
 */
function buildPrintReadyHtml(pageElement) {
  const clone = pageElement.cloneNode(true);
  clone.style.zoom = "";

  for (const img of clone.querySelectorAll("img")) {
    img.setAttribute("src", img.src);
  }

  for (const input of clone.querySelectorAll("input")) {
    input.setAttribute("value", input.value);
    // The placeholder ATTRIBUTE is harmless on its own (a browser only
    // ever shows placeholder text when `value` is empty) — but see point
    // 4 above: every field's actual typed value is now always written
    // into `value`, blank or not, specifically so that an *empty* field
    // reliably reads as blank rather than accidentally falling back to
    // showing this placeholder text as if it were real content.
    input.removeAttribute("placeholder");
  }

  return clone.outerHTML;
}

/**
 * Concatenates the CSS text of every same-origin stylesheet currently
 * loaded in the document. See this file's own doc comment, point 1, for
 * why this is necessary and point 2 for why a cross-origin stylesheet
 * (Google Fonts) is handled completely separately instead of here.
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
      // Google Fonts' own stylesheet is exactly this case, and is handled
      // separately by collectFontLinkTags() instead — this catch only
      // ever silently drops something that already has its own fix
      // elsewhere, never a real, unrecoverable loss.
    }
  }

  return chunks.join("\n");
}

/**
 * Copies every `<link rel="stylesheet">` pointing at fonts.googleapis.com
 * verbatim, so the backend's browser fetches the actual web font over the
 * network itself — see this file's own doc comment, point 2, for why this
 * has to be a real `<link>` element (not extracted CSS text) and why it's
 * cross-origin in the first place.
 */
function collectFontLinkTags() {
  const linkTags = document.querySelectorAll(
    'link[rel="stylesheet"][href*="fonts.googleapis.com"]',
  );
  return Array.from(linkTags)
    .map((link) => `<link rel="stylesheet" href="${link.href}">`)
    .join("\n");
}
