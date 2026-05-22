import React, { useState } from 'react';
import { Pencil, Eraser, Minus, Square, Circle, Type, Palette, Smile, ChevronDown, ChevronUp } from 'lucide-react';

const PRESET_COLORS = [
  '#7C3AED', '#EC4899', '#3B82F6', '#06B6D4', '#10B981',
  '#84CC16', '#F59E0B', '#EF4444', '#F97316', '#FFFFFF'
];

const EMOJI_STAMPS = ['⭐', '❤️', '🔥', '✨', '💀', '👀', '🎨', '💜', '🌈', '😎', '🦋', '🍄'];

export const Toolbar = ({
  activeTool,
  setActiveTool,
  color,
  setColor,
  brushSize,
  setBrushSize
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const tools = [
    { id: 'pen', icon: Pencil, label: 'Pen', shortcut: 'P' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
    { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
    { id: 'rect', icon: Square, label: 'Rect', shortcut: 'R' },
    { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
    { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  ];

  return (
    <div className="flex flex-col gap-2 w-64 select-none animate-slide-in-right">
      {/* Tools */}
      <div className="glass-panel rounded-2xl p-3 shadow-glow-primary">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tools</span>
          <span className="text-[9px] font-bold text-purple-400/60 bg-purple-500/10 px-1.5 py-0.5 rounded">
            {tools.find(t => t.id === activeTool)?.label || 'Pen'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                title={`${tool.label} (${tool.shortcut})`}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20 scale-[1.03]'
                    : 'bg-dark-card hover:bg-dark-hover text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={17} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                <span className="text-[9px] mt-1 font-semibold">{tool.label}</span>
                {!isActive && (
                  <span className="absolute top-1 right-1.5 text-[8px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {tool.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color palette */}
      <div className="glass-panel rounded-2xl p-3">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="flex items-center justify-between w-full mb-2 px-1 group"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full ring-2 ring-white/20 shadow-lg" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Color</span>
          </div>
          {showColorPicker ? <ChevronUp size={12} className="text-gray-500" /> : <ChevronDown size={12} className="text-gray-500" />}
        </button>

        {showColorPicker && (
          <div className="space-y-2.5 animate-scale-in">
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_COLORS.map((presetColor) => {
                const isSelected = color.toLowerCase() === presetColor.toLowerCase();
                return (
                  <button
                    key={presetColor}
                    onClick={() => setColor(presetColor)}
                    className={`w-full aspect-square rounded-lg transition-all duration-200 hover:scale-110 relative ${
                      isSelected ? 'ring-2 ring-white/50 scale-110 shadow-lg' : 'hover:ring-1 ring-white/20'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-dark-bg/60" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 bg-dark-card p-2 rounded-xl">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 text-[11px] font-mono font-bold bg-transparent text-gray-300 outline-none uppercase"
              />
            </div>
          </div>
        )}
      </div>

      {/* Brush size */}
      <div className="glass-panel rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Size</span>
          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
            {brushSize}px
          </span>
        </div>

        <div className="flex items-center gap-3 bg-dark-card p-2.5 rounded-xl">
          <div className="w-7 flex items-center justify-center shrink-0">
            <div
              className="rounded-full transition-all duration-150 shadow-lg"
              style={{
                width: `${Math.min(brushSize, 24)}px`,
                height: `${Math.min(brushSize, 24)}px`,
                backgroundColor: activeTool === 'eraser' ? '#ffffff' : color,
                boxShadow: `0 0 8px ${activeTool === 'eraser' ? 'rgba(255,255,255,0.3)' : color}40`
              }}
            />
          </div>
          <input
            type="range"
            min="1"
            max="40"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="flex-1"
          />
        </div>
      </div>

      {/* Emoji stamps */}
      <div className="glass-panel rounded-2xl p-3">
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className="flex items-center justify-between w-full px-1 group"
        >
          <div className="flex items-center gap-2">
            <Smile size={14} className="text-yellow-400" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stickers</span>
          </div>
          {showEmojis ? <ChevronUp size={12} className="text-gray-500" /> : <ChevronDown size={12} className="text-gray-500" />}
        </button>

        {showEmojis && (
          <div className="grid grid-cols-6 gap-1.5 mt-2.5 animate-scale-in">
            {EMOJI_STAMPS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setActiveTool('text');
                  // Store selected emoji in a custom event for Canvas to pick up
                  window.selectedEmoji = emoji;
                }}
                className="flex items-center justify-center p-2 text-lg rounded-lg bg-dark-card hover:bg-dark-hover hover:scale-110 transition-all duration-150 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
