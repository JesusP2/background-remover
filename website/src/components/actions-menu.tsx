import clsx from 'clsx';
import {
  AiOutlineRedo,
  AiOutlineUndo,
  AiOutlineZoomIn,
  AiOutlineZoomOut,
} from 'solid-icons/ai';
import { AiOutlineLine } from 'solid-icons/ai';
import { AiOutlineCloudDownload } from 'solid-icons/ai';
import { BiRegularEraser } from 'solid-icons/bi';
import { BsArrowsMove } from 'solid-icons/bs';
import { IoCutOutline } from 'solid-icons/io';
import { RiSystemAddFill } from 'solid-icons/ri';
import { TbFocusCentered } from 'solid-icons/tb';
import { VsEdit } from 'solid-icons/vs';
import { useGrabcutCanvas } from '~/hooks/use-grabcut-canvas';
import { drawStroke } from '~/hooks/use-grabcut-canvas/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function ActionsMenu(props: {
  source: string;
  mask: string | null;
  result: string;
}) {
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
  } = useGrabcutCanvas({
    sourceUrl: props.source,
    maskUrl: props.mask,
    resultUrl: props.result,
    drawStroke: drawStroke,
    eventTrigger: 'mousemove',
  });
  return (
    <div class="rounded-sm px-2 py-1 bg-white absolute bottom-0 left-0 flex gap-x-4 items-center">
      <button
        onClick={() => applyMaskToImage()}
        type="button"
        class="p-2 hover:bg-gray-100"
      >
        <IoCutOutline size={20} />
      </button>
      <button
        type="button"
        title="undo"
        disabled={!actions().length}
        onClick={undo}
        class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
      >
        <AiOutlineUndo size={20} />
      </button>
      <button
        type="button"
        title="redo"
        disabled={!redoActions().length}
        onClick={redo}
        class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
      >
        <AiOutlineRedo size={20} />
      </button>
      <button
        type="button"
        class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
        title="zoom in"
        onMouseDown={() => zoomIn({ x: 417, y: 494 })}
        onMouseUp={() => {
          isZooming.value = false;
        }}
      >
        <AiOutlineZoomIn size={20} />
      </button>
      <button
        type="button"
        class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
        title="zoom out"
        onMouseDown={() => zoomOut({ x: 417, y: 494 })}
        onMouseUp={() => {
          isZooming.value = false;
        }}
      >
        <AiOutlineZoomOut size={20} />
      </button>
      <button
        type="button"
        onClick={resetToOriginal}
        title="Fit and Center"
        class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
      >
        <TbFocusCentered size={20} />
      </button>
      <button
        type="button"
        onClick={() => setCurrentMode('move')}
        class={clsx(
          'hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center',
          currentMode() === 'move' && 'bg-gray-100',
        )}
      >
        <BsArrowsMove size={15} />
      </button>
      <button
        type="button"
        onClick={() => setCurrentMode('draw-green')}
        class={clsx(
          'hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center',
          currentMode() === 'draw-green' && 'bg-gray-100',
        )}
      >
        <RiSystemAddFill size={20} />
      </button>
      <button
        type="button"
        onClick={() => setCurrentMode('draw-red')}
        class={clsx(
          'hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center',
          currentMode() === 'draw-red' && 'bg-gray-100',
        )}
      >
        <AiOutlineLine size={20} />
      </button>
      <Tooltip>
        <TooltipTrigger>
          hello
        </TooltipTrigger>
        <TooltipContent>Draw yellow</TooltipContent>
      </Tooltip>
      <button
        onClick={() => setCurrentMode('erase')}
        class={clsx(
          'hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center',
          currentMode() === 'erase' && 'bg-gray-100',
        )}
      >
        <BiRegularEraser size={20} />
      </button>
      <button
        onClick={() => saveResult(name)}
        class={clsx(
          'hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center',
        )}
      >
        <AiOutlineCloudDownload size={20} />
      </button>
    </div>
  );
}
