import { createEffect, createSignal, onMount } from "solid-js";
import { ActionsMenu } from "../components/actions-menu";
import { useCanvas } from "~/lib/utils";
// import {
// 	getCanvas,
// 	getMousePos,
// 	reDrawCanvas,
// 	updateCanvasScale,
// } from "~/lib/utils";
export default function Home() {
	useCanvas();
	return (
		<>
			<main class="flex">
				<canvas class="w-[49.95%] h-screen svg-bg" id="source"></canvas>
				<div class="h-screen w-[0.1%] bg-zinc-400" />
				<canvas class="w-[49.95%] h-screen svg-bg" id="destination"></canvas>
			</main>
			<img
				id="zoomMe"
				class="zoomables"
				src="https://i.stack.imgur.com/C7qq2.png?s=328&g=1"
			/>
		</>
	);
}
