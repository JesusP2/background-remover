import { AiOutlineLoading } from 'solid-icons/ai';
import { For, Match, Show, Switch, createSignal, onMount } from 'solid-js';
import { GrabcutActionsMenu } from '~/components/grabcut-actions-menu';
import { useGrabcutCanvas } from '~/hooks/use-grabcut-canvas';
import { drawStroke } from '~/hooks/use-grabcut-canvas/utils';
import type { SelectImage } from '~/lib/db/schema';
import type { CanvasLayout } from '~/lib/types';
import { cn } from '~/lib/utils';
import { Draggable } from './draggable';
import { SAMActionsMenu } from './sam-actions-menu';
import { Dialog, DialogContentWithoutClose } from './ui/dialog';
import { BiRegularBrain } from 'solid-icons/bi';

function Particles() {
  const particleCount = 20;
  const items = Array(particleCount).map((_, i) => i);
  return (
    <For each={items}>
      {(item) => {
        const randomX1 = Math.random() * 400 - 200;
        const randomY1 = Math.random() * 400 - 200;
        const randomX2 = Math.random() * 400 - 200;
        const randomY2 = Math.random() * 400 - 200;
        return (
          <div
            class="particle absolute w-1 h-1 bg-primary rounded-full"
            style={{
              opacity: 0,
              '--random-x1': randomX1,
              '--random-y1': randomY1,
              '--random-x2': randomX2,
              '--random-y2': randomY2,
              'animation-duration': `${Math.random() * 2 + 1}s`,
              'animation-delay': `${Math.random() * 2}s`,
            }}
          />
        );
      }}
    </For>
  );
}

function ExtractingEmbeddings() {
  return (
    <div class="font-semibold relative justify-center flex flex-col items-center gap-y-4">
      <BiRegularBrain class="w-16 h-16 text-primary shaking-svg" />
      <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full spin-animation absolute top-3 left-[44%]" />
      <h2 class="text-2xl font-bold text-center">Extracting Embeddings</h2>
      <p class="text-center text-muted-foreground font-medium">
        Our AI model is currently processing your data to extract embeddings.
        This may take a few moments.
      </p>
      <Particles />
    </div>
  );
}

function LoadingModel() {
  return (
    <div class="font-semibold relative justify-center flex flex-col items-center gap-y-4">
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="download-icon"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <g class="arrow-group">
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </g>
      </svg>
      <h2 class="text-2xl font-bold text-center">Downloading AI Model</h2>
      <p class="text-center text-muted-foreground font-medium">
        Please wait while we download the AI model. This may take a few moments
        depending on your internet speed.
      </p>
      <Particles />
    </div>
  );
}

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

  onMount(() => {
    if (window.innerWidth < 600) {
      setCanvasLayout('mask');
    }
  });

  return (
    <>
      <Dialog open={isDownloadingModelOrEmbeddingImage() !== null}>
        <DialogContentWithoutClose class="max-w-[375px] overflow-hidden rounded-md">
          <Show
            when={
              isDownloadingModelOrEmbeddingImage() ===
              'Extracting embeddings...'
            }
          >
            <ExtractingEmbeddings />
          </Show>
          <Show
            when={isDownloadingModelOrEmbeddingImage() === 'Loading model...'}
          >
            <LoadingModel />
          </Show>
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
        <div
          onmouseover={() => setCanvasLayout('result')}
          onmouseup={() => setCanvasLayout('mask')}
          onmouseout={() => setCanvasLayout('mask')}
          onmouseleave={() => setCanvasLayout('mask')}
          ontouchstart={() => setCanvasLayout('result')}
          ontouchend={() => setCanvasLayout('mask')}
          ontouchcancel={() => setCanvasLayout('mask')}
          class={cn(
            'absolute top-14 right-2 text-white bg-blue-500 py-1 px-4 rounded-sm w-20 duration-100 ease-in-out text-center',
            canvasLayout() === 'mask' ? '' : 'bg-blue-600 w-28',
          )}
        >
          {canvasLayout() === 'mask' ? 'Source' : 'Result'}
        </div>
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
