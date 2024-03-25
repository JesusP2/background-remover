import { createSignal, onMount } from "solid-js";

function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			const img = new Image();
      if (typeof reader.result !== "string") return;
			img.src = reader.result
			img.onload = () => {
				resolve(img);
			};
		};
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

export function useCanvas() {
	const [img, setImg] = createSignal<HTMLImageElement | null>(null);
	const matrix = [1, 0, 0, 1, 0, 0];
	let scale = 1;
	const pos = { x: 0, y: 0 };
	let dirty = true;
	const mouse = { x: 0, y: 0, oldX: 0, oldY: 0, button: false };

	function drawInCanvas() {
		if (dirty) {
			update();
		}
		const { sourceCtx, destinationCtx } = getCanvas();
    const currentImg = img();
    if (!currentImg) return;
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
		sourceCtx.drawImage(currentImg, 0, 0);

		destinationCtx.translate(0, 0);
		destinationCtx.clearRect(
			0,
			0,
      10000,
      10000,
		);
		destinationCtx.setTransform(
			matrix[0],
			matrix[1],
			matrix[2],
			matrix[3],
			matrix[4],
			matrix[5],
		);
		destinationCtx.drawImage(currentImg, 0, 0);
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

	function scaleAt(at: { x: number; y: number }, amount: number) {
		if (dirty) {
			update();
		}
		scale *= amount;
		pos.x = at.x - (at.x - pos.x) * amount;
		pos.y = at.y - (at.y - pos.y) * amount;
		dirty = true;
	}

	function mouseEvent(event: MouseEvent) {
		const { sourceCtx } = getCanvas();
		if (event.type === "mousedown") {
			mouse.button = true;
		}
		if (event.type === "mouseup" || event.type === "mouseout") {
			mouse.button = false;
		}
		mouse.oldX = mouse.x;
		mouse.oldY = mouse.y;
		mouse.x = event.pageX - sourceCtx.canvas.offsetLeft;
		mouse.y = event.pageY - sourceCtx.canvas.offsetTop;
		if (mouse.button) {
			pan({ x: mouse.x - mouse.oldX, y: mouse.y - mouse.oldY });
			drawInCanvas();
		}
		event.preventDefault();
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
			drawInCanvas();
		} else {
			scaleAt({ x, y }, 1 / 1.1);
			drawInCanvas();
		}
		event.preventDefault();
	}

	async function onFileChange(file?: File | Blob) {
		const { sourceCtx, destinationCtx } = getCanvas();
		if (!file) return;
		const img = await fileToImage(file);
		setImg(img);
		const scale = sourceCtx.canvas.width / img.width;
		const startingY = (sourceCtx.canvas.height / scale - img.height) / 2;
		pos.y = startingY;
		scaleAt({ x: 0, y: 0 }, scale);
		drawInCanvas();
		sourceCtx.imageSmoothingEnabled = false;
		destinationCtx.imageSmoothingEnabled = false;
	}

	function setupListeners(
		canvas: HTMLCanvasElement,
		type: "source" | "destination",
	) {
		canvas.addEventListener("mousemove", mouseEvent, {
			passive: false,
		});
		canvas.addEventListener("mousedown", mouseEvent, {
			passive: false,
		});
		canvas.addEventListener("mouseup", mouseEvent, {
			passive: false,
		});
		canvas.addEventListener("mouseout", mouseEvent, {
			passive: false,
		});
		canvas.addEventListener("wheel", (e) => mouseWheelEvent(e, type), {
			passive: false,
		});
	}

	onMount(() => {
		const { sourceCtx, destinationCtx } = getCanvas();
		sourceCtx.canvas.width = innerWidth / 2;
		sourceCtx.canvas.height = innerHeight;
		destinationCtx.canvas.width = innerWidth / 2;
		destinationCtx.canvas.height = innerHeight;
		setupListeners(sourceCtx.canvas, "source");
		setupListeners(destinationCtx.canvas, "destination");
	});

	return { img, setImg, drawInCanvas, scaleAt, onFileChange };
}
