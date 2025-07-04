const TRUNCATE_AT = 200;
export type GrabcutActionType =
  | "move"
  | "draw-green"
  | "draw-red"
  | "draw-yellow"
  | "erase";
export type GrabcutAction = {
  id: string;
  type: GrabcutActionType;
  oldX: number;
  oldY: number;
  x: number;
  y: number;
  label?: 0 | 1;
  pos: { x: number; y: number };
  scale: number;
};

export const grabcutColors = {
  "draw-green": "#41fa5d",
  "draw-red": "#fa4150",
  "draw-yellow": "#fafa41",
} as Record<GrabcutActionType, string>;

export async function urlToImage(
  url: string,
): Promise<HTMLImageElement | null> {
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }
  const blob = await res.blob();
  const base64 = await new Promise<string | ArrayBuffer | null>(
    (resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(null);
      };
    },
  );
  if (typeof base64 !== "string") {
    return null;
  }
  return base64ToImage(base64).catch(() => null);
}

export function blobToBase64(blob: Blob) {
  return new Promise<string | ArrayBuffer | null>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      resolve(reader.result);
    };
  });
}

export function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(null);
    };
  });
}

export function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      if (typeof reader.result !== "string") return;
      img.src = reader.result;
      img.onload = () => {
        resolve(img);
      };
    };
  });
}

export function imageToCanvas(img: HTMLImageElement) {
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export async function canvasToFile(
  canvas: OffscreenCanvas,
  fileName: string,
  mimeType: string,
): Promise<File> {
  const blob = await canvas.convertToBlob();
  const file = new File([blob], fileName, { type: mimeType });
  return file;
}

export function getCanvas() {
  const sourceCanvas = document.querySelector<HTMLCanvasElement>("#source");
  const sourceCtx = sourceCanvas?.getContext("2d");
  const destinationCanvas =
    document.querySelector<HTMLCanvasElement>("#destination");
  const destinationCtx = destinationCanvas?.getContext("2d");
  if (!sourceCtx || !sourceCanvas || !destinationCanvas || !destinationCtx) {
    throw new Error("Canvas not found");
  }
  return { sourceCtx, destinationCtx };
}

export function eraseStroke(
  sourceImg: HTMLImageElement,
  action: GrabcutAction,
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) {
  let size = 0;
  if (action.scale < 0.3) {
    size = 60;
  } else if (action.scale < 1) {
    size = 30;
  } else if (action.scale < 2) {
    size = 16;
  } else if (action.scale < 4) {
    size = 6;
  } else if (action.scale < 8) {
    size = 4;
  } else if (action.scale < 12) {
    size = 2;
  } else if (action.scale <= 80) {
    size = 1;
  }
  const strokePos = {
    x: action.oldX / action.scale - action.pos.x / action.scale,
    y: action.oldY / action.scale - action.pos.y / action.scale,
  };
  const xPos =
    strokePos.x - size / 2 < 0
      ? 0
      : Math.floor(strokePos.x) - Math.floor(size / 2);
  const yPos =
    strokePos.y - size / 2 < 0
      ? 0
      : Math.floor(strokePos.y) - Math.floor(size / 2);
  ctx.drawImage(sourceImg, xPos, yPos, size, size, xPos, yPos, size, size);
}

function bresenhamAlgorithm(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const deltaCol = Math.abs(endX - startX);
  const deltaRow = Math.abs(endY - startY);

  let pointX = startX;
  let pointY = startY;

  const horizontalStep = startX < endX ? 1 : -1;
  const verticalStep = startY < endY ? 1 : -1;

  const points = [];

  let difference = deltaCol - deltaRow;

  while (pointX !== endX || pointY !== endY) {
    const doubleDifference = 2 * difference;

    if (doubleDifference > -deltaRow) {
      difference -= deltaRow;
      pointX += horizontalStep;
    }
    if (doubleDifference < deltaCol) {
      difference += deltaCol;
      pointY += verticalStep;
    }
    
    points.push({ x: pointX, y: pointY });
  }

  return points;
}

export function drawStroke(
  action: GrabcutAction,
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  newMousePosition?: { x: number; y: number },
) {
  ctx.fillStyle = grabcutColors[action.type];
  let size = 0;
  if (action.type === "draw-yellow") {
    if (action.scale < 0.3) {
      size = 50;
    } else if (action.scale < 1) {
      size = 40;
    } else if (action.scale < 2) {
      size = 20;
    } else if (action.scale < 4) {
      size = 8;
    } else if (action.scale < 8) {
      size = 5;
    } else if (action.scale < 12) {
      size = 2;
    } else if (action.scale <= 80) {
      size = 1;
    }
  } else {
    if (action.scale < 0.3) {
      size = 30;
    } else if (action.scale < 0.5) {
      size = 20;
    } else if (action.scale < 1) {
      size = 15;
    } else if (action.scale < 2) {
      size = 10;
    } else if (action.scale < 4) {
      size = 6;
    } else if (action.scale < 8) {
      size = 4;
    } else if (action.scale < 12) {
      size = 2;
    } else if (action.scale <= 80) {
      size = 1;
    }
  }

  const mousePosition = { x: action.oldX, y: action.oldY };
  if (newMousePosition) {
    mousePosition.x = newMousePosition.x;
    mousePosition.y = newMousePosition.y;
  }
  const _points = bresenhamAlgorithm(
    action.oldX,
    action.oldY,
    action.x,
    action.y,
  );

  let points = [];
  if (_points.length > TRUNCATE_AT) {
    const pickEvery = _points.length / TRUNCATE_AT;
    for (let i = 0; i < _points.length; i++) {
      if (i % pickEvery === 0) {
        points.push(_points[i]);
      }
    }
  } else {
    points = _points;
  }
  if (!points.length) {
    points.push({
      x: action.x,
      y: action.y,
    });
  }
  for (const point of points) {
    const strokePos = {
      x: point.x / action.scale - action.pos.x / action.scale,
      y: point.y / action.scale - action.pos.y / action.scale,
    };
    // const ySize = size[size.length - i - 1];
    const xPos = Math.max(Math.floor(strokePos.x), 0);
    const yPos = Math.max(Math.floor(strokePos.y), 0);
    strokeCircle({
      ctx,
      cx: xPos,
      cy: yPos,
      radius: size,
    });
  }
}
const strokeCircle = ({
  cx,
  cy,
  radius,
  ctx,
}: {
  cx: number;
  cy: number;
  radius: number;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}) => {
  let x = radius - 1;
  let y = 0;
  let dx = 1;
  let dy = 1;
  let err = dx - (radius << 1);

  while (x >= y) {
    ctx.fillRect(cx - x, cy + y, cx + x - (cx - x) + 1, 1);
    ctx.fillRect(cx - x, cy - y, cx + x - (cx - x) + 1, 1);
    ctx.fillRect(cx + y, cy - x, 1, cy + x - (cy - x) + 1);
    ctx.fillRect(cx - y, cy - x, 1, cy + x - (cy - x) + 1);

    if (err <= 0) {
      y++;
      err += dy;
      dy += 2;
    }

    if (err > 0) {
      x--;
      dx += 2;
      err += dx - (radius << 1);
    }
  }
};

export function getDataPoints(actions: GrabcutAction[]) {
  const positive_points = actions
    .filter((action) => action.type === "draw-green")
    .map((action) => {
      const x = action.oldX / action.scale - action.pos.x / action.scale;
      const y = action.oldY / action.scale - action.pos.y / action.scale;
      return [x, y];
    });
  const negative_points = actions
    .filter((action) => action.type === "draw-red")
    .map((action) => {
      const x = action.oldX / action.scale - action.pos.x / action.scale;
      const y = action.oldY / action.scale - action.pos.y / action.scale;
      return [x, y];
    });
  return { positive_points, negative_points };
}
