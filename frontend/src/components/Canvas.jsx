import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MousePointer, Check, X, Move } from 'lucide-react';

const STROKE_TOOLS = new Set(['pen', 'eraser', 'highlighter', 'glow']);

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
  stickerSize = 64
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoints, setCurrentPoints] = useState([]);
  
  // Remote active strokes cache (user drawing live shapes or pen strokes)
  const [remoteActiveStrokes, setRemoteActiveStrokes] = useState({});

  // Interactive Text / Sticker Placement State
  const [activePlacement, setActivePlacement] = useState(null); // { canvasX, canvasY, text, type: 'text'|'sticker', size, color }

  // Dragging placement state
  const [isDraggingPlacement, setIsDraggingPlacement] = useState(false);
  const [touchPreview, setTouchPreview] = useState(null);
  const dragStartRef = useRef({ x: 0, y: 0, placementX: 0, placementY: 0 });
  const isDrawingRef = useRef(false);
  const activeToolRef = useRef(activeTool);
  const colorRef = useRef(color);
  const brushSizeRef = useRef(brushSize);
  const selectedStickerRef = useRef(selectedSticker);
  const stickerSizeRef = useRef(stickerSize);

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
    isDrawingRef.current = isDrawing;
    window.__paintsyncDrawing = isDrawing;
  }, [isDrawing]);

  // Fixed internal backing store dimensions (Square 1600x1600 gives mobile 2.5x more vertical space!)
  const CANVAS_WIDTH = 1600;
  const CANVAS_HEIGHT = 1600;

  // 1. Drawing helper function
  const drawStroke = (ctx, stroke) => {
    if (!stroke) return;
    
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    if (STROKE_TOOLS.has(stroke.tool)) {
      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.38;
        ctx.lineWidth = stroke.size * 1.8;
      } else if (stroke.tool === 'glow') {
        ctx.lineWidth = Math.max(stroke.size, 3);
        ctx.shadowBlur = stroke.size * 2.5;
        ctx.shadowColor = stroke.color;
        ctx.strokeStyle = stroke.color;
      }
      if (stroke.points && stroke.points.length > 0) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        if (stroke.tool === 'glow') {
          ctx.shadowBlur = stroke.size * 1.2;
          ctx.globalAlpha = 0.85;
          ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    } else if (stroke.tool === 'line') {
      if (stroke.startPoint && stroke.endPoint) {
        ctx.moveTo(stroke.startPoint.x, stroke.startPoint.y);
        ctx.lineTo(stroke.endPoint.x, stroke.endPoint.y);
        ctx.stroke();
      }
    } else if (stroke.tool === 'rect') {
      if (stroke.startPoint && stroke.endPoint) {
        const x = stroke.startPoint.x;
        const y = stroke.startPoint.y;
        const w = stroke.endPoint.x - x;
        const h = stroke.endPoint.y - y;
        ctx.strokeRect(x, y, w, h);
      }
    } else if (stroke.tool === 'circle') {
      if (stroke.startPoint && stroke.endPoint) {
        const x = stroke.startPoint.x;
        const y = stroke.startPoint.y;
        const rx = stroke.endPoint.x - x;
        const ry = stroke.endPoint.y - y;
        const radius = Math.sqrt(rx * rx + ry * ry);
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else if (stroke.tool === 'text') {
      if (stroke.startPoint && stroke.text) {
        ctx.fillStyle = stroke.color;
        ctx.font = `${stroke.size}px Outfit, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(stroke.text, stroke.startPoint.x, stroke.startPoint.y);
      }
    } else if (stroke.tool === 'sticker') {
      if (stroke.startPoint && stroke.text) {
        ctx.font = `${stroke.size}px Outfit, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(stroke.text, stroke.startPoint.x, stroke.startPoint.y);
      }
    }

    ctx.restore();
  };

  // 2. Redraw canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw completed
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke);
    });

    // Draw remote active
    Object.values(remoteActiveStrokes).forEach((stroke) => {
      drawStroke(ctx, stroke);
    });

    // Draw local preview
    if (isDrawing) {
      const localActiveStroke = getLocalActiveStroke();
      if (localActiveStroke) {
        drawStroke(ctx, localActiveStroke);
      }
    }
  };

  const getLocalActiveStroke = () => {
    if (!startPoint) return null;
    const tool = activeToolRef.current;

    const baseStroke = {
      userId,
      username,
      tool,
      color: tool === 'eraser' ? '#ffffff' : colorRef.current,
      size: brushSizeRef.current
    };

    if (STROKE_TOOLS.has(tool)) {
      return { ...baseStroke, points: currentPoints };
    } else {
      const lastPoint = currentPoints[currentPoints.length - 1];
      if (!lastPoint) return null;
      return {
        ...baseStroke,
        startPoint,
        endPoint: lastPoint
      };
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [strokes, remoteActiveStrokes, isDrawing, currentPoints]);

  useEffect(() => {
    const handleRemoteDraw = (drawData) => {
      if (!drawData) return;
      const { type, stroke, userId: senderId } = drawData;

      if (type === 'preview') {
        setRemoteActiveStrokes((prev) => ({
          ...prev,
          [senderId]: stroke
        }));
      } else if (type === 'complete') {
        setRemoteActiveStrokes((prev) => {
          const copy = { ...prev };
          delete copy[senderId];
          return copy;
        });
        setStrokes((prev) => [...prev, stroke]);
      }
    };

    window.handleRemoteDraw = handleRemoteDraw;
    return () => {
      delete window.handleRemoteDraw;
    };
  }, [setStrokes]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    const hasTouches = e.touches && e.touches.length > 0;
    const clientX = hasTouches ? e.touches[0].clientX : e.clientX;
    const clientY = hasTouches ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    
    return { x, y };
  };

  const setDrawingLock = useCallback((locked) => {
    isDrawingRef.current = locked;
    window.__paintsyncDrawing = locked;
  }, []);

  const handleStart = (e) => {
    const coords = getCoordinates(e);
    if (!coords) return;

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

    if (activeToolRef.current === 'sticker' && selectedStickerRef.current) {
      setActivePlacement({
        canvasX: coords.x,
        canvasY: coords.y,
        text: selectedStickerRef.current,
        type: 'sticker',
        size: stickerSizeRef.current,
        color: '#ffffff'
      });
      return;
    }

    setIsDrawing(true);
    setDrawingLock(true);
    setStartPoint({ x: coords.x, y: coords.y });
    setCurrentPoints([{ x: coords.x, y: coords.y }]);
    setTouchPreview({ x: coords.x, y: coords.y });

    const tool = activeToolRef.current;
    const baseStroke = {
      userId,
      username,
      tool,
      color: tool === 'eraser' ? '#ffffff' : colorRef.current,
      size: brushSizeRef.current
    };

    const activeStroke = STROKE_TOOLS.has(tool)
      ? { ...baseStroke, points: [{ x: coords.x, y: coords.y }] }
      : { ...baseStroke, startPoint: { x: coords.x, y: coords.y }, endPoint: { x: coords.x, y: coords.y } };

    emitDraw({
      type: 'preview',
      userId,
      stroke: activeStroke
    });
  };

  const handleMove = (e) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    emitCursorMove(coords.x, coords.y);
    if (isDrawingRef.current) {
      setTouchPreview({ x: coords.x, y: coords.y });
    }

    if (!isDrawingRef.current || activeToolRef.current === 'text' || activeToolRef.current === 'sticker') return;

    setCurrentPoints((prev) => {
      const updated = [...prev, { x: coords.x, y: coords.y }];
      const tool = activeToolRef.current;
      const baseStroke = {
        userId,
        username,
        tool,
        color: tool === 'eraser' ? '#ffffff' : colorRef.current,
        size: brushSizeRef.current
      };

      const activeStroke = STROKE_TOOLS.has(tool)
        ? { ...baseStroke, points: updated }
        : { ...baseStroke, startPoint, endPoint: { x: coords.x, y: coords.y } };

      emitDraw({
        type: 'preview',
        userId,
        stroke: activeStroke
      });

      return updated;
    });
  };

  const handleEnd = () => {
    if (!isDrawingRef.current || activeToolRef.current === 'text' || activeToolRef.current === 'sticker') return;
    setIsDrawing(false);
    setDrawingLock(false);
    setTouchPreview(null);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }

    const finalStroke = getLocalActiveStroke();
    if (finalStroke) {
      setStrokes((prev) => [...prev, finalStroke]);
      setUndoStack((prev) => {
        const updated = [...prev, finalStroke];
        if (updated.length > 20) updated.shift();
        return updated;
      });
      setRedoStack([]);

      emitDraw({
        type: 'complete',
        userId,
        stroke: finalStroke,
        isComplete: true
      });
    }

    setStartPoint(null);
    setCurrentPoints([]);
  };

  const handlersRef = useRef({ handleStart, handleMove, handleEnd });
  handlersRef.current = { handleStart, handleMove, handleEnd };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;

    const onTouchStart = (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      handlersRef.current.handleStart(e);
    };
    const onTouchMove = (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      handlersRef.current.handleMove(e);
    };
    const onTouchEnd = (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
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

  // Dragging handling for placement
  const handleDragStart = (e) => {
    e.stopPropagation();
    const hasTouches = e.touches && e.touches.length > 0;
    const clientX = hasTouches ? e.touches[0].clientX : e.clientX;
    const clientY = hasTouches ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      placementX: activePlacement.canvasX,
      placementY: activePlacement.canvasY
    };
    setIsDraggingPlacement(true);
  };

  useEffect(() => {
    if (!isDraggingPlacement) return;

    const handleDragMove = (e) => {
      const hasTouches = e.touches && e.touches.length > 0;
      const clientX = hasTouches ? e.touches[0].clientX : e.clientX;
      const clientY = hasTouches ? e.touches[0].clientY : e.clientY;

      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      // Convert screen delta to canvas delta
      const canvasDx = dx * (CANVAS_WIDTH / rect.width);
      const canvasDy = dy * (CANVAS_HEIGHT / rect.height);

      setActivePlacement((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          canvasX: dragStartRef.current.placementX + canvasDx,
          canvasY: dragStartRef.current.placementY + canvasDy
        };
      });
    };

    const handleDragEnd = () => {
      setIsDraggingPlacement(false);
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: true });
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDraggingPlacement]);

  const handlePlacementSubmit = () => {
    if (activePlacement && activePlacement.text.trim()) {
      const isSticker = activePlacement.type === 'sticker';
      const stroke = {
        userId,
        username,
        tool: isSticker ? 'sticker' : 'text',
        color: isSticker ? '#ffffff' : activePlacement.color,
        size: activePlacement.size,
        startPoint: { x: activePlacement.canvasX, y: activePlacement.canvasY },
        text: activePlacement.text.trim()
      };

      setStrokes((prev) => [...prev, stroke]);
      setUndoStack((prev) => {
        const updated = [...prev, stroke];
        if (updated.length > 20) updated.shift();
        return updated;
      });
      setRedoStack([]);

      emitDraw({
        type: 'complete',
        userId,
        stroke,
        isComplete: true
      });
    }
    setActivePlacement(null);
  };

  const previewColor =
    activeTool === 'eraser'
      ? '#ffffff'
      : activeTool === 'highlighter'
        ? `${color}99`
        : activeTool === 'glow'
          ? color
          : color;
  const previewSize = Math.min(
    brushSize * (activeTool === 'highlighter' ? 1.8 : activeTool === 'glow' ? 1.4 : 1),
    48
  );
  const previewGlow = activeTool === 'glow' ? `0 0 ${brushSize * 2}px ${color}` : undefined;

  return (
    <div
      ref={containerRef}
      className="draw-surface relative flex-1 h-full w-full bg-[#0D0D12] overflow-hidden rounded-2xl border border-dark-border/40 flex items-center justify-center min-h-0 min-w-0"
    >
      <div className="relative aspect-square max-w-full max-h-full draw-surface">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          className="canvas-grid-bg w-full h-full cursor-crosshair block rounded-2xl shadow-2xl draw-surface"
        />

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
              boxShadow: previewGlow,
              opacity: activeTool === 'highlighter' ? 0.45 : activeTool === 'eraser' ? 0.2 : activeTool === 'glow' ? 0.75 : 0.55
            }}
          />
        )}

        {/* Interactive Resizable & Draggable Overlay */}
        {activePlacement && (
          <div
            className="absolute z-40 bg-[#352323]/98 border border-[#C73543]/50 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5 min-w-[220px] max-w-[90vw]"
            style={{
              left: `${(activePlacement.canvasX / CANVAS_WIDTH) * 100}%`,
              top: `${(activePlacement.canvasY / CANVAS_HEIGHT) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Header / Drag Bar */}
            <div
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              className="flex items-center justify-between gap-3 border-b border-dark-border/40 pb-2 cursor-move select-none"
            >
              <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-[#F7C7CB] uppercase tracking-widest">
                <Move size={11} />
                <span>{activePlacement.type === 'sticker' ? 'Drag sticker' : 'Drag text'}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePlacementSubmit}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/80 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-500 transition-all cursor-pointer"
                >
                  <Check size={12} /> Place
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlacement(null)}
                  className="px-2 py-1 rounded-lg bg-rose-500/30 text-rose-300 text-[10px] font-bold hover:bg-rose-500/50 transition-all cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Content Input or Emoji stamp */}
            {activePlacement.type === 'text' ? (
              <input
                type="text"
                autoFocus
                value={activePlacement.text}
                onChange={(e) => setActivePlacement({ ...activePlacement, text: e.target.value })}
                placeholder="Type here..."
                style={{ color: activePlacement.color }}
                className="bg-dark-card border border-dark-border/50 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500/60 font-medium"
              />
            ) : (
              <div className="text-center py-2 select-none">
                <span style={{ fontSize: `${activePlacement.size * 0.5}px` }}>
                  {activePlacement.text}
                </span>
              </div>
            )}

            {/* Size Resizer Slider */}
            <div className="flex flex-col gap-1 select-none">
              <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                <span>Scale</span>
                <span>{activePlacement.size}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="180"
                value={activePlacement.size}
                onChange={(e) => setActivePlacement({ ...activePlacement, size: parseInt(e.target.value) })}
                className="w-full cursor-ew-resize"
              />
            </div>
          </div>
        )}

        {/* Render Active Other Painter Cursors */}
        {Object.entries(cursors).map(([cUserId, cursor]) => {
          const canvas = canvasRef.current;
          if (!canvas) return null;
          if (cUserId === userId) return null;

          const pctX = (cursor.x / CANVAS_WIDTH) * 100;
          const pctY = (cursor.y / CANVAS_HEIGHT) * 100;

          return (
            <div
              key={cUserId}
              className="floating-cursor-label absolute pointer-events-none transition-all duration-75 flex flex-col items-start gap-1"
              style={{
                left: `${pctX}%`,
                top: `${pctY}%`
              }}
            >
              <MousePointer
                size={18}
                style={{
                  color: cursor.color,
                  fill: cursor.color
                }}
                className="drop-shadow-lg transform -rotate-90 -translate-x-1 -translate-y-1"
              />
              <span
                style={{ backgroundColor: cursor.color }}
                className="text-[9px] font-bold text-dark-bg px-2 py-0.5 rounded-full shadow-md whitespace-nowrap -translate-x-2 -translate-y-1 opacity-90 border border-black/10"
              >
                {cursor.username}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Canvas;
