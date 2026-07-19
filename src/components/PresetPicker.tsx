import { Preset, PRESETS } from '../types';

interface Props {
  current: Preset;
  onChange: (p: Preset) => void;
}

export function PresetPicker({ current, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p)}
          className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors
            ${p.key === current.key
              ? 'bg-mint text-navy border-mint font-bold'
              : 'border-white/10 text-paper/70 hover:border-mint/50'}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
