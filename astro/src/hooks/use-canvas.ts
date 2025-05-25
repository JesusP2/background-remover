import { ulid } from "ulidx";
import { imageNames } from "../lib/constants";
import type { CanvasLayout, GrabcutImages } from "../lib/types";
import {
  canvasToFile,
  drawStroke,
  eraseStroke,
  fileToImage,
  getCanvas,
  urlToImage,
} from "./utils";
import type { GrabcutAction, GrabcutActionType } from "./utils";
import { PYTHON_BACKEND_URL } from "astro:env/client";
import { db } from "../lib/db";

export function useGrabcutCanvas({
  id,
  canvasLayout,
  currentMode = { value: "draw-green" },
  currentId = { value: ulid() },
  isRemovingBackground = { value: false },
  actions = [],
  redoActions = [],
  isZooming = { value: false },
  matrix = [1, 0, 0, 1, 0, 0],
  scale = { value: 1 },
  pos = { x: 0, y: 0 },
  dirty = { value: true },
  mouse = { x: 0, y: 0, oldX: 0, oldY: 0, button: null },
  images = {
    sourceImg: null,
    destinationImg: null,
    strokesCanvas: null,
    strokesImg: null,
  },
}: {
  id: string;
  canvasLayout: CanvasLayout;
  currentMode?: { value: GrabcutActionType };
  currentId?: { value: string };
  isRemovingBackground?: { value: boolean };
  actions?: GrabcutAction[];
  redoActions?: GrabcutAction[];
  isZooming?: { value: boolean };
  matrix?: [number, number, number, number, number, number];
  scale?: { value: number };
  pos?: { x: number; y: number };
  dirty?: { value: boolean };
  mouse?: {
    x: number;
    y: number;
    oldX: number;
    oldY: number;
    button: null | number;
  };
  images?: GrabcutImages;
}) {
  function redrawEverything() {
    if (dirty.value) {
      update();
    }
    const { sourceCtx, destinationCtx } = getCanvas();
    if (!images.sourceImg || !images.strokesCanvas || !images.destinationImg) {
      console.error("could not execute redraw everything fn");
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
    destinationCtx.strokeStyle = "black";
    const borderWidth = 0.5 / scale.value;
    const halfBorder = borderWidth / 2;
    destinationCtx.lineWidth = borderWidth;
    destinationCtx.strokeRect(
      halfBorder,
      halfBorder,
      images.destinationImg.width - borderWidth,
      images.destinationImg.height - borderWidth,
    );
  }

  function update() {
    dirty.value = false;
    matrix[3] = matrix[0] = scale.value;
    matrix[2] = matrix[1] = 0;
    matrix[4] = pos.x;
    matrix[5] = pos.y;
  }

  function pan(amount: { x: number; y: number }) {
    const { sourceCtx } = getCanvas();
    if (dirty.value) {
      update();
    }
    if (!images.sourceImg) return;
    pos.x += amount.x;
    pos.y += amount.y;
    adjustImagePosition(sourceCtx);
    dirty.value = true;
  }

  function adjustImagePosition(ctx: CanvasRenderingContext2D) {
    if (!images.sourceImg) return;
    // the right side of the image should always end at the middle of the canvas
    const leftBoundary =
      ctx.canvas.width / 2 - images.sourceImg.width * scale.value;
    // the left side of the image should always end at the middle of the canvas
    const rightBoundary = ctx.canvas.width / 2;
    const topBoundary =
      ctx.canvas.height / 2 - images.sourceImg.height * scale.value;
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
    if (dirty.value) {
      update();
    }
    if (scale.value * amount > 80) {
      amount = 80 / scale.value;
      scale.value = 80;
    } else if (scale.value * amount < 0.1) {
      // TODO: this is a hack to prevent the user from zooming out too much. We should consider the image size to dynamically create a limit
      amount = 0.1 / scale.value;
      scale.value = 0.1;
    } else {
      scale.value *= amount;
    }
    pos.x = at.x - (at.x - pos.x) * amount;
    pos.y = at.y - (at.y - pos.y) * amount;
    dirty.value = true;
  }

  function undo() {
    const lastAction = actions[actions.length - 1];
    if (!lastAction) return;
    const lastStroke: GrabcutAction[] = [];

    actions = actions.filter((a) => {
      if (a.id === lastAction.id) {
        lastStroke.push(a);
        return false;
      }
      return true;
    });
    redoActions = redoActions.concat(lastStroke);
    saveSnapshot();
    redrawEverything();
  }

  function redo() {
    const lastAction = redoActions[redoActions.length - 1];
    if (!lastAction) return;
    const lastStroke: GrabcutAction[] = [];
    redoActions = redoActions.filter((a) => {
      if (a.id === lastAction.id) {
        lastStroke.push(a);
        return false;
      }
      return true;
    });
    actions = actions.concat(lastStroke);
    saveSnapshot();
    redrawEverything();
  }

  function saveSnapshot() {
    const strokesCanvasCopied = getDataFromSourceCanvas("strokes");
    if (!strokesCanvasCopied) return;
    images.strokesCanvas = strokesCanvasCopied;
  }

  function redrawActions(
    ctx: OffscreenCanvasRenderingContext2D,
    actionsType: "strokes",
  ) {
    for (const action of actions) {
      if (
        actionsType === "strokes" &&
        (action.type === "draw-red" ||
          action.type === "draw-green" ||
          action.type === "draw-yellow")
      ) {
        drawStroke(action, ctx);
      } else if (action.type === "erase" && images.sourceImg) {
        eraseStroke(images.sourceImg, action, ctx);
      }
    }
  }

  async function applyMaskToImage() {
    try {
      isRemovingBackground.value = true;
      const imgCanvasCopied = getDataFromSourceCanvas("image");
      const strokesCanvasCopied = getDataFromSourceCanvas("strokes");
      if (!imgCanvasCopied || !strokesCanvasCopied) return;
      const [image, mask] = await Promise.all([
        canvasToFile(imgCanvasCopied, "file.png", "image/png"),
        canvasToFile(strokesCanvasCopied, "mask.png", "image/png"),
      ]);
      const formData = new FormData();
      formData.append("image_file", image);
      formData.append("mask_file", mask);
      const res = await fetch(PYTHON_BACKEND_URL, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        console.log(await res.text());
        throw new Error("Failed to upload image");
      }
      const resultBlob = await res.blob();
      const resultFile = new File([resultBlob], imageNames.result, {
        type: "image/png",
      });
      await db.images.update(id, {
        mask: mask,
        result: resultFile,
      });
      images.destinationImg = await fileToImage(resultFile);
      redrawEverything();
    } catch (err) {
      console.error(err);
    } finally {
      isRemovingBackground.value = false;
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
    scale.value = 1;
    const _scale = calculateBaseScale(sourceCtx);
    pos.x = (sourceCtx.canvas.width / _scale - images.sourceImg.width) / 2;
    pos.y = (sourceCtx.canvas.height / _scale - images.sourceImg.height) / 2;
    scaleAt({ x: 0, y: 0 }, _scale);
    redrawEverything();
  }

  function getDataFromSourceCanvas(type: "image" | "strokes" | "all") {
    if (!images.sourceImg) {
      console.error("could not get source image");
      return;
    }
    const canvas = new OffscreenCanvas(
      images.sourceImg.width,
      images.sourceImg.height,
    );
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;
    canvas.width = images.sourceImg.width;
    canvas.height = images.sourceImg.height;
    if (type === "image" || type === "all") {
      canvasCtx.drawImage(images.sourceImg, 0, 0);
    }
    if (type === "strokes" || type === "all") {
      if (images.strokesImg) {
        canvasCtx.drawImage(images.strokesImg, 0, 0);
      }
      redrawActions(canvasCtx, "strokes");
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
    currentId.value = ulid();
    if (window.TouchEvent && event instanceof TouchEvent) {
      mouse.button = 0;
      const { sourceCtx } = getCanvas();
      trackMousePosition(sourceCtx, event);
    } else if (window.MouseEvent && event instanceof MouseEvent) {
      mouse.button = event.button;
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
    if (mouse.button === 1 || currentMode.value === "move") {
      const deltaX = mouse.x - mouse.oldX;
      const deltaY = mouse.y - mouse.oldY;

      if (deltaX !== 0 || deltaY !== 0) {
        pan({ x: deltaX, y: deltaY });
        redrawEverything();
      }
      return;
    }
    executeDrawingAction(sourceCtx);
  }

  function executeDrawingAction(sourceCtx: CanvasRenderingContext2D) {
    const strokesCanvasCtx = images.strokesCanvas?.getContext("2d");
    if (!images.sourceImg || !images.strokesCanvas || !strokesCanvasCtx) return;
    const action = {
      id: currentId.value,
      type: currentMode.value,
      oldX: mouse.oldX,
      oldY: mouse.oldY,
      x: mouse.x,
      y: mouse.y,
      pos: { x: pos.x, y: pos.y },
      scale: scale.value,
    } as GrabcutAction;
    actions.push(action);
    if (redoActions.length > 0) {
      redoActions = [];
    }
    if (currentMode.value === "erase") {
      eraseStroke(images.sourceImg, action, sourceCtx);
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
    const zoomFactor = 1.02;
    while (isZooming.value) {
      await new Promise((resolve) => setTimeout(resolve, 8));
      scaleAt(pos, 1 / zoomFactor);
      redrawEverything();
    }
  }

  async function zoomIn(pos: { x: number; y: number }) {
    isZooming.value = true;
    const zoomFactor = 1.02;
    while (isZooming.value) {
      await new Promise((resolve) => setTimeout(resolve, 8));
      scaleAt(pos, zoomFactor);
      redrawEverything();
    }
  }

  function mouseWheelEvent(event: WheelEvent, type: "source" | "destination") {
    const { sourceCtx, destinationCtx } = getCanvas();
    let canvas = sourceCtx.canvas;
    if (type === "destination") {
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
    type: "source" | "destination",
  ) {
    canvas.addEventListener("mousemove", mousemove);
    canvas.addEventListener("mousedown", mousedown);
    canvas.addEventListener("mouseup", mouseup);
    canvas.addEventListener("mouseout", mouseup);
    canvas.addEventListener("touchmove", mousemove);
    canvas.addEventListener("touchstart", mousedown);
    canvas.addEventListener("touchend", mouseup);
    canvas.addEventListener("wheel", (e) => mouseWheelEvent(e, type));
  }

  async function saveResult() {
    if (!images.destinationImg) return;
    const { name } = await db.images.get(id);
    const anchor = document.createElement("a");
    anchor.download = `${name.split(".")[0]}.png`;
    anchor.href = images.destinationImg.src;
    anchor.click();
  }

  function handleResize() {
    const { sourceCtx, destinationCtx } = getCanvas();
    if (canvasLayout === "both") {
      sourceCtx.canvas.width = innerWidth / 2;
      destinationCtx.canvas.width = innerWidth / 2;
    } else {
      sourceCtx.canvas.width = innerWidth;
      destinationCtx.canvas.width = innerWidth;
    }
    sourceCtx.canvas.height = innerHeight;
    destinationCtx.canvas.height = innerHeight;
    dirty.value = true;
    // sometimes the canvases need to get ajusted again after resizing
    sourceCtx.imageSmoothingEnabled = false;
    destinationCtx.imageSmoothingEnabled = false;
    adjustImagePosition(sourceCtx);
    redrawEverything();
  }

  function updateCanvasLayout(
    layout: CanvasLayout,
    previousLayout: CanvasLayout,
  ) {
    const { sourceCtx, destinationCtx } = getCanvas();
    if (layout === "both") {
      sourceCtx.canvas.width = innerWidth / 2;
      destinationCtx.canvas.width = innerWidth / 2;
    } else {
      sourceCtx.canvas.width = innerWidth;
      destinationCtx.canvas.width = innerWidth;
    }
    if (previousLayout === "both" && ["mask", "result"].includes(layout)) {
      pos.x = pos.x * 2;
    } else if (
      ["mask", "result"].includes(previousLayout) &&
      layout === "both"
    ) {
      pos.x = pos.x / 2;
    }
    sourceCtx.canvas.height = innerHeight;
    destinationCtx.canvas.height = innerHeight;
    dirty.value = true;
    // sometimes the canvases need to get ajusted again after resizing
    sourceCtx.imageSmoothingEnabled = false;
    destinationCtx.imageSmoothingEnabled = false;
    // adjustImagePosition(sourceCtx);
    redrawEverything();
  }

  async function setupCanvases() {
    const { sourceCtx, destinationCtx } = getCanvas();
    if (canvasLayout === "both") {
      sourceCtx.canvas.width = innerWidth / 2;
      destinationCtx.canvas.width = innerWidth / 2;
    } else {
      sourceCtx.canvas.width = innerWidth;
      destinationCtx.canvas.width = innerWidth;
    }
    sourceCtx.canvas.height = innerHeight;
    destinationCtx.canvas.height = innerHeight;

    const storedImage = await db.images.get(id);
    if (!storedImage) return;
    images.sourceImg = await fileToImage(storedImage.source);
    images.destinationImg = await fileToImage(storedImage.result);
    if (storedImage.mask) {
      images.strokesImg = await fileToImage(storedImage.mask);
    }
    if (!images.sourceImg || !images.destinationImg) {
      console.error("Could not load source image");
      return;
    }
    sourceCtx.imageSmoothingEnabled = false;
    destinationCtx.imageSmoothingEnabled = false;
    saveSnapshot();
    const scale = calculateBaseScale(sourceCtx);
    pos.x = (sourceCtx.canvas.width / scale - images.sourceImg.width) / 2;
    pos.y = (sourceCtx.canvas.height / scale - images.sourceImg.height) / 2;
    scaleAt({ x: 0, y: 0 }, scale);
    redrawEverything();

    setupListeners(sourceCtx.canvas, "source");
    setupListeners(destinationCtx.canvas, "destination");
    window.addEventListener("resize", handleResize);
  }
  setupCanvases();

  return {
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
    isRemovingBackground,
    updateCanvasLayout,
  };
}
