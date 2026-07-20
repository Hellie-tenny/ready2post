import { useCallback, useState } from 'react';
import { Dropzone } from './components/Dropzone';
import { PresetPicker } from './components/PresetPicker';
import { CanvasStage } from './components/CanvasStage';
import { AdjustPanel } from './components/AdjustPanel';
import { BackgroundPanel } from './components/BackgroundPanel';
import { CaptionPanel } from './components/CaptionPanel';
import { TextCardPanel } from './components/TextCardPanel';
import { TextCardStage } from './components/TextCardStage';
import { renderTextCard } from './lib/textCard';
import { useSegmenter } from './hooks/useSegmenter';
import {
  Adjustments,
  AppMode,
  BackgroundMode,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_TEXT_CARD,
  Pan,
  Preset,
  PRESETS,
  TextCardState,
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

const CAPTION_WORKER_URL = import.meta.env.VITE_CAPTION_WORKER_URL as string | undefined;
if (!CAPTION_WORKER_URL) {
  console.warn('VITE_CAPTION_WORKER_URL is not set — the caption feature is hidden until it is.');
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('photo');

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

  // text-card mode state
  const [cardPreset, setCardPreset] = useState<Preset>(PRESETS[0]);
  const [cardState, setCardState] = useState<TextCardState>(DEFAULT_TEXT_CARD);
  const [cardBgImg, setCardBgImg] = useState<HTMLImageElement | null>(null);
  const [cardDownloading, setCardDownloading] = useState(false);

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

  const getFullResBlob = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!img) { reject(new Error('No image loaded')); return; }
      const out = document.createElement('canvas');
      out.width = preset.w;
      out.height = preset.h;
      const ctx = out.getContext('2d')!;
      paintComposite({ ctx, img, cw: preset.w, ch: preset.h, pan, adjust, bgMode, cutoutCanvas, customBgImg });
      if (adjust.sharpen > 0) {
        applySharpen(ctx, preset.w, preset.h, adjust.sharpen);
      }
      out.toBlob((blob) => {
        if (blob) resolve(blob); else reject(new Error('Could not render image'));
      }, 'image/jpeg', 0.92);
    });
  }, [img, preset, pan, adjust, bgMode, cutoutCanvas, customBgImg]);

  const handleDownload = useCallback(() => {
    if (!img) return;
    setDownloading(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      getFullResBlob().then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `post-ready-${preset.key}.jpg`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setDownloading(false);
      }).catch(() => setDownloading(false));
    }));
  }, [img, preset, getFullResBlob]);

  const handleCardPhoto = useCallback(async (file: File) => {
    const image = await loadImage(file);
    setCardBgImg(image);
    setCardState((prev) => ({ ...prev, usePhoto: true }));
  }, []);

  const handleCardDownload = useCallback(() => {
    setCardDownloading(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const out = document.createElement('canvas');
      out.width = cardPreset.w;
      out.height = cardPreset.h;
      const ctx = out.getContext('2d')!;
      renderTextCard({ ctx, cw: cardPreset.w, ch: cardPreset.h, state: cardState, bgImage: cardBgImg });
      out.toBlob((blob) => {
        if (!blob) { setCardDownloading(false); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `post-ready-card-${cardPreset.key}.jpg`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setCardDownloading(false);
      }, 'image/jpeg', 0.95);
    }));
  }, [cardPreset, cardState, cardBgImg]);

  return (
    <div className="max-w-[920px] mx-auto px-5 pt-10 pb-20">
      <span className="inline-block text-[11px] font-bold tracking-wide text-navy bg-mint px-2 py-0.5 rounded mb-3.5">
        RUNS ENTIRELY IN YOUR BROWSER
      </span>
      <h1 className="font-extrabold text-[clamp(28px,5vw,42px)] tracking-tight mb-1.5">Post Ready</h1>
      <p className="text-paper/60 mb-6 max-w-[52ch] text-[15px]">
        Crop, enhance, and export for the platform you're posting to.{' '}
        <b className="text-mint font-medium">Nothing you upload leaves this page</b> — all processing happens on
        your device, so there's no server, no wait, and no cost per photo.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('photo')}
          className={`rounded-full px-4 py-2 text-sm font-semibold border ${
            mode === 'photo' ? 'bg-mint text-navy border-mint' : 'border-white/10 text-paper/60 hover:border-mint/50'
          }`}
        >
          Enhance a photo
        </button>
        <button
          onClick={() => setMode('text-card')}
          className={`rounded-full px-4 py-2 text-sm font-semibold border ${
            mode === 'text-card' ? 'bg-mint text-navy border-mint' : 'border-white/10 text-paper/60 hover:border-mint/50'
          }`}
        >
          Create a text card
        </button>
      </div>

      {mode === 'photo' && (
        <>
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

                {CAPTION_WORKER_URL && (
                  <CaptionPanel getFullResBlob={getFullResBlob} workerUrl={CAPTION_WORKER_URL} />
                )}

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
        </>
      )}

      {mode === 'text-card' && (
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
          <div className="bg-navy-soft rounded-2xl p-5 border border-white/[0.08]">
            <PresetPicker current={cardPreset} onChange={setCardPreset} />
            <TextCardStage preset={cardPreset} state={cardState} bgImage={cardBgImg} />
          </div>

          <div className="bg-navy-soft rounded-2xl p-[22px] border border-white/[0.08] flex flex-col gap-[18px]">
            <TextCardPanel
              state={cardState}
              onChange={setCardState}
              onPhotoFile={handleCardPhoto}
              hasPhoto={!!cardBgImg}
            />
            <button
              onClick={handleCardDownload}
              disabled={cardDownloading}
              className="mt-auto rounded-[10px] py-3.5 px-4 font-bold text-sm border-[1.5px] border-orange text-orange hover:bg-orange/10 disabled:opacity-50 disabled:cursor-wait"
            >
              {cardDownloading ? 'Preparing…' : 'Download for this platform'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
