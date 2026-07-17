import { useState, useCallback } from "react";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;
const STEP = 0.1;

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

  return { zoom, zoomIn, zoomOut, resetZoom, setZoom, MIN_ZOOM, MAX_ZOOM };
}
