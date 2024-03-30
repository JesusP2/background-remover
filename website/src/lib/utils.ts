import { createSignal, onMount } from 'solid-js';

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
  const [sourceImg, setSourceImg] = createSignal<HTMLImageElement | null>(null);
  const [destinationImg, setDestinationImg] =
    createSignal<HTMLImageElement | null>(null);
  const [currentMode, setCurrentMode] = createSignal<ActionType>('move');
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
  const actions: Action[] = [];
  const redoActions: Action[] = [];

  function drawInCanvas() {
    if (dirty) {
      update();
    }
    const { sourceCtx, destinationCtx } = getCanvas();
    const _sourceImg = sourceImg();
    const _destinationImg = destinationImg();
    if (!_sourceImg || !_destinationImg) return;
    sourceCtx.translate(0, 0);
    sourceCtx.clearRect(0, 0, 10000, 10000);
    sourceCtx.setTransform(
      matrix[0],
      matrix[1],
      matrix[2],
      matrix[3],
      matrix[4],
      matrix[5],
    );
    sourceCtx.drawImage(_sourceImg, 0, 0);

    destinationCtx.translate(0, 0);
    destinationCtx.clearRect(0, 0, 10000, 10000);
    destinationCtx.setTransform(
      matrix[0],
      matrix[1],
      matrix[2],
      matrix[3],
      matrix[4],
      matrix[5],
    );
    destinationCtx.drawImage(_destinationImg, 0, 0);
    redrawActions(sourceCtx);
  }

  function update() {
    dirty = false;
    matrix[3] = matrix[0] = scale;
    matrix[2] = matrix[1] = 0;
    matrix[4] = pos.x;
    matrix[5] = pos.y;
  }

  function pan(amount: { x: number; y: number }) {
    if (dirty) {
      update();
    }
    pos.x += amount.x;
    pos.y += amount.y;
    dirty = true;
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

  function mousedown(event: MouseEvent) {
    event.preventDefault();
    mouse.button = event.button;
  }

  function mouseup(event: MouseEvent) {
    event.preventDefault();
    mouse.button = null;
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
        type: currentMode(),
        oldX: mouse.oldX,
        oldY: mouse.oldY,
        pos: { x: pos.x, y: pos.y },
        scale,
      };
      drawStroke(action, sourceCtx);
      actions.push(action);
      return;
    } else if (currentMode() === 'erase') {
      return;
    }
  }

  function redrawActions(ctx: CanvasRenderingContext2D) {
    for (const action of actions) {
      if (action.type === 'draw-green' || action.type === 'draw-red') {
        drawStroke(action, ctx);
      }
    }
  }

  function drawStroke(action: Action, ctx: CanvasRenderingContext2D) {
    let width = 10 / action.scale;
    if (scale > 20) {
      width = 1;
    }
    ctx.fillStyle = colors[action.type];
    ctx.fillRect(
      action.oldX / action.scale - action.pos.x / action.scale - width / 2,
      action.oldY / action.scale - action.pos.y / action.scale - width / 2,
      width,
      width,
    );
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
    const positive_points = actions
      .filter((action) => action.type === 'draw-green')
      .map((action) => {
        const x = action.oldX / action.scale - action.pos.x / action.scale;
        const y = action.oldY / action.scale - action.pos.y / action.scale;
        return [x, y];
      });
    const negative_points = actions
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
    const file = await getDataFromSourceCanvas(type);
    if (!file) return;
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
    setDestinationImg(img);
    drawInCanvas();
  }

  async function onFileChange(file?: File | Blob) {
    const { sourceCtx, destinationCtx } = getCanvas();
    if (!file) return;
    const img = await fileToImage(file);
    setSourceImg(img);
    setDestinationImg(img);
    const scale = sourceCtx.canvas.width / img.width;
    const startingY = (sourceCtx.canvas.height / scale - img.height) / 2;
    pos.y = startingY;
    scaleAt({ x: 0, y: 0 }, scale);
    drawInCanvas();
    sourceCtx.imageSmoothingEnabled = false;
    destinationCtx.imageSmoothingEnabled = false;
    applyMaskToImage('image');
  }

  async function getDataFromSourceCanvas(type: 'image' | 'mask' | 'all') {
    const copy = document.createElement('canvas');
    const copyCtx = copy.getContext('2d');
    const _img = sourceImg();
    if (!copyCtx || !_img) return;
    copy.width = _img.width;
    copy.height = _img.height;
    if (type === 'image' || type === 'all') {
      copyCtx.drawImage(_img, 0, 0);
    }
    if (type === 'mask' || type === 'all') {
      redrawActions(copyCtx);
    }
    return imageToFile(copy, 'file.png', 'image/png');
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
    setSourceImg,
    drawInCanvas,
    scaleAt,
    onFileChange,
    setCurrentMode,
    applyMaskToImage,
  };
}
