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

export function updateCanvasScale(
	newScale: number,
	img?: HTMLImageElement | null,
) {
	const { sourceCtx, destinationCtx } = getCanvas();
	sourceCtx.restore();
	sourceCtx.save();
	destinationCtx.restore();
	destinationCtx.save();
	sourceCtx.scale(newScale, newScale);
	destinationCtx.scale(newScale, newScale);
	sourceCtx.clearRect(
		0,
		0,
		sourceCtx.canvas.width / newScale,
		sourceCtx.canvas.height / newScale,
	);
	destinationCtx.clearRect(
		0,
		0,
		destinationCtx.canvas.width * newScale,
		destinationCtx.canvas.height * newScale,
	);
	if (img) {
		sourceCtx.drawImage(img, 0, 0, img.width, img.height);
		destinationCtx.drawImage(img, 0, 0, img.width, img.height);
	}
}
