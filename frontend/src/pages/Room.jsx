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
  const [color, setColor] = useState('#70000E');
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
      <div className="min-h-screen flex items-center justify-center bg-dark-bg text-center p-4">
        <div className="relative w-full max-w-md pinterest-panel p-8 rounded-3xl animate-scale-in">
          <div className="w-16 h-16 bg-[#C73543]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Globe size={28} className="text-[#C73543]" />
          </div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">Board Not Found</h2>
          <p className="text-sm text-gray-400 mb-6 font-medium">{roomCheckingError}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-[#C73543] hover:bg-[#7A0C22] rounded-2xl font-bold text-sm text-white transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!roomExistsChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg text-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#C73543]/15 flex items-center justify-center mb-4 mx-auto">
            <Loader2 size={28} className="text-[#C73543] animate-spin" />
          </div>
          <span className="text-sm font-bold text-gray-300">Loading Board...</span>
          <p className="text-[10px] text-gray-500 mt-1 font-medium">Connecting to PaintSync servers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen w-screen bg-[#2A1B1B] flex flex-col overflow-hidden relative">
      {/* 1. TOP NAVBAR PANEL */}
      <header className="h-14 pinterest-panel border-b border-dark-border px-4 sm:px-5 flex items-center justify-between shrink-0 select-none">
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white transition-all bg-dark-card border border-dark-border hover:bg-dark-hover px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Exit</span>
          </button>
          
          <div className="h-4 w-[1px] bg-dark-border" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-extrabold tracking-widest bg-dark-card border border-dark-border px-2.5 py-0.5 rounded-lg text-white">
              {formattedRoomId}
            </span>
          </div>
        </div>

        {/* Center */}
        <div className="hidden md:flex items-center gap-2">
          <div className="relative flex items-center">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isConnected ? 'bg-emerald-500' : 'bg-[#C73543]'
              }`}
            />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {isConnected ? 'Synced' : 'Connecting...'}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {username && (
            <div className="hidden sm:flex items-center gap-2 bg-[#452F2F] border border-dark-border rounded-xl py-1 px-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ backgroundColor: userColor }}>
                {(username || '?')[0].toUpperCase()}
              </div>
              <span className="text-[11px] font-bold text-white truncate max-w-[70px]">
                {username}
              </span>
            </div>
          )}

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs font-bold text-[#F7C7CB] bg-[#7A0C22] border border-dark-border px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-[#C73543] transition-all active:scale-95 cursor-pointer"
          >
            {copiedLink ? <Check size={13} className="animate-bounce" /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={() => {
              setShowLeftSidebar(!showLeftSidebar);
              setShowRightSidebar(false);
            }}
            className={`md:hidden flex items-center justify-center w-9 h-9 rounded-xl border active:scale-95 transition-all cursor-pointer ${
              showLeftSidebar
                ? 'bg-[#C73543] border-dark-border text-white'
                : 'bg-dark-card border-dark-border text-gray-400 hover:text-white'
            }`}
            title="Toggle Drawing Tools"
          >
            <Palette size={15} />
          </button>

          <button
            onClick={() => {
              setShowRightSidebar(!showRightSidebar);
              setShowLeftSidebar(false);
            }}
            className={`md:hidden flex items-center justify-center w-9 h-9 rounded-xl border active:scale-95 transition-all relative cursor-pointer ${
              showRightSidebar
                ? 'bg-[#C73543] border-dark-border text-white'
                : 'bg-dark-card border-dark-border text-gray-400 hover:text-white'
            }`}
            title="Toggle Chat & Painters"
          >
            <MessageSquare size={15} />
            {activeUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C73543] rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                {activeUsers.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative p-1.5 md:p-4 gap-2 md:gap-4">
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
        <div className="flex-1 h-full min-w-0 relative flex flex-col gap-2 md:gap-4">
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
          <div className="h-12 pinterest-panel rounded-2xl flex items-center justify-between px-3 sm:px-4 select-none shrink-0 border border-dark-border">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleLocalUndo}
                disabled={undoStack.length === 0}
                title="Undo (Ctrl+Z)"
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-dark-card hover:bg-dark-hover border border-[#523838] disabled:opacity-30 text-gray-300 hover:text-white rounded-xl transition-all text-[11px] font-extrabold active:scale-95 shrink-0 cursor-pointer"
              >
                <Undo2 size={13} />
                <span className="hidden sm:inline">Undo</span>
                <span className="text-[8px] font-black text-[#F7C7CB] bg-[#7A0C22] px-1.5 py-0.5 rounded">{undoStack.length}</span>
              </button>
              <button
                onClick={handleLocalRedo}
                disabled={redoStack.length === 0}
                title="Redo (Ctrl+Y)"
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-dark-card hover:bg-dark-hover border border-[#523838] disabled:opacity-30 text-gray-300 hover:text-white rounded-xl transition-all text-[11px] font-extrabold active:scale-95 shrink-0 cursor-pointer"
              >
                <Redo2 size={13} />
                <span className="hidden sm:inline">Redo</span>
                <span className="text-[8px] font-black text-[#F7C7CB] bg-[#7A0C22] px-1.5 py-0.5 rounded">{redoStack.length}</span>
              </button>
            </div>

            <button
              onClick={handleLocalClear}
              disabled={strokes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#7A0C22]/30 border border-[#523838] text-[#F7C7CB] rounded-xl transition-all text-[11px] font-extrabold active:scale-95 disabled:opacity-20 shrink-0 cursor-pointer"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-1.5 bg-[#C73543] hover:bg-[#7A0C22] text-white rounded-xl transition-all text-[11px] font-extrabold active:scale-95 shrink-0 cursor-pointer"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* RIGHT WORKSPACE BAR (User profiles list + chat panels) */}
        <div 
          className={`flex-col shrink-0 w-full md:w-80 h-full min-h-0 z-30 absolute md:relative top-0 md:top-0 right-0 md:right-0 left-0 sm:left-auto md:left-auto bg-[#2A1B1B] md:bg-transparent border-l border-dark-border md:border-0 p-3 md:p-0 transition-all duration-300 ${
            showRightSidebar ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="flex md:hidden justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-400">Drawer Tools</span>
            <button
              onClick={() => setShowRightSidebar(false)}
              className="text-xs font-bold text-[#F7C7CB] bg-[#7A0C22] border border-[#523838] px-3 py-1.5 rounded-xl active:scale-95 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative w-full max-w-sm mx-4 pinterest-panel p-8 rounded-3xl text-center animate-scale-in">
            <div className="w-14 h-14 bg-[#C73543]/15 text-[#C73543] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Palette size={24} />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2">
              Join the Canvas
            </h2>
            <p className="text-xs text-gray-400 mb-6 font-semibold leading-relaxed">
              Pick a display name. You'll get a unique color assigned automatically.
            </p>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                required
                maxLength={16}
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                placeholder="Your name"
                className="w-full pinterest-input bg-[#1F1313] px-4 py-3.5 text-sm text-center font-bold tracking-wide placeholder:font-normal placeholder:tracking-normal"
              />
              <button
                type="submit"
                disabled={!modalInput.trim()}
                className="w-full py-3.5 bg-[#C73543] hover:bg-[#7A0C22] text-white font-extrabold rounded-2xl active:scale-[0.97] transition-all disabled:opacity-40 cursor-pointer"
              >
                <span>Start Drawing ✨</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
