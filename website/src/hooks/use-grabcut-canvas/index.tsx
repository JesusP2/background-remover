import { toaster } from '@kobalte/core';
import { createId } from '@paralleldrive/cuid2';
import { useAction, useParams } from '@solidjs/router';
import {
  type Accessor,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import {
  Toast,
  ToastContent,
  ToastProgress,
  ToastTitle,
} from '~/components/ui/toast';
import type { CanvasLayout } from '~/lib/types';
import { createStepAction } from '../../lib/actions/store-step';
import {
  base64ToImage,
  canvasToFile,
  eraseStroke,
  getCanvas,
  urlToImage,
} from './utils';
import type { GrabcutAction, GrabcutActionType } from './utils';

export function useGrabcutCanvas({
  sourceUrl,
  maskUrl,
  resultUrl,
  drawStroke,
  eventTrigger,
  canvasLayout,
}: {
  sourceUrl: string;
  maskUrl: string | null;
  resultUrl: string;
  eventTrigger: 'mousedown' | 'mousemove';
  canvasLayout: Accessor<CanvasLayout>;
  drawStroke: <T extends GrabcutAction>(
    action: T,
    ctx: CanvasRenderingContext2D,
    newMousePosition?: { x: number; y: number },
  ) => void;
}) {
  const createStep = useAction(createStepAction);
  const [currentMode, setCurrentMode] =
    createSignal<GrabcutActionType>('draw-green');
  let currentId = createId();
  const svgImg: HTMLImageElement | null = null;
  let sourceImg: HTMLImageElement | null = null;
  let destinationImg: HTMLImageElement | null = null;
  let intermediateMask: HTMLCanvasElement | null = null;
  let storedMask: HTMLImageElement | null = null;
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

  function redrawEverything() {
    if (dirty) {
      update();
    }
    const { sourceCtx, destinationCtx } = getCanvas();
    if (!sourceImg || !intermediateMask || !destinationImg) return;
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
    sourceCtx.drawImage(sourceImg, 0, 0);
    sourceCtx.globalAlpha = 0.5;
    sourceCtx.drawImage(intermediateMask, 0, 0);
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
    destinationCtx.drawImage(destinationImg, 0, 0);
    destinationCtx.strokeStyle = 'black';
    destinationCtx.lineWidth = 1 / scale;
    destinationCtx.strokeRect(
      0,
      0,
      destinationImg.width,
      destinationImg.height,
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
    if (!sourceImg) return;
    pos.x += amount.x;
    pos.y += amount.y;
    adjustImagePosition(sourceCtx);
    dirty = true;
  }

  function adjustImagePosition(ctx: CanvasRenderingContext2D) {
    if (!sourceImg) return;
    // the right side of the image should always end at the middle of the canvas
    const leftBoundary = ctx.canvas.width / 2 - sourceImg.width * scale;
    // the left side of the image should always end at the middle of the canvas
    const rightBoundary = ctx.canvas.width / 2;
    const topBoundary = ctx.canvas.height / 2 - sourceImg.height * scale;
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
    saveSnapshot();
    redrawEverything();
  }

  function saveSnapshot() {
    const maskCopied = getDataFromSourceCanvas('mask');
    if (!maskCopied) return;
    intermediateMask = maskCopied;
  }

  function redrawActions(
    ctx: CanvasRenderingContext2D,
    actionsType: 'all' | 'mask',
  ) {
    for (const action of actions()) {
      if (
        actionsType === 'all' ||
        (actionsType === 'mask' &&
          (action.type === 'draw-red' ||
            action.type === 'draw-green' ||
            action.type === 'draw-yellow'))
      ) {
        drawStroke(action, ctx);
      } else if (action.type === 'erase' && sourceImg) {
        eraseStroke(sourceImg, action, ctx);
      }
    }
  }

  async function applyMaskToImage() {
    const imgCopied = getDataFromSourceCanvas('image');
    const maskCopied = getDataFromSourceCanvas('mask');
    if (!imgCopied || !maskCopied) return;
    const image = await canvasToFile(imgCopied, 'file.png', 'image/png');
    const mask = await canvasToFile(maskCopied, 'mask.png', 'image/png');
    const payload = await createStep(image, mask, id);
    if (payload instanceof Error) {
      toaster.show((props) => (
        <Toast toastId={props.toastId}>
          <ToastContent>
            <ToastTitle>{payload.message}</ToastTitle>
          </ToastContent>
          <ToastProgress />
        </Toast>
      ));
      return;
    }
    destinationImg = await base64ToImage(payload.result);
    redrawEverything();
  }

  function calculateBaseScale(sourceCtx: CanvasRenderingContext2D) {
    if (!sourceImg) return 1;
    let scale = 1;
    if (sourceImg?.width > sourceImg?.height) {
      scale = sourceCtx.canvas.width / sourceImg.width;
    } else {
      scale = sourceCtx.canvas.height / sourceImg.height;
    }
    scale -= scale / 10;
    return scale;
  }

  function resetToOriginal() {
    const { sourceCtx } = getCanvas();
    if (!sourceImg) return;
    scale = 1;
    const _scale = calculateBaseScale(sourceCtx);
    pos.x = (sourceCtx.canvas.width / _scale - sourceImg.width) / 2;
    pos.y = (sourceCtx.canvas.height / _scale - sourceImg.height) / 2;
    scaleAt({ x: 0, y: 0 }, _scale);
    redrawEverything();
  }

  async function loadImage() {
    const { sourceCtx, destinationCtx } = getCanvas();
    // svgImg = await urlToImage('https://erased.13e14d558cce799d0040255703bae354.r2.cloudflarestorage.com/contour.svg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=8998abc8cba410ef72731b8554c88f75%2F20240910%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20240910T032307Z&X-Amz-Expires=604800&X-Amz-Signature=76eb2e1919b7d61d03c2b61e96e3ea89239bd3ba00f77be4d6d1c2574206c3cb&X-Amz-SignedHeaders=host&x-id=GetObject')
    sourceImg = await urlToImage(sourceUrl);
    destinationImg = await urlToImage(resultUrl);
    storedMask = maskUrl ? await urlToImage(maskUrl) : null;
    saveSnapshot();
    const scale = calculateBaseScale(sourceCtx);
    pos.x = (sourceCtx.canvas.width / scale - sourceImg.width) / 2;
    pos.y = (sourceCtx.canvas.height / scale - sourceImg.height) / 2;
    scaleAt({ x: 0, y: 0 }, scale);
    redrawEverything();
    sourceCtx.imageSmoothingEnabled = false;
    destinationCtx.imageSmoothingEnabled = false;
  }

  function getDataFromSourceCanvas(type: 'image' | 'mask' | 'all') {
    const copy = document.createElement('canvas');
    const copyCtx = copy.getContext('2d');
    if (!copyCtx || !sourceImg) return;
    copy.width = sourceImg.width;
    copy.height = sourceImg.height;
    if (type === 'image' || type === 'all') {
      copyCtx.drawImage(sourceImg, 0, 0);
    }
    if (type === 'mask' || type === 'all') {
      if (storedMask) {
        copyCtx.drawImage(storedMask, 0, 0);
      }
      redrawActions(copyCtx, 'mask');
    }
    return copy;
  }

  function mouseup(event: MouseEvent) {
    event.preventDefault();
    mouse.button = null;
    saveSnapshot();
  }

  function mousedown(event: MouseEvent) {
    event.preventDefault();
    mouse.button = event.button;
    currentId = createId();
    if (eventTrigger === 'mousedown') {
      const { sourceCtx } = getCanvas();
      applyAction(sourceCtx);
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
    if (eventTrigger === 'mousemove') {
      applyAction(sourceCtx);
    }
  }

  function applyAction(sourceCtx: CanvasRenderingContext2D) {
    const intermediateMaskCtx = intermediateMask?.getContext('2d');
    if (!sourceImg || !intermediateMask || !intermediateMaskCtx) return;
    const action = {
      id: currentId,
      type: currentMode(),
      oldX: mouse.oldX,
      oldY: mouse.oldY,
      x: mouse.x,
      y: mouse.y,
      pos: { x: pos.x, y: pos.y },
      scale,
    };
    setActions((prev) => {
      prev.push(action);
      return prev;
    });
    if (redoActions().length > 0) {
      setRedoActions([]);
    }
    if (
      currentMode() !== 'erase' &&
      sourceImg &&
      action.oldX / action.scale - action.pos.x / action.scale > -10 &&
      action.oldX / action.scale - action.pos.x / action.scale <
        sourceImg.width + 2 &&
      action.oldY / action.scale - action.pos.y / action.scale > -10 &&
      action.oldY / action.scale - action.pos.y / action.scale <
        sourceImg.height + 2
    ) {
      intermediateMaskCtx.setTransform(1, 0, 0, 1, 0, 0);
      drawStroke(action, intermediateMaskCtx);
      sourceCtx.clearRect(
        0,
        0,
        sourceCtx.canvas.width,
        sourceCtx.canvas.height,
      );
      sourceCtx.drawImage(sourceImg, 0, 0);
      sourceCtx.globalAlpha = 0.5;
      sourceCtx.drawImage(intermediateMask, 0, 0);
      sourceCtx.globalAlpha = 1.0;
    } else if (currentMode() === 'erase') {
      eraseStroke(sourceImg, action, sourceCtx);
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
    if (!destinationImg) return;
    const anchor = document.createElement('a');
    anchor.download = `${name.split('.')[0]}.png`;
    anchor.href = destinationImg.src;
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
    adjustImagePosition(sourceCtx);
    redrawEverything();
  }

  createEffect(handleResize);

  onMount(() => {
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
    setupListeners(sourceCtx.canvas, 'source');
    setupListeners(destinationCtx.canvas, 'destination');
    window.addEventListener('resize', handleResize);
    loadImage();
    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
    });
  });

  return {
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
  };
}
