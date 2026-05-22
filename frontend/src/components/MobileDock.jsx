import React, { useEffect, useRef } from 'react';
import {
  Pencil, Eraser, Sparkles, Sticker, PaintBucket,
  Palette, MessageSquare, Undo2, Redo2, Trash2, Download
} from 'lucide-react';
import { PRESET_COLORS } from '../constants/colors';

const MAIN_TOOLS = [
  { id: 'pen', icon: Pencil, label: 'Pen' },
  { id: 'glow', icon: Sparkles, label: 'Glow' },
  { id: 'fill', icon: PaintBucket, label: 'Fill' },
  { id: 'eraser', icon: Eraser, label: 'Erase' },
  { id: 'sticker', icon: Sticker, label: 'Sticker' }
];

const QUICK_COLORS = PRESET_COLORS.slice(0, 10);

export const MobileDock = ({
  activeTab,
  onTabChange,
  activeTool,
  setActiveTool,
  color,
  setColor,
  onUndo,
  onRedo,
  onClear,
  onDownload,
  canUndo,
  canRedo,
  canClear,
  hasChat,
  visible
}) => {
  const dockRef = useRef(null);

  useEffect(() => {
    const el = dockRef.current;
    if (!el || !visible) {
      document.documentElement.style.removeProperty('--mobile-dock-height');
      return undefined;
    }

    const syncHeight = () => {
      document.documentElement.style.setProperty('--mobile-dock-height', `${el.offsetHeight}px`);
    };

    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    window.addEventListener('resize', syncHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncHeight);
      document.documentElement.style.removeProperty('--mobile-dock-height');
    };
  }, [visible, activeTab]);

  if (!visible) return null;

  const isCanvas = activeTab === 'canvas';

  return (
    <div
      ref={dockRef}
      className="mobile-dock md:hidden fixed left-0 right-0 z-30 flex flex-col border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-8px_24px_rgba(0,0,0,0.4)]"
      style={{ bottom: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {isCanvas && (
        <div className="flex items-center gap-1 px-1.5 py-1 border-b border-[var(--color-border)]/50 min-h-[44px]">
          <div className="flex gap-0.5 shrink-0">
            {MAIN_TOOLS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                onClick={() => setActiveTool(id)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer ${
                  activeTool === id
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
                }`}
              >
                <Icon size={17} />
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-0 flex gap-1 overflow-x-auto color-strip-scroll py-0.5">
            {QUICK_COLORS.map((c) => {
              const selected = color.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full shrink-0 border-2 cursor-pointer ${
                    selected ? 'border-white scale-110 ring-2 ring-[var(--color-primary)]' : 'border-white/20'
                  }`}
                  style={{ backgroundColor: c }}
                />
              );
            })}
          </div>

          <div className="flex gap-0.5 shrink-0">
            {[
              { icon: Undo2, label: 'Undo', onClick: onUndo, disabled: !canUndo },
              { icon: Redo2, label: 'Redo', onClick: onRedo, disabled: !canRedo },
              { icon: Trash2, label: 'Clear', onClick: onClear, disabled: !canClear },
              { icon: Download, label: 'Save', onClick: onDownload, disabled: false, primary: true }
            ].map(({ icon: Icon, label, onClick, disabled, primary }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={onClick}
                disabled={disabled}
                className={`w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-30 ${
                  primary
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                }`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="flex items-stretch gap-1 px-2 py-1" aria-label="Main menu">
        <button
          type="button"
          onClick={() => onTabChange('tools')}
          className={`flex-1 flex flex-col items-center py-1 rounded-lg cursor-pointer ${
            activeTab === 'tools' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'
          }`}
        >
          <Palette size={17} />
          <span className="text-[9px] font-bold">Tools</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('canvas')}
          className={`flex-1 flex flex-col items-center py-1 rounded-lg cursor-pointer ${
            activeTab === 'canvas' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'
          }`}
        >
          <Pencil size={17} />
          <span className="text-[9px] font-bold">Draw</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('chat')}
          className={`flex-1 flex flex-col items-center py-1 rounded-lg cursor-pointer relative ${
            activeTab === 'chat' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'
          }`}
        >
          <MessageSquare size={17} />
          <span className="text-[9px] font-bold">Chat</span>
          {hasChat && activeTab !== 'chat' && (
            <span className="absolute top-1 right-[28%] w-1.5 h-1.5 rounded-full bg-[var(--color-accent-soft)]" />
          )}
        </button>
      </nav>
    </div>
  );
};

export default MobileDock;
