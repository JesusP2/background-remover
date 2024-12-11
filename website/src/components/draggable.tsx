import { type ComponentProps, createSignal, splitProps } from 'solid-js';
import { useDraggable } from '~/hooks/use-dragabble';
import { cn } from '~/lib/utils';

export function Draggable(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  const [position, setPosition] = createSignal({
    x: 0,
    y: 0,
  });
  const { handleMouseDown } = useDraggable({ position, setPosition });

  return (
    <div
      {...rest}
      onMouseDown={handleMouseDown}
      class={cn('absolute', local.class)}
      style={{
        top: `${position().y}px`,
        left: `${position().x}px`,
      }}
    >
      {local.children}
    </div>
  );
}
