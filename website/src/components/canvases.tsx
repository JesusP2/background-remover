import { ActionsMenu } from '~/components/actions-menu';
import { useCanvas } from '~/lib/canvas';

export function Canvases(props: { img: any }) {
  const { source, mask, result, base_mask } = props.img;
  const { setCurrentMode, applyMaskToImage, undo, redo, actions, redoActions } =
    useCanvas({
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
        redoActions={redoActions}
      />
      <canvas class="w-[49.95%] h-screen svg-bg" id="source" />
      <div class="h-screen w-[0.1%] bg-zinc-400" />
      <canvas class="w-[49.95%] h-screen svg-bg" id="destination" />
    </>
  );
}
