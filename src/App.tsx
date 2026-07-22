import { useCallback, useState } from 'react';
import { Dropzone } from './components/Dropzone';
import { PresetPicker } from './components/PresetPicker';
import { CanvasStage } from './components/CanvasStage';
import { AdjustPanel } from './components/AdjustPanel';
import { BackgroundPanel } from './components/BackgroundPanel';
import { CaptionPanel } from './components/CaptionPanel';
import { TextCardPanel } from './components/TextCardPanel';
import { TextCardStage } from './components/TextCardStage';
import { ProductCardPanel } from './components/ProductCardPanel';
import { ProductCardStage } from './components/ProductCardStage';
import { CollagePanel } from './components/CollagePanel';
import { CollageStage } from './components/CollageStage';
import { renderTextCard } from './lib/textCard';
import { renderProductCard } from './lib/productCard';
import { renderCollage } from './lib/collage';
import { useSegmenter } from './hooks/useSegmenter';
import { usePersistedState } from './hooks/usePersistedState';
import {
  Adjustments,
  AppMode,
  BackgroundMode,
  CollageState,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_COLLAGE,
  DEFAULT_PRODUCT_POST,
  DEFAULT_TEXT_CARD,
  FEATURE_GROUPS,
  groupOfMode,
  Pan,
  Preset,
  PRESETS,
  ProductPostState,
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

function downloadCanvas(canvas: HTMLCanvasElement, filename: string, onDone: () => void, quality = 0.92) {
  canvas.toBlob((blob) => {
    if (!blob) { onDone(); return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    onDone();
  }, 'image/jpeg', quality);
}

const CAPTION_WORKER_URL = import.meta.env.VITE_CAPTION_WORKER_URL as string | undefined;
if (!CAPTION_WORKER_URL) {
  console.warn('VITE_CAPTION_WORKER_URL is not set — the caption feature is hidden until it is.');
}

export default function App() {
  const [mode, setMode] = usePersistedState<AppMode>('mode', 'photo');

  // --- "Enhance a photo" mode state ---
  // img/pan/cutoutCanvas/customBgImg are never persisted — not serializable, and
  // photos are far too large for localStorage anyway. The style choices below are.
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [preset, setPreset] = usePersistedState<Preset>('photo.preset', PRESETS[0]);
  const [pan, setPan] = useState<Pan>({ x: 0.5, y: 0.5 });
  const [adjust, setAdjust] = usePersistedState<Adjustments>('photo.adjust', DEFAULT_ADJUSTMENTS);

  const [bgMode, setBgMode] = usePersistedState<BackgroundMode>('photo.bgMode', 'none');
  const [cutoutCanvas, setCutoutCanvas] = useState<HTMLCanvasElement | null>(null);
  const [customBgImg, setCustomBgImg] = useState<HTMLImageElement | null>(null);
  const [invertMask, setInvertMask] = usePersistedState('photo.invertMask', false);
  const [bgStatus, setBgStatus] = useState('');
  const [bgBusy, setBgBusy] = useState(false);

  const [downloading, setDownloading] = useState(false);

  // --- "Text card" mode state (gradient only, no photo, ever) ---
  const [cardPreset, setCardPreset] = usePersistedState<Preset>('textCard.preset', PRESETS[0]);
  const [cardState, setCardState] = usePersistedState<TextCardState>('textCard.state', DEFAULT_TEXT_CARD);
  const [cardDownloading, setCardDownloading] = useState(false);

  // --- "Photo + gradient card" mode state (photo required) ---
  const [photoCardPreset, setPhotoCardPreset] = usePersistedState<Preset>('photoCard.preset', PRESETS[0]);
  const [photoCardState, setPhotoCardState] = usePersistedState<TextCardState>('photoCard.state', DEFAULT_TEXT_CARD);
  const [photoCardBgImg, setPhotoCardBgImg] = useState<HTMLImageElement | null>(null);
  const [photoCardDownloading, setPhotoCardDownloading] = useState(false);

  // --- "Product post" mode state (photo required) ---
  const [productPreset, setProductPreset] = usePersistedState<Preset>('product.preset', PRESETS[0]);
  const [productState, setProductState] = usePersistedState<ProductPostState>('product.state', DEFAULT_PRODUCT_POST);
  const [productPhoto, setProductPhoto] = useState<HTMLImageElement | null>(null);
  const [productDownloading, setProductDownloading] = useState(false);

  // --- "Collage" mode state ---
  const [collagePreset, setCollagePreset] = usePersistedState<Preset>('collage.preset', PRESETS[0]);
  const [collagePhotos, setCollagePhotos] = useState<HTMLImageElement[]>([]);
  const [collageState, setCollageState] = usePersistedState<CollageState>('collage.state', DEFAULT_COLLAGE);
  const [collageDownloading, setCollageDownloading] = useState(false);

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

  const handleBgModeChange = useCallback(async (newMode: BackgroundMode) => {
    if (!img) return;
    setBgMode(newMode);
    if (newMode !== 'none' && !cutoutCanvas) {
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
        link.download = `postank-${preset.key}.jpg`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setDownloading(false);
      }).catch(() => setDownloading(false));
    }));
  }, [img, preset, getFullResBlob]);

  // --- text-card (gradient-only) handlers ---
  const handleCardDownload = useCallback(() => {
    setCardDownloading(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const out = document.createElement('canvas');
      out.width = cardPreset.w;
      out.height = cardPreset.h;
      const ctx = out.getContext('2d')!;
      renderTextCard({ ctx, cw: cardPreset.w, ch: cardPreset.h, state: cardState, bgImage: null });
      downloadCanvas(out, `postank-card-${cardPreset.key}.jpg`, () => setCardDownloading(false), 0.95);
    }));
  }, [cardPreset, cardState]);

  // --- photo-card handlers ---
  const handlePhotoCardFile = useCallback(async (file: File) => {
    const image = await loadImage(file);
    setPhotoCardBgImg(image);
  }, []);

  const handlePhotoCardDownload = useCallback(() => {
    if (!photoCardBgImg) return;
    setPhotoCardDownloading(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const out = document.createElement('canvas');
      out.width = photoCardPreset.w;
      out.height = photoCardPreset.h;
      const ctx = out.getContext('2d')!;
      renderTextCard({ ctx, cw: photoCardPreset.w, ch: photoCardPreset.h, state: photoCardState, bgImage: photoCardBgImg });
      downloadCanvas(out, `postank-photocard-${photoCardPreset.key}.jpg`, () => setPhotoCardDownloading(false), 0.95);
    }));
  }, [photoCardPreset, photoCardState, photoCardBgImg]);

  // --- product-post handlers ---
  const handleProductFile = useCallback(async (file: File) => {
    const image = await loadImage(file);
    setProductPhoto(image);
  }, []);

  const handleProductDownload = useCallback(() => {
    if (!productPhoto) return;
    setProductDownloading(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const out = document.createElement('canvas');
      out.width = productPreset.w;
      out.height = productPreset.h;
      const ctx = out.getContext('2d')!;
      renderProductCard({ ctx, cw: productPreset.w, ch: productPreset.h, state: productState, photo: productPhoto });
      downloadCanvas(out, `postank-product-${productPreset.key}.jpg`, () => setProductDownloading(false), 0.95);
    }));
  }, [productPreset, productState, productPhoto]);

  // --- collage handlers ---
  const handleCollageAddFiles = useCallback(async (files: File[]) => {
    const images = await Promise.all(files.map(loadImage));
    setCollagePhotos((prev) => [...prev, ...images].slice(0, 6));
  }, []);

  const handleCollageRemove = useCallback((index: number) => {
    setCollagePhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCollageDownload = useCallback(() => {
    setCollageDownloading(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const out = document.createElement('canvas');
      out.width = collagePreset.w;
      out.height = collagePreset.h;
      const ctx = out.getContext('2d')!;
      renderCollage({ ctx, cw: collagePreset.w, ch: collagePreset.h, state: collageState, photos: collagePhotos });
      downloadCanvas(out, `postank-collage-${collagePreset.key}.jpg`, () => setCollageDownloading(false), 0.95);
    }));
  }, [collagePreset, collageState, collagePhotos]);

  return (
    <div className="max-w-[920px] mx-auto px-5 pt-10 pb-20">
      <h1 className="font-extrabold text-[clamp(28px,5vw,42px)] tracking-tight mb-1.5">Postank</h1>
      <p className="text-paper/60 mb-2 max-w-[52ch] text-[15px]">
        Crop, enhance, and export for the platform you're posting to.{' '}
        <b className="text-mint font-medium">Nothing you upload leaves this page</b> — all processing happens on
        your device, so there's no server, no wait, and no cost per photo.
      </p>
      <p className="text-paper/35 mb-6 max-w-[52ch] text-[13px]">
        Your text and style choices are saved in this browser automatically. Photos aren't — they're too large for
        browser storage — so you'll need to re-add those if you come back later.
      </p>

      <div className="flex gap-2 mb-3">
        {FEATURE_GROUPS.map((g) => (
          <button
            key={g.key}
            onClick={() => setMode(g.modes[0].key)}
            className={`rounded-full px-4 py-2 text-sm font-bold border ${
              groupOfMode(mode) === g.key
                ? 'bg-navy-soft border-mint text-mint'
                : 'border-white/10 text-paper/50 hover:border-white/25'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FEATURE_GROUPS.find((g) => g.key === groupOfMode(mode))!.modes.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold border ${
              mode === m.key ? 'bg-mint text-navy border-mint' : 'border-white/10 text-paper/60 hover:border-mint/50'
            }`}
          >
            {m.label}
          </button>
        ))}
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

      {mode === 'collage' && (
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
          <div className="bg-navy-soft rounded-2xl p-5 border border-white/[0.08]">
            <PresetPicker current={collagePreset} onChange={setCollagePreset} />
            <CollageStage preset={collagePreset} state={collageState} photos={collagePhotos} />
          </div>

          <div className="bg-navy-soft rounded-2xl p-[22px] border border-white/[0.08] flex flex-col gap-[18px]">
            <CollagePanel
              photos={collagePhotos}
              onAddFiles={handleCollageAddFiles}
              onRemovePhoto={handleCollageRemove}
              state={collageState}
              onChange={setCollageState}
            />
            <button
              onClick={handleCollageDownload}
              disabled={collageDownloading || collagePhotos.length < 2}
              className="mt-auto rounded-[10px] py-3.5 px-4 font-bold text-sm border-[1.5px] border-orange text-orange hover:bg-orange/10 disabled:opacity-50 disabled:cursor-wait"
            >
              {collageDownloading ? 'Preparing…' : collagePhotos.length < 2 ? 'Add at least 2 photos' : 'Download for this platform'}
            </button>
          </div>
        </div>
      )}

      {mode === 'text-card' && (
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
          <div className="bg-navy-soft rounded-2xl p-5 border border-white/[0.08]">
            <PresetPicker current={cardPreset} onChange={setCardPreset} />
            <TextCardStage preset={cardPreset} state={cardState} bgImage={null} />
          </div>

          <div className="bg-navy-soft rounded-2xl p-[22px] border border-white/[0.08] flex flex-col gap-[18px]">
            <TextCardPanel state={cardState} onChange={setCardState} />
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

      {mode === 'photo-card' && (
        <>
          {!photoCardBgImg && <Dropzone onFile={handlePhotoCardFile} />}

          {photoCardBgImg && (
            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
              <div className="bg-navy-soft rounded-2xl p-5 border border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <PresetPicker current={photoCardPreset} onChange={setPhotoCardPreset} />
                  <button
                    onClick={() => setPhotoCardBgImg(null)}
                    className="text-xs text-paper/40 underline whitespace-nowrap ml-3"
                  >
                    Use a different photo
                  </button>
                </div>
                <TextCardStage preset={photoCardPreset} state={photoCardState} bgImage={photoCardBgImg} />
              </div>

              <div className="bg-navy-soft rounded-2xl p-[22px] border border-white/[0.08] flex flex-col gap-[18px]">
                <TextCardPanel state={photoCardState} onChange={setPhotoCardState} />
                <button
                  onClick={handlePhotoCardDownload}
                  disabled={photoCardDownloading}
                  className="mt-auto rounded-[10px] py-3.5 px-4 font-bold text-sm border-[1.5px] border-orange text-orange hover:bg-orange/10 disabled:opacity-50 disabled:cursor-wait"
                >
                  {photoCardDownloading ? 'Preparing…' : 'Download for this platform'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'product-post' && (
        <>
          {!productPhoto && <Dropzone onFile={handleProductFile} />}

          {productPhoto && (
            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
              <div className="bg-navy-soft rounded-2xl p-5 border border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <PresetPicker current={productPreset} onChange={setProductPreset} />
                  <button
                    onClick={() => setProductPhoto(null)}
                    className="text-xs text-paper/40 underline whitespace-nowrap ml-3"
                  >
                    Use a different photo
                  </button>
                </div>
                <ProductCardStage preset={productPreset} state={productState} photo={productPhoto} />
              </div>

              <div className="bg-navy-soft rounded-2xl p-[22px] border border-white/[0.08] flex flex-col gap-[18px]">
                <ProductCardPanel state={productState} onChange={setProductState} />
                <button
                  onClick={handleProductDownload}
                  disabled={productDownloading}
                  className="mt-auto rounded-[10px] py-3.5 px-4 font-bold text-sm border-[1.5px] border-orange text-orange hover:bg-orange/10 disabled:opacity-50 disabled:cursor-wait"
                >
                  {productDownloading ? 'Preparing…' : 'Download for this platform'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
