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
    setScale(2);
		const POSITION = 10; // mouse position
		sourceCtx.fillRect(POSITION, POSITION, 100, 100);
		sourceCtx.fillStyle = "red";
    updateScale(SCALE());
		sourceCtx.fillRect(POSITION / SCALE(), POSITION / SCALE(), 100, 100);
    setScale(15);
    updateScale(SCALE());
		sourceCtx.fillStyle = "blue";
		sourceCtx.fillRect(POSITION / SCALE(), POSITION / SCALE(), 48, 2);
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
		console.log(e.clientX / SCALE(), e.clientY / SCALE());
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
