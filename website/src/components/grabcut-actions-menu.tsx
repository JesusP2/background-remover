import clsx from 'clsx';
import {
  AiOutlineRedo,
  AiOutlineUndo,
  AiOutlineZoomIn,
  AiOutlineZoomOut,
  AiOutlineLine,
} from 'solid-icons/ai';
import { BsWindowSplit } from 'solid-icons/bs';
import { BsWindow } from 'solid-icons/bs';
import { BiRegularEraser } from 'solid-icons/bi';
import { BsArrowsMove } from 'solid-icons/bs';
import { IoCutOutline } from 'solid-icons/io';
import { RiSystemAddFill } from 'solid-icons/ri';
import { TbFocusCentered } from 'solid-icons/tb';
import { VsEdit } from 'solid-icons/vs';
import type { Accessor, Setter } from 'solid-js';
import type { CanvasLayout } from '~/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type {
  GrabcutAction,
  GrabcutActionType,
} from '~/hooks/use-grabcut-canvas/utils';

export function GrabcutActionsMenu(props: {
  setCurrentMode: Setter<GrabcutActionType>;
  applyMaskToImage: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  actions: Accessor<GrabcutAction[]>;
  redoActions: Accessor<GrabcutAction[]>;
  zoomIn: (pos: { x: number; y: number }) => void;
  zoomOut: (pos: { x: number; y: number }) => void;
  isZooming: { value: boolean };
  resetToOriginal: () => void;
  currentMode: Accessor<GrabcutActionType>;
  saveResult: (name: string) => Promise<void>;
  isDownloadingModelOrEmbeddingImage: Accessor<boolean>;
  canvasLayout: Accessor<CanvasLayout>;
  setCanvasLayout: Setter<CanvasLayout>;
  name: string;
}) {
  return (
    <div class="rounded-sm px-2 bg-white h-10 absolute bottom-2 left-2 flex gap-x-2 items-center shadow-xl">
      <Tooltip>
        <TooltipTrigger>
          <button
            onClick={() => props.applyMaskToImage()}
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
            onClick={() => props.setCurrentMode('draw-green')}
            class={clsx(
              'hover:bg-green-500 hover:text-white ease-in-out duration-200 rounded-full h-7 w-7 grid place-items-center',
              props.currentMode() === 'draw-green' && 'bg-green-500 text-white',
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
            onClick={() => props.setCurrentMode('draw-red')}
            class={clsx(
              'hover:bg-red-500 hover:text-white ease-in-out duration-200 rounded-full h-7 w-7 grid place-items-center',
              props.currentMode() === 'draw-red' && 'bg-red-500 text-white',
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
            onClick={() => props.setCurrentMode('draw-yellow')}
            class={clsx(
              'hover:bg-yellow-500 hover:text-white ease-in-out duration-200 rounded-full h-7 w-7 grid place-items-center',
              props.currentMode() === 'draw-yellow' &&
                'bg-yellow-500 text-white',
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
            onClick={() => props.setCurrentMode('erase')}
            class={clsx(
              'hover:bg-gray-500 hover:text-white rounded-full h-7 w-7 grid place-items-center',
              props.currentMode() === 'erase' && 'bg-gray-500 text-white',
            )}
          >
            <BiRegularEraser size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Erase</TooltipContent>
      </Tooltip>
      <div class="bg-sky-500 h-10 flex items-center gap-x-2 px-2 flex-center">
        <Tooltip>
          <TooltipTrigger>
            <button
              type="button"
              disabled={!props.actions().length}
              onClick={props.undo}
              class="disabled:text-white/40 rounded-full h-7 w-7 grid place-items-center text-gray-200 hover:text-white"
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
              disabled={!props.redoActions().length}
              onClick={props.redo}
              class="disabled:text-white/40 rounded-full h-7 w-7 grid place-items-center text-gray-200 hover:text-white"
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
              class="rounded-full h-7 w-7 grid place-items-center text-gray-200 hover:text-white"
              onMouseDown={() =>
                props.zoomIn({
                  x:
                    props.canvasLayout() === 'result'
                      ? window.innerWidth / 2 - 30
                      : window.innerWidth / 4 - 30,
                  y: window.innerHeight / 2,
                })
              }
              onMouseUp={() => {
                props.isZooming.value = false;
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
              class="rounded-full h-7 w-7 grid place-items-center text-gray-200 hover:text-white"
              onMouseDown={() => props.zoomOut({ x: 417, y: 494 })}
              onMouseUp={() => {
                props.isZooming.value = false;
              }}
            >
              <AiOutlineZoomOut size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Zoom out</TooltipContent>
        </Tooltip>
      </div>
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            onClick={props.resetToOriginal}
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
            onClick={() => props.setCurrentMode('move')}
            class={clsx(
              'hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center',
              props.currentMode() === 'move' && 'bg-gray-100',
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
            title="result"
            onClick={() => props.setCanvasLayout('result')}
            class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
          >
            <BsWindow size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>1 window</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            title="both"
            onClick={() => props.setCanvasLayout('both')}
            class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
          >
            <BsWindowSplit size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Split window</TooltipContent>
      </Tooltip>
      <button
        onClick={() => props.saveResult(props.name)}
        class={clsx(
          'hover:bg-gray-100 rounded-lg h-7 bg-sky-500 font-medium text-white px-3 grid place-items-center text-sm hover:bg-sky-600',
        )}
      >
        Download
      </button>
    </div>
  );
}
