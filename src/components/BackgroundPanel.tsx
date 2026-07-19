import { useRef } from 'react';
import { BackgroundMode } from '../types';

interface Props {
  bgMode: BackgroundMode;
  onModeChange: (m: BackgroundMode) => void;
  onCustomImage: (file: File) => void;
  invertMask: boolean;
  onInvertChange: (v: boolean) => void;
  status: string; // '' | 'loading model' | 'analyzing'
  disabled: boolean;
}

const OPTIONS: { key: BackgroundMode; label: string }[] = [
  { key: 'none', label: 'Original' },
  { key: 'blur', label: 'Blur' },
  { key: 'white', label: 'White' },
  { key: 'navy', label: 'Navy' },
  { key: 'mint', label: 'Mint' },
  { key: 'custom', label: 'Upload image…' },
];

export function BackgroundPanel({
  bgMode,
  onModeChange,
  onCustomImage,
  invertMask,
  onInvertChange,
  status,
  disabled,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-paper/50 mb-3">
        Background <span className="normal-case tracking-normal font-normal text-paper/35">{status}</span>
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            disabled={disabled && opt.key !== 'none'}
            onClick={() => (opt.key === 'custom' ? fileRef.current?.click() : onModeChange(opt.key))}
            className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors disabled:opacity-40 disabled:cursor-wait
              ${bgMode === opt.key
                ? 'bg-mint text-navy border-mint font-bold'
                : 'border-white/10 text-paper/65 hover:border-mint/50'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onCustomImage(e.target.files[0]); }}
      />
      <label className="flex items-center gap-1.5 text-xs text-paper/40 mt-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={invertMask}
          onChange={(e) => onInvertChange(e.target.checked)}
        />
        Subject and background look swapped
      </label>
    </div>
  );
}
