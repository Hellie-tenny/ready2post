import { useEffect, useRef } from 'react';
import { Adjustments, BackgroundMode, Pan, Preset } from '../types';
import { paintComposite, applySharpen, clamp, coverRect } from '../lib/imageProcessing';

interface Props {
  img: HTMLImageElement;
  preset: Preset;
  pan: Pan;
  onPanChange: (p: Pan) => void;
  adjust: Adjustments;
  bgMode: BackgroundMode;
  cutoutCanvas: HTMLCanvasElement | null;
  customBgImg: HTMLImageElement | null;
}

const PREVIEW_MAX = 520;

export function CanvasStage({ img, preset, pan, onPanChange, adjust, bgMode, cutoutCanvas, customBgImg }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const panStart = useRef<Pan | null>(null);

  const ratio = preset.w / preset.h;
  const cw = ratio >= 1 ? PREVIEW_MAX : PREVIEW_MAX * ratio;
  const ch = ratio >= 1 ? PREVIEW_MAX / ratio : PREVIEW_MAX;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d')!;
    paintComposite({ ctx, img, cw, ch, pan, adjust, bgMode, cutoutCanvas, customBgImg });
    if (adjust.sharpen > 0) {
      applySharpen(ctx, cw, ch, adjust.sharpen);
    }
  }, [img, preset, pan, adjust, bgMode, cutoutCanvas, customBgImg, cw, ch]);

  function pointerPos(e: PointerEvent | React.PointerEvent) {
    return { x: e.clientX, y: e.clientY };
  }

  function startDrag(e: React.PointerEvent) {
    dragging.current = true;
    dragStart.current = pointerPos(e);
    panStart.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDrag(e: React.PointerEvent) {
    if (!dragging.current || !dragStart.current || !panStart.current) return;
    const p = pointerPos(e);
    const dx = p.x - dragStart.current.x;
    const dy = p.y - dragStart.current.y;
    const { drawW, drawH } = coverRect(img, cw, ch, panStart.current);
    const maxOffX = Math.max(drawW - cw, 1);
    const maxOffY = Math.max(drawH - ch, 1);
    onPanChange({
      x: clamp(panStart.current.x - dx / maxOffX, 0, 1),
      y: clamp(panStart.current.y - dy / maxOffY, 0, 1),
    });
  }

  function endDrag() {
    dragging.current = false;
  }

  return (
    <div>
      <div
        className="relative w-full flex items-center justify-center rounded-lg overflow-hidden min-h-[280px]"
        style={{
          background:
            'repeating-conic-gradient(#0E2033 0% 25%, #0A1826 0% 50%) 50% / 16px 16px',
        }}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full block cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={startDrag}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>
      <div className="text-xs text-paper/40 mt-2.5 text-center">
        Drag the photo to reposition it inside the frame
      </div>
    </div>
  );
}
