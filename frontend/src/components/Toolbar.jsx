import React, { useState } from 'react';
import { Pencil, Eraser, Minus, Square, Circle, Type, Smile, ChevronDown, ChevronUp, Info } from 'lucide-react';

const PRESET_COLORS = [
  '#70000E', '#C3B79D', '#DCD7D4', '#F5F4F2', '#E11D48',
  '#2563EB', '#16A34A', '#D97706', '#EA580C', '#FFFFFF'
];

const EMOJI_STAMPS = ['⭐', '❤️', '🔥', '✨', '💀', '👀', '🎨', '🖤', '🌈', '😎', '🦋', '🍄'];

const TOOL_HINTS = {
  pen: 'Drag on the canvas to draw freehand lines.',
  eraser: 'Drag to erase parts of the drawing.',
  line: 'Click and drag to draw a straight line.',
  rect: 'Click and drag to draw a rectangle.',
  circle: 'Click and drag to draw a circle.',
  text: 'Tap the canvas, type your text, then confirm.',
};

export const Toolbar = ({
  activeTool,
  setActiveTool,
  color,
  setColor,
  brushSize,
  setBrushSize
}) => {
  const [showColorPicker, setShowColorPicker] = useState(true);
  const [showEmojis, setShowEmojis] = useState(false);

  const tools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rect', icon: Square, label: 'Box' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
  ];

  const activeLabel = tools.find((t) => t.id === activeTool)?.label || 'Pen';

  return (
    <div className="flex flex-col gap-3 w-full md:w-64 select-none">
      <div className="flex items-start gap-2 px-1 py-2 rounded-xl bg-[#452F2F]/50 border border-[#523838]/60">
        <Info size={14} className="text-[#F7C7CB] shrink-0 mt-0.5" />
        <p className="ux-hint text-[#F7C7CB]/90">
          <span className="text-white font-bold">{activeLabel} selected.</span>{' '}
          {TOOL_HINTS[activeTool]}
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
                onClick={() => setActiveTool(tool.id)}
                aria-pressed={isActive}
                aria-label={tool.label}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-[#C73543] border-[#7A0C22] text-white ring-2 ring-[#F7C7CB]/40'
                    : 'bg-dark-card border-dark-border text-gray-400 hover:text-white hover:border-[#5A3E3E]'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] mt-1.5 font-bold">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pinterest-panel rounded-2xl p-3">
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="flex items-center justify-between w-full mb-2 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full ring-2 ring-white/25"
              style={{ backgroundColor: color }}
            />
            <span className="ux-section-title">Brush color</span>
          </div>
          {showColorPicker ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </button>

        {showColorPicker && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((presetColor) => {
                const isSelected = color.toLowerCase() === presetColor.toLowerCase();
                return (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    aria-label={`Color ${presetColor}`}
                    className={`w-full aspect-square rounded-lg cursor-pointer ${
                      isSelected ? 'ring-2 ring-white scale-105' : 'ring-1 ring-white/15'
                    }`}
                    style={{ backgroundColor: presetColor }}
                  />
                );
              })}
            </div>
            <label className="flex items-center gap-2 bg-dark-card border border-dark-border p-2 rounded-xl cursor-pointer">
              <span className="ux-hint shrink-0">Custom</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      <div className="pinterest-panel rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="ux-section-title">Brush thickness</span>
          <span className="text-xs font-bold text-white bg-[#7A0C22] px-2 py-0.5 rounded-md">
            {brushSize}px
          </span>
        </div>
        <div className="flex items-center gap-3 bg-dark-card border border-dark-border p-3 rounded-xl">
          <span className="ux-hint shrink-0">Thin</span>
          <input
            type="range"
            min="1"
            max="40"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            aria-label="Brush size"
            className="flex-1 cursor-pointer"
          />
          <span className="ux-hint shrink-0">Thick</span>
        </div>
      </div>

      <div className="pinterest-panel rounded-2xl p-3">
        <button
          type="button"
          onClick={() => setShowEmojis(!showEmojis)}
          className="flex items-center justify-between w-full cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Smile size={16} className="text-[#F7C7CB]" />
            <span className="ux-section-title">Stickers (optional)</span>
          </div>
          {showEmojis ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showEmojis && (
          <>
            <p className="ux-hint mt-2 mb-2">Tap a sticker, then tap the canvas to place it.</p>
            <div className="grid grid-cols-6 gap-1.5">
              {EMOJI_STAMPS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setActiveTool('text');
                    window.selectedEmoji = emoji;
                  }}
                  className="flex items-center justify-center p-2 text-lg rounded-lg bg-dark-card border border-dark-border hover:bg-dark-hover active:scale-95 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
