import React, { useState } from 'react';
import { Pencil, Eraser, Highlighter, Sparkles, Sticker, ChevronDown, ChevronUp } from 'lucide-react';
import { ColorStrip } from './ColorStrip';
import { StickerPicker } from './StickerPicker';

export const MobileQuickBar = ({
  activeTool,
  setActiveTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  stickerSize,
  setStickerSize,
  selectedSticker,
  onSelectSticker,
  visible
}) => {
  const [showStickers, setShowStickers] = useState(false);

  if (!visible) return null;

  const handleStickerPick = (emoji) => {
    onSelectSticker(emoji);
    setActiveTool('sticker');
    setShowStickers(true);
  };

  const isStickerMode = activeTool === 'sticker' || showStickers;

  return (
    <div
      className="md:hidden fixed left-2 right-2 z-[18] flex flex-col gap-2"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))', touchAction: 'manipulation' }}
    >
      {activeTool === 'sticker' && selectedSticker && (
        <div className="px-3 py-2 rounded-xl bg-[#7A0C22]/80 border border-[#C73543] text-center">
          <p className="text-[11px] font-bold text-white">
            {selectedSticker} ready — <span className="text-[#F7C7CB]">tap the canvas to place</span>
          </p>
        </div>
      )}

      <div className="pinterest-panel rounded-2xl p-2.5 shadow-lg space-y-2">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'pen', icon: Pencil, label: 'Pen' },
            { id: 'glow', icon: Sparkles, label: 'Glow' },
            { id: 'highlighter', icon: Highlighter, label: 'Mark' },
            { id: 'eraser', icon: Eraser, label: 'Erase' },
            { id: 'sticker', icon: Sticker, label: 'Sticker' }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id === 'sticker') {
                  setShowStickers(!showStickers);
                  setActiveTool('sticker');
                } else {
                  setShowStickers(false);
                  setActiveTool(id);
                }
              }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl border cursor-pointer min-w-0 ${
                activeTool === id || (id === 'sticker' && showStickers)
                  ? 'bg-[#C73543] border-[#7A0C22] text-white'
                  : 'bg-dark-card border-dark-border text-gray-400'
              }`}
            >
              <Icon size={16} />
              <span className="text-[9px] font-bold truncate w-full text-center">{label}</span>
            </button>
          ))}
        </div>

        <ColorStrip color={color} setColor={setColor} showHint />

        {!isStickerMode ? (
          <div className="flex items-center gap-3 pt-0.5">
            <span className="text-[10px] font-bold text-gray-500 shrink-0">Size</span>
            <input
              type="range"
              min="1"
              max="40"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
              className="flex-1"
              aria-label="Brush size"
            />
            <span className="text-[10px] font-bold text-white bg-[#7A0C22] px-2 py-0.5 rounded-md shrink-0 w-8 text-center">
              {brushSize}
            </span>
          </div>
        ) : (
          <div className="space-y-2 pt-0.5 border-t border-[#523838]/50">
            <button
              type="button"
              onClick={() => setShowStickers(!showStickers)}
              className="w-full flex items-center justify-between text-[10px] font-bold text-gray-400 py-1 cursor-pointer"
            >
              <span>Sticker library</span>
              {showStickers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showStickers && (
              <>
                <StickerPicker
                  selectedSticker={selectedSticker}
                  onSelectSticker={handleStickerPick}
                  compact
                />
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-500 shrink-0">Sticker size</span>
                  <input
                    type="range"
                    min="24"
                    max="160"
                    value={stickerSize}
                    onChange={(e) => setStickerSize(parseInt(e.target.value, 10))}
                    className="flex-1"
                    aria-label="Sticker size"
                  />
                  <span className="text-[10px] font-bold text-white bg-[#7A0C22] px-2 py-0.5 rounded-md shrink-0">
                    {stickerSize}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileQuickBar;
