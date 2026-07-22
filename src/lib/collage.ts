import { BG_COLORS, COLLAGE_LAYOUTS, CollageState } from '../types';
import { coverFit } from './canvasUtils';

export function getLayout(key: string) {
  return COLLAGE_LAYOUTS.find((l) => l.key === key) ?? COLLAGE_LAYOUTS[0];
}

interface RenderArgs {
  ctx: CanvasRenderingContext2D;
  cw: number;
  ch: number;
  state: CollageState;
  photos: HTMLImageElement[];
}

export function renderCollage({ ctx, cw, ch, state, photos }: RenderArgs) {
  const layout = getLayout(state.layoutKey);
  const gapColor = BG_COLORS[state.gapColorKey] ?? BG_COLORS.white;
  const gap = cw * (state.gapSize * 0.012); // gapSize 0-4 -> 0% to ~4.8% of canvas width

  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = gapColor;
  ctx.fillRect(0, 0, cw, ch);

  layout.cells.forEach((cell, i) => {
    const photo = photos[i];
    if (!photo) return;

    const x = cell.x * cw + gap / 2;
    const y = cell.y * ch + gap / 2;
    const w = cell.w * cw - gap;
    const h = cell.h * ch - gap;
    if (w <= 0 || h <= 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const fit = coverFit(photo.width, photo.height, w, h);
    ctx.drawImage(photo, x + fit.x, y + fit.y, fit.w, fit.h);
    ctx.restore();
  });
}
