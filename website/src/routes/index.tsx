import { useCanvas } from '~/lib/utils';
import { ActionsMenu } from '../components/actions-menu';
export default function Home() {
  const { onFileChange, setCurrentMode } = useCanvas();
  return (
    <>
      <main class="flex">
        <ActionsMenu
          onFileChange={onFileChange}
          setCurrentMode={setCurrentMode}
        />
        <canvas class="w-[49.95%] h-screen svg-bg" id="source" />
        <div class="h-screen w-[0.1%] bg-zinc-400" />
        <canvas class="w-[49.95%] h-screen svg-bg" id="destination" />
      </main>
    </>
  );
}
