import { FONTS, GRADIENTS, TextCardState } from '../types';

function getGradientPreset(key: string) {
  return GRADIENTS.find((g) => g.key === key) ?? GRADIENTS[0];
}

function getFont(key: string) {
  return FONTS.find((f) => f.key === key) ?? FONTS[0];
}

const ACCENT = '#FF7A3D'; // orange, used for *highlighted* words

interface Word {
  text: string;
  highlighted: boolean;
}

// splits "plain *highlighted* plain" into a flat list of words, each tagged
function tokenize(text: string): Word[] {
  const words: Word[] = [];
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  for (const part of parts) {
    const isHighlight = part.startsWith('*') && part.endsWith('*') && part.length > 1;
    const clean = isHighlight ? part.slice(1, -1) : part;
    for (const w of clean.split(/\s+/).filter(Boolean)) {
      words.push({ text: w, highlighted: isHighlight });
    }
  }
  return words.length ? words : [{ text: ' ', highlighted: false }];
}

export function fontString(weight: number, size: number, family: string) {
  return `${weight} ${size}px "${family}"`;
}

// word-wraps tokenized words to fit maxWidth, shrinking font size until the
// block fits maxHeight. Returns lines as arrays of words (color preserved per word).
function fitWords(
  ctx: CanvasRenderingContext2D,
  words: Word[],
  maxWidth: number,
  maxHeight: number,
  startSize: number,
  minSize: number,
  weight: number,
  family: string
): { lines: Word[][]; fontSize: number; lineHeight: number } {
  let fontSize = startSize;
  while (fontSize >= minSize) {
    ctx.font = fontString(weight, fontSize, family);
    const spaceWidth = ctx.measureText(' ').width;
    const lines: Word[][] = [];
    let current: Word[] = [];
    let currentWidth = 0;

    for (const word of words) {
      const wordWidth = ctx.measureText(word.text).width;
      const extra = current.length ? spaceWidth + wordWidth : wordWidth;
      if (currentWidth + extra > maxWidth && current.length) {
        lines.push(current);
        current = [word];
        currentWidth = wordWidth;
      } else {
        current.push(word);
        currentWidth += extra;
      }
    }
    if (current.length) lines.push(current);

    const lineHeight = fontSize * 1.18;
    const totalHeight = lines.length * lineHeight;
    if (totalHeight <= maxHeight || fontSize <= minSize) {
      return { lines, fontSize, lineHeight };
    }
    fontSize -= 2;
  }
  return { lines: [words], fontSize: minSize, lineHeight: minSize * 1.18 };
}

interface RenderArgs {
  ctx: CanvasRenderingContext2D;
  cw: number;
  ch: number;
  state: TextCardState;
  bgImage: HTMLImageElement | null; // null = gradient-only text card; set = photo card
}

export function renderTextCard({ ctx, cw, ch, state, bgImage }: RenderArgs) {
  const preset = getGradientPreset(state.gradientKey);
  const font = getFont(state.fontKey);
  const [c1, c2] = preset.stops;

  ctx.clearRect(0, 0, cw, ch);

  // when there's a background photo, the gradient only covers the half
  // nearest the text (news-card look) — the rest of the photo stays clear.
  let textZoneTop = 0;
  let textZoneBottom = ch;

  if (bgImage) {
    const scale = Math.max(cw / bgImage.width, ch / bgImage.height);
    const bw = bgImage.width * scale;
    const bh = bgImage.height * scale;
    ctx.drawImage(bgImage, (cw - bw) / 2, (ch - bh) / 2, bw, bh);

    const bandFrac = 0.58;
    const solidAlpha = 'E6';

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
  } else if (preset.fadeToTransparent) {
    // "transparent" has to resolve to something once flattened to a JPEG —
    // white is the most neutral, broadly-useful base to fade onto.
    ctx.fillStyle = '#F4F7F5';
    ctx.fillRect(0, 0, cw, ch);
    const fade =
      state.align === 'top'
        ? ctx.createLinearGradient(0, 0, 0, ch) // solid at top, fading down
        : ctx.createLinearGradient(0, ch, 0, 0); // solid at bottom, fading up
    fade.addColorStop(0, `${c1}FF`);
    fade.addColorStop(1, `${c2}00`);
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, cw, ch);
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

  const tagHeight = state.tag ? cw * 0.09 : 0;
  const bylineHeight = state.byline ? cw * 0.045 : 0;
  const gap = cw * 0.025;
  const zoneHeight = textZoneBottom - textZoneTop;
  const availableForHeadline = zoneHeight - padding * 2 - tagHeight - bylineHeight - gap * 2;

  const rawHeadline = state.headline || ' ';
  const words = tokenize(font.uppercase ? rawHeadline.toUpperCase() : rawHeadline);

  const { lines, fontSize, lineHeight } = fitWords(
    ctx,
    words,
    maxWidth,
    Math.max(availableForHeadline, cw * 0.12),
    cw * 0.11,
    cw * 0.03,
    font.weight,
    font.family
  );

  const blockHeight = tagHeight + (state.tag ? gap : 0) + lines.length * lineHeight + (state.byline ? gap + bylineHeight : 0);

  let startY: number;
  if (state.align === 'top') startY = textZoneTop + padding;
  else if (state.align === 'bottom') startY = textZoneBottom - padding - blockHeight;
  else startY = textZoneTop + (zoneHeight - blockHeight) / 2;

  let cursorY = startY;

  // tag / badge
  if (state.tag) {
    ctx.font = fontString(700, cw * 0.032, 'Poppins');
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

  // headline — draw word by word so *highlighted* words can use the accent color
  ctx.font = fontString(font.weight, fontSize, font.family);
  ctx.textAlign = 'left';
  const spaceWidth = ctx.measureText(' ').width;
  for (const line of lines) {
    cursorY += lineHeight * 0.82;
    let x = padding;
    for (const word of line) {
      ctx.fillStyle = word.highlighted ? ACCENT : textColor;
      ctx.fillText(word.text, x, cursorY);
      x += ctx.measureText(word.text).width + spaceWidth;
    }
    cursorY += lineHeight * 0.18;
  }

  // byline
  if (state.byline) {
    cursorY += gap;
    ctx.font = fontString(500, cw * 0.032, 'Poppins');
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.75;
    ctx.fillText(state.byline, padding, cursorY + bylineHeight * 0.6);
    ctx.globalAlpha = 1;
  }
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
