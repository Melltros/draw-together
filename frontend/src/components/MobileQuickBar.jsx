import React, { useState } from 'react';
import { Pencil, Eraser, Highlighter, Sparkles, Sticker, PaintBucket, Square, Circle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showMoreTools, setShowMoreTools] = useState(false);

  if (!visible) return null;

  const handleStickerPick = (emoji) => {
    onSelectSticker(emoji);
    setActiveTool('sticker');
    setShowStickers(true);
  };

  const mainTools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'glow', icon: Sparkles, label: 'Glow' },
    { id: 'fill', icon: PaintBucket, label: 'Fill' },
    { id: 'eraser', icon: Eraser, label: 'Erase' },
    { id: 'sticker', icon: Sticker, label: 'Sticker' }
  ];

  const extraTools = [
    { id: 'highlighter', icon: Highlighter, label: 'Mark' },
    { id: 'filledRect', icon: Square, label: 'Fill □' },
    { id: 'filledCircle', icon: Circle, label: 'Fill ○' }
  ];

  const isSticker = activeTool === 'sticker';
  const isFill = activeTool === 'fill';

  return (
    <div
      className="md:hidden fixed left-2 right-2 z-[18] flex flex-col gap-2"
      style={{ bottom: 'calc(8.75rem + env(safe-area-inset-bottom, 0px))', touchAction: 'manipulation' }}
    >
      <div className="pinterest-panel rounded-2xl p-2.5 shadow-lg space-y-2">
        <div className="flex items-center gap-1">
          {mainTools.map(({ id, icon: Icon, label }) => (
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
              <Icon size={15} />
              <span className="text-[8px] font-bold">{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowMoreTools(!showMoreTools)}
          className="w-full text-[10px] font-bold text-gray-500 py-0.5 flex items-center justify-center gap-1 cursor-pointer"
        >
          More tools {showMoreTools ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showMoreTools && (
          <div className="flex gap-1">
            {extraTools.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTool(id)}
                className={`flex-1 py-2 rounded-xl border text-[9px] font-bold cursor-pointer flex flex-col items-center gap-0.5 ${
                  activeTool === id ? 'bg-[#C73543] text-white border-[#7A0C22]' : 'bg-dark-card border-dark-border text-gray-400'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}

        <ColorStrip color={color} setColor={setColor} showHint />

        {!isSticker && !isFill && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-500 shrink-0">Size</span>
            <input type="range" min="1" max="40" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value, 10))} className="flex-1" />
            <span className="text-[10px] font-bold text-white bg-[#7A0C22] px-2 py-0.5 rounded-md w-8 text-center">{brushSize}</span>
          </div>
        )}

        {isSticker && showStickers && (
          <div className="border-t border-[#523838]/50 pt-2 space-y-2">
            <StickerPicker selectedSticker={selectedSticker} onSelectSticker={handleStickerPick} compact />
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-gray-500 shrink-0">Size</span>
              <input type="range" min="24" max="200" value={stickerSize} onChange={(e) => setStickerSize(parseInt(e.target.value, 10))} className="flex-1" />
              <span className="text-[10px] font-bold text-white bg-[#7A0C22] px-2 py-0.5 rounded-md">{stickerSize}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileQuickBar;
