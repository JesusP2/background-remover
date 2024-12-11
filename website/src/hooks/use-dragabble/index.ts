import { type Accessor, type Setter, onMount } from "solid-js";
import type { DOMElement } from "solid-js/jsx-runtime";

export function useDraggable(props: {
  position: Accessor<{ x: number; y: number }>;
  setPosition: Setter<{ x: number; y: number }>;
}) {
  const handleMouseDown = (
    e: MouseEvent & {
      currentTarget: HTMLDivElement;
      target: DOMElement;
    },
  ) => {
    const startX = e.clientX - props.position().x;
    const startY = e.clientY - props.position().y;

    const handleMouseMove = (e: MouseEvent) => {
      props.setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return {
    handleMouseDown,
  };
}
