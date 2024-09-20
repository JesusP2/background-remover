import clsx from 'clsx';
import {
  AiOutlineRedo,
  AiOutlineUndo,
  AiOutlineZoomIn,
  AiOutlineZoomOut,
  AiOutlineLine,
} from 'solid-icons/ai';
import { TbPlayerTrackNext } from 'solid-icons/tb'
import { BsWindowSplit } from 'solid-icons/bs';
import { BsWindow } from 'solid-icons/bs';
import { BsArrowsMove } from 'solid-icons/bs';
import { RiSystemAddFill } from 'solid-icons/ri';
import { TbFocusCentered } from 'solid-icons/tb';
import type { Accessor, Setter } from 'solid-js';
import type { CanvasLayout } from '~/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type {
  GrabcutAction,
  GrabcutActionType,
} from '~/hooks/use-grabcut-canvas/utils';

export function SAMActionsMenu(props: {
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
  changeToCanvasMethod: (step: 'SAM' | 'GRABCUT') => void;
  name: string;
}) {
  return (
    <div class="rounded-sm px-2 bg-white h-10 absolute bottom-2 left-2 flex gap-x-2 items-center shadow-xl">
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            onClick={() => props.setCurrentMode('SAM-add-area')}
            class={clsx(
              'hover:bg-green-500 hover:text-white ease-in-out duration-200 rounded-full h-7 w-7 grid place-items-center',
              props.currentMode() === 'SAM-add-area' && 'bg-green-500 text-white',
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
            onClick={() => props.setCurrentMode('SAM-remove-area')}
            class={clsx(
              'hover:bg-red-500 hover:text-white ease-in-out duration-200 rounded-full h-7 w-7 grid place-items-center',
              props.currentMode() === 'SAM-remove-area' && 'bg-red-500 text-white',
            )}
          >
            <AiOutlineLine size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Remove background</TooltipContent>
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
            onClick={() => props.setCanvasLayout('mask')}
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
            onClick={() => props.setCanvasLayout('both')}
            class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
          >
            <BsWindowSplit size={20} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Split window</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            onClick={() => props.changeToCanvasMethod('GRABCUT')}
            class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
          >
            <TbPlayerTrackNext />
          </button>
        </TooltipTrigger>
        <TooltipContent>Next</TooltipContent>
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
