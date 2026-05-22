import React from 'react';
import { Check, X, Minus, Plus, Move } from 'lucide-react';

export const StickerPlacementBar = ({
  emoji,
  size,
  onSizeChange,
  onPlace,
  onCancel
}) => {
  const adjustSize = (delta) => {
    onSizeChange(Math.min(200, Math.max(20, size + delta)));
  };

  return (
    <div
      className="fixed left-0 right-0 z-[45] px-3 pointer-events-auto"
      style={{ bottom: 'calc(11rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pinterest-panel rounded-2xl p-3 shadow-2xl border-[#C73543]/40 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-[#1F1313] border border-[#523838] flex items-center justify-center shrink-0">
            <span style={{ fontSize: `${Math.min(size * 0.35, 40)}px` }} className="leading-none select-none">
              {emoji}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              <Move size={14} className="text-[#F7C7CB] shrink-0" />
              Move on canvas
            </p>
            <p className="ux-hint mt-0.5">Drag your finger on the canvas to position, then tap Place</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold text-gray-500 shrink-0">Size</span>
          <button type="button" onClick={() => adjustSize(-8)} className="w-9 h-9 rounded-xl bg-dark-card border border-dark-border text-white font-bold cursor-pointer active:scale-95" aria-label="Smaller">
            <Minus size={16} className="mx-auto" />
          </button>
          <input
            type="range"
            min="24"
            max="200"
            value={size}
            onChange={(e) => onSizeChange(parseInt(e.target.value, 10))}
            className="flex-1"
          />
          <button type="button" onClick={() => adjustSize(8)} className="w-9 h-9 rounded-xl bg-dark-card border border-dark-border text-white font-bold cursor-pointer active:scale-95" aria-label="Larger">
            <Plus size={16} className="mx-auto" />
          </button>
          <span className="text-[10px] font-bold text-white bg-[#7A0C22] px-2 py-1 rounded-md w-10 text-center shrink-0">{size}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-[#523838] text-gray-300 text-sm font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <X size={16} /> Cancel
          </button>
          <button
            type="button"
            onClick={onPlace}
            className="flex-[1.4] py-3 rounded-xl bg-[#C73543] hover:bg-[#7A0C22] text-white text-sm font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <Check size={16} /> Place sticker
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickerPlacementBar;
