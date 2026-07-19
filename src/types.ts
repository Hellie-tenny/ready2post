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
