import { useRef, useCallback } from 'react';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

/**
 * Lazily loads Google's MediaPipe selfie segmenter (Apache-2.0, free for
 * commercial use) and exposes a `segment` function that returns a
 * foreground-confidence mask as a Float32Array, sized to the mask's own
 * width/height (matches the input image).
 */
export function useSegmenter() {
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const loadingPromise = useRef<Promise<ImageSegmenter> | null>(null);

  const getSegmenter = useCallback(async (): Promise<ImageSegmenter> => {
    if (segmenterRef.current) return segmenterRef.current;
    if (!loadingPromise.current) {
      loadingPromise.current = (async () => {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          outputCategoryMask: false,
          outputConfidenceMasks: true,
          runningMode: 'IMAGE',
        });
        segmenterRef.current = segmenter;
        return segmenter;
      })();
    }
    return loadingPromise.current;
  }, []);

  const isLoaded = () => segmenterRef.current !== null;

  const segment = useCallback(
    async (img: HTMLImageElement): Promise<{ data: Float32Array; width: number; height: number }> => {
      const seg = await getSegmenter();
      const result = seg.segment(img);
      const mask = result.confidenceMasks![0];
      const data = mask.getAsFloat32Array();
      const width = mask.width;
      const height = mask.height;
      mask.close();
      return { data, width, height };
    },
    [getSegmenter]
  );

  return { segment, isLoaded };
}
