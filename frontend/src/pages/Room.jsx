import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { Toolbar } from '../components/Toolbar';
import { Canvas } from '../components/Canvas';
import { UserList } from '../components/UserList';
import { Chat } from '../components/Chat';
import { MobileHint } from '../components/MobileHint';
import { MobileQuickBar } from '../components/MobileQuickBar';
import { useRoomBodyLock } from '../hooks/useRoomBodyLock';
import {
  Undo2,
  Redo2,
  Trash2,
  Download,
  ArrowLeft,
  Copy,
  Check,
  Globe,
  Loader2,
  Palette,
  MessageSquare,
  Pencil,
  Link2,
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
  const [stickerSize, setStickerSize] = useState(64);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [placementMode, setPlacementMode] = useState(false);

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

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useRoomBodyLock(roomExistsChecked);

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
    showReconnectNotice,
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
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch((err) => console.error('Failed to copy link:', err));
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(formattedRoomId)
      .then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
        if (navigator.vibrate) navigator.vibrate(12);
      })
      .catch((err) => console.error('Failed to copy code:', err));
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
      <div className="min-h-dvh flex items-center justify-center bg-dark-bg text-center p-4 overflow-hidden">
        <div className="relative w-full max-w-md pinterest-panel p-8 rounded-3xl animate-scale-in">
          <div className="w-16 h-16 bg-[#C73543]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Globe size={28} className="text-[#C73543]" />
          </div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">Room not found</h2>
          <p className="text-sm text-gray-400 mb-6 font-medium">{roomCheckingError}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-[#C73543] hover:bg-[#7A0C22] rounded-2xl font-bold text-sm text-white transition-all duration-200 active:scale-95 cursor-pointer"
          >
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  if (!roomExistsChecked) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-dark-bg text-center gap-4 overflow-hidden">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[#C73543]/15 flex items-center justify-center mb-4 mx-auto">
            <Loader2 size={28} className="text-[#C73543] animate-spin" />
          </div>
          <span className="text-sm font-bold text-gray-300">Opening room…</span>
          <p className="ux-hint mt-1">Connecting you to the shared canvas</p>
        </div>
      </div>
    );
  }

  const mobileDrawerOpen = showLeftSidebar || showRightSidebar;

  const closeMobilePanels = () => {
    setShowLeftSidebar(false);
    setShowRightSidebar(false);
  };

  return (
    <div className="app-shell bg-[#2A1B1B] flex flex-col relative">
      {showReconnectNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow-lg animate-slide-up">
          Reconnected — you&apos;re back online
        </div>
      )}

      {!isConnected && roomExistsChecked && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#C73543]/95 text-white text-xs font-bold shadow-lg">
          Connection lost — trying to reconnect…
        </div>
      )}

      {mobileDrawerOpen && (
        <button
          type="button"
          aria-label="Close panel"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] md:hidden cursor-pointer"
          onClick={closeMobilePanels}
        />
      )}

      {/* Top bar */}
      <header className="h-auto min-h-14 pinterest-panel border-b border-dark-border px-3 sm:px-5 py-2 flex items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs font-bold text-gray-300 hover:text-white bg-dark-card border border-dark-border hover:bg-dark-hover px-2.5 py-2 rounded-xl active:scale-95 cursor-pointer shrink-0"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Leave</span>
          </button>

          <button
            type="button"
            onClick={handleCopyRoomCode}
            className="min-w-0 text-left rounded-xl hover:bg-dark-card/80 px-2 py-1 -mx-2 active:scale-95 cursor-pointer"
            title="Tap to copy room code"
          >
            <p className="ux-label leading-none mb-0.5">Room code · tap to copy</p>
            <p className="text-sm sm:text-base font-black tracking-widest text-white truncate flex items-center gap-1.5">
              {formattedRoomId}
              {copiedCode ? <Check size={12} className="text-emerald-400 shrink-0" /> : <Copy size={12} className="text-gray-500 shrink-0" />}
            </p>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-[#C73543]/10 border-[#C73543]/30 text-[#F7C7CB]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-[#C73543] animate-pulse'}`} />
            {isConnected ? 'Connected' : 'Connecting…'}
          </div>

          {username && (
            <div className="hidden md:flex items-center gap-1.5 bg-[#452F2F] border border-dark-border rounded-xl py-1 px-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                style={{ backgroundColor: userColor }}
              >
                {(username || '?')[0].toUpperCase()}
              </div>
              <span className="text-[11px] font-bold text-white max-w-[72px] truncate">{username}</span>
            </div>
          )}

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#C73543] hover:bg-[#7A0C22] px-3 py-2 rounded-xl active:scale-95 cursor-pointer"
            title="Copy link to invite friends"
          >
            {copiedLink ? <Check size={14} /> : <Link2 size={14} />}
            <span>{copiedLink ? 'Copied!' : 'Invite'}</span>
          </button>
        </div>
      </header>

      {/* Desktop: where things are */}
      <div className="hidden md:flex items-center justify-center gap-6 px-4 py-1.5 bg-[#352323]/40 border-b border-[#523838]/40 text-[11px] font-medium text-gray-400 shrink-0">
        <span className="flex items-center gap-1.5"><Palette size={12} className="text-[#C73543]" /> Tools on the left</span>
        <span className="flex items-center gap-1.5"><Pencil size={12} className="text-[#F7C7CB]" /> Draw in the center</span>
        <span className="flex items-center gap-1.5"><MessageSquare size={12} className="text-[#C73543]" /> Chat on the right</span>
        <span className="flex items-center gap-1.5"><Users size={12} /> {activeUsers.length} here now</span>
      </div>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative p-1.5 md:p-4 gap-2 md:gap-4 pb-[calc(11rem+env(safe-area-inset-bottom,0px))] md:pb-4">
        {/* Desktop: left toolbar */}
        <div className="hidden md:flex flex-col shrink-0 gap-3 select-none">
          <Toolbar
            activeTool={activeTool}
            setActiveTool={handleActiveToolChange}
            color={color}
            setColor={setColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            stickerSize={stickerSize}
            setStickerSize={setStickerSize}
            selectedSticker={selectedSticker}
            onSelectSticker={setSelectedSticker}
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
            selectedSticker={selectedSticker}
            stickerSize={stickerSize}
            onPlacementModeChange={setPlacementMode}
            onStickerSizeChange={setStickerSize}
          />

          {/* Canvas actions — always labeled */}
          <div className="pinterest-panel rounded-2xl flex items-center justify-between gap-1 px-2 py-2 sm:px-3 shrink-0 border border-dark-border">
            <div className="flex items-center gap-1">
              <button
                onClick={handleLocalUndo}
                disabled={undoStack.length === 0}
                aria-label="Undo last stroke"
                className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 px-2 py-1.5 sm:px-3 bg-dark-card hover:bg-dark-hover border border-[#523838] disabled:opacity-30 text-gray-300 hover:text-white rounded-xl text-[10px] font-bold active:scale-95 cursor-pointer"
              >
                <Undo2 size={14} />
                <span>Undo</span>
              </button>
              <button
                onClick={handleLocalRedo}
                disabled={redoStack.length === 0}
                aria-label="Redo"
                className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 px-2 py-1.5 sm:px-3 bg-dark-card hover:bg-dark-hover border border-[#523838] disabled:opacity-30 text-gray-300 hover:text-white rounded-xl text-[10px] font-bold active:scale-95 cursor-pointer"
              >
                <Redo2 size={14} />
                <span>Redo</span>
              </button>
            </div>

            <button
              onClick={handleLocalClear}
              disabled={strokes.length === 0}
              aria-label="Clear entire canvas"
              className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 px-2 py-1.5 text-[#F7C7CB] border border-[#523838] hover:bg-[#7A0C22]/25 rounded-xl text-[10px] font-bold active:scale-95 disabled:opacity-25 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Clear all</span>
            </button>

            <button
              onClick={handleDownload}
              aria-label="Save drawing as PNG"
              className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 px-3 py-1.5 bg-[#C73543] hover:bg-[#7A0C22] text-white rounded-xl text-[10px] font-bold active:scale-95 cursor-pointer"
            >
              <Download size={14} />
              <span>Save PNG</span>
            </button>
          </div>
        </div>

        {/* Desktop: right sidebar */}
        <div className="hidden md:flex flex-col shrink-0 w-80 h-full min-h-0 gap-3">
          <UserList activeUsers={activeUsers} selfUserId={userId} />
          <Chat chatMessages={chatMessages} sendMessage={sendMessage} />
        </div>
      </div>

      {/* Mobile: full-screen chat — typing bar pinned to bottom */}
      {showRightSidebar && (
        <div className="mobile-fullsheet md:hidden" role="dialog" aria-label="Chat">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#523838] bg-[#352323]">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-[#C73543]" />
                <span className="text-sm font-bold text-white">Group chat</span>
              </div>
              <p className="ux-hint mt-0.5 ml-6">Back to canvas when you&apos;re done</p>
            </div>
            <button
              type="button"
              onClick={() => setShowRightSidebar(false)}
              className="text-xs font-bold text-white bg-[#C73543] hover:bg-[#7A0C22] px-4 py-2.5 rounded-xl active:scale-95 cursor-pointer"
            >
              ← Canvas
            </button>
          </div>
          <UserList activeUsers={activeUsers} selfUserId={userId} compact />
          <div className="flex-1 min-h-0 flex flex-col px-3 pt-2 pb-0">
            <Chat chatMessages={chatMessages} sendMessage={sendMessage} fillHeight />
          </div>
        </div>
      )}

      {/* Mobile: tools bottom sheet */}
      {showLeftSidebar && (
        <div className="mobile-bottomsheet md:hidden" role="dialog" aria-label="Drawing tools">
          <div className="shrink-0 flex flex-col items-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#523838] mb-2" aria-hidden />
            <div className="w-full flex items-center justify-between px-4 pb-2">
              <div>
                <span className="text-sm font-bold text-white block">Drawing tools</span>
                <span className="ux-hint">Pick a tool, then draw on the canvas</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLeftSidebar(false)}
                className="text-xs font-bold text-white bg-[#C73543] px-3 py-2 rounded-xl active:scale-95 cursor-pointer shrink-0"
              >
                ← Canvas
              </button>
            </div>
          </div>
          <div className="mobile-bottomsheet-scroll px-3 pb-3">
            <Toolbar
              activeTool={activeTool}
              setActiveTool={handleActiveToolChange}
              color={color}
              setColor={setColor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              stickerSize={stickerSize}
              setStickerSize={setStickerSize}
              selectedSticker={selectedSticker}
              onSelectSticker={setSelectedSticker}
            />
          </div>
        </div>
      )}

      {!placementMode && <MobileHint />}

      <MobileQuickBar
        activeTool={activeTool}
        setActiveTool={handleActiveToolChange}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        stickerSize={stickerSize}
        setStickerSize={setStickerSize}
        selectedSticker={selectedSticker}
        onSelectSticker={setSelectedSticker}
        visible={!showLeftSidebar && !showRightSidebar && !placementMode}
      />

      {/* Mobile: bottom navigation */}
      <nav
        className="md:hidden fixed left-0 right-0 bottom-0 z-20 flex items-stretch gap-1 px-2 pt-2 border-t border-[#523838] bg-[#352323] safe-bottom"
        aria-label="Main menu"
      >
        <button
          type="button"
          onClick={() => {
            setShowLeftSidebar(!showLeftSidebar);
            setShowRightSidebar(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl cursor-pointer ${
            showLeftSidebar ? 'bg-[#C73543] text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Palette size={20} strokeWidth={2.5} />
          <span className="text-[11px] font-bold">Tools</span>
        </button>

        <button
          type="button"
          onClick={closeMobilePanels}
          className={`flex-[1.15] flex flex-col items-center justify-center gap-1 py-2 rounded-2xl cursor-pointer border-2 transition-all active:scale-95 ${
            !showLeftSidebar && !showRightSidebar
              ? 'border-[#C73543] bg-[#C73543]/15 text-white'
              : 'border-[#523838] text-gray-400 hover:text-white'
          }`}
        >
          <Pencil size={22} strokeWidth={2.5} className={!showLeftSidebar && !showRightSidebar ? 'text-[#F7C7CB]' : ''} />
          <span className="text-[11px] font-bold">Canvas</span>
          <span className="text-[9px] font-medium opacity-70">{isConnected ? 'Tap to draw' : 'Connecting…'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowRightSidebar(!showRightSidebar);
            setShowLeftSidebar(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl cursor-pointer relative ${
            showRightSidebar ? 'bg-[#C73543] text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <MessageSquare size={20} strokeWidth={2.5} />
          <span className="text-[11px] font-bold">Chat</span>
          {chatMessages.length > 0 && !showRightSidebar && (
            <span className="absolute top-1.5 right-[28%] min-w-[8px] h-2 px-0.5 bg-[#F7C7CB] rounded-full" />
          )}
        </button>
      </nav>

      {/* 4. USERNAME OVERLAY SELECTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative w-full max-w-sm mx-4 pinterest-panel p-8 rounded-3xl text-center animate-scale-in">
            <div className="w-14 h-14 bg-[#C73543]/15 text-[#C73543] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Palette size={24} />
            </div>
            
            <p className="ux-label mb-2">Before you draw</p>
            <h2 className="text-2xl font-black text-white mb-2">
              What&apos;s your name?
            </h2>
            <p className="text-sm text-gray-400 mb-6 font-medium leading-relaxed">
              Friends will see this next to your cursor. You also get your own color.
            </p>

            <form onSubmit={handleModalSubmit} className="space-y-4 text-left">
              <label className="block">
                <span className="ux-label mb-1.5 block">Display name</span>
                <input
                  type="text"
                  autoFocus
                  required
                  maxLength={16}
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full pinterest-input px-4 py-3.5 text-sm font-bold placeholder:font-normal"
                />
              </label>
              <button
                type="submit"
                disabled={!modalInput.trim()}
                className="w-full py-3.5 bg-[#C73543] hover:bg-[#7A0C22] text-white font-bold text-base rounded-2xl active:scale-[0.97] transition-all disabled:opacity-40 cursor-pointer"
              >
                Enter the room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
