import React, { useState } from 'react';
import { Sticker } from 'lucide-react';
import { STICKER_CATEGORIES } from '../constants/stickers';

export const StickerPicker = ({
  selectedSticker,
  onSelectSticker,
  compact = false
}) => {
  const [category, setCategory] = useState(STICKER_CATEGORIES[0].id);

  const activeCategory = STICKER_CATEGORIES.find((c) => c.id === category) || STICKER_CATEGORIES[0];

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center gap-2">
        <Sticker size={14} className="text-[#F7C7CB] shrink-0" />
        <p className="ux-section-title">Stickers</p>
        {selectedSticker && (
          <span className="text-lg ml-auto" title="Selected sticker">
            {selectedSticker}
          </span>
        )}
      </div>

      <p className="ux-hint">
        Tap a sticker, then <strong className="text-white">drag on the canvas</strong> to position it, and press <strong className="text-white">Place sticker</strong>.
      </p>

      <div className="sticker-scroll flex gap-1.5 overflow-x-auto pb-1">
        {STICKER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
              category === cat.id
                ? 'bg-[#C73543] border-[#7A0C22] text-white'
                : 'bg-dark-card border-dark-border text-gray-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className={`grid gap-1.5 ${compact ? 'grid-cols-6' : 'grid-cols-6 sm:grid-cols-8'}`}>
        {activeCategory.stickers.map((emoji) => {
          const isSelected = selectedSticker === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelectSticker(emoji)}
              className={`flex items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${
                compact ? 'p-2 text-xl' : 'p-2.5 text-2xl'
              } ${
                isSelected
                  ? 'bg-[#C73543]/30 border-[#C73543] ring-2 ring-[#F7C7CB]/40 scale-105'
                  : 'bg-dark-card border-dark-border hover:bg-dark-hover'
              }`}
              aria-label={`Sticker ${emoji}`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StickerPicker;
