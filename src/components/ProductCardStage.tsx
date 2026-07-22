import { useEffect, useRef } from 'react';
import { Preset, ProductPostState } from '../types';
import { renderProductCard } from '../lib/productCard';

interface Props {
  preset: Preset;
  state: ProductPostState;
  photo: HTMLImageElement;
}

const PREVIEW_MAX = 520;

export function ProductCardStage({ preset, state, photo }: Props) {
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
    renderProductCard({ ctx, cw, ch, state, photo });
  }, [preset, state, photo, cw, ch]);

  return (
    <div className="w-full flex items-center justify-center rounded-lg overflow-hidden min-h-[280px] bg-navy">
      <canvas ref={canvasRef} className="max-w-full block" />
    </div>
  );
}
