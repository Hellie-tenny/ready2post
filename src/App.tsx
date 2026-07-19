import { useCallback, useState } from 'react';
import { Dropzone } from './components/Dropzone';
import { PresetPicker } from './components/PresetPicker';
import { CanvasStage } from './components/CanvasStage';
import { AdjustPanel } from './components/AdjustPanel';
import { BackgroundPanel } from './components/BackgroundPanel';
import { useSegmenter } from './hooks/useSegmenter';
import {
  Adjustments,
  BackgroundMode,
  DEFAULT_ADJUSTMENTS,
  Pan,
  Preset,
  PRESETS,
} from './types';
import { analyzePhoto, applySharpen, buildCutoutCanvas, paintComposite } from './lib/imageProcessing';

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [pan, setPan] = useState<Pan>({ x: 0.5, y: 0.5 });
  const [adjust, setAdjust] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);

  const [bgMode, setBgMode] = useState<BackgroundMode>('none');
  const [cutoutCanvas, setCutoutCanvas] = useState<HTMLCanvasElement | null>(null);
  const [customBgImg, setCustomBgImg] = useState<HTMLImageElement | null>(null);
  const [invertMask, setInvertMask] = useState(false);
  const [bgStatus, setBgStatus] = useState('');
  const [bgBusy, setBgBusy] = useState(false);

  const [downloading, setDownloading] = useState(false);

  const { segment, isLoaded } = useSegmenter();

  const handleFile = useCallback(async (file: File) => {
    const image = await loadImage(file);
    setImg(image);
    setPreset(PRESETS[0]);
    setPan({ x: 0.5, y: 0.5 });
    setAdjust(DEFAULT_ADJUSTMENTS);
    setBgMode('none');
    setCutoutCanvas(null);
    setCustomBgImg(null);
    setBgStatus('');
  }, []);

  const buildCutout = useCallback(async (sourceImg: HTMLImageElement, invert: boolean) => {
    setBgStatus(isLoaded() ? '· analyzing photo…' : '· downloading background model (one-time, ~few MB)…');
    setBgBusy(true);
    try {
      const { data, width, height } = await segment(sourceImg);
      const canvas = buildCutoutCanvas(sourceImg, data, width, height, invert);
      setCutoutCanvas(canvas);
      setBgStatus('');
    } catch (err) {
      console.error('Segmentation failed', err);
      setBgStatus('· unavailable (see console)');
      setBgMode('none');
    } finally {
      setBgBusy(false);
    }
  }, [segment, isLoaded]);

  const handleBgModeChange = useCallback(async (mode: BackgroundMode) => {
    if (!img) return;
    setBgMode(mode);
    if (mode !== 'none' && !cutoutCanvas) {
      await buildCutout(img, invertMask);
    }
  }, [img, cutoutCanvas, invertMask, buildCutout]);

  const handleCustomImage = useCallback(async (file: File) => {
    const bgImg = await loadImage(file);
    setCustomBgImg(bgImg);
    setBgMode('custom');
    if (img && !cutoutCanvas) await buildCutout(img, invertMask);
  }, [img, cutoutCanvas, invertMask, buildCutout]);

  const handleInvertChange = useCallback(async (checked: boolean) => {
    setInvertMask(checked);
    if (img && bgMode !== 'none') {
      await buildCutout(img, checked);
    }
  }, [img, bgMode, buildCutout]);

  const handleAutoEnhance = useCallback(() => {
    if (!img) return;
    const suggestion = analyzePhoto(img);
    setAdjust((prev) => ({ ...prev, ...suggestion }));
  }, [img]);

  const handleDownload = useCallback(() => {
    if (!img) return;
    setDownloading(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const out = document.createElement('canvas');
      out.width = preset.w;
      out.height = preset.h;
      const ctx = out.getContext('2d')!;
      paintComposite({ ctx, img, cw: preset.w, ch: preset.h, pan, adjust, bgMode, cutoutCanvas, customBgImg });
      if (adjust.sharpen > 0) {
        applySharpen(ctx, preset.w, preset.h, adjust.sharpen);
      }
      out.toBlob((blob) => {
        if (!blob) { setDownloading(false); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `post-ready-${preset.key}.jpg`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setDownloading(false);
      }, 'image/jpeg', 0.92);
    }));
  }, [img, preset, pan, adjust, bgMode, cutoutCanvas, customBgImg]);

  return (
    <div className="max-w-[920px] mx-auto px-5 pt-10 pb-20">
      <span className="inline-block text-[11px] font-bold tracking-wide text-navy bg-mint px-2 py-0.5 rounded mb-3.5">
        RUNS ENTIRELY IN YOUR BROWSER
      </span>
      <h1 className="font-extrabold text-[clamp(28px,5vw,42px)] tracking-tight mb-1.5">Post Ready</h1>
      <p className="text-paper/60 mb-8 max-w-[52ch] text-[15px]">
        Crop, enhance, and export for the platform you're posting to.{' '}
        <b className="text-mint font-medium">Nothing you upload leaves this page</b> — all processing happens on
        your device, so there's no server, no wait, and no cost per photo.
      </p>

      {!img && <Dropzone onFile={handleFile} />}

      {img && (
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
          <div className="bg-navy-soft rounded-2xl p-5 border border-white/[0.08]">
            <PresetPicker current={preset} onChange={(p) => { setPreset(p); setPan({ x: 0.5, y: 0.5 }); }} />
            <CanvasStage
              img={img}
              preset={preset}
              pan={pan}
              onPanChange={setPan}
              adjust={adjust}
              bgMode={bgMode}
              cutoutCanvas={cutoutCanvas}
              customBgImg={customBgImg}
            />
          </div>

          <div className="bg-navy-soft rounded-2xl p-[22px] border border-white/[0.08] flex flex-col gap-[18px]">
            <AdjustPanel adjust={adjust} onChange={setAdjust} onAutoEnhance={handleAutoEnhance} />

            <BackgroundPanel
              bgMode={bgMode}
              onModeChange={handleBgModeChange}
              onCustomImage={handleCustomImage}
              invertMask={invertMask}
              onInvertChange={handleInvertChange}
              status={bgStatus}
              disabled={bgBusy}
            />

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="mt-auto rounded-[10px] py-3.5 px-4 font-bold text-sm border-[1.5px] border-orange text-orange hover:bg-orange/10 disabled:opacity-50 disabled:cursor-wait"
            >
              {downloading ? 'Preparing…' : 'Download for this platform'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
