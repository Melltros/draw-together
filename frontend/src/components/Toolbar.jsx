import React from 'react';
import { Pencil, Eraser, Minus, Square, Circle, Type, Palette } from 'lucide-react';

const PRESET_COLORS = [
  '#FF4D4D', '#FF9F43', '#FECA57', '#1DD1A1', '#00D2D3',
  '#54A0FF', '#5F27CD', '#FF9FF3', '#48DBFB', '#FFFFFF'
];

const BRUSH_SIZES = [2, 5, 8, 12, 18, 24];

export const Toolbar = ({
  activeTool,
  setActiveTool,
  color,
  setColor,
  brushSize,
  setBrushSize
}) => {
  const tools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' }
  ];

  return (
    <div className="flex flex-col gap-5 w-72 glass-panel p-5 rounded-2xl shadow-glow-primary border-dark-border select-none">
      {/* Drawing Tools Section */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Drawing Tools
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105'
                    : 'bg-dark-card hover:bg-dark-hover text-gray-300'
                }`}
              >
                <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
                <span className="text-[10px] mt-1 font-medium">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-dark-border" />

      {/* Palette / Color Picker Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Color Palette
          </h3>
          <div className="flex items-center gap-1.5 bg-dark-card px-2 py-0.5 rounded-md text-[10px] text-gray-300 font-medium">
            <Palette size={10} />
            Active
          </div>
        </div>

        {/* Preset Colors Grid */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {PRESET_COLORS.map((presetColor) => {
            const isSelected = color.toLowerCase() === presetColor.toLowerCase();
            return (
              <button
                key={presetColor}
                onClick={() => setColor(presetColor)}
                className={`w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 relative ${
                  isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-dark-sidebar scale-105' : ''
                }`}
                style={{ backgroundColor: presetColor }}
                title={presetColor}
              />
            );
          })}
        </div>

        {/* Custom Color Selector */}
        <div className="flex items-center gap-2 bg-dark-card p-2 rounded-xl border border-dark-border/40">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden"
          />
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-medium">Custom Color</span>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="text-xs font-semibold bg-transparent text-gray-100 outline-none w-20"
            />
          </div>
        </div>
      </div>

      <hr className="border-dark-border" />

      {/* Brush Size Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Stroke Weight
          </h3>
          <span className="text-xs bg-dark-card px-2 py-0.5 rounded-md text-indigo-400 font-bold">
            {brushSize}px
          </span>
        </div>

        <div className="flex items-center gap-3 bg-dark-card p-3 rounded-xl border border-dark-border/40">
          {/* Visual brush weight circle preview */}
          <div className="w-8 flex items-center justify-center">
            <div
              className="bg-indigo-500 rounded-full transition-all duration-100"
              style={{
                width: `${Math.min(brushSize, 28)}px`,
                height: `${Math.min(brushSize, 28)}px`,
                backgroundColor: activeTool === 'eraser' ? '#ffffff' : color
              }}
            />
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <input
              type="range"
              min="1"
              max="40"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] text-gray-500 font-bold px-0.5">
              <span>Thin</span>
              <span>Thick</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
