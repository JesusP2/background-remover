import {
  type Accessor,
  type Setter,
  createEffect,
  createSignal,
  onMount,
} from 'solid-js';
import { imageNames } from '~/lib/constants';
import type { GrabcutImages, ModelStatus, Point } from '~/lib/types';
import { fileToImage } from '../use-grabcut-canvas/utils';

function setupWorker({
  lastPoints,
  setLastPoints,
  images,
  modelStatus,
  setIsDownloadingModelOrEmbeddingImage,
  redrawEverything,
}: {
  lastPoints: Accessor<null | Point[]>;
  setLastPoints: Setter<null | Point[]>;
  images: GrabcutImages;
  modelStatus: ModelStatus;
  setIsDownloadingModelOrEmbeddingImage: Setter<string | null>;
  redrawEverything: () => void;
}) {
  const worker = new Worker('/transformer.js', {
    type: 'module',
  });

  worker.addEventListener('message', (e) => {
    const { type, data } = e.data;
    if (type === 'ready') {
      modelStatus.modelReady = true;
      // not needed, ugly flash that removes loading screen for a split second
      setIsDownloadingModelOrEmbeddingImage('Extracting embeddings...');
    } else if (type === 'decode_result') {
      modelStatus.isDecoding = false;

      if (!modelStatus.isEncoded || !images?.sourceImg) {
        return; // We are not ready to decode yet
      }

      if (!modelStatus.isMultiMaskMode && lastPoints()?.length) {
        // Perform decoding with the last point
        // decode();
        modelStatus.isDecoding = true;
        worker.postMessage({ type: 'decode', data: lastPoints() });
        setLastPoints([]);
      }

      const { mask, scores } = data;

      const maskCanvas = new OffscreenCanvas(mask.width, mask.height);
      const maskContext = maskCanvas.getContext(
        '2d',
      ) as OffscreenCanvasRenderingContext2D;
      const tempCanvas = new OffscreenCanvas(mask.width, mask.height);
      const tempContext = tempCanvas.getContext(
        '2d',
      ) as OffscreenCanvasRenderingContext2D;
      tempContext.drawImage(images.sourceImg, 0, 0);
      const maskImageData = maskContext.getImageData(
        0,
        0,
        maskCanvas.width,
        maskCanvas.height,
      );
      const tempImageData = tempContext.getImageData(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height,
      );
      if (!tempImageData || !maskImageData) {
        console.error('could not get image data from mask canvas');
        return;
      }

      const numMasks = scores.length; // 3
      let bestIndex = 0;
      for (let i = 1; i < numMasks; ++i) {
        if (scores[i] > scores[bestIndex]) {
          bestIndex = i;
        }
      }

      for (let i = 0; i < tempImageData.data.length; ++i) {
        // TODO: we need to take into consideration the grabcut + alpha matting mask too
        // realization: it's not possible
        const offset = 4 * i;
        if (mask.data[numMasks * i + bestIndex] !== 1) {
          tempImageData.data[offset + 3] = 0; // alpha
          maskImageData.data[offset] = 0;
          maskImageData.data[offset + 1] = 0;
          maskImageData.data[offset + 2] = 0;
          maskImageData.data[offset + 3] = 255;
        } else {
          maskImageData.data[offset] = 255;
          maskImageData.data[offset + 1] = 255;
          maskImageData.data[offset + 2] = 255;
          maskImageData.data[offset + 3] = 255;
        }
      }
      maskContext.putImageData(maskImageData, 0, 0);
      maskCanvas.convertToBlob().then((blob) => {
        const file = new File([blob], imageNames.samMask, {
          type: 'image/jpeg',
        });
        images.samMask = file;
      });
      tempContext.putImageData(tempImageData, 0, 0);
      tempCanvas
        .convertToBlob()
        .then((blob) => {
          const file = new File([blob], imageNames.result, {
            type: 'image/png',
          });
          return fileToImage(file);
        })
        .then((img) => {
          images.destinationImg = img;
          redrawEverything();
        });
    } else if (type === 'segment_result') {
      if (data === 'start') {
        setIsDownloadingModelOrEmbeddingImage('Extracting embeddings...');
      } else {
        setIsDownloadingModelOrEmbeddingImage(null);
        modelStatus.isEncoded = true;
      }
    }
  });

  return { worker };
}

export function useSam({
  images,
  sourceImgBase64,
  redrawEverything,
}: {
  images: GrabcutImages;
  sourceImgBase64: Accessor<string | null>;
  redrawEverything: () => void;
}) {
  const [worker, setWorker] = createSignal<null | Worker>(null);
  const [lastPoints, setLastPoints] = createSignal<null | Point[]>(null);
  const [
    isDownloadingModelOrEmbeddingImage,
    setIsDownloadingModelOrEmbeddingImage,
  ] = createSignal<string | null>(null);
  const modelStatus = {
    isEncoded: false,
    isDecoding: false,
    isMultiMaskMode: false,
    modelReady: false,
  };

  function decode() {
    modelStatus.isDecoding = true;
    worker()?.postMessage({ type: 'decode', data: lastPoints() });
  }

  function segment(data: string) {
    // Update state
    modelStatus.isEncoded = false;
    if (!modelStatus.modelReady) {
      setIsDownloadingModelOrEmbeddingImage('Loading model...');
    }
    worker()?.postMessage({ type: 'segment', data });
  }

  onMount(() => {
    if (!worker()) {
      const { worker } = setupWorker({
        lastPoints,
        setLastPoints,
        modelStatus,
        setIsDownloadingModelOrEmbeddingImage,
        redrawEverything,
        images,
      });
      setWorker(worker);
    }
  });

  createEffect(() => {
    const img = sourceImgBase64();
    if (typeof img !== 'string') return;
    segment(img);
  });
  return {
    decode,
    modelStatus,
    isDownloadingModelOrEmbeddingImage,
    lastPoints,
    setLastPoints,
  };
}
