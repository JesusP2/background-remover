import clsx from 'clsx';
import {
  AiOutlineRedo,
  AiOutlineUndo,
  AiOutlineZoomIn,
  AiOutlineZoomOut,
  AiOutlineLine,
} from 'solid-icons/ai';
import { BiRegularEraser } from 'solid-icons/bi';
import { BsArrowsMove } from 'solid-icons/bs';
import { IoCutOutline } from 'solid-icons/io';
import { RiSystemAddFill } from 'solid-icons/ri';
import { TbFocusCentered } from 'solid-icons/tb';
import { VsEdit } from 'solid-icons/vs';
import type { Accessor } from 'solid-js';
import { useGrabcutCanvas } from '~/hooks/use-grabcut-canvas';
import { drawStroke } from '~/hooks/use-grabcut-canvas/utils';
import type { CanvasLayout } from '~/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function ActionsMenu(props: {
  source: string;
  mask: string | null;
  result: string;
  canvasLayout: Accessor<CanvasLayout>;
  name: string;
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
    canvasLayout: props.canvasLayout,
  });
  return (
    <div class="rounded-sm px-2 py-1 bg-white absolute bottom-0 left-0 flex gap-x-4 items-center">
      <Tooltip>
        <TooltipTrigger>
          <button
            onClick={() => applyMaskToImage()}
            type="button"
            class="p-2 hover:bg-gray-100"
          >
            <IoCutOutline size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Cut</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            disabled={!actions().length}
            onClick={undo}
            class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
          >
            <AiOutlineUndo size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Undo last action</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            disabled={!redoActions().length}
            onClick={redo}
            class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
          >
            <AiOutlineRedo size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Redo previous action</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
            onMouseDown={() =>
              zoomIn({
                x:
                  props.canvasLayout() === 'result'
                    ? window.innerWidth / 2 - 30
                    : window.innerWidth / 4 - 30,
                y: window.innerHeight / 2,
              })
            }
            onMouseUp={() => {
              isZooming.value = false;
            }}
          >
            <AiOutlineZoomIn size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Zoom in</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
            onMouseDown={() => zoomOut({ x: 417, y: 494 })}
            onMouseUp={() => {
              isZooming.value = false;
            }}
          >
            <AiOutlineZoomOut size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Zoom out</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            onClick={resetToOriginal}
            class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
          >
            <TbFocusCentered size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Fit and Center</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
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
        </TooltipTrigger>
        <TooltipContent>Move</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
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
        </TooltipTrigger>
        <TooltipContent>Add foreground</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
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
        </TooltipTrigger>
        <TooltipContent>Remove background</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            onClick={() => setCurrentMode('draw-yellow')}
            class={clsx(
              'hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center',
              currentMode() === 'draw-yellow' && 'bg-gray-100',
            )}
          >
            <VsEdit size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Alpha matte</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button
            onClick={() => setCurrentMode('erase')}
            class={clsx(
              'hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center',
              currentMode() === 'erase' && 'bg-gray-100',
            )}
          >
            <BiRegularEraser size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Erase</TooltipContent>
      </Tooltip>
      <button
        onClick={() => saveResult(props.name)}
        class={clsx(
          'hover:bg-gray-100 rounded-full h-7 bg-indigo-500 font-medium text-white px-3 grid place-items-center text-sm hover:bg-indigo-600',
        )}
      >
        Download
      </button>
    </div>
  );
}
