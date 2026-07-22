import { useState, useCallback } from "react";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;
const STEP = 0.1;

// A4 page dimensions in CSS px at 96dpi — matches the fixed `210mm`/`297mm`
// set on .page in BillPage.module.css/InvoicePage.module.css. Used only to
// compute a fit-to-width/height zoom level; the page itself still always
// renders at true A4 size (see doc comment below) — this just picks what
// scale factor makes that fixed-size page match the available space.
const A4_WIDTH_PX = 793.7;
const A4_HEIGHT_PX = 1122.5;

// The floating "+" (LineItemActions, see BillPage.module.css's
// .floatingAddButton) sits at `left: -22px` relative to the page's own left
// edge — outside the page's `210mm` box on purpose, so the printed table
// never gains an extra column for it (see that file's doc comment). It's
// still part of what the user needs to see/reach without horizontal
// scrolling, so fit-width treats the page's *reachable* width as this much
// wider than the raw A4 width when computing a zoom level.
const FLOATING_BUTTON_OFFSET_PX = 22;

/**
 * Zoom level for the canvas — pages are fixed at real A4 size (210mm, see
 * BillPage.module.css) since that exact markup is what the PDF service
 * eventually renders headlessly (see docs/data-model.md); reflowing the
 * document itself for small screens would break that print fidelity. Zoom
 * instead scales the *display* via CSS transform (see CanvasArea's
 * pageWrapper), which is how this app handles "pages not properly fit on
 * small devices" — the user zooms out rather than the layout reflowing.
 *
 * Default 1 on desktop-width viewports; CanvasArea itself picks a smaller
 * initial zoom on narrow screens (see its own mount-time check) since a
 * fresh mobile visitor shouldn't have to manually zoom out from 100% just
 * to see the page at all.
 *
 * `zoomToFitWidth`/`zoomToFitHeight` additionally let the user snap zoom to
 * whatever scale makes the fixed-A4-size page exactly fill the given
 * available width/height (e.g. the canvas viewport, minus its own
 * scroll-area padding) — same idea as a PDF viewer's "fit width"/"fit page"
 * option. Both take the *available space in px* (measured by the caller,
 * typically the canvas container's clientWidth/clientHeight) rather than
 * measuring anything themselves, so this hook stays DOM-free and testable.
 */
export function useZoom(initial = 1) {
  const [zoom, setZoom] = useState(initial);

  const zoomIn = useCallback(
    () =>
      setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + STEP) * 100) / 100)),
    [],
  );
  const zoomOut = useCallback(
    () =>
      setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - STEP) * 100) / 100)),
    [],
  );
  const resetZoom = useCallback(() => setZoom(1), []);

  const zoomToFitWidth = useCallback((availableWidthPx) => {
    if (!availableWidthPx) return;
    const next = availableWidthPx / (A4_WIDTH_PX + FLOATING_BUTTON_OFFSET_PX);
    setZoom(
      Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(next * 100) / 100)),
    );
  }, []);

  const zoomToFitHeight = useCallback((availableHeightPx) => {
    if (!availableHeightPx) return;
    const next = availableHeightPx / A4_HEIGHT_PX;
    setZoom(
      Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(next * 100) / 100)),
    );
  }, []);

  return {
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomToFitWidth,
    zoomToFitHeight,
    setZoom,
    MIN_ZOOM,
    MAX_ZOOM,
  };
}
