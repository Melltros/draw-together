import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MousePointer } from 'lucide-react';
import { drawStroke, STROKE_TOOLS } from '../utils/drawStroke';
import { createFillPatch } from '../utils/canvasFill';
import { CANVAS_SIZE } from '../constants/canvas';
import { StickerPlacementBar } from './StickerPlacementBar';

const CANVAS_WIDTH = CANVAS_SIZE;
const CANVAS_HEIGHT = CANVAS_SIZE;
export const Canvas = ({
  strokes,
  setStrokes,
  activeTool,
  color,
  brushSize,
  cursors,
  emitDraw,
  emitCursorMove,
  userId,
  username,
  undoStack,
  setUndoStack,
  redoStack,
  setRedoStack,
  selectedSticker = null,
  stickerSize = 64,
  onPlacementModeChange,
  onStickerSizeChange
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fillImageCache = useRef({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [remoteActiveStrokes, setRemoteActiveStrokes] = useState({});
  const [activePlacement, setActivePlacement] = useState(null);
  const [stickerDraft, setStickerDraft] = useState(null);
  const [touchPreview, setTouchPreview] = useState(null);

  const isDrawingRef = useRef(false);
  const activeToolRef = useRef(activeTool);
  const colorRef = useRef(color);
  const brushSizeRef = useRef(brushSize);
  const selectedStickerRef = useRef(selectedSticker);
  const stickerSizeRef = useRef(stickerSize);
  const stickerDraftRef = useRef(stickerDraft);

  useEffect(() => {
    activeToolRef.current = activeTool;
    colorRef.current = color;
    brushSizeRef.current = brushSize;
  }, [activeTool, color, brushSize]);

  useEffect(() => {
    selectedStickerRef.current = selectedSticker;
    stickerSizeRef.current = stickerSize;
  }, [selectedSticker, stickerSize]);

  useEffect(() => {
    stickerDraftRef.current = stickerDraft;
    onPlacementModeChange?.(!!stickerDraft || !!activePlacement);
  }, [stickerDraft, activePlacement, onPlacementModeChange]);

  useEffect(() => {
    isDrawingRef.current = isDrawing;
    window.__paintsyncDrawing = isDrawing || !!stickerDraft;
  }, [isDrawing, stickerDraft]);

  const commitStroke = useCallback(
    (stroke) => {
      setStrokes((prev) => [...prev, stroke]);
      setUndoStack((prev) => {
        const updated = [...prev, stroke];
        if (updated.length > 20) updated.shift();
        return updated;
      });
      setRedoStack([]);
      emitDraw({ type: 'complete', userId, stroke, isComplete: true });
    },
    [setStrokes, setUndoStack, setRedoStack, emitDraw, userId]
  );

  const getLocalActiveStroke = useCallback(() => {
    if (!startPoint) return null;
    const tool = activeToolRef.current;
    const baseStroke = {
      userId,
      username,
      tool,
      color: tool === 'eraser' ? '#ffffff' : colorRef.current,
      size: brushSizeRef.current
    };
    if (STROKE_TOOLS.has(tool)) return { ...baseStroke, points: currentPoints };
    const last = currentPoints[currentPoints.length - 1];
    if (!last) return null;
    return { ...baseStroke, startPoint, endPoint: last };
  }, [startPoint, currentPoints, userId, username]);

  const redrawCanvasRef = useRef(() => {});

  const drawFillStroke = (ctx, stroke) => {
    if (!stroke.dataUrl) return;
    let img = fillImageCache.current[stroke.dataUrl];
    if (!img) {
      img = new Image();
      img.src = stroke.dataUrl;
      img.onload = () => redrawCanvasRef.current();
      fillImageCache.current[stroke.dataUrl] = img;
    }
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, stroke.x, stroke.y, stroke.width, stroke.height);
    }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.tool === 'fill') drawFillStroke(ctx, stroke);
      else drawStroke(ctx, stroke);
    });

    Object.values(remoteActiveStrokes).forEach((stroke) => {
      if (stroke.tool === 'fill') drawFillStroke(ctx, stroke);
      else drawStroke(ctx, stroke);
    });

    if (isDrawing && startPoint) {
      const local = getLocalActiveStroke();
      if (local) drawStroke(ctx, local);
    }
  }, [strokes, remoteActiveStrokes, isDrawing, startPoint, getLocalActiveStroke]);

  redrawCanvasRef.current = redrawCanvas;

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    window.handleRemoteDraw = (drawData) => {
      if (!drawData) return;
      const { type, stroke, userId: senderId } = drawData;
      if (type === 'preview') {
        setRemoteActiveStrokes((prev) => ({ ...prev, [senderId]: stroke }));
      } else if (type === 'complete') {
        setRemoteActiveStrokes((prev) => {
          const copy = { ...prev };
          delete copy[senderId];
          return copy;
        });
        setStrokes((prev) => [...prev, stroke]);
      }
    };
    return () => delete window.handleRemoteDraw;
  }, [setStrokes]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches?.[0];
    const clientX = t ? t.clientX : e.clientX;
    const clientY = t ? t.clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const setDrawingLock = useCallback((locked) => {
    isDrawingRef.current = locked;
    window.__paintsyncDrawing = locked || !!stickerDraftRef.current;
  }, []);

  const handleFill = (coords) => {
    const patch = createFillPatch(strokes, coords.x, coords.y, colorRef.current);
    if (!patch) return;
    commitStroke({ ...patch, userId, username, size: 1 });
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const startStickerDraft = (coords) => {
    if (!selectedStickerRef.current) return;
    setStickerDraft({
      emoji: selectedStickerRef.current,
      canvasX: coords.x,
      canvasY: coords.y,
      size: stickerSizeRef.current
    });
  };

  const placeStickerDraft = () => {
    const draft = stickerDraftRef.current;
    if (!draft?.emoji) return;
    commitStroke({
      userId,
      username,
      tool: 'sticker',
      color: '#ffffff',
      size: draft.size,
      startPoint: { x: draft.canvasX, y: draft.canvasY },
      text: draft.emoji
    });
    setStickerDraft(null);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleStart = (e) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    if (activeToolRef.current === 'fill') {
      handleFill(coords);
      return;
    }

    if (activeToolRef.current === 'sticker') {
      if (stickerDraftRef.current) {
        setStickerDraft((d) => (d ? { ...d, canvasX: coords.x, canvasY: coords.y } : d));
      } else {
        startStickerDraft(coords);
      }
      return;
    }

    if (activeToolRef.current === 'text') {
      setActivePlacement({
        canvasX: coords.x,
        canvasY: coords.y,
        text: '',
        type: 'text',
        size: 32,
        color: colorRef.current
      });
      return;
    }

    setIsDrawing(true);
    setDrawingLock(true);
    setStartPoint({ x: coords.x, y: coords.y });
    setCurrentPoints([{ x: coords.x, y: coords.y }]);
    setTouchPreview({ x: coords.x, y: coords.y });

    const tool = activeToolRef.current;
    const base = {
      userId,
      username,
      tool,
      color: tool === 'eraser' ? '#ffffff' : colorRef.current,
      size: brushSizeRef.current
    };
    const activeStroke = STROKE_TOOLS.has(tool)
      ? { ...base, points: [{ x: coords.x, y: coords.y }] }
      : { ...base, startPoint: { x: coords.x, y: coords.y }, endPoint: { x: coords.x, y: coords.y } };

    emitDraw({ type: 'preview', userId, stroke: activeStroke });
  };

  const handleMove = (e) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    emitCursorMove(coords.x, coords.y);

    if (stickerDraftRef.current && activeToolRef.current === 'sticker') {
      setStickerDraft((d) => (d ? { ...d, canvasX: coords.x, canvasY: coords.y } : d));
      return;
    }

    if (isDrawingRef.current) setTouchPreview({ x: coords.x, y: coords.y });
    if (!isDrawingRef.current || activeToolRef.current === 'text') return;

    setCurrentPoints((prev) => {
      const updated = [...prev, { x: coords.x, y: coords.y }];
      const tool = activeToolRef.current;
      const base = {
        userId,
        username,
        tool,
        color: tool === 'eraser' ? '#ffffff' : colorRef.current,
        size: brushSizeRef.current
      };
      const activeStroke = STROKE_TOOLS.has(tool)
        ? { ...base, points: updated }
        : { ...base, startPoint, endPoint: { x: coords.x, y: coords.y } };
      emitDraw({ type: 'preview', userId, stroke: activeStroke });
      return updated;
    });
  };

  const handleEnd = () => {
    if (activeToolRef.current === 'sticker' || activeToolRef.current === 'text' || activeToolRef.current === 'fill') return;
    if (!isDrawingRef.current) return;

    setIsDrawing(false);
    setDrawingLock(false);
    setTouchPreview(null);
    if (navigator.vibrate) navigator.vibrate(8);

    const finalStroke = getLocalActiveStroke();
    if (finalStroke) commitStroke(finalStroke);
    setStartPoint(null);
    setCurrentPoints([]);
  };

  const handlePlacementSubmit = () => {
    if (!activePlacement?.text?.trim()) {
      setActivePlacement(null);
      return;
    }
    commitStroke({
      userId,
      username,
      tool: 'text',
      color: activePlacement.color,
      size: activePlacement.size,
      startPoint: { x: activePlacement.canvasX, y: activePlacement.canvasY },
      text: activePlacement.text.trim()
    });
    setActivePlacement(null);
  };

  const handlersRef = useRef({});
  handlersRef.current = { handleStart, handleMove, handleEnd };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;

    const onTouchStart = (e) => {
      if (e.cancelable) e.preventDefault();
      handlersRef.current.handleStart(e);
    };
    const onTouchMove = (e) => {
      if (e.cancelable) e.preventDefault();
      handlersRef.current.handleMove(e);
    };
    const onTouchEnd = (e) => {
      if (e.cancelable) e.preventDefault();
      handlersRef.current.handleEnd(e);
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

    const stopScroll = (e) => {
      if (isDrawingRef.current && e.cancelable) e.preventDefault();
    };
    container?.addEventListener('touchmove', stopScroll, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      container?.removeEventListener('touchmove', stopScroll);
    };
  }, []);

  const previewColor =
    activeTool === 'eraser' ? '#ffffff' : activeTool === 'highlighter' ? `${color}99` : color;
  const previewSize = Math.min(brushSize * (activeTool === 'highlighter' ? 1.8 : activeTool === 'glow' ? 1.4 : 1), 48);

  const cursorClass =
    activeTool === 'fill'
      ? 'cursor-cell'
      : activeTool === 'sticker'
        ? 'cursor-copy'
        : 'cursor-crosshair';

  return (
    <>
      {stickerDraft && (
        <StickerPlacementBar
          emoji={stickerDraft.emoji}
          size={stickerDraft.size}
          onSizeChange={(s) => {
            setStickerDraft((d) => (d ? { ...d, size: s } : d));
            onStickerSizeChange?.(s);
          }}
          onPlace={placeStickerDraft}
          onCancel={() => setStickerDraft(null)}
        />
      )}

      <div
        ref={containerRef}
        className="canvas-stage-host flex-1 min-h-0 draw-surface rounded-2xl border border-dark-border/50 bg-[var(--color-canvas-bg)]/80"
      >
        <div className="canvas-square draw-surface">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            className={`canvas-grid-bg block w-full h-full draw-surface ${cursorClass}`}
            style={{ touchAction: 'none' }}
          />

          {stickerDraft && (
            <div
              className="pointer-events-none absolute z-30 select-none"
              style={{
                left: `${(stickerDraft.canvasX / CANVAS_WIDTH) * 100}%`,
                top: `${(stickerDraft.canvasY / CANVAS_HEIGHT) * 100}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${stickerDraft.size}px`,
                lineHeight: 1,
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'
              }}
            >
              {stickerDraft.emoji}
            </div>
          )}

          {touchPreview && isDrawing && (
            <div
              className="pointer-events-none absolute rounded-full border-2 border-white/50 z-20"
              style={{
                left: `${(touchPreview.x / CANVAS_WIDTH) * 100}%`,
                top: `${(touchPreview.y / CANVAS_HEIGHT) * 100}%`,
                width: previewSize,
                height: previewSize,
                transform: 'translate(-50%, -50%)',
                backgroundColor: previewColor,
                opacity: 0.55
              }}
            />
          )}

          {activePlacement?.type === 'text' && (
            <div
              className="absolute z-40 left-1/2 -translate-x-1/2 bottom-4 w-[min(100%,280px)] pinterest-panel p-4 rounded-2xl shadow-2xl border-primary-soft"
            >
              <p className="text-xs font-bold text-white mb-2">Add text</p>
              <input
                type="text"
                autoFocus
                value={activePlacement.text}
                onChange={(e) => setActivePlacement({ ...activePlacement, text: e.target.value })}
                placeholder="Type here…"
                style={{ color: activePlacement.color }}
                className="w-full pinterest-input px-3 py-2.5 text-sm font-semibold mb-3"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePlacement(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#523838] text-sm font-bold text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePlacementSubmit}
                  disabled={!activePlacement.text.trim()}
                  className="flex-1 py-2.5 rounded-xl btn-primary text-sm font-bold disabled:opacity-40 cursor-pointer"
                >
                  Place text
                </button>
              </div>
            </div>
          )}

          {Object.entries(cursors).map(([cUserId, cursor]) => {
            if (cUserId === userId) return null;
            const pctX = (cursor.x / CANVAS_WIDTH) * 100;
            const pctY = (cursor.y / CANVAS_HEIGHT) * 100;
            return (
              <div
                key={cUserId}
                className="floating-cursor-label absolute pointer-events-none flex flex-col items-start"
                style={{ left: `${pctX}%`, top: `${pctY}%` }}
              >
                <MousePointer size={18} style={{ color: cursor.color, fill: cursor.color }} className="-rotate-90" />
                <span
                  style={{ backgroundColor: cursor.color }}
                  className="text-[9px] font-bold text-[#1F1313] px-2 py-0.5 rounded-full whitespace-nowrap"
                >
                  {cursor.username}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Canvas;
