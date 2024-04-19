import { Accessor } from 'solid-js';
import { ActionType } from '~/lib/canvas/utils';
import {
  AiOutlineUndo,
  AiOutlineRedo,
  AiOutlineZoomIn,
  AiOutlineZoomOut,
} from 'solid-icons/ai';
import { VsEdit } from 'solid-icons/vs';
import { BiRegularEraser } from 'solid-icons/bi';
import { TbFocusCentered } from 'solid-icons/tb';
import { RiSystemAddFill } from 'solid-icons/ri'
import { BsArrowsMove } from 'solid-icons/bs'
import { AiOutlineLine } from 'solid-icons/ai'
import clsx from 'clsx';

export function ActionsMenu({
  setCurrentMode,
  applyMaskToImage,
  undo,
  redo,
  actions,
  redoActions,
  zoomIn,
  zoomOut,
  isZooming,
  currentMode,
  resetToOriginal,
}: {
  setCurrentMode: (mode: ActionType) => void;
  applyMaskToImage: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  actions: Accessor<any[]>;
  redoActions: Accessor<any[]>;
  zoomIn: (pos: { x: number; y: number }) => void;
  zoomOut: (pos: { x: number; y: number }) => void;
  isZooming: { value: boolean };
  currentMode: Accessor<ActionType>;
  resetToOriginal: () => void;
}) {
  return (
    <div class="rounded-sm px-2 py-1 bg-white absolute bottom-0 left-0 flex gap-x-4 items-center">
      <button
        onClick={() => applyMaskToImage()}
        type="button"
        class="p-2 hover:bg-gray-100"
      >
        Save
      </button>
      <button
        title="undo"
        disabled={!actions().length}
        onClick={undo}
        class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
      >
        <AiOutlineUndo size={20} />
      </button>
      <button
        title="redo"
        disabled={!redoActions().length}
        onClick={redo}
        class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
      >
        <AiOutlineRedo size={20} />
      </button>
      <button
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
        onClick={resetToOriginal}
        title="Fit and Center"
        class="hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center"
      >
        <TbFocusCentered size={20} />
      </button>
      <button
        type="button"
        onClick={() => setCurrentMode('move')}
        class={clsx("hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center", currentMode() === 'move' && 'bg-gray-100')}
      >
        <BsArrowsMove size={15} />
      </button>
      <button
        type="button"
        onClick={() => setCurrentMode('draw-green')}
        class={clsx("hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center", currentMode() === 'draw-green' && 'bg-gray-100')}
      >
        <RiSystemAddFill size={20} />
      </button>
      <button
        type="button"
        onClick={() => setCurrentMode('draw-red')}
        class={clsx("hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center", currentMode() === 'draw-red' && 'bg-gray-100')}
      >
        <AiOutlineLine size={20} />
      </button>
      <button
        type="button"
        onClick={() => setCurrentMode('draw-yellow')}
        class={clsx("hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center", currentMode() === 'draw-yellow' && 'bg-gray-100')}
      >
        <VsEdit size={17} />
      </button>
      <button
        type="button"
        onClick={() => setCurrentMode('erase')}
        class={clsx("hover:bg-gray-100 rounded-full h-7 w-7 grid place-items-center", currentMode() === 'erase' && 'bg-gray-100')}
      >
        <BiRegularEraser size={20} />
      </button>
    </div>
  );
}
