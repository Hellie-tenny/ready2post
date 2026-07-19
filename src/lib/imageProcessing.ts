import { Adjustments, BackgroundMode, BG_COLORS, Pan } from '../types';

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// object-fit: cover math for drawing `img` into an outW x outH box, respecting pan
export function coverRect(
  img: HTMLImageElement,
  outW: number,
  outH: number,
  pan: Pan
) {
  const scale = Math.max(outW / img.width, outH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const maxOffX = drawW - outW;
  const maxOffY = drawH - outH;
  const offX = -pan.x * maxOffX;
  const offY = -pan.y * maxOffY;
  return { drawW, drawH, offX, offY };
}

export function baseFilter(adjust: Adjustments): string {
  return `brightness(${adjust.brightness}%) contrast(${adjust.contrast}%) saturate(${adjust.saturation}%)`;
}

interface CompositeArgs {
  ctx: CanvasRenderingContext2D;
  img: HTMLImageElement;
  cw: number;
  ch: number;
  pan: Pan;
  adjust: Adjustments;
  bgMode: BackgroundMode;
  cutoutCanvas: HTMLCanvasElement | null;
  customBgImg: HTMLImageElement | null;
}

// draws the current frame (background + subject cutout, or just the plain photo)
export function paintComposite({
  ctx,
  img,
  cw,
  ch,
  pan,
  adjust,
  bgMode,
  cutoutCanvas,
  customBgImg,
}: CompositeArgs) {
  const { drawW, drawH, offX, offY } = coverRect(img, cw, ch, pan);
  const filter = baseFilter(adjust);

  if (bgMode === 'none' || !cutoutCanvas) {
    ctx.save();
    ctx.filter = filter;
    ctx.drawImage(img, offX, offY, drawW, drawH);
    ctx.restore();
    return;
  }

  // 1) background layer
  ctx.save();
  if (bgMode === 'blur') {
    ctx.filter = `${filter} blur(24px)`;
    ctx.drawImage(img, offX, offY, drawW, drawH);
  } else if (bgMode === 'custom' && customBgImg) {
    const scale = Math.max(cw / customBgImg.width, ch / customBgImg.height);
    const bw = customBgImg.width * scale;
    const bh = customBgImg.height * scale;
    ctx.filter = filter;
    ctx.drawImage(customBgImg, (cw - bw) / 2, (ch - bh) / 2, bw, bh);
  } else {
    ctx.filter = 'none';
    ctx.fillStyle = BG_COLORS[bgMode] || '#F4F7F5';
    ctx.fillRect(0, 0, cw, ch);
  }
  ctx.restore();

  // 2) subject cutout on top, same cover geometry
  ctx.save();
  ctx.filter = filter;
  ctx.drawImage(cutoutCanvas, offX, offY, drawW, drawH);
  ctx.restore();
}

// unsharp-mask style convolution sharpen, applied in place on the given context
export function applySharpen(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const strength = (amount / 100) * 1.2;
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);
  const sd = src.data;
  const dd = dst.data;
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        dd[i] = sd[i]; dd[i + 1] = sd[i + 1]; dd[i + 2] = sd[i + 2]; dd[i + 3] = sd[i + 3];
        continue;
      }
      for (let c = 0; c < 3; c++) {
        let sum = 0, k = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * w + (x + kx)) * 4 + c;
            sum += sd[idx] * kernel[k];
            k++;
          }
        }
        const blended = sd[i + c] * (1 - strength) + sum * strength;
        dd[i + c] = clamp(blended, 0, 255);
      }
      dd[i + 3] = sd[i + 3];
    }
  }
  ctx.putImageData(dst, 0, 0);
}

// analyzes a photo's own histogram and returns suggested adjustment values
export function analyzePhoto(img: HTMLImageElement): Partial<Adjustments> {
  const sampleSize = 120;
  const tmp = document.createElement('canvas');
  tmp.width = sampleSize;
  tmp.height = sampleSize;
  const tctx = tmp.getContext('2d')!;
  const scale = Math.max(sampleSize / img.width, sampleSize / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  tctx.drawImage(img, (sampleSize - w) / 2, (sampleSize - h) / 2, w, h);
  const data = tctx.getImageData(0, 0, sampleSize, sampleSize).data;

  let sum = 0, sumSq = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += lum;
    sumSq += lum * lum;
    n++;
  }
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  const stddev = Math.sqrt(Math.max(variance, 0));

  const brightness = clamp(100 + (128 - mean) * 0.35, 85, 140);
  const contrast = clamp(100 + (48 - stddev) * 1.1, 95, 145);

  return {
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    saturation: 112,
    sharpen: 20,
  };
}

// builds a subject cutout (original image with background made transparent via the mask)
export function buildCutoutCanvas(
  img: HTMLImageElement,
  maskData: Float32Array,
  maskW: number,
  maskH: number,
  invert: boolean
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = maskW;
  canvas.height = maskH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, maskW, maskH);
  const imgData = ctx.getImageData(0, 0, maskW, maskH);
  for (let i = 0; i < maskData.length; i++) {
    let a = maskData[i];
    if (invert) a = 1 - a;
    imgData.data[i * 4 + 3] = Math.round(clamp(a, 0, 1) * 255);
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
