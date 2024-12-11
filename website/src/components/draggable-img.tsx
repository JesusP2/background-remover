import type { Accessor, Setter } from 'solid-js';
import { useDraggable } from '~/hooks/use-dragabble';
import { cn } from '~/lib/utils';

type ImgProps = {
  class?: string;
  src: string;
  alt: string;
};
export function DraggableImg(props: {
  img1: ImgProps;
  img2: ImgProps;
  position: Accessor<{ x: number; y: number }>;
  setPosition: Setter<{ x: number; y: number }>;
}) {
  const { handleMouseDown } = useDraggable({
    position: props.position,
    setPosition: props.setPosition,
  });
  return (
    <div
      class="absolute"
      onMouseDown={handleMouseDown}
      style={{
        top: `${props.position().y}px`,
        left: `${props.position().x}px`,
      }}
    >
      <div
        class={cn(
          'w-56 rounded-md border-[4px] border-black',
          props.img1.class,
        )}
      >
        <img src={props.img1.src} alt={props.img1.alt} />
      </div>
      <div
        class={cn(
          'w-28 rounded-md bg-black p-1 absolute -bottom-8 -left-8',
          props.img2.class,
        )}
      >
        <img src={props.img2.src} alt={props.img2.alt} />
      </div>
    </div>
  );
}
