import React, { useState } from 'react';
import { X, Palette, MessageSquare, Pencil } from 'lucide-react';

const STORAGE_KEY = 'paintsync_seen_mobile_hint';

export const MobileHint = () => {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="md:hidden fixed left-3 right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[35] animate-slide-up">
      <div className="pinterest-panel rounded-2xl p-4 shadow-2xl border-[#C73543]/30">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-sm font-bold text-white">Quick guide</p>
          <button
            type="button"
            onClick={dismiss}
            className="text-gray-400 hover:text-white p-1 -m-1 cursor-pointer"
            aria-label="Dismiss guide"
          >
            <X size={16} />
          </button>
        </div>
        <ul className="space-y-2.5 text-xs text-gray-300 font-medium">
          <li className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#C73543]/20 flex items-center justify-center shrink-0">
              <Palette size={14} className="text-[#C73543]" />
            </span>
            <span><strong className="text-white">Tools</strong> — pick pen, color & brush size</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#C73543]/20 flex items-center justify-center shrink-0">
              <Pencil size={14} className="text-[#F7C7CB]" />
            </span>
            <span><strong className="text-white">Canvas</strong> — draw here (page won&apos;t refresh while you draw)</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#C73543]/20 flex items-center justify-center shrink-0">
              <MessageSquare size={14} className="text-[#C73543]" />
            </span>
            <span><strong className="text-white">Chat</strong> — message your friends</span>
          </li>
        </ul>
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 w-full py-2.5 bg-[#C73543] hover:bg-[#7A0C22] text-white text-xs font-bold rounded-xl active:scale-[0.98] cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default MobileHint;
