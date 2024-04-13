export type ActionType = 'move' | 'draw-green' | 'draw-red' | 'draw-yellow' | 'erase';
export type Action = {
  id: string;
  type: ActionType;
  oldX: number;
  oldY: number;
  pos: { x: number; y: number };
  scale: number;
};

export const colors = {
  'draw-green': '#41fa5d',
  'draw-red': '#fa4150',
  'draw-yellow': '#fafa41',
  // 'draw-red': '#808080',
} as Record<ActionType, string>;

export function urlToImage(url: string): Promise<HTMLImageElement> {
  return new Promise(async (resolve) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const base64 = await new Promise<string | ArrayBuffer | null>((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        resolve(reader.result);
      };
    });
    if (typeof base64 !== 'string') throw new Error('Failed to convert blob to base64.');
    resolve(await base64ToImage(base64));
  });
}

export function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      resolve(img);
    };
  });
}

export function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
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

export function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context.');
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export function canvasToFile(
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

export function drawStroke(action: Action, ctx: CanvasRenderingContext2D) {
  const strokePos = {
    x: action.oldX / action.scale - action.pos.x / action.scale,
    y: action.oldY / action.scale - action.pos.y / action.scale,
  };
  ctx.fillStyle = colors[action.type];
  ctx.globalAlpha = 0.5;
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
      x: strokePos.x - xSize / 2 < 0 ? 0 : Math.floor(strokePos.x - xSize / 2),
      y: strokePos.y - ySize / 2 < 0 ? 0 : Math.floor(strokePos.y - ySize / 2),
    };
    ctx.fillRect(pos.x, pos.y, xSize * 2, ySize * 2);
  }
}

export function getDataPoints(actions: Action[]) {
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
