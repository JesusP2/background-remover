import { type ComponentProps, createSignal, splitProps } from 'solid-js';
import { cn } from '~/lib/utils';

export function Draggable(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  const [mouse, setMouse] = createSignal({
    dragging: false,
    x: 0,
    y: 0,
    mouseX: 0,
    mouseY: 0,
  });

  return (
    <div
      {...rest}
      onMouseDown={(e) => {
        setMouse(prev => ({
        ...prev,
          dragging: true,
          mouseX: e.clientX,
          mouseY: e.clientY,
        }));
      }}
      onMouseUp={() => {
        setMouse((prev) => ({
          ...prev,
          dragging: false,
        }));
      }}
      onMouseLeave={() => {
        setMouse((prev) => ({
          ...prev,
          dragging: false,
        }));
      }}
      onMouseMove={(e) => {
        if (mouse().dragging) {
          setMouse(prev => ({
            dragging: true,
            y: prev.y + e.clientY - prev.mouseY,
            x: prev.x + e.clientX - prev.mouseX,
            mouseX: e.clientX,
            mouseY: e.clientY,
          }));
        }
      }}
      class={cn('absolute', local.class)}
      style={{
        top: `${mouse().y}px`,
        left: `${mouse().x}px`,
      }}
    >
      {local.children}
    </div>
  );
}
