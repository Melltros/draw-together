import React, { useState } from 'react';
import {
  Pencil, Eraser, Highlighter, Sparkles, Sticker, Minus, Square, Circle, Type,
  PaintBucket, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { PRESET_COLORS } from '../constants/colors';
import { ColorStrip } from './ColorStrip';
import { StickerPicker } from './StickerPicker';

const TOOL_HINTS = {
  pen: 'Drag to draw freehand lines.',
  glow: 'Neon glowing strokes — use bright colors.',
  highlighter: 'Transparent marker strokes.',
  eraser: 'Drag to erase.',
  fill: 'Tap a closed area to fill it with color.',
  filledRect: 'Drag to draw a solid rectangle.',
  filledCircle: 'Drag to draw a solid circle.',
  sticker: 'Pick a sticker, drag on canvas to move it, then Place.',
  line: 'Drag for a straight line.',
  rect: 'Drag for rectangle outline.',
  circle: 'Drag for circle outline.',
  text: 'Tap canvas, type, then Place text.',
};

export const Toolbar = ({
  activeTool,
  setActiveTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  stickerSize,
  setStickerSize,
  selectedSticker,
  onSelectSticker
}) => {
  const [showColors, setShowColors] = useState(true);
  const [showStickers, setShowStickers] = useState(false);

  const tools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'glow', icon: Sparkles, label: 'Glow' },
    { id: 'fill', icon: PaintBucket, label: 'Fill' },
    { id: 'highlighter', icon: Highlighter, label: 'Mark' },
    { id: 'eraser', icon: Eraser, label: 'Erase' },
    { id: 'filledRect', icon: Square, label: 'Fill □' },
    { id: 'filledCircle', icon: Circle, label: 'Solid ○' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rect', icon: Square, label: 'Box' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'sticker', icon: Sticker, label: 'Sticker' },
    { id: 'text', icon: Type, label: 'Text' },
  ];

  const activeLabel = tools.find((t) => t.id === activeTool)?.label || 'Pen';
  const isSticker = activeTool === 'sticker';
  const isFillOnly = activeTool === 'fill';

  const handleStickerSelect = (emoji) => {
    onSelectSticker(emoji);
    setActiveTool('sticker');
    setShowStickers(true);
  };

  return (
    <div className="flex flex-col gap-3 w-full md:w-64 select-none">
      <div className="flex items-start gap-2 px-1 py-2 rounded-xl bg-[#452F2F]/50 border border-[#523838]/60">
        <Info size={14} className="text-[#F7C7CB] shrink-0 mt-0.5" />
        <p className="ux-hint text-[#F7C7CB]/90">
          <span className="text-white font-bold">{activeLabel}</span> — {TOOL_HINTS[activeTool] || TOOL_HINTS.pen}
        </p>
      </div>

      <div className="pinterest-panel rounded-2xl p-3">
        <p className="ux-section-title mb-3">Tools</p>
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setActiveTool(tool.id);
                  if (tool.id === 'sticker') setShowStickers(true);
                }}
                aria-pressed={activeTool === tool.id}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer ${
                  activeTool === tool.id
                    ? 'bg-[#C73543] border-[#7A0C22] text-white ring-2 ring-[#F7C7CB]/40'
                    : 'bg-dark-card border-dark-border text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={17} />
                <span className="text-[9px] mt-1 font-bold text-center leading-tight">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pinterest-panel rounded-2xl p-3">
        <button type="button" onClick={() => setShowColors(!showColors)} className="flex items-center justify-between w-full mb-2 cursor-pointer">
          <span className="ux-section-title">Colors ({PRESET_COLORS.length})</span>
          {showColors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showColors && (
          <div className="space-y-3">
            <ColorStrip color={color} setColor={setColor} showHint={false} />
            <label className="flex items-center gap-2 bg-dark-card border border-dark-border p-2 rounded-xl cursor-pointer">
              <span className="ux-hint shrink-0">Custom</span>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer" />
            </label>
          </div>
        )}
      </div>

      {!isSticker && !isFillOnly && (
        <div className="pinterest-panel rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="ux-section-title">Brush size</span>
            <span className="text-xs font-bold text-white bg-[#7A0C22] px-2 py-0.5 rounded-md">{brushSize}px</span>
          </div>
          <input type="range" min="1" max="40" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value, 10))} className="w-full" />
        </div>
      )}

      {isSticker && (
        <div className="pinterest-panel rounded-2xl p-3">
          <span className="ux-section-title block mb-2">Sticker size</span>
          <input type="range" min="24" max="200" value={stickerSize} onChange={(e) => setStickerSize(parseInt(e.target.value, 10))} className="w-full" />
        </div>
      )}

      <div className="pinterest-panel rounded-2xl p-3">
        <button type="button" onClick={() => setShowStickers(!showStickers)} className="flex items-center justify-between w-full cursor-pointer">
          <div className="flex items-center gap-2">
            <Sticker size={16} className="text-[#F7C7CB]" />
            <span className="ux-section-title">Stickers</span>
          </div>
          {showStickers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showStickers && (
          <div className="mt-3">
            <StickerPicker selectedSticker={selectedSticker} onSelectSticker={handleStickerSelect} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
