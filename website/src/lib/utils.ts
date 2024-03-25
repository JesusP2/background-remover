import { onMount } from "solid-js";

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

export function useCanvas() {
	const matrix = [1, 0, 0, 1, 0, 0];
	let m = matrix;
	let scale = 1;
	const pos = { x: 0, y: 0 };
	let dirty = true;

	const view = {
		applyTo() {
			if (dirty) {
				this.update();
			}
			const { sourceCtx, destinationCtx } = getCanvas();
			sourceCtx.clearRect(
				0,
				0,
				sourceCtx.canvas.width,
				sourceCtx.canvas.height,
			);
			sourceCtx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
			sourceCtx.drawImage(sourceCtx.canvas, 0, 0);
			destinationCtx.clearRect(
				0,
				0,
				destinationCtx.canvas.width,
				destinationCtx.canvas.height,
			);
			destinationCtx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
			destinationCtx.drawImage(destinationCtx.canvas, 0, 0);

			const zoomMe = document.querySelector("#zoomMe") as HTMLImageElement;
			zoomMe.style.transform = `matrix(${m[0]},${m[1]},${m[2]},${m[3]},${m[4]},${m[5]})`;
		},
		update() {
			dirty = false;
			m[3] = m[0] = scale;
			m[2] = m[1] = 0;
			m[4] = pos.x;
			m[5] = pos.y;
		},
		pan(amount: any) {
			if (dirty) {
				this.update();
			}
			pos.x += amount.x;
			pos.y += amount.y;
			dirty = true;
		},
		scaleAt(at: any, amount: any) {
			// at in screen coords
			if (dirty) {
				this.update();
			}
			scale *= amount;
			pos.x = at.x - (at.x - pos.x) * amount;
			pos.y = at.y - (at.y - pos.y) * amount;
			dirty = true;
		},
	};

	const mouse = { x: 0, y: 0, oldX: 0, oldY: 0, button: false };
	function mouseEvent(event: any) {
		if (event.type === "mousedown") {
			mouse.button = true;
		}
		if (event.type === "mouseup" || event.type === "mouseout") {
			mouse.button = false;
		}
		mouse.oldX = mouse.x;
		mouse.oldY = mouse.y;
		mouse.x = event.pageX;
		mouse.y = event.pageY;
		if (mouse.button) {
			view.pan({ x: mouse.x - mouse.oldX, y: mouse.y - mouse.oldY });
			view.applyTo();
		}
		event.preventDefault();
	}
	function mouseWheelEvent(event: any) {
		const zoomMe = document.querySelector("#zoomMe") as HTMLImageElement;
    console.log(zoomMe.width, zoomMe.height)
		const x = event.pageX - zoomMe.width / 2;
		const y = event.pageY - zoomMe.height / 2;
		if (event.deltaY < 0) {
			view.scaleAt({ x, y }, 1.1);
			view.applyTo();
		} else {
			view.scaleAt({ x, y }, 1 / 1.1);
			view.applyTo();
		}
		event.preventDefault();
	}
	onMount(() => {
  //   const { sourceCtx, destinationCtx } = getCanvas();
  //   sourceCtx.canvas.addEventListener("mousemove", mouseEvent, { passive: false });
  //   sourceCtx.canvas.addEventListener("mousedown", mouseEvent, { passive: false });
  //   sourceCtx.canvas.addEventListener("mouseup", mouseEvent, { passive: false });
  //   sourceCtx.canvas.addEventListener("mouseout", mouseEvent, { passive: false });
		// sourceCtx.canvas.addEventListener("wheel", mouseWheelEvent, { passive: false });
  //   destinationCtx.canvas.addEventListener("mousemove", mouseEvent, { passive: false });
  //   destinationCtx.canvas.addEventListener("mousedown", mouseEvent, { passive: false });
  //   destinationCtx.canvas.addEventListener("mouseup", mouseEvent, { passive: false });
  //   destinationCtx.canvas.addEventListener("mouseout", mouseEvent, { passive: false });
		// destinationCtx.canvas.addEventListener("wheel", mouseWheelEvent, { passive: false });

		document.addEventListener("mousemove", mouseEvent, { passive: false });
		document.addEventListener("mousedown", mouseEvent, { passive: false });
		document.addEventListener("mouseup", mouseEvent, { passive: false });
		document.addEventListener("mouseout", mouseEvent, { passive: false });
		document.addEventListener("wheel", mouseWheelEvent, { passive: false });
	});
}
