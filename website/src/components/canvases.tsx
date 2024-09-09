import { ActionsMenu } from '~/components/actions-menu';
import type { SelectImage } from '~/lib/db/schema';

export function Canvases(props: { img: SelectImage }) {
  return (
    <>
      <ActionsMenu
        source={props.img.source}
        mask={props.img.mask}
        result={props.img.result}
      />
      <canvas class="w-[49.95%] h-screen svg-bg" id="source" />
      <div class="h-screen w-[0.1%] bg-zinc-400" />
      <canvas class="w-[49.95%] h-screen svg-bg" id="destination" />
    </>
  );
}
