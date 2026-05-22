import React from 'react';
import { Undo2, Redo2, Trash2, Download } from 'lucide-react';

export const MobileCanvasActions = ({
  onUndo,
  onRedo,
  onClear,
  onDownload,
  canUndo,
  canRedo,
  canClear,
  visible = true
}) => {
  if (!visible) return null;

  const btn =
    'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl border text-[10px] font-bold active:scale-95 cursor-pointer min-h-[44px]';

  return (
    <div
      className="md:hidden fixed left-2 right-2 z-[22] flex gap-1.5 pointer-events-auto"
      style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Canvas actions"
    >
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        className={`${btn} bg-dark-card border-dark-border text-gray-200 disabled:opacity-35`}
      >
        <Undo2 size={18} />
        Undo
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        className={`${btn} bg-dark-card border-dark-border text-gray-200 disabled:opacity-35`}
      >
        <Redo2 size={18} />
        Redo
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={!canClear}
        aria-label="Clear canvas"
        className={`${btn} bg-dark-card border-[#523838] text-[#F7C7CB] disabled:opacity-35`}
      >
        <Trash2 size={18} />
        Clear
      </button>
      <button
        type="button"
        onClick={onDownload}
        aria-label="Save PNG"
        className={`${btn} bg-[#C73543] border-[#7A0C22] text-white`}
      >
        <Download size={18} />
        Save
      </button>
    </div>
  );
};

export default MobileCanvasActions;
