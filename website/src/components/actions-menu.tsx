import { Accessor } from "solid-js";

export function ActionsMenu({
  setCurrentMode,
  applyMaskToImage,
  undo,
  redo,
  actions,
  redoActions,
}: {
  setCurrentMode: (mode: 'draw-green' | 'draw-red' | 'move' | 'erase') => void;
  applyMaskToImage: (idk: boolean) => Promise<void>;
  undo: () => void;
  redo: () => void;
  actions: Accessor<any[]>;
  redoActions: Accessor<any[]>;
}) {
  return (
    <div class="rounded-sm px-2 py-1 bg-white absolute bottom-2 left-2 flex gap-x-4 items-center">
      <button
        onClick={() => applyMaskToImage(true)}
        type="button"
        class="p-2 hover:bg-gray-100"
      >
        Save
      </button>
      <button
        onClick={() => applyMaskToImage(false)}
        type="button"
        class="p-2 hover:bg-gray-100"
      >
        apply
      </button>
      <button disabled={!actions().length} onClick={undo}>
        undo
      </button>
      <button disabled={!redoActions().length} onClick={redo}>redo</button>
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
    </div>
  );
}
