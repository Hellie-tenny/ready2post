import { useRef } from 'react';
import { BG_COLORS, COLLAGE_LAYOUTS, CollageState } from '../types';

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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">
          Photos <span className="normal-case tracking-normal font-normal text-paper/35">({photos.length})</span>
        </h2>
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
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">Layout</h2>
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
          Uses your first N photos for whichever layout you pick — add more above to unlock bigger layouts.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">Gap size</h2>
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
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">Gap color</h2>
        <div className="flex gap-1.5">
          {GAP_COLOR_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => set('gapColorKey', key)}
              title={key}
              className={`w-8 h-8 rounded-full border-2 ${
                state.gapColorKey === key ? 'border-mint scale-110' : 'border-white/15'
              }`}
              style={{ background: BG_COLORS[key] }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
