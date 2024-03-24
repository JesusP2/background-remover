import { Accessor, Setter } from "solid-js";
import {
	drawImage,
	getCanvas,
	reDrawCanvas,
	updateCanvasScale,
} from "~/lib/utils";

export function ActionsMenu({
	baseScale,
	setBaseScale,
	scale,
	setScale,
	setImg,
}: {
	baseScale: Accessor<number>;
	setBaseScale: Setter<number>;
	scale: Accessor<number>;
	setScale: Setter<number>;
	setImg: Setter<HTMLImageElement | null>;
}) {
	async function onFileChange(file?: File | Blob) {
		const { sourceCtx } = getCanvas();
		if (!file) return;
		const img = await fileToImage(file);
		setImg(img);
    setBaseScale(sourceCtx.canvas.width / img.width);
		updateCanvasScale(baseScale());
		const paddingTop = (sourceCtx.canvas.height / baseScale() - img.height) / 2;
		reDrawCanvas(img, 1, { x: 0, y: paddingTop / scale() });
    // sourceCtx.fillStyle = "blue";
    // sourceCtx.fillRect(0, paddingTop / scale(), 500, 500);
    // setScale(3)
    // updateCanvasScale(scale() * baseScale())
    // sourceCtx.fillStyle = "red";
    // sourceCtx.fillRect(0, paddingTop / scale(), 50, 50);
		// reDrawCanvas(img, 1, { x: 0, y: paddingTop });
	}

	function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				const img = new Image();
				img.src = reader.result as string;
				img.onload = () => {
					resolve(img);
				};
			};
		});
	}

	function zoomIn() {
		setScale((prev) => prev + 1);
	}
	function zoomOut() {
		setScale((prev) => prev - 1);
	}
	return (
		<div class="rounded-sm px-2 py-1 bg-white absolute bottom-2 left-2 flex gap-x-4 items-center">
			<label
				aria-label="button to open file dialog"
				for="file"
				class="rounded-sm px-2 py-1 hover:bg-zinc-100 grid place-items-center"
			>
				Open
			</label>
			<input
				id="file"
				type="file"
				hidden
				onChange={(e) => {
					const file = e.target.files?.[0];
					onFileChange(file);
				}}
			/>
			<button class="p-2 hover:bg-gray-100">Save</button>
			<button class="rounded-full h-4 w-4 bg-emerald-500"></button>
			<button class="rounded-full h-4 w-4 bg-red-500"></button>
			<button onClick={zoomIn}>+</button>
			<button onClick={zoomOut}>x</button>
			<button>delete</button>
		</div>
	);
}
