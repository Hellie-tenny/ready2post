export interface Preset {
  key: 'square' | 'portrait' | 'story' | 'landscape';
  label: string;
  w: number;
  h: number;
}

export const PRESETS: Preset[] = [
  { key: 'square', label: 'Square post', w: 1080, h: 1080 },
  { key: 'portrait', label: 'Portrait post', w: 1080, h: 1350 },
  { key: 'story', label: 'Story / Status', w: 1080, h: 1920 },
  { key: 'landscape', label: 'Landscape post', w: 1600, h: 900 },
];

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpen: number;
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpen: 0,
};

export type BackgroundMode = 'none' | 'blur' | 'white' | 'navy' | 'mint' | 'custom';

export const BG_COLORS: Record<string, string> = {
  white: '#F4F7F5',
  navy: '#0B1B2B',
  mint: '#5FE3B3',
};

export interface Pan {
  x: number;
  y: number;
}

export type AppMode = 'photo' | 'collage' | 'text-card' | 'photo-card' | 'product-post';

export type FeatureGroup = 'photos' | 'cards';

export interface FeatureGroupDef {
  key: FeatureGroup;
  label: string;
  modes: { key: AppMode; label: string }[];
}

// Grouped by what the tools have in common: "Photos" work with your raw photo(s),
// "Cards" compose text/graphics into something built for posting.
export const FEATURE_GROUPS: FeatureGroupDef[] = [
  {
    key: 'photos',
    label: 'Photos',
    modes: [
      { key: 'photo', label: 'Enhance a photo' },
      { key: 'collage', label: 'Collage' },
    ],
  },
  {
    key: 'cards',
    label: 'Cards',
    modes: [
      { key: 'text-card', label: 'Text card' },
      { key: 'photo-card', label: 'Photo + gradient card' },
      { key: 'product-post', label: 'Product post' },
    ],
  },
];

export function groupOfMode(mode: AppMode): FeatureGroup {
  return FEATURE_GROUPS.find((g) => g.modes.some((m) => m.key === mode))!.key;
}

export interface GradientPreset {
  key: string;
  label: string;
  stops: [string, string];
  textColor: 'light' | 'dark';
  fadeToTransparent?: boolean; // true = fades to actual transparency, not a second color
}

export const GRADIENTS: GradientPreset[] = [
  { key: 'brand', label: 'Brand', stops: ['#0B1B2B', '#5FE3B3'], textColor: 'light' },
  { key: 'sunset', label: 'Sunset', stops: ['#FF7A3D', '#FF3D77'], textColor: 'light' },
  { key: 'ocean', label: 'Ocean', stops: ['#0B1B2B', '#1E9C82'], textColor: 'light' },
  { key: 'midnight', label: 'Midnight', stops: ['#0B1B2B', '#4B2E83'], textColor: 'light' },
  { key: 'punch', label: 'Punch', stops: ['#FF7A3D', '#0B1B2B'], textColor: 'light' },
  { key: 'noir', label: 'Black fade', stops: ['#000000', '#000000'], textColor: 'light', fadeToTransparent: true },
];

export type TextAlign = 'top' | 'center' | 'bottom';

export interface FontChoice {
  key: string;
  label: string;
  family: string;
  weight: number;
  uppercase?: boolean;
}

export const FONTS: FontChoice[] = [
  { key: 'poppins', label: 'Poppins', family: 'Poppins', weight: 800 },
  { key: 'playfair', label: 'Playfair', family: 'Playfair Display', weight: 800 },
  { key: 'bebas', label: 'Bebas', family: 'Bebas Neue', weight: 400, uppercase: true },
  { key: 'grotesk', label: 'Grotesk', family: 'Space Grotesk', weight: 700 },
];

export interface TextCardState {
  tag: string;
  headline: string; // supports *word* markup to highlight in the accent color
  byline: string;
  gradientKey: string;
  align: TextAlign;
  fontKey: string;
}

export const DEFAULT_TEXT_CARD: TextCardState = {
  tag: '',
  headline: 'Your headline goes here',
  byline: '',
  gradientKey: 'brand',
  align: 'center',
  fontKey: 'poppins',
};

export type StickerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type StickerShape = 'circle' | 'rounded-square' | 'ribbon' | 'starburst';

export const STICKER_SHAPES: { key: StickerShape; label: string }[] = [
  { key: 'circle', label: 'Circle' },
  { key: 'rounded-square', label: 'Badge' },
  { key: 'ribbon', label: 'Ribbon' },
  { key: 'starburst', label: 'Burst' },
];

export const STICKER_COLORS: Record<string, string> = {
  mint: '#5FE3B3',
  orange: '#FF7A3D',
  white: '#F4F7F5',
  navy: '#0B1B2B',
};

export interface ProductPostState {
  productName: string;
  price: string; // free text so any currency symbol/format works, e.g. "MK 15,000"
  comparePrice: string; // optional "was" price, shown struck through above the price
  description: string;
  badge: string; // e.g. "NEW", "SALE" — blank to hide
  gradientKey: string;
  fontKey: string;
  stickerPosition: StickerPosition;
  stickerShape: StickerShape;
  stickerColorKey: keyof typeof STICKER_COLORS;
}

export const DEFAULT_PRODUCT_POST: ProductPostState = {
  productName: 'Product name',
  price: '',
  comparePrice: '',
  description: '',
  badge: '',
  gradientKey: 'brand',
  fontKey: 'poppins',
  stickerPosition: 'top-right',
  stickerShape: 'circle',
  stickerColorKey: 'mint',
};

export interface CollageCell {
  x: number; // fractions of canvas, 0..1
  y: number;
  w: number;
  h: number;
}

export interface CollageLayoutDef {
  key: string;
  label: string;
  slots: number;
  cells: CollageCell[];
}

export const COLLAGE_LAYOUTS: CollageLayoutDef[] = [
  {
    key: 'two-vertical',
    label: '2 · side by side',
    slots: 2,
    cells: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    key: 'two-horizontal',
    label: '2 · stacked',
    slots: 2,
    cells: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    key: 'three-main-left',
    label: '3 · one large',
    slots: 3,
    cells: [
      { x: 0, y: 0, w: 0.6, h: 1 },
      { x: 0.6, y: 0, w: 0.4, h: 0.5 },
      { x: 0.6, y: 0.5, w: 0.4, h: 0.5 },
    ],
  },
  {
    key: 'four-grid',
    label: '4 · grid',
    slots: 4,
    cells: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    key: 'six-grid',
    label: '6 · grid',
    slots: 6,
    cells: [
      { x: 0, y: 0, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 0, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
    ],
  },
];

export interface CollageState {
  layoutKey: string;
  gapColorKey: keyof typeof BG_COLORS;
  gapSize: number; // 0-4, mapped to a fraction of canvas width when rendering
}

export const DEFAULT_COLLAGE: CollageState = {
  layoutKey: 'four-grid',
  gapColorKey: 'white',
  gapSize: 2,
};

