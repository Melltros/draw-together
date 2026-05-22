/** Reliable square size when flex layout reports 0 height (old Android / in-app browsers). */
export function getMobileCanvasSide(hostWidth, hostHeight, padding = 12) {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const dockPx = parseFloat(styles.getPropertyValue('--mobile-dock-height')) || 100;
  const headerPx = parseFloat(styles.getPropertyValue('--room-header-height')) || 56;
  const pad = padding;
  const vv = window.visualViewport;
  const viewW = (vv?.width ?? window.innerWidth) - pad - 8;
  const viewH =
    (vv?.height ?? window.innerHeight) - headerPx - dockPx - pad - 8;

  const viewportSide = Math.floor(Math.min(Math.max(viewW, 0), Math.max(viewH, 0)));

  const w = hostWidth - pad;
  const h = hostHeight - pad;
  let side = viewportSide;

  if (w > 0 && h > 80) {
    side = Math.min(Math.floor(Math.min(w, h)), viewportSide);
  }

  return Math.max(140, Math.min(side, Math.floor(viewW)));
}
