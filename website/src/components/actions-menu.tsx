import { Accessor, Setter } from "solid-js";
import { drawImage, getCanvas, updateCanvasScale } from "~/lib/utils";

export function ActionsMenu({
	scale,
	setScale,
	setImg,
}: {
	scale: Accessor<number>;
	setScale: Setter<number>;
	setImg: Setter<HTMLImageElement | null>;
}) {
	async function onFileChange(file?: File | Blob) {
		const { sourceCtx, destinationCtx } = getCanvas();
		if (!file) return;
		const img = await fileToImage(file);
		setImg(img);
		const newScale = sourceCtx.canvas.width / img.width;
		const paddingTop =
			Math.abs(sourceCtx.canvas.height * newScale - img.height) / 2;
    setScale(newScale);
    updateCanvasScale(newScale);
		sourceCtx.drawImage(img, 0, paddingTop, img.width, img.height);
		destinationCtx.drawImage(img, 0, paddingTop, img.width, img.height);
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
