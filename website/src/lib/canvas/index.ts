import { createId } from "@paralleldrive/cuid2";
import { useAction, useParams } from "@solidjs/router";
import { createEffect, createSignal, onMount } from "solid-js";
import { createStepAction } from "../actions/store-step";
import {
  base64ToImage,
  canvasToFile,
  eraseStroke,
  getCanvas,
  imageToCanvas,
  urlToImage,
} from "./utils";
import { type Action, type ActionType, drawStroke } from "./utils";
import { showToast } from "~/components/ui/toast";

export function useCanvas({
  sourceUrl,
  maskUrl,
  resultUrl,
  baseMaskUrl,
}: {
  sourceUrl: string;
  maskUrl: string | null;
  resultUrl: string;
  baseMaskUrl: string;
}) {
  let currentId = createId();
  let sourceImg: HTMLImageElement | null = null;
  let destinationImg: HTMLImageElement | null = null;
  let intermediateMask: HTMLCanvasElement | null = null;
  let storedMask: HTMLImageElement | null = null;
  let baseMask: HTMLImageElement | null = null;
  const isZooming = {
    value: false,
  };
  const createStep = useAction(createStepAction);
  const { id } = useParams();

  const [currentMode, setCurrentMode] = createSignal<ActionType>("draw-green");
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
  const [actions, setActions] = createSignal<Action[]>([], {
    equals: false,
  });
  const [redoActions, setRedoActions] = createSignal<Action[]>([]);

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
    redrawEverything();
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
    setActions((prev) => {
      prev.push(lastAction);
      return prev;
    });
    saveSnapshot();
    redrawEverything();
  }

  function saveSnapshot() {
    const maskCopied = getDataFromSourceCanvas("mask");
    if (!maskCopied) return;
    intermediateMask = maskCopied;
  }

  function redrawActions(
    ctx: CanvasRenderingContext2D,
    actionsType: "all" | "mask",
  ) {
    for (const action of actions()) {
      if (
        actionsType === "all" ||
        (actionsType === "mask" &&
          (action.type === "draw-red" ||
            action.type === "draw-green" ||
            action.type === "draw-yellow"))
      ) {
        drawStroke(action, ctx);
      } else if (action.type === "erase" && sourceImg) {
        eraseStroke(sourceImg, action, ctx);
      }
    }
  }

  async function applyMaskToImage() {
    const imgCopied = getDataFromSourceCanvas("image");
    const maskCopied = getDataFromSourceCanvas("mask");
    if (!imgCopied || !maskCopied || !baseMask) return;
    const baseMaskCopied = imageToCanvas(baseMask);
    const image = await canvasToFile(imgCopied, "file.png", "image/png");
    const mask = await canvasToFile(maskCopied, "mask.png", "image/png");
    const baseMaskImg = await canvasToFile(
      baseMaskCopied,
      "base_mask.png",
      "image/png",
    );
    const payload = await createStep(image, mask, baseMaskImg, id);
    if (payload instanceof Error) {
      showToast({
        variant: "destructive",
        title: payload.message,
        duration: 10_000,
      });
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
    sourceImg = await urlToImage(sourceUrl);
    destinationImg = await urlToImage(resultUrl);
    storedMask = maskUrl ? await urlToImage(maskUrl) : null;
    baseMask = await urlToImage(baseMaskUrl);
    saveSnapshot();
    const scale = calculateBaseScale(sourceCtx);
    pos.x = (sourceCtx.canvas.width / scale - sourceImg.width) / 2;
    pos.y = (sourceCtx.canvas.height / scale - sourceImg.height) / 2;
    scaleAt({ x: 0, y: 0 }, scale);
    redrawEverything();
    sourceCtx.imageSmoothingEnabled = false;
    destinationCtx.imageSmoothingEnabled = false;
  }

  function getDataFromSourceCanvas(type: "image" | "mask" | "all") {
    const copy = document.createElement("canvas");
    const copyCtx = copy.getContext("2d");
    if (!copyCtx || !sourceImg) return;
    copy.width = sourceImg.width;
    copy.height = sourceImg.height;
    if (type === "image" || type === "all") {
      copyCtx.drawImage(sourceImg, 0, 0);
    }
    if (type === "mask" || type === "all") {
      if (storedMask) {
        copyCtx.drawImage(storedMask, 0, 0);
      }
      redrawActions(copyCtx, "mask");
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
    if (currentMode() === "move") {
      pan({ x: mouse.x - mouse.oldX, y: mouse.y - mouse.oldY });
      redrawEverything();
      return;
    }

    const intermediateMaskCtx = intermediateMask?.getContext("2d");
    if (!sourceImg || !intermediateMask || !intermediateMaskCtx) return;
    const action = {
      id: currentId,
      type: currentMode(),
      oldX: mouse.oldX,
      oldY: mouse.oldY,
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
      currentMode() !== "erase" &&
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
    } else if (currentMode() === "erase") {
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
    canvas.addEventListener("mousemove", mousemove, {
      passive: false,
    });
    canvas.addEventListener("mousedown", mousedown, {
      passive: false,
    });
    canvas.addEventListener("mouseup", mouseup, {
      passive: false,
    });
    canvas.addEventListener("mouseout", mouseup, {
      passive: false,
    });
    canvas.addEventListener("wheel", (e) => mouseWheelEvent(e, type), {
      passive: false,
    });
  }

  async function saveResult(name: string) {
    if (!destinationImg) return;
    const anchor = document.createElement("a");
    anchor.download = `${name.split(".")[0]}.png`;
    anchor.href = destinationImg.src;
    anchor.click();
  }

  onMount(() => {
    const { sourceCtx, destinationCtx } = getCanvas();
    sourceCtx.canvas.width = innerWidth / 2;
    sourceCtx.canvas.height = innerHeight;
    destinationCtx.canvas.width = innerWidth / 2;
    destinationCtx.canvas.height = innerHeight;
    setupListeners(sourceCtx.canvas, "source");
    setupListeners(destinationCtx.canvas, "destination");
    window.addEventListener("resize", (event) => {
      sourceCtx.canvas.width = innerWidth / 2;
      sourceCtx.canvas.height = innerHeight;
      destinationCtx.canvas.width = innerWidth / 2;
      destinationCtx.canvas.height = innerHeight;
      // // resetToOriginal();
      // {
      //   const { sourceCtx } = getCanvas();
      //   if (!sourceImg) return;
      //   scale = 1;
      //   const _scale = calculateBaseScale(sourceCtx);
      //   pos.x = (sourceCtx.canvas.width / _scale - sourceImg.width) / 2;
      //   pos.y = (sourceCtx.canvas.height / _scale - sourceImg.height) / 2;
      //   scaleAt({ x: 0, y: 0 }, _scale);
      //   redrawEverything();
      // }
      redrawEverything();
    });
    loadImage();
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
