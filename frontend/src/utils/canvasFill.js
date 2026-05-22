import { CANVAS_SIZE } from '../constants/canvas.js';
import { drawStroke } from './drawStroke.js';

const hexToRgba = (hex, alpha = 255) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha];
};

const colorsMatch = (data, i, target, tolerance) => {
  return (
    Math.abs(data[i] - target[0]) <= tolerance &&
    Math.abs(data[i + 1] - target[1]) <= tolerance &&
    Math.abs(data[i + 2] - target[2]) <= tolerance &&
    Math.abs(data[i + 3] - target[3]) <= tolerance
  );
};

/** Render strokes onto ctx (caller sets bg first) */
export function renderStrokesToContext(ctx, strokes, drawStrokeFn, width, height) {
  strokes.forEach((stroke) => drawStrokeFn(ctx, stroke));
}

/**
 * Flood fill at canvas coordinates; returns a fill patch stroke object.
 */
export function createFillPatch(strokes, x, y, fillColor, bgColor = '#0d1117', tolerance = 36) {
  const drawStrokeFn = drawStroke;
  const width = CANVAS_SIZE;
  const height = CANVAS_SIZE;
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const ctx = off.getContext('2d', { willReadFrequently: true });

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  renderStrokesToContext(ctx, strokes, drawStrokeFn, width, height);

  const ix = Math.floor(Math.max(0, Math.min(width - 1, x)));
  const iy = Math.floor(Math.max(0, Math.min(height - 1, y)));
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const startIdx = (iy * width + ix) * 4;
  const target = [data[startIdx], data[startIdx + 1], data[startIdx + 2], data[startIdx + 3]];
  const fill = hexToRgba(fillColor);

  if (colorsMatch(data, startIdx, fill, 8)) return null;

  const stack = [[ix, iy]];
  const visited = new Uint8Array(width * height);
  let minX = ix;
  let maxX = ix;
  let minY = iy;
  let maxY = iy;
  let filled = 0;
  const maxPixels = width * height * 0.45;

  while (stack.length > 0 && filled < maxPixels) {
    const [px, py] = stack.pop();
    const pi = py * width + px;
    if (px < 0 || py < 0 || px >= width || py >= height || visited[pi]) continue;
    const idx = pi * 4;
    if (!colorsMatch(data, idx, target, tolerance)) continue;

    visited[pi] = 1;
    data[idx] = fill[0];
    data[idx + 1] = fill[1];
    data[idx + 2] = fill[2];
    data[idx + 3] = 255;
    filled++;
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
    stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
  }

  if (filled < 12) return null;

  const patchW = maxX - minX + 1;
  const patchH = maxY - minY + 1;
  const patch = ctx.createImageData(patchW, patchH);
  for (let py = 0; py < patchH; py++) {
    for (let px = 0; px < patchW; px++) {
      const src = ((minY + py) * width + (minX + px)) * 4;
      const dst = (py * patchW + px) * 4;
      patch.data[dst] = data[src];
      patch.data[dst + 1] = data[src + 1];
      patch.data[dst + 2] = data[src + 2];
      patch.data[dst + 3] = data[src + 3];
    }
  }

  const patchCanvas = document.createElement('canvas');
  patchCanvas.width = patchW;
  patchCanvas.height = patchH;
  patchCanvas.getContext('2d').putImageData(patch, 0, 0);

  return {
    tool: 'fill',
    color: fillColor,
    x: minX,
    y: minY,
    width: patchW,
    height: patchH,
    dataUrl: patchCanvas.toDataURL('image/png')
  };
}
