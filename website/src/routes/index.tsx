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
				scale={scale}
				setScale={setScale}
				setImg={setImg}
				translatePos={translatePos}
				setTranslatePos={setTranslatePos}
			/>
			<canvas
				onWheel={(e) => {
					if (e.deltaY > 0) {
						const newScale = scale() - 0.17;
						setScale(newScale);
						updateCanvasScale(scale());
						reDrawCanvas(img(), scale(), {
							x: translatePos().x + e.clientX / scale() - e.clientX,
							y: translatePos().y + e.clientY / scale() - e.clientY,
						});
					} else {
						const newScale = scale() + 0.17;
            console.table({
              scale: scale(),
              newScale,
              y: e.clientY,
            })
						setScale(newScale);
						updateCanvasScale(scale());
						// setTranslatePos({
						// 	x: 0,
						// 	y: translatePos().y + e.clientY / scale() - e.clientY,
						// });
						reDrawCanvas(img(), scale(), {
							x: translatePos().x + e.clientX / scale() - e.clientX,
							y: translatePos().y + e.clientY / scale() - e.clientY,
            });
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
