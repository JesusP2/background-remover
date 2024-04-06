import { useCanvas } from '~/lib/canvas';
import { ActionsMenu } from '../components/actions-menu';

export default function Home() {
  const { onFileChange, setCurrentMode, applyMaskToImage, undo, redo, actions, redoActions } = useCanvas();

  return (
    <>
      <main class="flex">
        <ActionsMenu
          onFileChange={onFileChange}
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
      </main>
    </>
  );
}
