import { createSignal } from 'solid-js';
import { ActionsMenu } from '~/components/actions-menu';
import type { SelectImage } from '~/lib/db/schema';
import type { CanvasLayout } from '~/lib/types';
import { cn } from '~/lib/utils';

export function Canvases(props: { img: SelectImage }) {
  const [canvasLayout, setCanvasLayout] = createSignal<CanvasLayout>('both');
  return (
    <>
      <ActionsMenu
        source={props.img.source}
        mask={props.img.mask}
        result={props.img.result}
        canvasLayout={canvasLayout}
        setCanvasLayout={setCanvasLayout}
        name={props.img.name}
      />
      <canvas
        hidden={canvasLayout() === 'result'}
        class={cn('h-screen svg-bg')}
        style={{
          width: canvasLayout() === 'both' ? '49.95%' : '99.9%',
        }}
        id="source"
      />
      <div class="h-screen w-[0.1%] bg-zinc-400" />
      <canvas
        hidden={canvasLayout() === 'mask'}
        style={{
          width: canvasLayout() === 'both' ? '49.95%' : '99.9%',
        }}
        class={cn('h-screen svg-bg')}
        id="destination"
      />
    </>
  );
}
