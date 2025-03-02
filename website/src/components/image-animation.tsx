import { onMount } from 'solid-js';
import { base64ToImage } from '~/hooks/use-grabcut-canvas/utils';

export function CanvasAlphaMaskAnimation(props: {
  canvasId: string;
  url1: string;
  url2: string;
}) {
  let canvas: null | HTMLCanvasElement = null;
  let originalImgData: undefined | ImageData = undefined;
  let backgroundlessImgData: undefined | ImageData = undefined;
  let animationProgress = 0;
  const animationDuration = 500;
  const mouse = { enter: false };

  function startAnimation() {
    animationProgress = 0;
    animate();
  }

  function animate() {
    if (animationProgress >= 1 || !mouse.enter) {
      animationProgress = 1;
      return;
    }
    requestAnimationFrame(animate);

    const deltaTime = 16;
    animationProgress += deltaTime / animationDuration;

    const ctx = canvas?.getContext('2d');

    if (!ctx || !canvas || !originalImgData || !backgroundlessImgData) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const pixelIndex = (y * canvas.width + x) * 4;
        if (backgroundlessImgData && data[pixelIndex + 3] < 255) {
          const pixelDiff =
            backgroundlessImgData.data[pixelIndex + 3] -
            originalImgData.data[pixelIndex + 3];
          data[pixelIndex] = backgroundlessImgData.data[pixelIndex];
          data[pixelIndex + 1] = backgroundlessImgData.data[pixelIndex + 1];
          data[pixelIndex + 2] = backgroundlessImgData.data[pixelIndex + 2];
          data[pixelIndex + 3] =
            originalImgData.data[pixelIndex + 3] + animationProgress * pixelDiff;

          // if (backgroundlessImgData && backgroundlessImgData.data[pixelIndex + 3] < 255) {
          //   const pixelDiff =
          //     originalImgData.data[pixelIndex + 3] - backgroundlessImgData.data[pixelIndex + 3];
          //   data[pixelIndex + 3] = 255 - animationProgress * pixelDiff;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function mouseenter() {
    mouse.enter = true;
    startAnimation();
  }

  function mouseleave() {
    mouse.enter = false;
    if (originalImgData) {
      canvas?.getContext('2d')?.putImageData(originalImgData, 0, 0);
    }
  }

  onMount(async () => {
    canvas = document.querySelector<HTMLCanvasElement>(`#${props.canvasId}`);
    if (!canvas) return;
    const [originalImage, backgroundlessImage] = await Promise.all([
      base64ToImage(props.url1),
      base64ToImage(props.url2),
    ]);
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    canvas.getContext('2d')?.drawImage(originalImage, 0, 0);
    canvas.addEventListener('mouseenter', mouseenter);
    canvas.addEventListener('mouseleave', mouseleave);

    const originalImgCanvas = new OffscreenCanvas(
      originalImage.width,
      originalImage.height,
    );
    const originalImgCtx = originalImgCanvas.getContext('2d');
    originalImgCtx?.drawImage(originalImage, 0, 0);
    originalImgData = originalImgCanvas
      ?.getContext('2d')
      ?.getImageData(0, 0, originalImgCanvas.width, originalImgCanvas.height);

    const backgroundlessImgCanvas = new OffscreenCanvas(
      originalImage.width,
      originalImage.height,
    );
    const backgroundlessCtx = backgroundlessImgCanvas.getContext('2d');
    backgroundlessCtx?.drawImage(backgroundlessImage, 0, 0);
    backgroundlessImgData = backgroundlessImgCanvas
      ?.getContext('2d')
      ?.getImageData(
        0,
        0,
        backgroundlessImgCanvas.width,
        backgroundlessImgCanvas.height,
      );
  });
  return (
    <canvas
      class="max-w-[100%] max-h-[100%] h-96 object-contain"
      id={props.canvasId}
    />
  );
}
