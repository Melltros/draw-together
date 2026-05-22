import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { Toolbar } from '../components/Toolbar';
import { Canvas } from '../components/Canvas';
import { UserList } from '../components/UserList';
import { Chat } from '../components/Chat';
import {
  Undo2,
  Redo2,
  Trash2,
  Download,
  Share2,
  ArrowLeft,
  Copy,
  Check,
  Globe,
  Loader2,
  Palette,
  MessageSquare,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://draw-together-xckc.onrender.com';

export const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const formattedRoomId = roomId ? roomId.toUpperCase() : '';

  // App states
  const [username, setUsername] = useState(() => localStorage.getItem('paintsync_username') || '');
  const [showModal, setShowModal] = useState(!localStorage.getItem('paintsync_username'));
  const [modalInput, setModalInput] = useState('');
  const [roomExistsChecked, setRoomExistsChecked] = useState(false);
  const [roomCheckingError, setRoomCheckingError] = useState(null);

  // Responsive sidebar toggles
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Drawing config states
  const [activeTool, setActiveTool] = useState('pen'); // 'pen', 'eraser', 'line', 'rect', 'circle', 'text'
  const [color, setColor] = useState('#FF4D4D');
  const [brushSize, setBrushSize] = useState(5);
  
  // Custom tool changer that auto-collapses left sidebar on mobile screen
  const handleActiveToolChange = (tool) => {
    setActiveTool(tool);
    if (window.innerWidth < 768) {
      setShowLeftSidebar(false);
    }
  };

  // Vector stroke state & Undo/Redo tracking
  const [strokes, setStrokes] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Copy indicators
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. First: Check if room exists in directory
  useEffect(() => {
    const checkRoomExists = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/room/${formattedRoomId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setRoomCheckingError('This board does not exist or has expired.');
          } else {
            setRoomCheckingError('Failed to fetch board details.');
          }
          return;
        }
        setRoomExistsChecked(true);
      } catch (err) {
        console.error(err);
        setRoomCheckingError('Connection error. Server might be offline.');
      }
    };
    if (formattedRoomId) {
      checkRoomExists();
    }
  }, [formattedRoomId]);

  // 2. Initialize Sockets Custom Hook
  // We forward real-time drawing streams directly to Canvas drawing listener
  const onDrawReceived = (drawData) => {
    if (window.handleRemoteDraw) {
      window.handleRemoteDraw(drawData);
    }
  };

  const onCanvasStateReceived = (initialStrokes) => {
    setStrokes(initialStrokes);
  };

  const onCanvasCleared = () => {
    setStrokes([]);
    setUndoStack([]);
    setRedoStack([]);
  };

  const socketProps = useSocket(
    roomExistsChecked ? formattedRoomId : null,
    username,
    onDrawReceived,
    onCanvasStateReceived,
    onCanvasCleared
  );

  const {
    isConnected,
    userId,
    userColor,
    activeUsers,
    chatMessages,
    cursors,
    emitDraw,
    emitCursorMove,
    emitUndo,
    emitRedo,
    emitClearCanvas,
    sendMessage
  } = socketProps;

  // 3. Join Modal Submission Handler
  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (modalInput.trim()) {
      const trimmed = modalInput.trim();
      setUsername(trimmed);
      localStorage.setItem('paintsync_username', trimmed);
      setShowModal(false);
      
      // Fire celebration trigger
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.9 },
        colors: [userColor || '#6366f1', '#10b981', '#3b82f6']
      });
    }
  };

  // 4. Board actions
  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch((err) => console.error('Failed to copy link:', err));
  };

  const handleLocalUndo = () => {
    if (undoStack.length === 0) return;

    // Pop from local history
    setUndoStack((prev) => {
      const copy = [...prev];
      const popped = copy.pop();
      if (popped) {
        // Push onto redo
        setRedoStack((prevRedo) => [...prevRedo, popped]);
        
        // Notify server to undo this user's strokes
        emitUndo();
      }
      return copy;
    });
  };

  const handleLocalRedo = () => {
    if (redoStack.length === 0) return;

    setRedoStack((prev) => {
      const copy = [...prev];
      const popped = copy.pop();
      if (popped) {
        // Push back onto undo stack
        setUndoStack((prevUndo) => [...prevUndo, popped]);
        
        // Notify server to push stroke back
        emitRedo(popped);
      }
      return copy;
    });
  };

  const handleLocalClear = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      setStrokes([]);
      setUndoStack([]);
      setRedoStack([]);
      emitClearCanvas();
    }
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // Create virtual canvas to render solid backing so exporting transparency is readable
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    // Fill dark background
    exportCtx.fillStyle = '#0F0F11';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Overlay grid ticks lines (optional, looks cool!)
    exportCtx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    const gridSize = 24;
    for (let x = 0; x < exportCanvas.width; x += gridSize) {
      exportCtx.fillRect(x, 0, 1, exportCanvas.height);
    }
    for (let y = 0; y < exportCanvas.height; y += gridSize) {
      exportCtx.fillRect(0, y, exportCanvas.width, 1);
    }

    // Draw active drawing layer
    exportCtx.drawImage(canvas, 0, 0);

    // Save
    const downloadLink = document.createElement('a');
    downloadLink.download = `PaintSync-${formattedRoomId}.png`;
    downloadLink.href = exportCanvas.toDataURL('image/png');
    downloadLink.click();
  };

  // Render checking page if board validation is taking place
  if (roomCheckingError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D] text-center p-4">
        <div className="max-w-md glass-panel p-8 rounded-3xl border border-dark-border">
          <Globe size={48} className="mx-auto text-rose-500 mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-gray-200 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-400 mb-6">{roomCheckingError}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm text-white transition-all duration-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!roomExistsChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0D] text-center gap-3">
        <Loader2 size={36} className="text-indigo-500 animate-spin" />
        <span className="text-sm font-semibold text-gray-400">Verifying PaintSync Board...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen w-screen bg-[#0A0A0D] flex flex-col overflow-hidden relative">
      {/* 1. TOP NAVBAR PANEL */}
      <header className="h-14 glass-panel border-b border-dark-border px-4 sm:px-5 flex items-center justify-between shrink-0 select-none">
        {/* Left Back Button */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-all bg-dark-card border border-dark-border/50 hover:bg-dark-hover px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl active:scale-95"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Exit</span>
          </button>
          
          <div className="h-4 w-[1px] bg-dark-border" />
          
          {/* Room details */}
          <div className="flex items-center gap-1.5">
            <span className="hidden xs:inline text-[10px] text-gray-500 font-bold uppercase tracking-wider">BOARD</span>
            <span className="text-xs sm:text-sm font-extrabold text-white tracking-widest bg-indigo-600/10 border border-indigo-500/20 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-lg">
              {formattedRoomId}
            </span>
          </div>
        </div>

        {/* Center Connection Indicator */}
        <div className="hidden md:flex items-center gap-2">
          <div className="relative flex items-center">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            {isConnected && (
              <span className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full shrink-0 animate-ping opacity-75" />
            )}
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {isConnected ? 'Real-time Connected' : 'Connecting Server...'}
          </span>
        </div>

        {/* Right Invite / Share button */}
        <div className="flex items-center gap-2">
          {username && (
            <div className="hidden sm:flex items-center gap-2 bg-dark-card/50 border border-dark-border/50 rounded-xl py-1 px-2.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">You:</span>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: userColor }} />
              <span className="text-xs font-semibold text-gray-300 truncate max-w-[80px]">
                {username}
              </span>
            </div>
          )}

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-indigo-500/20 transition-all hover:scale-105 active:scale-95"
          >
            {copiedLink ? <Check size={13} className="animate-bounce" /> : <Copy size={13} />}
            <span className="hidden xs:inline">{copiedLink ? 'Copied URL!' : 'Share'}</span>
          </button>

          {/* Mobile responsive sidebar togglers */}
          <button
            onClick={() => {
              setShowLeftSidebar(!showLeftSidebar);
              setShowRightSidebar(false);
            }}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border/50 text-indigo-400 active:scale-95"
            title="Toggle Drawing Tools"
          >
            <Palette size={16} />
          </button>

          <button
            onClick={() => {
              setShowRightSidebar(!showRightSidebar);
              setShowLeftSidebar(false);
            }}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border/50 text-indigo-400 active:scale-95 relative"
            title="Toggle Chat & Painters"
          >
            <MessageSquare size={16} />
            {activeUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {activeUsers.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative p-4 gap-4">
        {/* LEFT WORKSPACE BAR (Drawing tools floating sidebar) */}
        <div 
          className={`flex-col shrink-0 gap-3 z-30 select-none absolute md:relative top-16 md:top-0 left-4 md:left-0 transition-all duration-300 ${
            showLeftSidebar ? 'flex' : 'hidden md:flex'
          }`}
        >
          <Toolbar
            activeTool={activeTool}
            setActiveTool={handleActiveToolChange}
            color={color}
            setColor={setColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
          />
        </div>

        {/* MIDDLE WORKSPACE (Main painting canvas overlay) */}
        <div className="flex-1 h-full min-w-0 relative flex flex-col gap-4">
          <Canvas
            strokes={strokes}
            setStrokes={setStrokes}
            activeTool={activeTool}
            color={color}
            brushSize={brushSize}
            cursors={cursors}
            emitDraw={emitDraw}
            emitCursorMove={emitCursorMove}
            userId={userId}
            username={username}
            undoStack={undoStack}
            setUndoStack={setUndoStack}
            redoStack={redoStack}
            setRedoStack={setRedoStack}
          />

          {/* 3. BOTTOM PANEL ACTIONS */}
          <div className="h-14 glass-panel rounded-2xl flex items-center justify-between px-4 sm:px-5 select-none shrink-0 border border-dark-border shadow-glow-primary">
            {/* Undo / Redo buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLocalUndo}
                disabled={undoStack.length === 0}
                title="Undo (Ctrl+Z)"
                className="flex items-center gap-1 px-2.5 py-1.5 sm:gap-1.5 sm:px-3.5 sm:py-2 bg-dark-card hover:bg-dark-hover border border-dark-border disabled:opacity-40 disabled:scale-100 disabled:bg-dark-card text-gray-300 rounded-xl transition-all duration-150 text-xs font-bold active:scale-95 shrink-0"
              >
                <Undo2 size={14} />
                <span className="hidden sm:inline">Undo</span>
                <span className="text-[9px] font-bold text-gray-600 bg-black/25 px-1.5 py-0.5 rounded-md">
                  {undoStack.length}
                </span>
              </button>

              <button
                onClick={handleLocalRedo}
                disabled={redoStack.length === 0}
                title="Redo (Ctrl+Y)"
                className="flex items-center gap-1 px-2.5 py-1.5 sm:gap-1.5 sm:px-3.5 sm:py-2 bg-dark-card hover:bg-dark-hover border border-dark-border disabled:opacity-40 disabled:scale-100 disabled:bg-dark-card text-gray-300 rounded-xl transition-all duration-150 text-xs font-bold active:scale-95 shrink-0"
              >
                <Redo2 size={14} />
                <span className="hidden sm:inline">Redo</span>
                <span className="text-[9px] font-bold text-gray-600 bg-black/25 px-1.5 py-0.5 rounded-md">
                  {redoStack.length}
                </span>
              </button>
            </div>

            {/* Clear Board action */}
            <button
              onClick={handleLocalClear}
              disabled={strokes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 hover:bg-rose-500/10 border border-dark-border text-rose-400 hover:text-rose-300 rounded-xl transition-all duration-150 text-xs font-bold active:scale-95 disabled:opacity-30 disabled:scale-100 shrink-0"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear Canvas</span>
            </button>

            {/* Download/Share Board */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-150 text-xs font-bold active:scale-95 shrink-0"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Download PNG</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT WORKSPACE BAR (User profiles list + chat panels) */}
        <div 
          className={`flex-col shrink-0 w-80 h-[calc(100%-2rem)] md:h-full min-h-0 z-30 absolute md:relative top-16 md:top-0 right-4 md:right-0 bg-dark-bg/95 md:bg-transparent border border-dark-border md:border-0 rounded-2xl md:rounded-none shadow-2xl md:shadow-none p-4 md:p-0 transition-all duration-300 ${
            showRightSidebar ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="flex md:hidden justify-end mb-2">
            <button
              onClick={() => setShowRightSidebar(false)}
              className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1.5 rounded-xl active:scale-95"
            >
              Close Drawer
            </button>
          </div>
          <UserList activeUsers={activeUsers} selfUserId={userId} />
          <Chat chatMessages={chatMessages} sendMessage={sendMessage} />
        </div>
      </div>

      {/* 4. USERNAME OVERLAY SELECTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md mx-4 glass-panel p-8 rounded-3xl border border-dark-border text-center shadow-glow-primary animate-glow">
            <div className="w-12 h-12 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Palette size={20} className="animate-spin" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-100 mb-2">Who's Drawing?</h2>
            <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">
              Enter your display name to join this real-time session. A custom color will be automatically assigned to you.
            </p>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                required
                maxLength={16}
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                placeholder="Enter username"
                className="w-full glass-input bg-dark-input hover:bg-dark-input/80 px-4 py-3 border-dark-border text-sm text-center font-bold placeholder:font-normal"
              />
              <button
                type="submit"
                disabled={!modalInput.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                Join Studio Board
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
