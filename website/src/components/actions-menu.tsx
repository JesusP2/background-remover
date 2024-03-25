export function ActionsMenu({
	onFileChange,
}: {
	onFileChange: (file?: File | Blob) => void;
}) {
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
		</div>
	);
}
