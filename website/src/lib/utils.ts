export function drawImage(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
) {
	ctx.drawImage(img, 0, 0, img.width, img.height);
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

export function reDrawCanvas(
	img: HTMLImageElement | null,
	scale: number,
	pos: { x: number; y: number },
) {
  if (!img) return;
	const { sourceCtx, destinationCtx } = getCanvas();
	sourceCtx.clearRect(
		0,
		0,
		sourceCtx.canvas.width / scale,
		sourceCtx.canvas.height / scale,
	);
	destinationCtx.clearRect(
		0,
		0,
		destinationCtx.canvas.width / scale,
		destinationCtx.canvas.height / scale,
	);
	sourceCtx.drawImage(img, 0, pos.y, img.width, img.height);
	destinationCtx.drawImage(img, 0, pos.y, img.width, img.height);
}

export function updateCanvasScale(
	newScale: number,
) {
	const { sourceCtx, destinationCtx } = getCanvas();
	sourceCtx.restore();
	sourceCtx.save();
	destinationCtx.restore();
	destinationCtx.save();
	sourceCtx.scale(newScale, newScale);
	destinationCtx.scale(newScale, newScale);
}

export function getMousePos(e: MouseEvent, scale: number) {
	// console.log(e.clientX / scale, e.clientY / scale);
}
