import { useRef } from 'react';
import { BG_COLORS, COLLAGE_LAYOUTS, CollageState, colorLabel } from '../types';
import { Section } from './Section';
import { SwatchPicker } from './SwatchPicker';

interface Props {
  photos: HTMLImageElement[];
  onAddFiles: (files: File[]) => void;
  onRemovePhoto: (index: number) => void;
  state: CollageState;
  onChange: (s: CollageState) => void;
}

const GAP_COLOR_KEYS = Object.keys(BG_COLORS) as (keyof typeof BG_COLORS)[];

export function CollagePanel({ photos, onAddFiles, onRemovePhoto, state, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof CollageState>(key: K, value: CollageState[K]) {
    onChange({ ...state, [key]: value });
  }

  const gapColorItems = GAP_COLOR_KEYS.map((key) => ({
    key,
    label: colorLabel(key),
    style: { background: BG_COLORS[key] },
  }));

  return (
    <>
      <Section step={1} title="Photos" suffix={`(${photos.length})`} hint="Add 2–6 photos — the layout below uses your first N of them.">
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative w-14 h-14 rounded-md overflow-hidden border border-white/10">
              <img src={photo.src} className="w-full h-full object-cover" />
              <button
                onClick={() => onRemovePhoto(i)}
                className="absolute top-0 right-0 w-4 h-4 bg-navy/90 text-paper text-[10px] flex items-center justify-center rounded-bl"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-14 h-14 rounded-md border border-dashed border-mint/35 text-mint text-xl flex items-center justify-center hover:border-mint"
          >
            +
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onAddFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
      </Section>

      <Section step={2} title="Layout & style">
        <div>
          <p className="text-xs font-semibold text-paper/60 mb-1.5">Layout</p>
          <div className="flex flex-wrap gap-1.5">
            {COLLAGE_LAYOUTS.map((l) => {
              const disabled = photos.length < l.slots;
              return (
                <button
                  key={l.key}
                  disabled={disabled}
                  onClick={() => set('layoutKey', l.key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed ${
                    state.layoutKey === l.key
                      ? 'bg-mint text-navy border-mint font-bold'
                      : 'border-white/10 text-paper/65 hover:border-mint/50'
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-paper/35 mt-1.5">
            Layouts needing more photos than you've added are grayed out — add more above to unlock them.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-paper/60 mb-1.5">Gap size</p>
          <input
            type="range"
            min={0}
            max={4}
            value={state.gapSize}
            onChange={(e) => set('gapSize', Number(e.target.value))}
            className="postank-slider"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-paper/60 mb-1.5">Gap color</p>
          <SwatchPicker items={gapColorItems} selectedKey={state.gapColorKey} onChange={(k) => set('gapColorKey', k as keyof typeof BG_COLORS)} size={32} />
        </div>
      </Section>
    </>
  );
}
