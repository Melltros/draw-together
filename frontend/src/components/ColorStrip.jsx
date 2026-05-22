import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PRESET_COLORS } from '../constants/colors';

export const ColorStrip = ({
  color,
  setColor,
  colors = PRESET_COLORS,
  size = 'md',
  showHint = true
}) => {
  const scrollRef = useRef(null);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 120, behavior: 'smooth' });
  };

  const dotClass = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';

  return (
    <div className="min-w-0 flex-1 flex flex-col gap-1">
      {showHint && (
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide px-0.5">
          Swipe colors →
        </p>
      )}
      <div className="flex items-center gap-1 min-w-0">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          className="shrink-0 w-7 h-7 rounded-lg bg-dark-card border border-dark-border text-gray-400 flex items-center justify-center active:scale-90 cursor-pointer"
          aria-label="Scroll colors left"
        >
          <ChevronLeft size={14} />
        </button>

        <div
          ref={scrollRef}
          className="color-strip-scroll flex-1 min-w-0 rounded-xl"
          role="listbox"
          aria-label="Brush colors"
        >
          <div className="flex flex-nowrap gap-2 py-1 px-1 w-max">
            {colors.map((c) => {
              const selected = color.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => setColor(c)}
                  className={`${dotClass} rounded-full shrink-0 border-2 cursor-pointer transition-transform active:scale-95 ${
                    selected ? 'border-white scale-110 ring-2 ring-[#C73543]/60' : 'border-white/20'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollBy(1)}
          className="shrink-0 w-7 h-7 rounded-lg bg-dark-card border border-dark-border text-gray-400 flex items-center justify-center active:scale-90 cursor-pointer"
          aria-label="Scroll colors right"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default ColorStrip;
