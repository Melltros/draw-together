import React, { useState } from 'react';
import {
  Pencil, Eraser, Sparkles, Sticker, PaintBucket,
  Palette, MessageSquare, Undo2, Redo2, Trash2, Download, ChevronUp, ChevronDown
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
  const [toolsOpen, setToolsOpen] = useState(true);

  if (!visible) return null;

  const isCanvas = activeTab === 'canvas';
  const showDrawPanel = isCanvas && toolsOpen;

  return (
    <div
      className="md:hidden fixed left-0 right-0 z-30 flex flex-col border-t border-[var(--color-border)] bg-[var(--color-surface)]/98 backdrop-blur-lg"
      style={{ bottom: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Canvas-only: draw tools (collapsible) */}
      {isCanvas && (
        <>
          <button
            type="button"
            onClick={() => setToolsOpen(!toolsOpen)}
            className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold text-[var(--color-text-muted)] border-b border-[var(--color-border)]/60 cursor-pointer"
          >
            {toolsOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            {toolsOpen ? 'Hide draw tools' : 'Show draw tools'}
          </button>

          {showDrawPanel && (
            <div className="px-2 pt-2 pb-1 space-y-2 border-b border-[var(--color-border)]/60 max-h-[38dvh] overflow-y-auto touch-scrollable">
              <div className="flex gap-1">
                {MAIN_TOOLS.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTool(id)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-[9px] font-bold cursor-pointer min-w-0 ${
                      activeTool === id
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
              <ColorStrip color={color} setColor={setColor} showHint={false} />
              {activeTool !== 'fill' && activeTool !== 'sticker' && (
                <div className="flex items-center gap-2 px-0.5">
                  <span className="text-[10px] font-semibold text-[var(--color-text-muted)] w-8">Size</span>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                    className="flex-1"
                  />
                  <span className="text-[10px] font-bold text-white bg-[var(--color-primary)] px-2 py-0.5 rounded-md min-w-[2rem] text-center">
                    {brushSize}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions — always visible on canvas, never overlaps nav */}
          <div className="flex gap-1.5 px-2 py-2">
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
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg text-[10px] font-bold min-h-[44px] active:scale-95 cursor-pointer disabled:opacity-35 ${
                  primary
                    ? 'bg-[var(--color-primary)] text-white'
                    : warn
                      ? 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)]'
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Main tabs */}
      <nav className="flex items-stretch gap-1 px-2 py-2" aria-label="Main menu">
        <button
          type="button"
          onClick={() => onTabChange('tools')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl cursor-pointer ${
            activeTab === 'tools' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'
          }`}
        >
          <Palette size={20} />
          <span className="text-[11px] font-bold">All tools</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('canvas')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl cursor-pointer ${
            activeTab === 'canvas' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'
          }`}
        >
          <Pencil size={20} />
          <span className="text-[11px] font-bold">Draw</span>
          {activeTab === 'canvas' && (
            <span className="text-[9px] opacity-80">{isConnected ? roomId : '…'}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onTabChange('chat')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl cursor-pointer relative ${
            activeTab === 'chat' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)]'
          }`}
        >
          <MessageSquare size={20} />
          <span className="text-[11px] font-bold">Chat</span>
          {hasChat && activeTab !== 'chat' && (
            <span className="absolute top-2 right-[22%] w-2 h-2 rounded-full bg-[var(--color-accent-soft)]" />
          )}
        </button>
      </nav>
    </div>
  );
};

export default MobileDock;
