import clsx from 'clsx';
import { BsWindowSplit } from 'solid-icons/bs';
import { BsWindow } from 'solid-icons/bs';
import { BiRegularEraser } from 'solid-icons/bi';
import {
  TbArrowsMove,
  TbCrosshair,
  TbZoomInArea,
  TbZoomOutArea,
} from 'solid-icons/tb';
import { VsEdit } from 'solid-icons/vs';
import type { Accessor, Setter } from 'solid-js';
import type { CanvasLayout } from '~/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type {
  GrabcutAction,
  GrabcutActionType,
} from '~/hooks/use-grabcut-canvas/utils';
import { cn } from '~/lib/utils';
import { CgAddR, CgRemoveR } from 'solid-icons/cg';

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
  changeToCanvasMethod: (step: 'SAM' | 'GRABCUT') => void;
  name: string;
}) {
  return (
    <>
      <div class="bg-white rounded-lg p-2 flex flex-col gap-y-2">
        <button
          onClick={() => props.applyMaskToImage()}
          type="button"
          class="px-2 py-1 hover:bg-blue-600 font-semibold rounded-full bg-blue-500 text-white"
        >
          Cut
        </button>
        <div class="border-[2px] border-stone-300 py-2 px-3 flex rounded-md gap-x-2 justify-between">
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                onClick={() => props.setCurrentMode('draw-green')}
                class={cn(
                  'hover:text-blue-600 text-stone-300 text-sm ease-in-out duration-200 rounded-full grid place-items-center font-semibold',
                  props.currentMode() === 'draw-green' && 'text-blue-600',
                )}
              >
                <CgAddR size={24} />
                Add
              </button>
            </TooltipTrigger>
            <TooltipContent>Add area</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                onClick={() => props.setCurrentMode('draw-red')}
                class={cn(
                  'hover:text-red-500 text-stone-300 text-sm ease-in-out duration-200 rounded-full grid place-items-center font-semibold',
                  props.currentMode() === 'draw-red' && 'text-red-500',
                )}
              >
                <CgRemoveR size={24} />
                Remove
              </button>
            </TooltipTrigger>
            <TooltipContent>Remove area</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                onClick={() => props.setCurrentMode('draw-yellow')}
                class={cn(
                  'hover:text-yellow-500 text-stone-300 text-sm ease-in-out duration-200 rounded-full grid place-items-center font-semibold',
                  props.currentMode() === 'draw-yellow' && 'text-yellow-500',
                )}
              >
                <VsEdit size={24} />
                Hair
              </button>
            </TooltipTrigger>
            <TooltipContent>Alpha matte</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <button
                onClick={() => props.setCurrentMode('erase')}
                class={cn(
                  'hover:text-gray-500 text-stone-300 text-sm ease-in-out duration-200 rounded-full grid place-items-center font-semibold',
                  props.currentMode() === 'erase' && 'text-gray-500',
                )}
              >
                <BiRegularEraser size={24} />
                Erase
              </button>
            </TooltipTrigger>
            <TooltipContent>Erase</TooltipContent>
          </Tooltip>
        </div>
        <div class="flex items-center justify-between border-2 border-stone-300 rounded-md px-3 py-2 gap-x-2">
          <Tooltip disabled={!props.actions().length}>
            <TooltipTrigger>
              <button
                type="button"
                disabled={!props.actions().length}
                onClick={props.undo}
                class="disabled:text-zinc-100 disabled:bg-stone-300 text-zinc-100 hover:text-white hover:bg-stone-600 font-semibold px-3 py-1 bg-stone-500 rounded-full"
              >
                Undo
              </button>
            </TooltipTrigger>
            <TooltipContent>Undo last action</TooltipContent>
          </Tooltip>
          <Tooltip disabled={!props.redoActions().length}>
            <TooltipTrigger>
              <button
                type="button"
                disabled={!props.redoActions().length}
                onClick={props.redo}
                class="disabled:text-zinc-100 disabled:bg-stone-300 text-zinc-100 hover:text-white hover:bg-stone-600 font-semibold px-3 py-1 bg-stone-500 rounded-full"
              >
                Redo
              </button>
            </TooltipTrigger>
            <TooltipContent>Redo previous action</TooltipContent>
          </Tooltip>
        </div>
        <div class="bg-gray-100 rounded-full flex items-center justify-between py-1 px-3">
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
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                onClick={props.resetToOriginal}
                class="h-7 w-7 grid place-items-center text-zinc-500 hover:text-zinc-700"
              >
                <TbCrosshair size={24} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Fit and Center</TooltipContent>
          </Tooltip>
        </div>
        <div class="bg-gray-100 rounded-full flex items-center justify-between py-1 px-3">
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                onClick={() => props.setCurrentMode('move')}
                class={cn(
                  'h-7 w-7 grid place-items-center text-zinc-500 hover:text-zinc-700',
                  props.currentMode() === 'move' && 'text-zinc-900',
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
                class="text-zinc-600 hover:text-zinc-800 rounded-full h-7 w-7 grid place-items-center"
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
                class="text-zinc-600 hover:text-zinc-800 rounded-full h-7 w-7 grid place-items-center"
              >
                <BsWindowSplit size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Split window</TooltipContent>
          </Tooltip>
        </div>
        <div class="flex justify-between items-centerr">
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                onClick={() => props.changeToCanvasMethod('SAM')}
                class="text-sm text-zinc-500 hover:text-zinc-600 font-semibold px-3 py-1 ring-1 w-full rounded-full ring-zinc-400 hover:ring-zinc-600 h-[26px]"
              >
                Reset
              </button>
            </TooltipTrigger>
            <TooltipContent>Next</TooltipContent>
          </Tooltip>
          <button
            onClick={() => props.saveResult(props.name)}
            class={clsx(
              'hover:bg-gray-100 rounded-full bg-blue-500 font-medium text-white px-3 grid place-items-center text-sm hover:bg-blue-600 font-semibold w-24 h-[28px]',
            )}
          >
            Download
          </button>
        </div>
      </div>
    </>
  );
}
