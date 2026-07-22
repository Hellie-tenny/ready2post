import { FONTS, GRADIENTS, ProductPostState, StickerPosition, STICKER_COLORS, STICKER_SHAPES } from '../types';

interface Props {
  state: ProductPostState;
  onChange: (s: ProductPostState) => void;
}

const STICKER_POSITIONS: { key: StickerPosition; label: string }[] = [
  { key: 'top-right', label: 'Top right' },
  { key: 'top-left', label: 'Top left' },
  { key: 'bottom-right', label: 'Bottom right' },
  { key: 'bottom-left', label: 'Bottom left' },
];

export function ProductCardPanel({ state, onChange }: Props) {
  function set<K extends keyof ProductPostState>(key: K, value: ProductPostState[K]) {
    onChange({ ...state, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm text-paper/75 mb-1.5">Product name</label>
        <input
          value={state.productName}
          onChange={(e) => set('productName', e.target.value)}
          maxLength={60}
          className="w-full rounded-lg bg-navy border border-white/10 px-3 py-2 text-sm outline-none focus:border-mint/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-paper/75 mb-1.5">Price</label>
          <input
            value={state.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="e.g. MK 15,000"
            maxLength={14}
            className="w-full rounded-lg bg-navy border border-white/10 px-3 py-2 text-sm outline-none focus:border-mint/50"
          />
        </div>
        <div>
          <label className="block text-sm text-paper/75 mb-1.5">Was (optional)</label>
          <input
            value={state.comparePrice}
            onChange={(e) => set('comparePrice', e.target.value)}
            placeholder="e.g. MK 20,000"
            maxLength={14}
            className="w-full rounded-lg bg-navy border border-white/10 px-3 py-2 text-sm outline-none focus:border-mint/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-paper/75 mb-1.5">Description (optional)</label>
        <textarea
          value={state.description}
          onChange={(e) => set('description', e.target.value)}
          maxLength={100}
          rows={2}
          className="w-full rounded-lg bg-navy border border-white/10 px-3 py-2 text-sm outline-none focus:border-mint/50 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-paper/75 mb-1.5">Badge (optional)</label>
        <input
          value={state.badge}
          onChange={(e) => set('badge', e.target.value)}
          placeholder="NEW, SALE, LIMITED…"
          maxLength={14}
          className="w-full rounded-lg bg-navy border border-white/10 px-3 py-2 text-sm outline-none focus:border-mint/50"
        />
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">Price sticker position</h2>
        <div className="grid grid-cols-2 gap-1.5">
          {STICKER_POSITIONS.map((p) => (
            <button
              key={p.key}
              onClick={() => set('stickerPosition', p.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                state.stickerPosition === p.key
                  ? 'bg-mint text-navy border-mint font-bold'
                  : 'border-white/10 text-paper/65 hover:border-mint/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">Sticker style</h2>
        <div className="flex flex-wrap gap-1.5">
          {STICKER_SHAPES.map((s) => (
            <button
              key={s.key}
              onClick={() => set('stickerShape', s.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                state.stickerShape === s.key
                  ? 'bg-mint text-navy border-mint font-bold'
                  : 'border-white/10 text-paper/65 hover:border-mint/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">Sticker color</h2>
        <div className="flex gap-1.5">
          {(Object.keys(STICKER_COLORS) as (keyof typeof STICKER_COLORS)[]).map((key) => (
            <button
              key={key}
              onClick={() => set('stickerColorKey', key)}
              title={key}
              className={`w-8 h-8 rounded-full border-2 ${
                state.stickerColorKey === key ? 'border-mint scale-110' : 'border-white/15'
              }`}
              style={{ background: STICKER_COLORS[key] }}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-2">Font</h2>
        <div className="flex flex-wrap gap-1.5">
          {FONTS.map((f) => (
            <button
              key={f.key}
              onClick={() => set('fontKey', f.key)}
              style={{ fontFamily: f.family }}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                state.fontKey === f.key
                  ? 'bg-mint text-navy border-mint font-bold'
                  : 'border-white/10 text-paper/70 hover:border-mint/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
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
              style={{
                background: g.fadeToTransparent
                  ? `linear-gradient(135deg, ${g.stops[0]}, transparent), repeating-conic-gradient(#0E2033 0% 25%, #0A1826 0% 50%) 50%/6px 6px`
                  : `linear-gradient(135deg, ${g.stops[0]}, ${g.stops[1]})`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
