import { createSignal, onMount } from "solid-js";

export default function Playground() {
	const [SCALE, setScale] = createSignal(1);
	onMount(() => {
		const sourceCanvas = document.querySelector<HTMLCanvasElement>("#source");
		const sourceCtx = sourceCanvas?.getContext("2d");
		if (!sourceCanvas || !sourceCtx) {
			return;
		}
		sourceCanvas.width = innerWidth / 2;
		sourceCanvas.height = innerHeight;
		const L = 50;
		sourceCtx.fillStyle = "red";

		const baseScale = sourceCtx.canvas.width / L;
		const fakePaddingTop = (sourceCtx.canvas.height / baseScale - L) / 2;
		setScale(baseScale);
		updateScale(baseScale);
		const paddingTop = SCALE() * fakePaddingTop;
		sourceCtx.fillRect(
			0,
			paddingTop + paddingTop / SCALE() - paddingTop,
			L,
			L,
		);
		setScale(13);
		updateScale(13);
    console.log(paddingTop)
    console.log(paddingTop + paddingTop / SCALE() - paddingTop)
		sourceCtx.fillStyle = "blue";
		sourceCtx.fillRect(
			0,
			paddingTop + paddingTop / SCALE() - paddingTop,
			L,
			L,
		);
	});

	function updateScale(newScale: number) {
		const sourceCanvas = document.querySelector<HTMLCanvasElement>("#source");
		const sourceCtx = sourceCanvas?.getContext("2d");
		if (!sourceCanvas || !sourceCtx) {
			return;
		}
		sourceCtx.restore();
		sourceCtx.save();
		sourceCtx.scale(newScale, newScale);
	}

	function getMousePos(e: MouseEvent) {
		const sourceCanvas = document.querySelector<HTMLCanvasElement>("#source");
		const sourceCtx = sourceCanvas?.getContext("2d");
		if (!sourceCanvas || !sourceCtx) {
			return;
		}
		console.log(e.clientX / SCALE(), e.clientY);
	}
	return (
		<main class="flex">
			<canvas
				onMouseMove={getMousePos}
				class="w-[49.95%] h-screen border svg-bg"
				id="source"
			></canvas>
		</main>
	);
}
