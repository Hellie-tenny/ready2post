import { useRef } from 'react';
import { GRADIENTS, TextAlign, TextCardState } from '../types';

interface Props {
  state: TextCardState;
  onChange: (s: TextCardState) => void;
  onPhotoFile: (file: File) => void;
  hasPhoto: boolean;
}

const ALIGNS: { key: TextAlign; label: string }[] = [
  { key: 'top', label: 'Top' },
  { key: 'center', label: 'Center' },
  { key: 'bottom', label: 'Bottom' },
];

export function TextCardPanel({ state, onChange, onPhotoFile, hasPhoto }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof TextCardState>(key: K, value: TextCardState[K]) {
    onChange({ ...state, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm text-paper/75 mb-1.5">Tag (optional)</label>
        <input
          value={state.tag}
          onChange={(e) => set('tag', e.target.value)}
          placeholder="BREAKING"
          maxLength={20}
          className="w-full rounded-lg bg-navy border border-white/10 px-3 py-2 text-sm outline-none focus:border-mint/50"
        />
      </div>

      <div>
        <label className="block text-sm text-paper/75 mb-1.5">Headline</label>
        <textarea
          value={state.headline}
          onChange={(e) => set('headline', e.target.value)}
          maxLength={140}
          rows={3}
          className="w-full rounded-lg bg-navy border border-white/10 px-3 py-2 text-sm outline-none focus:border-mint/50 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-paper/75 mb-1.5">Byline (optional)</label>
        <input
          value={state.byline}
          onChange={(e) => set('byline', e.target.value)}
          placeholder="Source or credit"
          maxLength={60}
          className="w-full rounded-lg bg-navy border border-white/10 px-3 py-2 text-sm outline-none focus:border-mint/50"
        />
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">Gradient</h2>
        <div className="flex flex-wrap gap-2">
          {GRADIENTS.map((g) => (
            <button
              key={g.key}
              onClick={() => set('gradientKey', g.key)}
              title={g.label}
              className={`w-9 h-9 rounded-full border-2 transition-transform ${
                state.gradientKey === g.key ? 'border-mint scale-110' : 'border-transparent'
              }`}
              style={{ background: `linear-gradient(135deg, ${g.stops[0]}, ${g.stops[1]})` }}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">Text position</h2>
        <div className="flex gap-1.5">
          {ALIGNS.map((a) => (
            <button
              key={a.key}
              onClick={() => set('align', a.key)}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                state.align === a.key
                  ? 'bg-mint text-navy border-mint font-bold'
                  : 'border-white/10 text-paper/65 hover:border-mint/50'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">Background</h2>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => set('usePhoto', false)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              !state.usePhoto ? 'bg-mint text-navy border-mint font-bold' : 'border-white/10 text-paper/65'
            }`}
          >
            Gradient only
          </button>
          <button
            onClick={() => (hasPhoto ? set('usePhoto', true) : fileRef.current?.click())}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              state.usePhoto ? 'bg-mint text-navy border-mint font-bold' : 'border-white/10 text-paper/65'
            }`}
          >
            {hasPhoto ? 'Photo + gradient' : 'Add a photo…'}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) onPhotoFile(e.target.files[0]); }}
        />
      </div>
    </div>
  );
}
