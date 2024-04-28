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
    saveResult,
  } = useCanvas({
    sourceUrl: source,
    maskUrl: mask,
    resultUrl: result,
    baseMaskUrl: base_mask,
  });
  return (
    <>
      <ActionsMenu
        undo={undo}
        redo={redo}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        actions={actions}
        name={props.img.name}
        isZooming={isZooming}
        saveResult={saveResult}
        currentMode={currentMode}
        redoActions={redoActions}
        setCurrentMode={setCurrentMode}
        resetToOriginal={resetToOriginal}
        applyMaskToImage={applyMaskToImage}
      />
      <canvas class="w-[49.95%] h-screen svg-bg" id="source" />
      <div class="h-screen w-[0.1%] bg-zinc-400" />
      <canvas class="w-[49.95%] h-screen svg-bg" id="destination" />
    </>
  );
}
