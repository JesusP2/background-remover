import { createEffect, createSignal, onMount } from "solid-js";
import { ActionsMenu } from "../components/actions-menu";
import {
	getCanvas,
	getMousePos,
	reDrawCanvas,
	updateCanvasScale,
} from "~/lib/utils";
export default function Home() {
	const [scale, setScale] = createSignal(1);
	const [baseScale, setBaseScale] = createSignal(1);
	const [img, setImg] = createSignal<HTMLImageElement | null>(null);
	const [translatePos, setTranslatePos] = createSignal({ x: 0, y: 0 });

	onMount(() => {
		const { sourceCtx, destinationCtx } = getCanvas();
		sourceCtx.canvas.width = innerWidth / 2;
		sourceCtx.canvas.height = innerHeight;
		destinationCtx.canvas.width = innerWidth / 2;
		destinationCtx.canvas.height = innerHeight;
		sourceCtx.imageSmoothingEnabled = false;
		destinationCtx.imageSmoothingEnabled = false;
	});

	return (
		<main class="flex">
			<ActionsMenu
				baseScale={baseScale}
				setBaseScale={setBaseScale}
				scale={scale}
				setScale={setScale}
				setImg={setImg}
			/>
			<canvas
				onWheel={(e) => {
					const { sourceCtx } = getCanvas();
					if (e.deltaY > 0) {
						const newScale = scale() - 0.1;
						setScale(newScale);
						updateCanvasScale(scale() * baseScale());
						reDrawCanvas(img(), scale() * baseScale(), { x: 0, y: 671.72 / scale() });
					} else {
						const newScale = scale() + 0.1;
						setScale(newScale);
						updateCanvasScale(scale() * baseScale());
						reDrawCanvas(img(), scale(), { x: 0, y: 671.72 / scale() });
					}
				}}
				onMouseMove={(e) => getMousePos(e, scale())}
				class="w-[49.95%] h-screen border svg-bg"
				id="source"
			></canvas>
			<div class="h-screen w-[0.1%] bg-zinc-400" />
			<canvas class="w-[49.95%] h-screen svg-bg" id="destination"></canvas>
		</main>
	);
}
