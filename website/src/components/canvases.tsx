import { createSignal, Match, Switch } from 'solid-js';
import { GrabcutActionsMenu } from '~/components/grabcut-actions-menu';
import { useGrabcutCanvas } from '~/hooks/use-grabcut-canvas';
import type { SelectImage } from '~/lib/db/schema';
import type { CanvasLayout } from '~/lib/types';
import { drawStroke } from '~/hooks/use-grabcut-canvas/utils';
import { Dialog, DialogContentWithoutClose } from './ui/dialog';
import { cn } from '~/lib/utils';
import { SAMActionsMenu } from './sam-actions-menu';

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
    canvasStep
  } = useGrabcutCanvas({
    sourceUrl: props.img.source,
    strokesUrl: props.img.mask,
    resultUrl: props.img.result,
    drawStroke: drawStroke,
    canvasLayout: canvasLayout,
  });
  return (
    <>
      <Dialog open={isDownloadingModelOrEmbeddingImage()}>
        <DialogContentWithoutClose class="sm:max-w-[425px]">
          <div class="grid gap-4 py-4">Loading...</div>
        </DialogContentWithoutClose>
      </Dialog>
      <Switch>
        <Match when={canvasStep() === 'SAM'}>
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
            isDownloadingModelOrEmbeddingImage={
              isDownloadingModelOrEmbeddingImage
            }
            canvasLayout={canvasLayout}
            setCanvasLayout={setCanvasLayout}
            name={props.img.name}
          />
        </Match>
        <Match when={canvasStep() === 'GRABCUT'}>
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
            isDownloadingModelOrEmbeddingImage={
              isDownloadingModelOrEmbeddingImage
            }
            canvasLayout={canvasLayout}
            setCanvasLayout={setCanvasLayout}
            name={props.img.name}
          />
        </Match>
      </Switch>
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
