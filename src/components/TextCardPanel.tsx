import { FONTS, GRADIENTS, TextAlign, TextCardState } from '../types';
import { Section } from './Section';
import { SwatchPicker } from './SwatchPicker';

interface Props {
  state: TextCardState;
  onChange: (s: TextCardState) => void;
}

const ALIGNS: { key: TextAlign; label: string }[] = [
  { key: 'top', label: 'Top' },
  { key: 'center', label: 'Center' },
  { key: 'bottom', label: 'Bottom' },
];

export function TextCardPanel({ state, onChange }: Props) {
  function set<K extends keyof TextCardState>(key: K, value: TextCardState[K]) {
    onChange({ ...state, [key]: value });
  }

  const gradientItems = GRADIENTS.map((g) => ({
    key: g.key,
    label: g.label,
    style: {
      background: g.fadeToTransparent
        ? `linear-gradient(135deg, ${g.stops[0]}, transparent), repeating-conic-gradient(#0E2033 0% 25%, #0A1826 0% 50%) 50%/6px 6px`
        : `linear-gradient(135deg, ${g.stops[0]}, ${g.stops[1]})`,
    },
  }));

  return (
    <>
      <Section step={1} title="Content">
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
          <p className="text-[11px] text-paper/35 mt-1">
            Wrap a word in *asterisks* to highlight it in accent color — e.g. "Prices *drop* today"
          </p>
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
      </Section>

      <Section step={2} title="Style">
        <div>
          <p className="text-xs font-semibold text-paper/60 mb-1.5">Font</p>
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
          <p className="text-xs font-semibold text-paper/60 mb-1.5">Gradient</p>
          <SwatchPicker items={gradientItems} selectedKey={state.gradientKey} onChange={(k) => set('gradientKey', k)} />
        </div>

        <div>
          <p className="text-xs font-semibold text-paper/60 mb-1.5">Text position</p>
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
      </Section>
    </>
  );
}
