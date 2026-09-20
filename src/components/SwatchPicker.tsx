import { CSSProperties } from 'react';

export interface SwatchItem {
  key: string;
  label: string;
  style: CSSProperties;
}

interface Props {
  items: SwatchItem[];
  selectedKey: string;
  onChange: (key: string) => void;
  size?: number; // px
}

export function SwatchPicker({ items, selectedKey, onChange, size = 36 }: Props) {
  const selected = items.find((i) => i.key === selectedKey);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            title={item.label}
            aria-label={item.label}
            className={`rounded-full border-2 transition-transform ${
              selectedKey === item.key ? 'border-mint scale-110' : 'border-white/15'
            }`}
            style={{ width: size, height: size, ...item.style }}
          />
        ))}
      </div>
      {selected && (
        <p className="text-[11px] text-paper/40 mt-1.5">
          Selected: <span className="text-paper/70">{selected.label}</span>
        </p>
      )}
    </div>
  );
}
