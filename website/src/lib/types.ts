export type CanvasLayout = 'mask' | 'result' | 'both';

export type Point = {
  point: [number, number];
  label: 0 | 1;
};

export type ModelStatus = {
  modelReady: boolean;
  isDecoding: boolean;
  isEncoded: boolean;
  isMultiMaskMode: boolean;
};

export type GrabcutImages = {
  sourceImg: null | HTMLImageElement;
  destinationImg: null | HTMLImageElement;
  strokesImg: null | HTMLImageElement;
  strokesCanvas: null | OffscreenCanvas;
  samMask: null | HTMLImageElement;
};
