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
    const baseScale = sourceCanvas.width / L;
    updateScale(baseScale);
    sourceCtx.fillStyle = "red";
    let paddingTop = (sourceCanvas.height / baseScale - L) / 2
    // const paddingTop = 10;
    sourceCtx.fillRect(0, paddingTop, L, L);
    setScale(5);
    updateScale(SCALE() * baseScale);
    // paddingTop = (sourceCanvas.height / SCALE() - L) / 2
    sourceCtx.fillStyle = "blue";
    sourceCtx.fillRect(0, paddingTop / SCALE(), L, L);
    setScale(0.3);
    updateScale(SCALE() * baseScale);
    // paddingTop = (sourceCanvas.height / SCALE() - L) / 2
    sourceCtx.fillStyle = "green";
    sourceCtx.fillRect(0, paddingTop / SCALE(), L, L);
		// const POSITION = 10; // mouse position
		// sourceCtx.fillStyle = "red";
		// updateScale(SCALE());
		// sourceCtx.fillRect(POSITION / SCALE(), POSITION / SCALE(), 100, 100);
		// setScale(15);
		// updateScale(SCALE());
		// sourceCtx.fillStyle = "blue";
		// sourceCtx.fillRect(POSITION / SCALE(), POSITION / SCALE(), 2, 2);
		// setScale(4);
		// updateScale(SCALE());
		// console.log("translation:", POSITION - POSITION / SCALE());
		// sourceCtx.fillStyle = "green";
		// sourceCtx.fillRect(POSITION / SCALE(), POSITION / SCALE(), 2, 2);
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
