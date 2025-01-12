import { useAction, useParams } from '@solidjs/router';
import {
  type Accessor,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { ulid } from 'ulidx';
import {
  createDeletePresignedUrlAction,
  createWritePresignedUrlAction,
} from '~/lib/actions/create-presigned-url';
import { imageNames } from '~/lib/constants';
import type { CanvasLayout, GrabcutImages, Point } from '~/lib/types';
import { useSam } from '../use-sam';
import {
  base64ToImage,
  blobToBase64,
  canvasToFile,
  eraseStroke,
  fileToImage,
  getCanvas,
  imageToCanvas,
  urlToImage,
} from './utils';
import type { GrabcutAction, GrabcutActionType } from './utils';

export function useGrabcutCanvas({
  sourceUrl,
  strokesUrl,
  resultUrl,
  samMaskUrl,
  drawStroke,
  canvasLayout,
}: {
  sourceUrl: string;
  strokesUrl: string | null;
  resultUrl: string;
  samMaskUrl: string | null;
  canvasLayout: Accessor<CanvasLayout>;
  drawStroke: <T extends GrabcutAction>(
    action: T,
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    newMousePosition?: { x: number; y: number },
  ) => void;
}) {
  const [canvasMethod, setCanvasMethod] = createSignal<'SAM' | 'GRABCUT'>(
    'SAM',
  );
  const createWritePresignedUrl = useAction(createWritePresignedUrlAction);
  const createDeletePresignedUrl = useAction(createDeletePresignedUrlAction);
  const [currentMode, setCurrentMode] =
    createSignal<GrabcutActionType>('SAM-add-area');
  let currentId = ulid();
  const [isRemovingBackground, setIsRemovingBackground] = createSignal(false);
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
    // lastPoints: samLastPoints,
    setLastPoints: setSamLastPoints,
    isDownloadingModelOrEmbeddingImage,
  } = useSam({
    images,
    sourceImgBase64,
    redrawEverything,
  });

  async function changeToCanvasMethod(step: 'SAM' | 'GRABCUT') {
    setActions([]);
    setRedoActions([]);
    setCanvasMethod(step);
    if (step === 'SAM') {
      setCurrentMode('SAM-add-area');
      // this should never be true
      if (!images.samMask || !images.sourceImg) {
        console.error('this should never happen');
        return;
      }
      images.samMask = null;
      images.strokesImg = null;
      images.strokesCanvas
        ?.getContext('2d')
        ?.clearRect(
          0,
          0,
          images.strokesCanvas.width,
          images.strokesCanvas.height,
        );
      images.destinationImg = images.sourceImg;
      const destinationFile = await canvasToFile(
        imageToCanvas(images.sourceImg),
        'result.png',
        'image/png',
      );
      const [samMaskUrl, strokesUrl, destinationUrl] = await Promise.all([
        createDeletePresignedUrl(`${id}-${imageNames.samMask}`),
        createDeletePresignedUrl(`${id}-${imageNames.mask}`),
        createWritePresignedUrl(
          `${id}-${imageNames.result}`,
          destinationFile.type,
          destinationFile.size,
        ),
      ]);
      if (!samMaskUrl || !strokesUrl || !destinationUrl) {
        console.error('Could not create SAM-mask url');
        return;
      }
      await Promise.allSettled([
        fetch(samMaskUrl, {
          method: 'DELETE',
        }),
        fetch(strokesUrl, {
          method: 'DELETE',
        }),
        fetch(destinationUrl, {
          method: 'PUT',
          body: destinationFile,
          headers: {
            'Content-Type': destinationFile.type,
          },
        }),
      ]);
      redrawEverything();
    } else if (step === 'GRABCUT') {
      setCurrentMode('draw-green');
      if (!images.samMask && images.sourceImg) {
        const canvas = new OffscreenCanvas(
          images.sourceImg.width,
          images.sourceImg.height,
        );
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('this should never happen');
          return;
        }
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, images.sourceImg.width, images.sourceImg.height);
        images.samMask = await canvasToFile(
          canvas,
          imageNames.samMask,
          'image/jpeg',
        );
      }
      if (!images.samMask || !images.destinationImg) {
        console.error('this should never happen');
        return;
      }
      const destinationFile = await canvasToFile(
        imageToCanvas(images.destinationImg),
        'result.png',
        'image/png',
      );
      const [destinationUrl, samMaskUrl] = await Promise.all([
        createWritePresignedUrl(
          `${id}-${imageNames.result}`,
          destinationFile.type,
          destinationFile.size,
        ),
        createWritePresignedUrl(
          `${id}-${imageNames.samMask}`,
          images.samMask.type,
          images.samMask.size,
        ),
      ]);
      if (!samMaskUrl || !destinationUrl) {
        console.error('Could not create urls');
        return;
      }
      await Promise.allSettled([
        fetch(samMaskUrl, {
          method: 'PUT',
          body: images.samMask,
          headers: {
            'Content-Type': images.samMask.type,
          },
        }),
        fetch(destinationUrl, {
          method: 'PUT',
          body: destinationFile,
          headers: {
            'Content-Type': destinationFile.type,
          },
        }),
      ]);
    }
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
    if (canvasMethod() === 'SAM') {
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
    if (canvasMethod() === 'SAM' && images.sourceImg) {
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
        // console.log('no idea what to do here');
        return;
      } else if (action.type === 'erase' && images.sourceImg) {
        eraseStroke(images.sourceImg, action, ctx);
      }
    }
  }

  async function applyMaskToImage() {
    try {
      setIsRemovingBackground(true);
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
      if (images.samMask) {
        formData.append('sammask_file', images.samMask);
      }
      const res = await fetch('https://erasebg.app/mask', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        console.log(await res.text());
        throw new Error('Failed to upload image');
      }
      const resultBlob = await res.blob();
      const resultFile = new File([resultBlob], imageNames.result, {
        type: 'image/png',
      });
      images.destinationImg = await fileToImage(resultFile);
      redrawEverything();
      const [strokesUrl, resultUrl] = await Promise.all([
        createWritePresignedUrl(
          `${id}-${imageNames.mask}`,
          mask.type,
          mask.size,
        ),
        createWritePresignedUrl(
          `${id}-${imageNames.result}`,
          resultFile.type,
          resultFile.size,
        ),
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsRemovingBackground(false);
    }
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

  function mouseup(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    mouse.button = null;
    saveSnapshot();
  }

  function mousedown(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    currentId = ulid();
    if (window.TouchEvent && event instanceof TouchEvent) {
      mouse.button = 0;
      const { sourceCtx } = getCanvas();
      trackMousePosition(sourceCtx, event);
      if (currentMode().startsWith('SAM')) {
        const { sourceCtx } = getCanvas();
        executeDrawingAction(sourceCtx);
      }
    } else if (window.MouseEvent && event instanceof MouseEvent) {
      mouse.button = event.button;
      if (currentMode().startsWith('SAM') && event.button === 0) {
        const { sourceCtx } = getCanvas();
        executeDrawingAction(sourceCtx);
      }
    }
  }

  function trackMousePosition(
    sourceCtx: CanvasRenderingContext2D,
    event: MouseEvent | TouchEvent,
  ) {
    let pageX = 0;
    let pageY = 0;
    if (window.TouchEvent && event instanceof TouchEvent) {
      // Make sure there's at least one touch
      if (event.touches.length > 0) {
        const touch = event.touches[0]; // Use the first touch
        pageX = touch.pageX;
        pageY = touch.pageY;
      } else {
        return;
      }
    } else if (event instanceof MouseEvent) {
      pageX = event.pageX;
      pageY = event.pageY;
    }
    mouse.oldX = mouse.x;
    mouse.oldY = mouse.y;
    const canvasRect = sourceCtx.canvas.getBoundingClientRect();
    mouse.x = Math.round(pageX - canvasRect.left);
    mouse.y = Math.round(pageY - canvasRect.top);
  }

  function mousemove(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    const { sourceCtx } = getCanvas();
    trackMousePosition(sourceCtx, event);
    if (mouse.button === null) return;
    if (mouse.button === 1 || currentMode() === 'move') {
      const deltaX = mouse.x - mouse.oldX;
      const deltaY = mouse.y - mouse.oldY;

      if (deltaX !== 0 || deltaY !== 0) {
        pan({ x: deltaX, y: deltaY });
        redrawEverything();
      }
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
    canvas.addEventListener('mousemove', mousemove);
    canvas.addEventListener('mousedown', mousedown);
    canvas.addEventListener('mouseup', mouseup);
    canvas.addEventListener('mouseout', mouseup);
    canvas.addEventListener('touchmove', mousemove);
    canvas.addEventListener('touchstart', mousedown);
    canvas.addEventListener('touchend', mouseup);
    canvas.addEventListener('wheel', (e) => mouseWheelEvent(e, type));
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
    if (typeof base64 !== 'string' || !base64.startsWith('data:image')) {
      throw new Error('Failed to convert blob to base64.');
    }
    images.sourceImg = await base64ToImage(base64);
    images.destinationImg = await urlToImage(resultUrl);
    // ---------
    if (strokesUrl !== null) {
      images.strokesImg = await urlToImage(strokesUrl);
    }
    if (samMaskUrl !== null) {
      const _samMask = await urlToImage(samMaskUrl);
      if (_samMask) {
        setCanvasMethod('GRABCUT');
        setCurrentMode('draw-green');
        images.samMask = await canvasToFile(
          imageToCanvas(_samMask),
          imageNames.samMask,
          'image/jpeg',
        );
      }
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
    canvasMethod,
    changeToCanvasMethod,
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
    isRemovingBackground,
  };
}
