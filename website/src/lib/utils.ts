import { createSignal, onMount } from "solid-js";

function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
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

type ActionType = "move" | "draw-green" | "draw-red" | "erase";
type Action = {
	type: ActionType;
	x: number;
	y: number;
	oldX: number;
	oldY: number;
	pos: { x: number; y: number };
	scale: number;
};

const colors = {
	"draw-green": "green",
	"draw-red": "red",
} as Record<ActionType, string>;
export function useCanvas() {
	const [img, setImg] = createSignal<HTMLImageElement | null>(null);
	const [currentMode, setCurrentMode] = createSignal<ActionType>("move");
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
	const actions: Action[] = [];
	const redoActions: Action[] = [];

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
		destinationCtx.clearRect(0, 0, 10000, 10000);
		destinationCtx.setTransform(
			matrix[0],
			matrix[1],
			matrix[2],
			matrix[3],
			matrix[4],
			matrix[5],
		);
		destinationCtx.drawImage(currentImg, 0, 0);
		redrawActions();
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

	function mousedown(event: MouseEvent) {
		event.preventDefault();
		mouse.button = event.button;
	}

	function mouseup(event: MouseEvent) {
		event.preventDefault();
		mouse.button = null;
	}

	function mousemove(event: MouseEvent) {
		event.preventDefault();
		const { sourceCtx } = getCanvas();
		mouse.oldX = mouse.x;
		mouse.oldY = mouse.y;
		mouse.x = event.pageX - sourceCtx.canvas.offsetLeft;
		mouse.y = event.pageY - sourceCtx.canvas.offsetTop;
		if (mouse.button === null) return;
		else if (mouse.button === 1) {
			pan({ x: mouse.x - mouse.oldX, y: mouse.y - mouse.oldY });
			drawInCanvas();
		} else if (currentMode() === "move") {
			pan({ x: mouse.x - mouse.oldX, y: mouse.y - mouse.oldY });
			drawInCanvas();
		} else if (currentMode() === "draw-green") {
			drawStroke();
			return;
		} else if (currentMode() === "draw-red") {
			drawStroke();
			return;
		} else if (currentMode() === "erase") {
			return;
		}
	}

	function redrawActions() {
		const { sourceCtx } = getCanvas();
		actions.forEach((action) => {
			if (action.type === "draw-green" || action.type === "draw-red") {
				const { oldX, oldY, pos, scale } = action;
				let width = 10 / scale;
				if (scale > 70) {
					width = 1;
				}
				sourceCtx.fillStyle = colors[currentMode()];
				sourceCtx.fillRect(
					oldX / scale - pos.x / scale - width / 2,
					oldY / scale - pos.y / scale - width / 2,
					width,
					width,
				);
			}
		});
	}

	function drawStroke() {
		const { sourceCtx } = getCanvas();
		let width = 10 / scale;
		if (scale > 70) {
			width = 1;
		}
		sourceCtx.fillStyle = colors[currentMode()];
		sourceCtx.fillRect(
			mouse.oldX / scale - pos.x / scale - width / 2,
			mouse.oldY / scale - pos.y / scale - width / 2,
			width,
			width,
		);
		actions.push({
			type: currentMode(),
			x: mouse.x,
			y: mouse.y,
			oldX: mouse.oldX,
			oldY: mouse.oldY,
			pos: { x: pos.x, y: pos.y },
			scale,
		});
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

	onMount(() => {
		const { sourceCtx, destinationCtx } = getCanvas();
		sourceCtx.canvas.width = innerWidth / 2;
		sourceCtx.canvas.height = innerHeight;
		destinationCtx.canvas.width = innerWidth / 2;
		destinationCtx.canvas.height = innerHeight;
		setupListeners(sourceCtx.canvas, "source");
		setupListeners(destinationCtx.canvas, "destination");
	});

	return { img, setImg, drawInCanvas, scaleAt, onFileChange, setCurrentMode };
}
