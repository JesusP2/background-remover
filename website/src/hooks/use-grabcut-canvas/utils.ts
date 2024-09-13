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
    return null
  }
  return base64ToImage(base64).catch(() => null);
}

export function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(null)
    }
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

export function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context.");
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
        throw new Error("Failed to convert canvas to blob.");
      }
      const file = new File([blob], fileName, { type: mimeType });
      resolve(file);
    }, mimeType);
  });
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
  ctx: CanvasRenderingContext2D,
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
  const deltaCol = Math.abs(endX - startX); // zero or positive number
  const deltaRow = Math.abs(endY - startY); // zero or positive number

  let pointX = startX;
  let pointY = startY;

  const horizontalStep = startX < endX ? 1 : -1;

  const verticalStep = startY < endY ? 1 : -1;

  const points = [];

  let difference = deltaCol - deltaRow;

  while (true) {
    const doubleDifference = 2 * difference; // necessary to store this value
    if (doubleDifference > -deltaRow) {
      difference -= deltaRow;
      pointX += horizontalStep;
    }
    if (doubleDifference < deltaCol) {
      difference += deltaCol;
      pointY += verticalStep;
    }
    if (pointX === endX && pointY === endY) {
      break;
    } // doesnt include the end point
    points.push({ x: pointX, y: pointY });
  }

  return points;
}

export function drawStroke(
  action: GrabcutAction,
  ctx: CanvasRenderingContext2D,
  newMousePosition?: { x: number; y: number },
) {
  ctx.fillStyle = grabcutColors[action.type];
  let size: number[] = [];
  if (action.type === "draw-yellow") {
    if (action.scale < 0.3) {
      size = [
        5, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60,
      ];
    } else if (action.scale < 1) {
      size = [
        4, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 24, 28, 32, 36, 40,
      ];
    } else if (action.scale < 2) {
      size = [3, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20];
    } else if (action.scale < 4) {
      size = [2, 3, 5];
    } else if (action.scale < 8) {
      size = [2, 3];
    } else if (action.scale < 12) {
      size = [1];
    } else if (action.scale <= 80) {
      size = [0.5];
    }
  } else {
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
  for (const point of points) {
    const strokePos = {
      x: point.x / action.scale - action.pos.x / action.scale,
      y: point.y / action.scale - action.pos.y / action.scale,
    };
    for (let i = 0; i < size.length; i++) {
      const xSize = size[i];
      const ySize = size[size.length - i - 1];
      let xPos = 0;
      if (strokePos.x - xSize / 2 > 0) {
        xPos = Math.floor(strokePos.x) - Math.floor(xSize / 2);
      }
      let yPos = 0;
      if (strokePos.y - ySize / 2 > 0) {
        yPos = Math.floor(strokePos.y) - Math.floor(ySize / 2);
      }
      ctx.fillRect(xPos, yPos, xSize * 2, ySize * 2);
    }
  }
}

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
