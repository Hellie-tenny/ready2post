import { GRADIENTS, TextCardState } from '../types';

function getGradientPreset(key: string) {
  return GRADIENTS.find((g) => g.key === key) ?? GRADIENTS[0];
}

// wraps text to fit maxWidth, shrinking font size until it fits within maxHeight
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  startSize: number,
  minSize: number,
  weight: number,
  family = 'Poppins'
): { lines: string[]; fontSize: number; lineHeight: number } {
  let fontSize = startSize;
  while (fontSize >= minSize) {
    ctx.font = `${weight} ${fontSize}px ${family}`;
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

    const lineHeight = fontSize * 1.18;
    const totalHeight = lines.length * lineHeight;
    if (totalHeight <= maxHeight || fontSize <= minSize) {
      return { lines, fontSize, lineHeight };
    }
    fontSize -= 2;
  }
  // unreachable, satisfies TS
  return { lines: [text], fontSize: minSize, lineHeight: minSize * 1.18 };
}

interface RenderArgs {
  ctx: CanvasRenderingContext2D;
  cw: number;
  ch: number;
  state: TextCardState;
  bgImage: HTMLImageElement | null;
}

export function renderTextCard({ ctx, cw, ch, state, bgImage }: RenderArgs) {
  const preset = getGradientPreset(state.gradientKey);
  const [c1, c2] = preset.stops;

  ctx.clearRect(0, 0, cw, ch);

  // when text sits over a photo, the gradient only covers the half nearest
  // the text (like a news/quote card) — the rest of the photo stays clear.
  // textZoneTop/Bottom bound where the headline is allowed to lay out.
  let textZoneTop = 0;
  let textZoneBottom = ch;

  if (state.usePhoto && bgImage) {
    const scale = Math.max(cw / bgImage.width, ch / bgImage.height);
    const bw = bgImage.width * scale;
    const bh = bgImage.height * scale;
    ctx.drawImage(bgImage, (cw - bw) / 2, (ch - bh) / 2, bw, bh);

    const bandFrac = 0.58; // portion of the card the gradient band covers
    const solidAlpha = 'E6'; // ~90% opacity at the anchored edge

    if (state.align === 'top') {
      const bandEnd = ch * bandFrac;
      textZoneTop = 0;
      textZoneBottom = bandEnd;
      const scrim = ctx.createLinearGradient(0, 0, 0, bandEnd);
      scrim.addColorStop(0, `${c1}${solidAlpha}`);
      scrim.addColorStop(1, `${c2}00`);
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, cw, bandEnd);
    } else {
      const bandStart = ch * (1 - bandFrac);
      textZoneTop = bandStart;
      textZoneBottom = ch;
      const scrim = ctx.createLinearGradient(0, bandStart, 0, ch);
      scrim.addColorStop(0, `${c1}00`);
      scrim.addColorStop(1, `${c2}${solidAlpha}`);
      ctx.fillStyle = scrim;
      ctx.fillRect(0, bandStart, cw, ch - bandStart);
    }
  } else {
    const gradient = ctx.createLinearGradient(0, 0, cw, ch);
    gradient.addColorStop(0, c1);
    gradient.addColorStop(1, c2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cw, ch);
  }

  const padding = cw * 0.08;
  const maxWidth = cw - padding * 2;
  const textColor = preset.textColor === 'light' ? '#F4F7F5' : '#0B1B2B';

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = textColor;

  // reserve vertical space for tag + byline so the headline auto-fit accounts for them
  const tagHeight = state.tag ? cw * 0.09 : 0;
  const bylineHeight = state.byline ? cw * 0.045 : 0;
  const gap = cw * 0.025;
  const zoneHeight = textZoneBottom - textZoneTop;
  const availableForHeadline = zoneHeight - padding * 2 - tagHeight - bylineHeight - gap * 2;

  const { lines, fontSize, lineHeight } = fitText(
    ctx,
    state.headline || ' ',
    maxWidth,
    Math.max(availableForHeadline, cw * 0.12),
    cw * 0.11,
    cw * 0.03,
    800
  );

  const blockHeight = tagHeight + (state.tag ? gap : 0) + lines.length * lineHeight + (state.byline ? gap + bylineHeight : 0);

  let startY: number;
  if (state.align === 'top') startY = textZoneTop + padding;
  else if (state.align === 'bottom') startY = textZoneBottom - padding - blockHeight;
  else startY = textZoneTop + (zoneHeight - blockHeight) / 2;

  let cursorY = startY;

  // tag / badge
  if (state.tag) {
    ctx.font = `700 ${cw * 0.032}px Poppins`;
    const tagText = state.tag.toUpperCase();
    const tagMetrics = ctx.measureText(tagText);
    const tagPadX = cw * 0.025;
    const tagW = tagMetrics.width + tagPadX * 2;
    const tagH = tagHeight * 0.72;
    ctx.fillStyle = textColor === '#F4F7F5' ? 'rgba(244,247,245,0.16)' : 'rgba(11,27,43,0.14)';
    roundRect(ctx, padding, cursorY, tagW, tagH, tagH / 2);
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(tagText, padding + tagPadX, cursorY + tagH / 2 + cw * 0.011);
    cursorY += tagHeight + gap;
  }

  // headline
  ctx.font = `800 ${fontSize}px Poppins`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  for (const line of lines) {
    cursorY += lineHeight * 0.82;
    ctx.fillText(line, padding, cursorY);
    cursorY += lineHeight * 0.18;
  }

  // byline
  if (state.byline) {
    cursorY += gap;
    ctx.font = `500 ${cw * 0.032}px Poppins`;
    ctx.globalAlpha = 0.75;
    ctx.fillText(state.byline, padding, cursorY + bylineHeight * 0.6);
    ctx.globalAlpha = 1;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
