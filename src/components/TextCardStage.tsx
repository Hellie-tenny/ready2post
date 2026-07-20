import { useEffect, useRef } from 'react';
import { Preset, TextCardState } from '../types';
import { renderTextCard } from '../lib/textCard';

interface Props {
  preset: Preset;
  state: TextCardState;
  bgImage: HTMLImageElement | null;
}

const PREVIEW_MAX = 520;

export function TextCardStage({ preset, state, bgImage }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ratio = preset.w / preset.h;
  const cw = ratio >= 1 ? PREVIEW_MAX : PREVIEW_MAX * ratio;
  const ch = ratio >= 1 ? PREVIEW_MAX / ratio : PREVIEW_MAX;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d')!;
    renderTextCard({ ctx, cw, ch, state, bgImage });
  }, [preset, state, bgImage, cw, ch]);

  return (
    <div className="w-full flex items-center justify-center rounded-lg overflow-hidden min-h-[280px] bg-navy">
      <canvas ref={canvasRef} className="max-w-full block" />
    </div>
  );
}
