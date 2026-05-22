import React from 'react';
import { Pencil, Eraser, Highlighter } from 'lucide-react';

const QUICK_COLORS = ['#70000E', '#C73543', '#FFFFFF', '#2563EB', '#16A34A', '#F7C7CB'];

export const MobileQuickBar = ({
  activeTool,
  setActiveTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  visible
}) => {
  if (!visible) return null;

  return (
    <div
      className="md:hidden fixed left-2 right-2 z-[18] flex flex-col gap-2 pointer-events-auto"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pinterest-panel rounded-2xl px-3 py-2.5 flex items-center gap-2 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTool('pen')}
          aria-label="Pen"
          className={`p-2.5 rounded-xl border cursor-pointer ${
            activeTool === 'pen' ? 'bg-[#C73543] border-[#7A0C22] text-white' : 'bg-dark-card border-dark-border text-gray-400'
          }`}
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTool('highlighter')}
          aria-label="Highlighter"
          className={`p-2.5 rounded-xl border cursor-pointer ${
            activeTool === 'highlighter' ? 'bg-[#C73543] border-[#7A0C22] text-white' : 'bg-dark-card border-dark-border text-gray-400'
          }`}
        >
          <Highlighter size={18} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTool('eraser')}
          aria-label="Eraser"
          className={`p-2.5 rounded-xl border cursor-pointer ${
            activeTool === 'eraser' ? 'bg-[#C73543] border-[#7A0C22] text-white' : 'bg-dark-card border-dark-border text-gray-400'
          }`}
        >
          <Eraser size={18} />
        </button>

        <div className="w-px h-8 bg-[#523838] shrink-0" />

        <div className="flex gap-1.5 overflow-x-auto touch-scrollable flex-1 py-0.5">
          {QUICK_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={`w-8 h-8 rounded-full shrink-0 border-2 cursor-pointer ${
                color.toLowerCase() === c.toLowerCase() ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="pinterest-panel rounded-xl px-3 py-2 flex items-center gap-3">
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
        <span className="text-[10px] font-bold text-white bg-[#7A0C22] px-2 py-0.5 rounded-md shrink-0">
          {brushSize}
        </span>
      </div>
    </div>
  );
};

export default MobileQuickBar;
