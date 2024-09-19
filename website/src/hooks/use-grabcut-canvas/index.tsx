import { ulid } from 'ulidx';
import { useAction, useParams } from '@solidjs/router';
import {
  type Accessor,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import type { CanvasLayout, GrabcutImages, Point } from '~/lib/types';
import {
  base64ToImage,
  blobToBase64,
  canvasToFile,
  eraseStroke,
  fileToImage,
  getCanvas,
  urlToImage,
} from './utils';
import type { GrabcutAction, GrabcutActionType } from './utils';
import { createPresignedUrlAction } from '~/lib/actions/create-presigned-url';
import { useSam } from '../use-sam';

export function useGrabcutCanvas({
  sourceUrl,
  strokesUrl,
  resultUrl,
  drawStroke,
  canvasLayout,
}: {
  sourceUrl: string;
  strokesUrl: string;
  resultUrl: string;
  canvasLayout: Accessor<CanvasLayout>;
  drawStroke: <T extends GrabcutAction>(
    action: T,
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    newMousePosition?: { x: number; y: number },
  ) => void;
}) {
  const [canvasStep, setCanvasStep] = createSignal<'SAM' | 'GRABCUT'>('SAM');
  const createPresignedUrl = useAction(createPresignedUrlAction);
  const [currentMode, setCurrentMode] =
    createSignal<GrabcutActionType>('SAM-add-area');
  let currentId = ulid();
  const images = {
    sourceImg: null,
    destinationImg: null,
    strokesCanvas: null,
    strokesImg: null,
    samMask: null,
  } as GrabcutImages;
  const isZooming = {
    value: false,
  };
  const { id } = useParams();
  const matrix = [1, 0, 0, 1, 0, 0];
  let scale = 1;
  const pos = { x: 0, y: 0 };
  let dirty = true;
  const mouse = { x: 0, y: 0, oldX: 0, oldY: 0, button: null } as {
    x: number;
    y: number;
    oldX: number;
    oldY: number;
    button: null | number;
  };
  const [actions, setActions] = createSignal<GrabcutAction[]>([], {
    equals: false,
  });
  const [redoActions, setRedoActions] = createSignal<GrabcutAction[]>([]);
  const [sourceImgBase64, setSourceImgBase64] = createSignal<null | string>(
    null,
  );
  const {
    decode,
    modelStatus,
    lastPoints: samLastPoints,
    setLastPoints: setSamLastPoints,
    isDownloadingModelOrEmbeddingImage,
  } = useSam({
    images,
    sourceImgBase64,
    redrawEverything,
  });

  function changeCanvasStep(step: 'SAM' | 'GRABCUT') {
    setActions([])
    setRedoActions([])
    if (canvasStep() === 'SAM') {
      // save SAM mask
    } else if (canvasStep() === 'GRABCUT') {
      // delete SAM mask
    }
    setCanvasStep(step)
  }

  function redrawEverything() {
    if (dirty) {
      update();
    }
    const { sourceCtx, destinationCtx } = getCanvas();
    if (!images.sourceImg || !images.strokesCanvas || !images.destinationImg) {
      console.error('could not execute redraw everything fn');
      return;
    }
    sourceCtx.setTransform(1, 0, 0, 1, 0, 0);
    sourceCtx.clearRect(0, 0, sourceCtx.canvas.width, sourceCtx.canvas.height);
    sourceCtx.setTransform(
      matrix[0],
      matrix[1],
      matrix[2],
      matrix[3],
      matrix[4],
      matrix[5],
    );
    sourceCtx.drawImage(images.sourceImg, 0, 0);
    sourceCtx.globalAlpha = 0.5;
    sourceCtx.drawImage(images.strokesCanvas, 0, 0);
    sourceCtx.globalAlpha = 1.0;

    destinationCtx.setTransform(1, 0, 0, 1, 0, 0);
    destinationCtx.clearRect(
      0,
      0,
      destinationCtx.canvas.width,
      destinationCtx.canvas.height,
    );
    destinationCtx.setTransform(
      matrix[0],
      matrix[1],
      matrix[2],
      matrix[3],
      matrix[4],
      matrix[5],
    );
    destinationCtx.drawImage(images.destinationImg, 0, 0);
    destinationCtx.strokeStyle = 'black';
    destinationCtx.lineWidth = 1 / scale;
    destinationCtx.strokeRect(
      0,
      0,
      images.destinationImg.width,
      images.destinationImg.height,
    );
  }

  function update() {
    dirty = false;
    matrix[3] = matrix[0] = scale;
    matrix[2] = matrix[1] = 0;
    matrix[4] = pos.x;
    matrix[5] = pos.y;
  }

  function pan(amount: { x: number; y: number }) {
    const { sourceCtx } = getCanvas();
    if (dirty) {
      update();
    }
    if (!images.sourceImg) return;
    pos.x += amount.x;
    pos.y += amount.y;
    adjustImagePosition(sourceCtx);
    dirty = true;
  }

  function adjustImagePosition(ctx: CanvasRenderingContext2D) {
    if (!images.sourceImg) return;
    // the right side of the image should always end at the middle of the canvas
    const leftBoundary = ctx.canvas.width / 2 - images.sourceImg.width * scale;
    // the left side of the image should always end at the middle of the canvas
    const rightBoundary = ctx.canvas.width / 2;
    const topBoundary = ctx.canvas.height / 2 - images.sourceImg.height * scale;
    const bottomBoundary = ctx.canvas.height / 2;

    // after moving/resizing, we perform boundary checks
    // we discard the smallest between current x and left boundary
    // and the greatest between the previous result and the right boundary
    // the same applies for y
    pos.x = Math.min(Math.max(pos.x, leftBoundary), rightBoundary);
    pos.y = Math.min(Math.max(pos.y, topBoundary), bottomBoundary);
  }

  function scaleAt(at: { x: number; y: number }, _amount: number) {
    let amount = _amount;
    if (dirty) {
      update();
    }
    if (scale * amount > 80) {
      amount = 80 / scale;
      scale = 80;
    } else {
      scale *= amount;
    }
    pos.x = at.x - (at.x - pos.x) * amount;
    pos.y = at.y - (at.y - pos.y) * amount;
    dirty = true;
  }

  function undo() {
    const lastAction = actions()[actions().length - 1];
    const lastStroke: GrabcutAction[] = [];

    setActions((prev) =>
      prev.filter((a) => {
        if (a.id === lastAction.id) {
          lastStroke.push(a);
          return false;
        }
        return true;
      }),
    );
    if (canvasStep() === 'SAM') {
      setSamLastPoints((points) => {
        if (!points) return points;
        points.pop();
        return [...points];
      });
      decode();
    }
    setRedoActions((prev) => prev.concat(lastStroke));
    saveSnapshot();
    redrawEverything();
  }

  function redo() {
    const lastAction = redoActions()[redoActions().length - 1];
    const lastStroke: GrabcutAction[] = [];
    setRedoActions((prev) =>
      prev.filter((a) => {
        if (a.id === lastAction.id) {
          lastStroke.push(a);
          return false;
        }
        return true;
      }),
    );
    setActions((prev) => {
      prev.push(lastAction);
      return prev;
    });
    if (canvasStep() === 'SAM' && images.sourceImg) {
      const mouseX =
        (lastAction.oldX / lastAction.scale -
          lastAction.pos.x / lastAction.scale) /
        images.sourceImg.width;
      const mouseY =
        (lastAction.oldY / lastAction.scale -
          lastAction.pos.y / lastAction.scale) /
        images.sourceImg.height;
      const point = {
        point: [mouseX, mouseY],
        label: currentMode() === 'SAM-add-area' ? 1 : 0,
      } as Point;
      setSamLastPoints((points) => {
        if (!points) return points;
        points.push(point);
        return [...points];
      });
      decode();
    }
    saveSnapshot();
    redrawEverything();
  }

  function saveSnapshot() {
    const strokesCanvasCopied = getDataFromSourceCanvas('strokes');
    if (!strokesCanvasCopied) return;
    images.strokesCanvas = strokesCanvasCopied;
  }

  function redrawActions(
    ctx: OffscreenCanvasRenderingContext2D,
    actionsType: 'strokes',
  ) {
    for (const action of actions()) {
      if (
        actionsType === 'strokes' &&
        (action.type === 'draw-red' ||
          action.type === 'draw-green' ||
          action.type === 'draw-yellow')
      ) {
        drawStroke(action, ctx);
      } else if (actionsType === 'strokes' && action.type.startsWith('SAM')) {
        console.log('TEMP LOG - sam redrawing action / probably not needed');
      } else if (action.type === 'erase' && images.sourceImg) {
        eraseStroke(images.sourceImg, action, ctx);
      }
    }
  }

  async function applyMaskToImage() {
    const imgCanvasCopied = getDataFromSourceCanvas('image');
    const strokesCanvasCopied = getDataFromSourceCanvas('strokes');
    if (!imgCanvasCopied || !strokesCanvasCopied) return;
    const [image, mask] = await Promise.all([
      canvasToFile(imgCanvasCopied, 'file.png', 'image/png'),
      canvasToFile(strokesCanvasCopied, 'mask.png', 'image/png'),
    ]);
    const formData = new FormData();
    formData.append('image_file', image);
    formData.append('mask_file', mask);
    const res = await fetch('http://localhost:8000/mask', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error('Failed to upload image');
    }
    const resultBlob = await res.blob();
    const resultFile = new File([resultBlob], 'result.png', {
      type: 'image/png',
    });
    images.destinationImg = await fileToImage(resultFile);
    redrawEverything();
    const [strokesUrl, resultUrl] = await Promise.all([
      createPresignedUrl(`${id}-mask.png`, mask.type, mask.size),
      createPresignedUrl(`${id}-result.png`, resultFile.type, resultFile.size),
    ]);
    if (!strokesUrl || !resultUrl) return;
    await Promise.all([
      fetch(strokesUrl, {
        method: 'PUT',
        body: mask,
        headers: {
          'Content-Type': mask.type,
        },
      }),
      fetch(resultUrl, {
        method: 'PUT',
        body: resultFile,
        headers: {
          'Content-Type': resultFile.type,
        },
      }),
    ]);
  }

  function calculateBaseScale(sourceCtx: CanvasRenderingContext2D) {
    if (!images.sourceImg) return 1;
    let scale = 1;
    if (images.sourceImg?.width > images.sourceImg?.height) {
      scale = sourceCtx.canvas.width / images.sourceImg.width;
    } else {
      scale = sourceCtx.canvas.height / images.sourceImg.height;
    }
    scale -= scale / 10;
    return scale;
  }

  function resetToOriginal() {
    const { sourceCtx } = getCanvas();
    if (!images.sourceImg) return;
    scale = 1;
    const _scale = calculateBaseScale(sourceCtx);
    pos.x = (sourceCtx.canvas.width / _scale - images.sourceImg.width) / 2;
    pos.y = (sourceCtx.canvas.height / _scale - images.sourceImg.height) / 2;
    scaleAt({ x: 0, y: 0 }, _scale);
    redrawEverything();
  }

  function getDataFromSourceCanvas(type: 'image' | 'strokes' | 'all') {
    if (!images.sourceImg) {
      console.error('could not get source image');
      return;
    }
    const canvas = new OffscreenCanvas(
      images.sourceImg.width,
      images.sourceImg.height,
    );
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    canvas.width = images.sourceImg.width;
    canvas.height = images.sourceImg.height;
    if (type === 'image' || type === 'all') {
      canvasCtx.drawImage(images.sourceImg, 0, 0);
    }
    if (type === 'strokes' || type === 'all') {
      if (images.strokesImg) {
        canvasCtx.drawImage(images.strokesImg, 0, 0);
      }
      redrawActions(canvasCtx, 'strokes');
    }
    return canvas;
  }

  function mouseup(event: MouseEvent) {
    event.preventDefault();
    mouse.button = null;
    saveSnapshot();
  }

  function mousedown(event: MouseEvent) {
    event.preventDefault();
    mouse.button = event.button;
    currentId = ulid();
    // extra check just to not trigger SAM actions on mousemove
    if (currentMode().startsWith('SAM') && event.button === 0) {
      const { sourceCtx } = getCanvas();
      executeDrawingAction(sourceCtx);
    }
  }

  function mousemove(event: MouseEvent) {
    event.preventDefault();
    const { sourceCtx } = getCanvas();
    mouse.oldX = mouse.x;
    mouse.oldY = mouse.y;
    mouse.x = event.pageX - sourceCtx.canvas.offsetLeft;
    mouse.y = event.pageY - sourceCtx.canvas.offsetTop;
    if (mouse.button === null) return;
    if (mouse.button === 1) {
      pan({ x: mouse.x - mouse.oldX, y: mouse.y - mouse.oldY });
      redrawEverything();
      return;
    }
    if (currentMode() === 'move') {
      pan({ x: mouse.x - mouse.oldX, y: mouse.y - mouse.oldY });
      redrawEverything();
      return;
    }
    // extra check just to not trigger SAM actions on mousemove
    if (!currentMode().startsWith('SAM')) {
      executeDrawingAction(sourceCtx);
    }
  }

  function executeDrawingAction(sourceCtx: CanvasRenderingContext2D) {
    const strokesCanvasCtx = images.strokesCanvas?.getContext('2d');
    if (!images.sourceImg || !images.strokesCanvas || !strokesCanvasCtx) return;
    const action = {
      id: currentId,
      type: currentMode(),
      oldX: mouse.oldX,
      oldY: mouse.oldY,
      x: mouse.x,
      y: mouse.y,
      pos: { x: pos.x, y: pos.y },
      scale,
    } as GrabcutAction;
    setActions((prev) => {
      prev.push(action);
      return prev;
    });
    if (redoActions().length > 0) {
      setRedoActions([]);
    }
    if (currentMode() === 'erase') {
      eraseStroke(images.sourceImg, action, sourceCtx);
    } else if (currentMode().startsWith('SAM')) {
      if (!modelStatus.isEncoded) {
        return; // Ignore if not encoded yet
      }

      if (!modelStatus.isMultiMaskMode) {
        setSamLastPoints([]);
        modelStatus.isMultiMaskMode = true;
      }

      const mouseX =
        (action.oldX / action.scale - action.pos.x / action.scale) /
        images.sourceImg.width;
      const mouseY =
        (action.oldY / action.scale - action.pos.y / action.scale) /
        images.sourceImg.height;
      const point = {
        point: [mouseX, mouseY],
        label: currentMode() === 'SAM-add-area' ? 1 : 0,
      } as Point;
      action.label = point.label;
      setSamLastPoints((prev) => {
        if (!prev) return [];
        return [...prev, point];
      });
      decode();
    } else if (
      images.sourceImg &&
      action.oldX / action.scale - action.pos.x / action.scale > -10 &&
      action.oldX / action.scale - action.pos.x / action.scale <
        images.sourceImg.width + 2 &&
      action.oldY / action.scale - action.pos.y / action.scale > -10 &&
      action.oldY / action.scale - action.pos.y / action.scale <
        images.sourceImg.height + 2
    ) {
      strokesCanvasCtx.setTransform(1, 0, 0, 1, 0, 0);
      drawStroke(action, strokesCanvasCtx);
      sourceCtx.clearRect(
        0,
        0,
        sourceCtx.canvas.width,
        sourceCtx.canvas.height,
      );
      sourceCtx.drawImage(images.sourceImg, 0, 0);
      sourceCtx.globalAlpha = 0.5;
      sourceCtx.drawImage(images.strokesCanvas, 0, 0);
      sourceCtx.globalAlpha = 1.0;
    }
  }

  async function zoomOut(pos: { x: number; y: number }) {
    isZooming.value = true;
    while (isZooming.value) {
      await new Promise((resolve) => setTimeout(resolve, 1));
      scaleAt(pos, 1 / 1.01);
      redrawEverything();
    }
  }

  async function zoomIn(pos: { x: number; y: number }) {
    isZooming.value = true;
    while (isZooming.value) {
      await new Promise((resolve) => setTimeout(resolve, 1));
      scaleAt(pos, 1.01);
      redrawEverything();
    }
  }

  function mouseWheelEvent(event: WheelEvent, type: 'source' | 'destination') {
    const { sourceCtx, destinationCtx } = getCanvas();
    let canvas = sourceCtx.canvas;
    if (type === 'destination') {
      canvas = destinationCtx.canvas;
    }
    const x = event.pageX - canvas.offsetLeft;
    const y = event.pageY - canvas.offsetTop;
    if (event.deltaY < 0) {
      scaleAt({ x, y }, 1.1);
      redrawEverything();
    } else {
      scaleAt({ x, y }, 1 / 1.1);
      redrawEverything();
    }
    event.preventDefault();
  }

  function setupListeners(
    canvas: HTMLCanvasElement,
    type: 'source' | 'destination',
  ) {
    canvas.addEventListener('mousemove', mousemove, {
      passive: false,
    });
    canvas.addEventListener('mousedown', mousedown, {
      passive: false,
    });
    canvas.addEventListener('mouseup', mouseup, {
      passive: false,
    });
    canvas.addEventListener('mouseout', mouseup, {
      passive: false,
    });
    canvas.addEventListener('wheel', (e) => mouseWheelEvent(e, type), {
      passive: false,
    });
  }

  async function saveResult(name: string) {
    if (!images.destinationImg) return;
    const anchor = document.createElement('a');
    anchor.download = `${name.split('.')[0]}.png`;
    anchor.href = images.destinationImg.src;
    anchor.click();
  }

  function handleResize() {
    const { sourceCtx, destinationCtx } = getCanvas();
    if (canvasLayout() === 'both') {
      sourceCtx.canvas.width = innerWidth / 2;
      destinationCtx.canvas.width = innerWidth / 2;
    } else {
      sourceCtx.canvas.width = innerWidth;
      destinationCtx.canvas.width = innerWidth;
    }
    sourceCtx.canvas.height = innerHeight;
    destinationCtx.canvas.height = innerHeight;
    dirty = true;
    // sometimes the canvases need to get ajusted again after resizing
    sourceCtx.imageSmoothingEnabled = false;
    destinationCtx.imageSmoothingEnabled = false;
    adjustImagePosition(sourceCtx);
    redrawEverything();
  }

  createEffect(handleResize);

  onMount(async () => {
    const { sourceCtx, destinationCtx } = getCanvas();
    if (canvasLayout() === 'both') {
      sourceCtx.canvas.width = innerWidth / 2;
      destinationCtx.canvas.width = innerWidth / 2;
    } else {
      sourceCtx.canvas.width = innerWidth;
      destinationCtx.canvas.width = innerWidth;
    }
    sourceCtx.canvas.height = innerHeight;
    destinationCtx.canvas.height = innerHeight;

    // --------- does the same as urlToImage
    const res = await fetch(sourceUrl);
    const blob = await res.blob();
    const base64 = await blobToBase64(blob);
    setSourceImgBase64(base64 as string);
    if (typeof base64 !== 'string') {
      throw new Error('Failed to convert blob to base64.');
    }
    images.sourceImg = await base64ToImage(base64);
    images.destinationImg = await urlToImage(resultUrl);
    // ---------
    if (strokesUrl !== null) {
      images.strokesImg = await urlToImage(strokesUrl);
    }
    if (!images.sourceImg || !images.destinationImg) {
      console.error('Could not load source image');
      return;
    }
    saveSnapshot();
    const scale = calculateBaseScale(sourceCtx);
    pos.x = (sourceCtx.canvas.width / scale - images.sourceImg.width) / 2;
    pos.y = (sourceCtx.canvas.height / scale - images.sourceImg.height) / 2;
    scaleAt({ x: 0, y: 0 }, scale);
    redrawEverything();
    sourceCtx.imageSmoothingEnabled = false;
    destinationCtx.imageSmoothingEnabled = false;

    setupListeners(sourceCtx.canvas, 'source');
    setupListeners(destinationCtx.canvas, 'destination');
    window.addEventListener('resize', handleResize);
    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
    });
  });

  return {
    canvasStep,
    setCurrentMode,
    applyMaskToImage,
    undo,
    redo,
    actions,
    redoActions,
    zoomIn,
    zoomOut,
    isZooming,
    resetToOriginal,
    currentMode,
    saveResult,
    isDownloadingModelOrEmbeddingImage,
  };
}
