import { FONTS, GRADIENTS, ProductPostState, STICKER_COLORS } from '../types';
import { fontString, roundRect } from './textCard';
import { coverFit } from './canvasUtils';

function getGradientPreset(key: string) {
  return GRADIENTS.find((g) => g.key === key) ?? GRADIENTS[0];
}
function getFont(key: string) {
  return FONTS.find((f) => f.key === key) ?? FONTS[0];
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface RenderArgs {
  ctx: CanvasRenderingContext2D;
  cw: number;
  ch: number;
  state: ProductPostState;
  photo: HTMLImageElement;
}

export function renderProductCard({ ctx, cw, ch, state, photo }: RenderArgs) {
  const preset = getGradientPreset(state.gradientKey);
  const font = getFont(state.fontKey);
  const [c1, c2] = preset.stops;
  const textColor = preset.textColor === 'light' ? '#F4F7F5' : '#0B1B2B';
  const padding = cw * 0.06;

  ctx.clearRect(0, 0, cw, ch);

  // photo, cover-fit centered (no user-controlled pan for this mode — keeps it simple)
  const fit = coverFit(photo.width, photo.height, cw, ch);
  ctx.drawImage(photo, fit.x, fit.y, fit.w, fit.h);

  // bottom gradient band for name + description, same fade-in approach as the news card
  const bandFrac = 0.42;
  const bandStart = ch * (1 - bandFrac);
  const scrim = ctx.createLinearGradient(0, bandStart, 0, ch);
  scrim.addColorStop(0, `${c1}00`);
  scrim.addColorStop(1, `${c2}E6`);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandStart, cw, ch - bandStart);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  const maxWidth = cw - padding * 2;
  const nameSize = cw * 0.055;
  const nameText = font.uppercase ? state.productName.toUpperCase() : state.productName;
  ctx.font = fontString(font.weight, nameSize, font.family);
  const nameLines = wrapText(ctx, nameText || ' ', maxWidth).slice(0, 2);

  const descSize = cw * 0.03;
  let descLines: string[] = [];
  if (state.description) {
    ctx.font = fontString(400, descSize, 'Poppins');
    descLines = wrapText(ctx, state.description, maxWidth).slice(0, 2);
  }

  const nameLineHeight = nameSize * 1.18;
  const descLineHeight = descSize * 1.35;
  const gap = cw * 0.015;
  const blockHeight =
    nameLines.length * nameLineHeight + (descLines.length ? gap + descLines.length * descLineHeight : 0);

  let cursorY = ch - padding - blockHeight;

  ctx.font = fontString(font.weight, nameSize, font.family);
  ctx.fillStyle = textColor;
  for (const line of nameLines) {
    cursorY += nameLineHeight * 0.85;
    ctx.fillText(line, padding, cursorY);
    cursorY += nameLineHeight * 0.15;
  }
  if (descLines.length) {
    cursorY += gap;
    ctx.font = fontString(400, descSize, 'Poppins');
    ctx.globalAlpha = 0.8;
    for (const line of descLines) {
      cursorY += descLineHeight * 0.85;
      ctx.fillText(line, padding, cursorY);
      cursorY += descLineHeight * 0.15;
    }
    ctx.globalAlpha = 1;
  }

  // badge pill, opposite corner from the price sticker so they never collide
  if (state.badge) {
    const badgeCorner = state.stickerPosition.startsWith('top') ? 'top-left' : 'bottom-left';
    const isTop = badgeCorner === 'top-left';
    ctx.font = fontString(700, cw * 0.032, 'Poppins');
    const badgeText = state.badge.toUpperCase();
    const bw = ctx.measureText(badgeText).width;
    const padX = cw * 0.022;
    const pillW = bw + padX * 2;
    const pillH = cw * 0.062;
    const bx = padding;
    const by = isTop ? padding : ch - padding - pillH;
    ctx.fillStyle = '#FF7A3D';
    roundRect(ctx, bx, by, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = '#0B1B2B';
    ctx.fillText(badgeText, bx + padX, by + pillH / 2 + cw * 0.011);
  }

  if (state.price) {
    drawPriceSticker(ctx, cw, ch, state, padding);
  }
}

function drawPriceSticker(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  state: ProductPostState,
  padding: number
) {
  const color = STICKER_COLORS[state.stickerColorKey] ?? STICKER_COLORS.mint;
  const textColor = color === STICKER_COLORS.navy ? '#F4F7F5' : '#0B1B2B';
  const isRibbon = state.stickerShape === 'ribbon';
  const size = cw * 0.24;
  const w = isRibbon ? size * 1.5 : size;
  const h = isRibbon ? size * 0.52 : size;

  let cx: number, cy: number;
  switch (state.stickerPosition) {
    case 'top-left':
      cx = padding + w / 2; cy = padding + h / 2; break;
    case 'bottom-left':
      cx = padding + w / 2; cy = ch - padding - h / 2; break;
    case 'bottom-right':
      cx = cw - padding - w / 2; cy = ch - padding - h / 2; break;
    default: // top-right
      cx = cw - padding - w / 2; cy = padding + h / 2;
  }

  ctx.fillStyle = color;
  drawStickerShape(ctx, state.stickerShape, cx, cy, w, h);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;

  const priceSize = isRibbon ? h * 0.4 : size * 0.22;
  const compareSize = isRibbon ? h * 0.24 : size * 0.12;

  if (state.comparePrice) {
    const compY = cy - h * (isRibbon ? 0.18 : 0.2);
    ctx.font = fontString(600, compareSize, 'Poppins');
    ctx.globalAlpha = 0.6;
    ctx.fillText(state.comparePrice, cx, compY);
    const measured = ctx.measureText(state.comparePrice).width;
    ctx.strokeStyle = textColor;
    ctx.lineWidth = Math.max(1, size * 0.01);
    ctx.beginPath();
    ctx.moveTo(cx - measured / 2, compY);
    ctx.lineTo(cx + measured / 2, compY);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.font = fontString(800, priceSize, 'Poppins');
    ctx.fillText(state.price, cx, cy + h * (isRibbon ? 0.15 : 0.12));
  } else {
    ctx.font = fontString(800, priceSize, 'Poppins');
    ctx.fillText(state.price, cx, cy);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// builds the fill path for the chosen sticker shape, centered at (cx, cy) within a w x h box
function drawStickerShape(
  ctx: CanvasRenderingContext2D,
  shape: ProductPostState['stickerShape'],
  cx: number,
  cy: number,
  w: number,
  h: number
) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(cx, cy, w / 2, 0, Math.PI * 2);
  } else if (shape === 'rounded-square') {
    roundRect(ctx, cx - w / 2, cy - h / 2, w, h, w * 0.18);
  } else if (shape === 'ribbon') {
    const x0 = cx - w / 2, x1 = cx + w / 2;
    const y0 = cy - h / 2, y1 = cy + h / 2;
    const notch = h * 0.32;
    ctx.moveTo(x0 + notch, y0);
    ctx.lineTo(x1 - notch, y0);
    ctx.lineTo(x1, cy);
    ctx.lineTo(x1 - notch, y1);
    ctx.lineTo(x0 + notch, y1);
    ctx.lineTo(x0, cy);
    ctx.closePath();
  } else if (shape === 'starburst') {
    const points = 14;
    const outerR = w / 2;
    const innerR = outerR * 0.8;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
}
