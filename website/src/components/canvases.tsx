import { ActionsMenu } from '~/components/actions-menu';
import { useCanvas } from '~/lib/canvas';
import type { SelectImage } from '~/lib/db/schema';

export function Canvases(props: { img: SelectImage }) {
  const { source, mask, result, base_mask } = props.img;
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
  } = useCanvas({
    sourceUrl: source,
    maskUrl: mask,
    resultUrl: result,
    baseMaskUrl: base_mask,
  });
  return (
    <>
      <ActionsMenu
        applyMaskToImage={applyMaskToImage}
        setCurrentMode={setCurrentMode}
        undo={undo}
        redo={redo}
        actions={actions}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        isZooming={isZooming}
        currentMode={currentMode}
        redoActions={redoActions}
        resetToOriginal={resetToOriginal}
      />
      <canvas class="w-[49.95%] h-screen svg-bg" id="source" />
      <div class="h-screen w-[0.1%] bg-zinc-400" />
      <canvas class="w-[49.95%] h-screen svg-bg" id="destination" />
    </>
  );
}
