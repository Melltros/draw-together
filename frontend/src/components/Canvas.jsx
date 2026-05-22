import React, { useRef, useEffect, useState } from 'react';
import { MousePointer, Check, X, RotateCcw } from 'lucide-react';

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
  setRedoStack
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

    if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
      if (stroke.points && stroke.points.length > 0) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
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
    
    const baseStroke = {
      userId,
      username,
      tool: activeTool,
      color: activeTool === 'eraser' ? '#ffffff' : color,
      size: brushSize
    };

    if (activeTool === 'pen' || activeTool === 'eraser') {
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

  // Sync window emoji stamps to activePlacement state
  useEffect(() => {
    const checkStickerChange = setInterval(() => {
      if (window.selectedEmoji) {
        // Find center of canvas or set active placement
        setActivePlacement({
          canvasX: CANVAS_WIDTH / 2 - 40,
          canvasY: CANVAS_HEIGHT / 2 - 40,
          text: window.selectedEmoji,
          type: 'sticker',
          size: 80,
          color: '#ffffff'
        });
        window.selectedEmoji = null;
      }
    }, 150);
    return () => clearInterval(checkStickerChange);
  }, []);

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

  // Mouse Down / Touch Start
  const handleStart = (e) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    if (activeTool === 'text') {
      setActivePlacement({
        canvasX: coords.x,
        canvasY: coords.y,
        text: '',
        type: 'text',
        size: 32,
        color: color
      });
      return;
    }

    setIsDrawing(true);
    setStartPoint({ x: coords.x, y: coords.y });
    setCurrentPoints([{ x: coords.x, y: coords.y }]);

    const baseStroke = {
      userId,
      username,
      tool: activeTool,
      color: activeTool === 'eraser' ? '#ffffff' : color,
      size: brushSize
    };
    
    const activeStroke = activeTool === 'pen' || activeTool === 'eraser' 
      ? { ...baseStroke, points: [{ x: coords.x, y: coords.y }] }
      : { ...baseStroke, startPoint: { x: coords.x, y: coords.y }, endPoint: { x: coords.x, y: coords.y } };

    emitDraw({
      type: 'preview',
      userId,
      stroke: activeStroke
    });
  };

  // Mouse Move / Touch Move
  const handleMove = (e) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    emitCursorMove(coords.x, coords.y);

    if (!isDrawing || activeTool === 'text') return;

    setCurrentPoints((prev) => {
      const updated = [...prev, { x: coords.x, y: coords.y }];
      
      const baseStroke = {
        userId,
        username,
        tool: activeTool,
        color: activeTool === 'eraser' ? '#ffffff' : color,
        size: brushSize
      };

      const activeStroke = activeTool === 'pen' || activeTool === 'eraser'
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

  // Mouse Up / Touch End
  const handleEnd = () => {
    if (!isDrawing || activeTool === 'text') return;
    setIsDrawing(false);

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

  // Commits the active text or sticker onto the canvas
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

  // Helper to convert internal canvas coords to css percent
  const getPercentCoords = (canvasX, canvasY) => {
    return {
      x: (canvasX / CANVAS_WIDTH) * 100,
      y: (canvasY / CANVAS_HEIGHT) * 100
    };
  };

  const activePct = activePlacement ? getPercentCoords(activePlacement.canvasX, activePlacement.canvasY) : null;

  return (
    <div ref={containerRef} className="relative flex-1 h-full w-full bg-[#0D0D12] overflow-hidden rounded-2xl border border-dark-border/40">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className="canvas-grid-bg w-full h-full cursor-crosshair max-w-full max-h-full block rounded-2xl"
      />

      {/* Interactive Text & Sticker Editor Overlay */}
      {activePlacement && activePct && (
        <div
          className="absolute z-40 bg-dark-sidebar/95 border border-purple-500/40 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 min-w-[220px]"
          style={{
            left: `${activePct.x}%`,
            top: `${activePct.y}%`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-15px'
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-dark-border/40 pb-1.5">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
              Editing {activePlacement.type}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePlacementSubmit}
                className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-all"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => setActivePlacement(null)}
                className="w-5 h-5 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/30 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {activePlacement.type === 'text' ? (
            <input
              type="text"
              autoFocus
              value={activePlacement.text}
              onChange={(e) => setActivePlacement({ ...activePlacement, text: e.target.value })}
              placeholder="Enter text..."
              className="bg-dark-card border border-dark-border/50 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500/60"
            />
          ) : (
            <div className="text-center py-1">
              <span style={{ fontSize: `${activePlacement.size * 0.75}px` }}>
                {activePlacement.text}
              </span>
            </div>
          )}

          {/* Real-time Resizer Slider */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center justify-between text-[9px] font-bold text-gray-500">
              <span>Size</span>
              <span>{activePlacement.size}px</span>
            </div>
            <input
              type="range"
              min="16"
              max="160"
              value={activePlacement.size}
              onChange={(e) => setActivePlacement({ ...activePlacement, size: parseInt(e.target.value) })}
              className="w-full"
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
  );
};

export default Canvas;
