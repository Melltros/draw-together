import React, { useState } from 'react';
import {
  Pencil, Eraser, Highlighter, Sparkles, Sticker, Minus, Square, Circle, Type,
  ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { PRESET_COLORS } from '../constants/colors';
import { ColorStrip } from './ColorStrip';
import { StickerPicker } from './StickerPicker';

const TOOL_HINTS = {
  pen: 'Drag on the canvas to draw freehand lines.',
  glow: 'Glowing neon lines — best on dark canvas with bright colors.',
  highlighter: 'Semi-transparent strokes — great for marking areas.',
  eraser: 'Drag to erase parts of the drawing.',
  sticker: 'Pick a sticker below, then tap the canvas to place it.',
  line: 'Click and drag to draw a straight line.',
  rect: 'Click and drag to draw a rectangle.',
  circle: 'Click and drag to draw a circle.',
  text: 'Tap the canvas, type your text, then press Place.',
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
  const [showStickers, setShowStickers] = useState(true);

  const tools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'glow', icon: Sparkles, label: 'Glow' },
    { id: 'highlighter', icon: Highlighter, label: 'Mark' },
    { id: 'eraser', icon: Eraser, label: 'Erase' },
    { id: 'sticker', icon: Sticker, label: 'Sticker' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rect', icon: Square, label: 'Box' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
  ];

  const activeLabel = tools.find((t) => t.id === activeTool)?.label || 'Pen';

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
          <span className="text-white font-bold">{activeLabel} selected.</span>{' '}
          {TOOL_HINTS[activeTool] || TOOL_HINTS.pen}
        </p>
      </div>

      <div className="pinterest-panel rounded-2xl p-3">
        <p className="ux-section-title mb-3 px-0.5">Choose a tool</p>
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  if (tool.id === 'sticker') setShowStickers(true);
                }}
                aria-pressed={isActive}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border cursor-pointer ${
                  isActive
                    ? 'bg-[#C73543] border-[#7A0C22] text-white ring-2 ring-[#F7C7CB]/40'
                    : 'bg-dark-card border-dark-border text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={17} />
                <span className="text-[9px] mt-1 font-bold">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pinterest-panel rounded-2xl p-3">
        <button
          type="button"
          onClick={() => setShowColors(!showColors)}
          className="flex items-center justify-between w-full mb-2 cursor-pointer"
        >
          <span className="ux-section-title">Colors ({PRESET_COLORS.length})</span>
          {showColors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showColors && (
          <div className="space-y-3">
            <ColorStrip color={color} setColor={setColor} showHint={false} />
            <label className="flex items-center gap-2 bg-dark-card border border-dark-border p-2 rounded-xl cursor-pointer">
              <span className="ux-hint shrink-0">Custom</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {activeTool !== 'sticker' ? (
        <div className="pinterest-panel rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="ux-section-title">Brush thickness</span>
            <span className="text-xs font-bold text-white bg-[#7A0C22] px-2 py-0.5 rounded-md">{brushSize}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="40"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
            className="w-full cursor-pointer"
            aria-label="Brush size"
          />
        </div>
      ) : (
        <div className="pinterest-panel rounded-2xl p-3">
          <span className="ux-section-title block mb-2">Sticker size</span>
          <input
            type="range"
            min="24"
            max="160"
            value={stickerSize}
            onChange={(e) => setStickerSize(parseInt(e.target.value, 10))}
            className="w-full cursor-pointer"
            aria-label="Sticker size"
          />
          <p className="text-[10px] font-bold text-white text-right mt-1">{stickerSize}px</p>
        </div>
      )}

      <div className="pinterest-panel rounded-2xl p-3">
        <button
          type="button"
          onClick={() => setShowStickers(!showStickers)}
          className="flex items-center justify-between w-full cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sticker size={16} className="text-[#F7C7CB]" />
            <span className="ux-section-title">Sticker library</span>
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
