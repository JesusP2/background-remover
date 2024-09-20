import clsx from 'clsx';
import { TbZoomInArea, TbZoomOutArea,  TbFocusCentered, TbArrowsMove  } from 'solid-icons/tb'
import { CgAddR, CgRemoveR, CgUndo, CgRedo } from 'solid-icons/cg'
import { TbPlayerTrackNext } from 'solid-icons/tb';
import { BsWindowSplit } from 'solid-icons/bs';
import { BsWindow } from 'solid-icons/bs';
import { BsArrowsMove } from 'solid-icons/bs';
import type { Accessor, Setter } from 'solid-js';
import type { CanvasLayout } from '~/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type {
  GrabcutAction,
  GrabcutActionType,
} from '~/hooks/use-grabcut-canvas/utils';
import { cn } from '~/lib/utils';

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
    <div class="bg-white rounded-lg p-2 flex flex-col gap-y-2">
      <div class="border-[2px] border-stone-300 p-3 flex gap-x-3 rounded-md">
        <Tooltip>
          <TooltipTrigger>
            <button
              type="button"
              onClick={() => props.setCurrentMode('SAM-add-area')}
              class={cn(
                'hover:text-blue-600 text-stone-300 text-sm ease-in-out duration-200 rounded-full grid place-items-center font-semibold',
                props.currentMode() === 'SAM-add-area' && 'text-blue-600',
              )}
            >
              <CgAddR size={24} />
              Add Mask
            </button>
          </TooltipTrigger>
          <TooltipContent>Add Mask</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <button
              type="button"
              onClick={() => props.setCurrentMode('SAM-remove-area')}
              class={cn(
                'hover:text-red-500 text-stone-300 text-sm ease-in-out duration-200 rounded-full grid place-items-center font-semibold',
                props.currentMode() === 'SAM-remove-area' && 'text-red-500',
              )}
            >
              <CgRemoveR size={24} />
              Remove area
            </button>
          </TooltipTrigger>
          <TooltipContent>Remove area</TooltipContent>
        </Tooltip>
      </div>
      <div class="h-10 flex items-center justify-between px-4 rounded-full bg-gray-100">
        <Tooltip>
          <TooltipTrigger>
            <button
              type="button"
              disabled={!props.actions().length}
              onClick={props.undo}
              class="disabled:text-zinc-300 h-7 w-7 grid place-items-center text-zinc-500 hover:text-zinc-700"
            >
              Undo
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
              class="disabled:text-zinc-300 h-7 w-7 grid place-items-center text-zinc-500 hover:text-zinc-700"
            >
              Redo
            </button>
          </TooltipTrigger>
          <TooltipContent>Redo previous action</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <button
              type="button"
              class="h-7 w-7 grid place-items-center text-zinc-500 hover:text-zinc-700"
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
              <TbZoomInArea size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Zoom in</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <button
              type="button"
              class="h-7 w-7 grid place-items-center text-zinc-500 hover:text-zinc-700"
              onMouseDown={() => props.zoomOut({ x: 417, y: 494 })}
              onMouseUp={() => {
                props.isZooming.value = false;
              }}
            >
              <TbZoomOutArea size={24} />
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
            <TbArrowsMove size={24} />
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
