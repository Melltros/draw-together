import React, { useRef, useEffect, useState } from 'react';
import { MousePointer } from 'lucide-react';

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
  // userId -> stroke
  const [remoteActiveStrokes, setRemoteActiveStrokes] = useState({});

  // Floating text input state
  const [textInput, setTextInput] = useState(null); // { x, y, canvasX, canvasY }
  const [textVal, setTextVal] = useState('');

  // Fixed internal backing store dimensions (ensures scaling is identical for all users)
  const CANVAS_WIDTH = 2000;
  const CANVAS_HEIGHT = 1200;

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
      // destination-out removes elements beneath it (transparent eraser)
      ctx.globalCompositeOperation = 'destination-out';
      // To see eraser properly on transparency, we use thick width
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
        ctx.font = `${stroke.size * 3 + 12}px Outfit, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(stroke.text, stroke.startPoint.x, stroke.startPoint.y);
      }
    }

    ctx.restore();
  };

  // 2. Redraw canvas whenever strokes or remote active strokes change
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear whole canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke);
    });

    // Draw all active remote strokes (other users drawing live)
    Object.values(remoteActiveStrokes).forEach((stroke) => {
      drawStroke(ctx, stroke);
    });

    // Draw local active stroke (current user drawing preview)
    if (isDrawing) {
      const localActiveStroke = getLocalActiveStroke();
      if (localActiveStroke) {
        drawStroke(ctx, localActiveStroke);
      }
    }
  };

  // Get active stroke based on mouse positions
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

  // Trigger redraw on state updates
  useEffect(() => {
    redrawCanvas();
  }, [strokes, remoteActiveStrokes, isDrawing, currentPoints]);

  // Listen for socket events targeting drawing updates from remote users
  // We handle incoming socket messages inside Canvas
  useEffect(() => {
    const handleRemoteDraw = (drawData) => {
      if (!drawData) return;

      const { type, stroke, userId: senderId } = drawData;

      if (type === 'preview') {
        // Update remote active strokes cache
        setRemoteActiveStrokes((prev) => ({
          ...prev,
          [senderId]: stroke
        }));
      } else if (type === 'complete') {
        // Remove from remote active cache
        setRemoteActiveStrokes((prev) => {
          const copy = { ...prev };
          delete copy[senderId];
          return copy;
        });
        
        // Add to permanent strokes
        setStrokes((prev) => [...prev, stroke]);
      }
    };

    // Store in global window or handle dynamically in parent component
    window.handleRemoteDraw = handleRemoteDraw;
    
    return () => {
      delete window.handleRemoteDraw;
    };
  }, [setStrokes]);

  // Convert client cursor coords to internal scaled coordinates
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    // Support both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    
    // Percentages for floating overlays
    const pctX = ((clientX - rect.left) / rect.width) * 100;
    const pctY = ((clientY - rect.top) / rect.height) * 100;

    return { x, y, pctX, pctY };
  };

  // 3. Mouse Down / Touch Start
  const handleStart = (e) => {
    if (activeTool === 'text') {
      const coords = getCoordinates(e);
      if (!coords) return;

      // Calculate relative percentage coordinates of click on client viewport bounds
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      setTextInput({
        x,
        y,
        canvasX: coords.x,
        canvasY: coords.y
      });
      setTextVal('');
      return;
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setStartPoint({ x: coords.x, y: coords.y });
    setCurrentPoints([{ x: coords.x, y: coords.y }]);

    // Emit live preview
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

  // 4. Mouse Move / Touch Move
  const handleMove = (e) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    // Throttle cursor synchronization to prevent network congestion
    emitCursorMove(coords.x, coords.y);

    if (!isDrawing || activeTool === 'text') return;

    setCurrentPoints((prev) => {
      const updated = [...prev, { x: coords.x, y: coords.y }];
      
      // Emit live updates to sockets so others can see progress
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

  // 5. Mouse Up / Touch End / Mouse Leave
  const handleEnd = () => {
    if (!isDrawing || activeTool === 'text') return;
    setIsDrawing(false);

    const finalStroke = getLocalActiveStroke();
    if (finalStroke) {
      // 1. Add to local strokes
      setStrokes((prev) => [...prev, finalStroke]);

      // 2. Manage local history for Undo/Redo (limit to last 20 actions)
      setUndoStack((prev) => {
        const updated = [...prev, finalStroke];
        if (updated.length > 20) updated.shift(); // Keep last 20
        return updated;
      });
      // Clear redo stack on new action
      setRedoStack([]);

      // 3. Emit completed action via Socket to broadcast and store in room state
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

  // 6. Text Submit Handler
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textVal.trim() && textInput) {
      const textStroke = {
        userId,
        username,
        tool: 'text',
        color,
        size: brushSize,
        startPoint: { x: textInput.canvasX, y: textInput.canvasY },
        text: textVal.trim()
      };

      setStrokes((prev) => [...prev, textStroke]);
      setUndoStack((prev) => {
        const updated = [...prev, textStroke];
        if (updated.length > 20) updated.shift();
        return updated;
      });
      setRedoStack([]);

      emitDraw({
        type: 'complete',
        userId,
        stroke: textStroke,
        isComplete: true
      });
    }
    setTextInput(null);
    setTextVal('');
  };

  // Prevent default scrolling behaviour on mobile touches inside canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefaultTouch = (e) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    canvas.addEventListener('touchmove', preventDefaultTouch, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefaultTouch);
      canvas.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 h-full w-full bg-[#121215] overflow-hidden rounded-2xl border border-dark-border shadow-glow-primary">
      {/* Canvas Elements */}
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

      {/* Floating Text Input Box Overlay */}
      {textInput && (
        <form
          onSubmit={handleTextSubmit}
          className="absolute"
          style={{
            left: `${textInput.x}px`,
            top: `${textInput.y}px`,
            zIndex: 50
          }}
        >
          <input
            type="text"
            autoFocus
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            onBlur={handleTextSubmit}
            placeholder="Type text, hit Enter..."
            style={{
              color: color,
              fontSize: `${brushSize * 1.5 + 12}px`,
              fontFamily: 'Outfit, sans-serif'
            }}
            className="bg-dark-sidebar/95 border border-indigo-500 rounded-lg px-2 py-1 outline-none shadow-xl shadow-indigo-500/10 min-w-[200px]"
          />
        </form>
      )}

      {/* Render Active Other Painter Cursors */}
      {Object.entries(cursors).map(([cUserId, cursor]) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        
        // Skip rendering our own cursor
        if (cUserId === userId) return null;

        // Map cursor coordinate { x, y } onto display coordinates in percentages
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
            {/* Cursor Icon with User Color */}
            <MousePointer
              size={18}
              style={{
                color: cursor.color,
                fill: cursor.color
              }}
              className="drop-shadow-lg transform -rotate-90 -translate-x-1 -translate-y-1"
            />
            {/* User Label Name Tag */}
            <span
              style={{ backgroundColor: cursor.color }}
              className="text-[9px] font-bold text-dark-bg px-2 py-0.5 rounded-full shadow-md whitespace-nowrap -translate-x-2 -translate-y-1 opacity-90 animate-pulse border border-black/10"
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
