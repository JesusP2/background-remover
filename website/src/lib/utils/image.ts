import pica from "pica";

export type ImageResize = 720| 1080 | 3840;
export const sizes: Record<
  ImageResize,
  { maxWidth: number; maxHeight: number }
> = {
  720: {
    maxWidth: 1280,
    maxHeight: 720,
  },
  1080: {
    maxWidth: 1920,
    maxHeight: 1080,
  },
  3840: {
    maxWidth: 3840,
    maxHeight: 2160,
  },
} as const;

function getMaximumSize(
  image: { width: number; height: number },
  size: ImageResize = 720,
) {
  let width = image.width;
  let height = image.height;
  const maxWidth = sizes[size].maxWidth;
  const maxHeight = sizes[size].maxHeight;
  if (width > height) {
    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width *= maxHeight / height;
      height = maxHeight;
    }
  }
  return {
    height,
    width,
  };
}

export async function downscaleImage(file: File, size: ImageResize = 720): Promise<File> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const { width, height } = getMaximumSize(img, size);
  if (img.width === width && img.height === height) {
    return file;
  }

  canvas.width = width;
  canvas.height = height;

  const resizer = pica();
  await resizer.resize(img, canvas);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const newFile = new File([blob], file.name, { type: file.type });
        resolve(newFile);
      } else {
        reject(new Error("Canvas to Blob conversion failed"));
      }
    }, file.type);
  });
}
export async function upscaleImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
): Promise<File> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const resizer = pica();
  await resizer.resize(img, canvas, {
    unsharpAmount: 80,
    unsharpRadius: 0.6,
    unsharpThreshold: 2,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const newFile = new File([blob], file.name, { type: file.type });
        resolve(newFile);
      } else {
        reject(new Error("Canvas to Blob conversion failed"));
      }
    }, file.type);
  });
}

export function removeBackground(
  originalImage: HTMLImageElement,
  maskImage: HTMLImageElement,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Unable to get 2D context"));
      return;
    }

    ctx.drawImage(originalImage, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = maskImage.width;
    maskCanvas.height = maskImage.height;
    const maskCtx = maskCanvas.getContext("2d");

    if (!maskCtx) {
      reject(new Error("Unable to get 2D context for mask"));
      return;
    }

    // Draw the mask
    maskCtx.drawImage(maskImage, 0, 0);
    const maskData = maskCtx.getImageData(
      0,
      0,
      maskCanvas.width,
      maskCanvas.height,
    ).data;

    for (let i = 0; i < data.length; i += 4) {
      // The mask is grayscale, so we can use any of R, G, or B channel. We'll use R.
      data[i + 3] = maskData[i]; // Set alpha to the mask value
    }

    // Put the modified image data back to the canvas
    ctx.putImageData(imageData, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const newFile = new File([blob], "result.png", { type: "image/png" });
        resolve(newFile);
      } else {
        reject(new Error("Canvas to Blob conversion failed"));
      }
    }, "image.png");
  });
}
