import { createSignal } from 'solid-js';
import { ActionsMenu } from '~/components/actions-menu';
import type { SelectImage } from '~/lib/db/schema';
import type { CanvasLayout } from '~/lib/types';
import { cn } from '~/lib/utils';

export function Canvases(props: { img: SelectImage }) {
  const [canvasLayout, setCanvasLayout] = createSignal<CanvasLayout>('both');
  return (
    <>
      <div class="rounded-sm px-2 py-1 bg-white absolute top-0 left-0 flex gap-x-4 items-center">
        <button
          type="button"
          title="result"
          onClick={() => setCanvasLayout('result')}
          class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
        >
          result
        </button>
        <button
          type="button"
          title="both"
          onClick={() => setCanvasLayout('both')}
          class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
        >
          both
        </button>
      </div>
      <ActionsMenu
        source={props.img.source}
        mask={props.img.mask}
        result={props.img.result}
        canvasLayout={canvasLayout}
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
