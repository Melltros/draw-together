import React, { useEffect, useRef } from 'react';
import {
  Pencil, Eraser, Sparkles, Sticker, PaintBucket,
  Palette, MessageSquare, Undo2, Redo2, Trash2, Download
} from 'lucide-react';
import { ColorStrip } from './ColorStrip';

const MAIN_TOOLS = [
  { id: 'pen', icon: Pencil, label: 'Pen' },
  { id: 'glow', icon: Sparkles, label: 'Glow' },
  { id: 'fill', icon: PaintBucket, label: 'Fill' },
  { id: 'eraser', icon: Eraser, label: 'Erase' },
  { id: 'sticker', icon: Sticker, label: 'Sticker' }
];

export const MobileDock = ({
  activeTab,
  onTabChange,
  activeTool,
  setActiveTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  onUndo,
  onRedo,
  onClear,
  onDownload,
  canUndo,
  canRedo,
  canClear,
  isConnected,
  roomId,
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
      className="mobile-dock md:hidden fixed left-0 right-0 z-30 flex flex-col border-t border-[var(--color-border)] bg-[var(--color-surface)]/98 backdrop-blur-lg"
      style={{ bottom: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Draw tab: compact tools so canvas stays visible on small phones */}
      {isCanvas && (
        <>
          <div className="mobile-dock-tools px-2 pt-1.5 pb-1 space-y-1 border-b border-[var(--color-border)]/60">
            <div className="flex gap-1 overflow-x-auto color-strip-scroll">
              {MAIN_TOOLS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTool(id)}
                  className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-lg text-[8px] font-bold cursor-pointer shrink-0 min-w-[3rem] ${
                    activeTool === id
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
            <ColorStrip color={color} setColor={setColor} size="sm" showHint={false} />
            {activeTool !== 'fill' && activeTool !== 'sticker' && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold text-[var(--color-text-muted)] shrink-0">Size</span>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                  className="flex-1 min-w-0 h-5"
                />
                <span className="text-[9px] font-bold text-white bg-[var(--color-primary)] px-1.5 py-0.5 rounded min-w-[1.75rem] text-center shrink-0">
                  {brushSize}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-1 px-2 py-1.5">
            {[
              { label: 'Undo', icon: Undo2, onClick: onUndo, disabled: !canUndo },
              { label: 'Redo', icon: Redo2, onClick: onRedo, disabled: !canRedo },
              { label: 'Clear', icon: Trash2, onClick: onClear, disabled: !canClear, warn: true },
              { label: 'Save', icon: Download, onClick: onDownload, disabled: false, primary: true }
            ].map(({ label, icon: Icon, onClick, disabled, warn, primary }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                disabled={disabled}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold min-h-[40px] active:scale-95 cursor-pointer disabled:opacity-35 ${
                  primary
                    ? 'bg-[var(--color-primary)] text-white'
                    : warn
                      ? 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      <nav className="flex items-stretch gap-1 px-2 py-1.5" aria-label="Main menu">
        <button
          type="button"
          onClick={() => onTabChange('tools')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl cursor-pointer ${
            activeTab === 'tools' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'
          }`}
        >
          <Palette size={18} />
          <span className="text-[10px] font-bold">All tools</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('canvas')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl cursor-pointer ${
            activeTab === 'canvas' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'
          }`}
        >
          <Pencil size={18} />
          <span className="text-[10px] font-bold">Draw</span>
          {activeTab === 'canvas' && (
            <span className="text-[8px] opacity-80 leading-none">{isConnected ? roomId : '…'}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onTabChange('chat')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl cursor-pointer relative ${
            activeTab === 'chat' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'
          }`}
        >
          <MessageSquare size={18} />
          <span className="text-[10px] font-bold">Chat</span>
          {hasChat && activeTab !== 'chat' && (
            <span className="absolute top-1.5 right-[22%] w-2 h-2 rounded-full bg-[var(--color-accent-soft)]" />
          )}
        </button>
      </nav>
    </div>
  );
};

export default MobileDock;
