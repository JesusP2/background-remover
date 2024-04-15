import { Accessor } from 'solid-js';
import { ActionType } from '~/lib/canvas/utils';
import {
  AiOutlineUndo,
  AiOutlineRedo,
  AiOutlineZoomIn,
  AiOutlineZoomOut,
} from 'solid-icons/ai';
import { TbFocusCentered } from 'solid-icons/tb'

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
  resetToOriginal
}: {
  setCurrentMode: (mode: ActionType) => void;
  applyMaskToImage: (idk: boolean) => Promise<void>;
  undo: () => void;
  redo: () => void;
  actions: Accessor<any[]>;
  redoActions: Accessor<any[]>;
  zoomIn: (pos: { x: number; y: number }) => void;
  zoomOut: (pos: { x: number; y: number }) => void;
  isZooming: { value: boolean };
    resetToOriginal: () => void;
}) {
  return (
    <div class="rounded-sm px-2 py-1 bg-white absolute bottom-0 left-0 flex gap-x-4 items-center">
      <button
        onClick={() => applyMaskToImage(true)}
        type="button"
        class="p-2 hover:bg-gray-100"
      >
        Save
      </button>
      <button title="undo" disabled={!actions().length} onClick={undo}>
        <AiOutlineUndo class="h-5 w-5" />
      </button>
      <button title="redo" disabled={!redoActions().length} onClick={redo}>
        <AiOutlineRedo class="h-5 w-5" />
      </button>
      <button
        title="zoom in"
        onMouseDown={() => zoomIn({ x: 417, y: 494 })}
        onMouseUp={() => {
          isZooming.value = false;
        }}
      >
        <AiOutlineZoomIn class="h-5 w-5" />
      </button>
      <button
        title="zoom out"
        onMouseDown={() => zoomOut({ x: 417, y: 494 })}
        onMouseUp={() => {
          isZooming.value = false;
        }}
      >
        <AiOutlineZoomOut class="h-5 w-5" />
      </button>
      <button onClick={resetToOriginal}>
        <TbFocusCentered class="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => setCurrentMode('move')}
        class="rounded-full h-4 w-4 bg-gray-500"
      />
      <button
        type="button"
        onClick={() => setCurrentMode('draw-green')}
        class="rounded-full h-4 w-4 bg-emerald-500"
      />
      <button
        type="button"
        onClick={() => setCurrentMode('draw-red')}
        class="rounded-full h-4 w-4 bg-red-500"
      />
      <button
        type="button"
        onClick={() => setCurrentMode('draw-yellow')}
        class="rounded-full h-4 w-4 bg-yellow-500"
      />
    </div>
  );
}
