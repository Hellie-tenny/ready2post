import { Adjustments, DEFAULT_ADJUSTMENTS } from '../types';

interface Props {
  adjust: Adjustments;
  onChange: (a: Adjustments) => void;
  onAutoEnhance: () => void;
}

const SLIDERS: { key: keyof Adjustments; label: string; min: number; max: number; suffix: string }[] = [
  { key: 'brightness', label: 'Brightness', min: 60, max: 160, suffix: '%' },
  { key: 'contrast', label: 'Contrast', min: 60, max: 160, suffix: '%' },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200, suffix: '%' },
  { key: 'sharpen', label: 'Sharpen', min: 0, max: 100, suffix: '' },
];

export function AdjustPanel({ adjust, onChange, onAutoEnhance }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onAutoEnhance}
        className="rounded-[10px] py-3.5 px-4 font-bold text-sm bg-gradient-to-br from-mint to-[#3fc99a] text-navy hover:brightness-105"
      >
        ✦ Auto enhance
      </button>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-3">Fine-tune</h2>
        <div className="flex flex-col gap-3.5">
          {SLIDERS.map(({ key, label, min, max, suffix }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="flex justify-between text-sm text-paper/75">
                {label}
                <span className="text-mint tabular-nums">{adjust[key]}{suffix}</span>
              </label>
              <input
                type="range"
                min={min}
                max={max}
                value={adjust[key]}
                onChange={(e) => onChange({ ...adjust, [key]: Number(e.target.value) })}
                className="postank-slider"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onChange(DEFAULT_ADJUSTMENTS)}
        className="text-xs text-paper/40 underline self-start"
      >
        Reset adjustments
      </button>
    </div>
  );
}
