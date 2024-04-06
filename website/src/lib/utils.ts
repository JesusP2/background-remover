import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createSignal, onMount } from 'solid-js';
import { createId } from '@paralleldrive/cuid2';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      if (typeof reader.result !== 'string') return;
      img.src = reader.result;
      img.onload = () => {
        resolve(img);
      };
    };
  });
}

function imageToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  mimeType: string,
): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to convert canvas to blob.');
      }
      const file = new File([blob], fileName, { type: mimeType });
      resolve(file);
    }, mimeType);
  });
}

export function getCanvas() {
  const sourceCanvas = document.querySelector<HTMLCanvasElement>('#source');
  const sourceCtx = sourceCanvas?.getContext('2d');
  const destinationCanvas =
    document.querySelector<HTMLCanvasElement>('#destination');
  const destinationCtx = destinationCanvas?.getContext('2d');
  if (!sourceCtx || !sourceCanvas || !destinationCanvas || !destinationCtx) {
    throw new Error('Canvas not found');
  }
  return { sourceCtx, destinationCtx };
}

type ActionType = 'move' | 'draw-green' | 'draw-red' | 'erase';
type Action = {
  id: string;
  type: ActionType;
  oldX: number;
  oldY: number;
  pos: { x: number; y: number };
  scale: number;
};

const colors = {
  'draw-green': 'white',
  'draw-red': 'red',
} as Record<ActionType, string>;

export function useCanvas() {
  let currentId = createId();
  let sourceImg: HTMLImageElement | null = null;
  let destinationImg: HTMLImageElement | null = null;
  let intermediateImg: HTMLImageElement | HTMLCanvasElement | null = null;
  const [currentMode, setCurrentMode] = createSignal<ActionType>('draw-green');
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
  const [actions, setActions] = createSignal<Action[]>([]);
  const [redoActions, setRedoActions] = createSignal<Action[]>([]);

  function drawInCanvas() {
    if (dirty) {
      update();
    }
    const { sourceCtx, destinationCtx } = getCanvas();
    if (!sourceImg || !intermediateImg || !destinationImg) return;
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
    sourceCtx.drawImage(intermediateImg, 0, 0);

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
    const leftBoundary = sourceCtx.canvas.width / 2 - sourceImg.width * scale;
    const rightBoundary = sourceCtx.canvas.width / 2;
    const topBoundary = sourceCtx.canvas.height / 2 - sourceImg.height * scale;
    const bottomBoundary = sourceCtx.canvas.height / 2;
    if (
      pos.x + amount.x < rightBoundary &&
      pos.x + amount.x > leftBoundary &&
      pos.y + amount.y < bottomBoundary &&
      pos.y + amount.y > topBoundary
    ) {
      pos.x += amount.x;
      pos.y += amount.y;
      dirty = true;
    }
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
    const lastStroke: Action[] = [];
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
    drawInCanvas();
  }

  function redo() {
    const lastAction = redoActions()[redoActions().length - 1];
    const lastStroke: Action[] = [];
    setRedoActions((prev) =>
      prev.filter((a) => {
        if (a.id === lastAction.id) {
          lastStroke.push(a);
          return false;
        }
        return true;
      }),
    );
    setActions((prev) => prev.concat(lastStroke));
    saveSnapshot();
    drawInCanvas();
  }

  function mousedown(event: MouseEvent) {
    event.preventDefault();
    mouse.button = event.button;
    currentId = createId();
  }

  function saveSnapshot() {
    const imgCopied = getDataFromSourceCanvas('all');
    if (!imgCopied) return;
    intermediateImg = imgCopied;
  }

  function mouseup(event: MouseEvent) {
    event.preventDefault();
    mouse.button = null;
    saveSnapshot();
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
      drawInCanvas();
    } else if (currentMode() === 'move') {
      pan({ x: mouse.x - mouse.oldX, y: mouse.y - mouse.oldY });
      drawInCanvas();
    } else if (currentMode() === 'draw-green' || currentMode() === 'draw-red') {
      const { sourceCtx } = getCanvas();
      const action = {
        id: currentId,
        type: currentMode(),
        oldX: mouse.oldX,
        oldY: mouse.oldY,
        pos: { x: pos.x, y: pos.y },
        scale,
      };
      if (!sourceImg) return;
      if (
        sourceImg &&
        action.oldX / action.scale - action.pos.x / action.scale > -10 &&
        action.oldX / action.scale - action.pos.x / action.scale <
          sourceImg.width + 2 &&
        action.oldY / action.scale - action.pos.y / action.scale > -10 &&
        action.oldY / action.scale - action.pos.y / action.scale <
          sourceImg.height + 2
      ) {
        drawStroke(action, sourceCtx);
        setActions(prev => [...prev, action])
        if (redoActions().length > 0) {
          setRedoActions([]);
        }
      }
      return;
    } else if (currentMode() === 'erase') {
      return;
    }
  }

  function redrawActions(ctx: CanvasRenderingContext2D) {
    for (const action of actions()) {
      if (action.type === 'draw-green' || action.type === 'draw-red') {
        drawStroke(action, ctx);
      }
    }
  }

  function drawStroke(action: Action, ctx: CanvasRenderingContext2D) {
    const strokePos = {
      x: action.oldX / action.scale - action.pos.x / action.scale,
      y: action.oldY / action.scale - action.pos.y / action.scale,
    };
    ctx.fillStyle = colors[action.type];
    let size: number[] = [];
    if (action.scale < 0.3) {
      size = [
        5, 9, 12, 14, 16, 17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      ];
    } else if (action.scale < 1) {
      size = [4, 7, 8, 10, 11, 12, 13, 14, 15];
    } else if (action.scale < 2) {
      size = [3, 5, 6, 7, 8];
    } else if (action.scale < 4) {
      size = [2, 3];
    } else if (action.scale < 8) {
      size = [2];
    } else if (action.scale < 12) {
      size = [1];
    } else if (action.scale <= 80) {
      size = [0.5];
    }
    for (let i = 0; i < size.length; i++) {
      const xSize = size[i];
      const ySize = size[size.length - i - 1];
      const pos = {
        x:
          strokePos.x - xSize / 2 < 0 ? 0 : Math.floor(strokePos.x - xSize / 2),
        y:
          strokePos.y - ySize / 2 < 0 ? 0 : Math.floor(strokePos.y - ySize / 2),
      };
      ctx.fillRect(pos.x, pos.y, xSize * 2, ySize * 2);
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
      drawInCanvas();
    } else {
      scaleAt({ x, y }, 1 / 1.1);
      drawInCanvas();
    }
    event.preventDefault();
  }

  function getDataPoints() {
    const positive_points = actions()
      .filter((action) => action.type === 'draw-green')
      .map((action) => {
        const x = action.oldX / action.scale - action.pos.x / action.scale;
        const y = action.oldY / action.scale - action.pos.y / action.scale;
        return [x, y];
      });
    const negative_points = actions()
      .filter((action) => action.type === 'draw-red')
      .map((action) => {
        const x = action.oldX / action.scale - action.pos.x / action.scale;
        const y = action.oldY / action.scale - action.pos.y / action.scale;
        return [x, y];
      });
    return { positive_points, negative_points };
  }

  async function applyMaskToImage(type: 'image' | 'mask') {
    const formData = new FormData();
    const imgCopied = getDataFromSourceCanvas(type);
    if (!imgCopied) return;
    const file = await imageToFile(imgCopied, 'file.png', 'image/png');
    formData.append('file', file);
    const endpoint = type === 'image' ? 'start' : 'mask';
    const res = await fetch(`http://localhost:8000/${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Failed to upload image');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const img = await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        resolve(img);
      };
    });
    destinationImg = img;
    drawInCanvas();
  }

  async function onFileChange(file?: File | Blob) {
    const { sourceCtx, destinationCtx } = getCanvas();
    if (!file) return;
    const img = await fileToImage(file);
    sourceImg = img;
    intermediateImg = img;
    destinationImg = img;
    let scale = 1;
    if (img.width > img.height) {
      scale = sourceCtx.canvas.width / img.width;
    } else {
      scale = sourceCtx.canvas.height / img.height;
    }
    scale -= scale / 10;
    pos.x = (sourceCtx.canvas.width / scale - img.width) / 2;
    pos.y = (sourceCtx.canvas.height / scale - img.height) / 2;
    scaleAt({ x: 0, y: 0 }, scale);
    drawInCanvas();
    sourceCtx.imageSmoothingEnabled = false;
    destinationCtx.imageSmoothingEnabled = false;
    applyMaskToImage('image');
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
      redrawActions(copyCtx);
    }
    return copy;
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

  onMount(() => {
    const { sourceCtx, destinationCtx } = getCanvas();
    sourceCtx.canvas.width = innerWidth / 2;
    sourceCtx.canvas.height = innerHeight;
    destinationCtx.canvas.width = innerWidth / 2;
    destinationCtx.canvas.height = innerHeight;
    setupListeners(sourceCtx.canvas, 'source');
    setupListeners(destinationCtx.canvas, 'destination');
  });

  return {
    sourceImg,
    drawInCanvas,
    scaleAt,
    onFileChange,
    setCurrentMode,
    applyMaskToImage,
    undo,
    redo,
    actions,
    redoActions,
  };
}
