import { AiOutlineLoading } from 'solid-icons/ai';
import { Match, Show, Switch, createSignal } from 'solid-js';
import { GrabcutActionsMenu } from '~/components/grabcut-actions-menu';
import { useGrabcutCanvas } from '~/hooks/use-grabcut-canvas';
import { drawStroke } from '~/hooks/use-grabcut-canvas/utils';
import type { SelectImage } from '~/lib/db/schema';
import type { CanvasLayout } from '~/lib/types';
import { cn } from '~/lib/utils';
import { Draggable } from './draggable';
import { SAMActionsMenu } from './sam-actions-menu';
import { Dialog, DialogContentWithoutClose } from './ui/dialog';

export function Canvases(props: { img: SelectImage }) {
  const [canvasLayout, setCanvasLayout] = createSignal<CanvasLayout>('both');
  const {
    setCurrentMode,
    applyMaskToImage,
    undo,
    redo,
    actions,
    redoActions,
    zoomIn,
    zoomOut,
    isZooming,
    resetToOriginal,
    currentMode,
    saveResult,
    isDownloadingModelOrEmbeddingImage,
    canvasMethod,
    changeToCanvasMethod,
    isRemovingBackground,
  } = useGrabcutCanvas({
    sourceUrl: props.img.source,
    strokesUrl: props.img.mask,
    resultUrl: props.img.result,
    samMaskUrl: props.img.samMask,
    drawStroke: drawStroke,
    canvasLayout: canvasLayout,
  });
  return (
    <>
      <Dialog open={isDownloadingModelOrEmbeddingImage() !== null}>
        <DialogContentWithoutClose class="sm:max-w-[425px]">
          <div class="font-semibold">
            {isDownloadingModelOrEmbeddingImage()}
          </div>
        </DialogContentWithoutClose>
      </Dialog>
      <Draggable>
        <Switch>
          <Match when={canvasMethod() === 'SAM'}>
            <SAMActionsMenu
              setCurrentMode={setCurrentMode}
              applyMaskToImage={applyMaskToImage}
              undo={undo}
              redo={redo}
              actions={actions}
              redoActions={redoActions}
              zoomIn={zoomIn}
              zoomOut={zoomOut}
              isZooming={isZooming}
              resetToOriginal={resetToOriginal}
              currentMode={currentMode}
              saveResult={saveResult}
              canvasLayout={canvasLayout}
              setCanvasLayout={setCanvasLayout}
              changeToCanvasMethod={changeToCanvasMethod}
              name={props.img.name}
              isRemovingBackground={isRemovingBackground}
            />
          </Match>
          <Match when={canvasMethod() === 'GRABCUT'}>
            <GrabcutActionsMenu
              setCurrentMode={setCurrentMode}
              applyMaskToImage={applyMaskToImage}
              undo={undo}
              redo={redo}
              actions={actions}
              redoActions={redoActions}
              zoomIn={zoomIn}
              zoomOut={zoomOut}
              isZooming={isZooming}
              resetToOriginal={resetToOriginal}
              currentMode={currentMode}
              saveResult={saveResult}
              canvasLayout={canvasLayout}
              setCanvasLayout={setCanvasLayout}
              changeToCanvasMethod={changeToCanvasMethod}
              name={props.img.name}
              isRemovingBackground={isRemovingBackground}
            />
          </Match>
        </Switch>
      </Draggable>
      <Show when={canvasLayout() !== 'both'}>
        <button
          onmouseenter={() =>
            canvasLayout() !== 'both' && setCanvasLayout('result')
          }
          onmouseleave={() =>
            canvasLayout() !== 'both' && setCanvasLayout('mask')
          }
          class="absolute top-14 right-2 text-white bg-blue-500 py-1 px-4 rounded-sm w-20 hover:bg-blue-600 hover:w-28 duration-100 ease-in-out"
        >
          {canvasLayout() === 'mask' ? 'Source' : 'Result'}
        </button>
      </Show>
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
      <Show when={isRemovingBackground()}>
        <div class="absolute h-screen w-[49.95%] left-[50%] bg-white bg-opacity-50 grid place-items-center">
          <AiOutlineLoading class="text-stone-600 animate-spin" size={40} />
        </div>
      </Show>
    </>
  );
}
