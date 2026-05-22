import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://draw-together-xckc.onrender.com';

export const useSocket = (roomId, username, onDrawReceived, onCanvasStateReceived, onCanvasCleared) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showReconnectNotice, setShowReconnectNotice] = useState(false);
  const hadConnectedRef = useRef(false);
  const [userId, setUserId] = useState(null);
  const [userColor, setUserColor] = useState('#ffffff');
  const [activeUsers, setActiveUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [cursors, setCursors] = useState({});

  const callbacksRef = useRef({
    onDrawReceived,
    onCanvasStateReceived,
    onCanvasCleared
  });
  callbacksRef.current = { onDrawReceived, onCanvasStateReceived, onCanvasCleared };

  const joinRoom = useCallback((socket) => {
    if (!roomId || !username) return;
    socket.emit('join-room', { roomId, username });
  }, [roomId, username]);

  useEffect(() => {
    if (!roomId || !username) return;

    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 12,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (hadConnectedRef.current) {
        setShowReconnectNotice(true);
        setTimeout(() => setShowReconnectNotice(false), 3000);
      }
      hadConnectedRef.current = true;
      joinRoom(socket);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('canvas-state', ({ strokes, chatMessages: messages, userColor: color, userId: assignedId }) => {
      if (color) setUserColor(color);
      if (assignedId) setUserId(assignedId);
      if (messages) setChatMessages(messages);

      if (window.__paintsyncDrawing) return;

      if (callbacksRef.current.onCanvasStateReceived && strokes) {
        callbacksRef.current.onCanvasStateReceived(strokes);
      }
    });

    socket.on('draw', (drawData) => {
      if (callbacksRef.current.onDrawReceived) {
        callbacksRef.current.onDrawReceived(drawData);
      }
    });

    socket.on('user-joined', ({ username: uName }) => {
      setChatMessages((prev) => [
        ...prev,
        {
          username: 'System',
          text: `${uName} joined the room.`,
          color: '#10B981',
          isSystem: true,
          timestamp: new Date()
        }
      ]);
    });

    socket.on('user-left', ({ userId: leftUserId, username: uName }) => {
      setCursors((prev) => {
        const copy = { ...prev };
        delete copy[leftUserId];
        return copy;
      });
      setChatMessages((prev) => [
        ...prev,
        {
          username: 'System',
          text: `${uName} left the room.`,
          color: '#EF4444',
          isSystem: true,
          timestamp: new Date()
        }
      ]);
    });

    socket.on('user-list-update', (users) => {
      setActiveUsers(users);
    });

    socket.on('cursor-update', ({ userId: cursorUserId, username: cursorUsername, color: cursorColor, x, y }) => {
      setCursors((prev) => ({
        ...prev,
        [cursorUserId]: { username: cursorUsername, color: cursorColor, x, y }
      }));
    });

    socket.on('new-message', (message) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socket.on('canvas-cleared', () => {
      if (callbacksRef.current.onCanvasCleared) {
        callbacksRef.current.onCanvasCleared();
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, username, joinRoom]);

  const emitDraw = (drawData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('draw', { roomId, drawData });
    }
  };

  const emitCursorMove = (x, y) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cursor-move', { roomId, x, y, username });
    }
  };

  const emitUndo = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('undo', { roomId, userId });
    }
  };

  const emitRedo = (stroke) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('redo', { roomId, stroke });
    }
  };

  const emitClearCanvas = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('clear-canvas', { roomId });
    }
  };

  const sendMessage = (text) => {
    if (socketRef.current?.connected && text.trim()) {
      socketRef.current.emit('send-message', { roomId, text });
    }
  };

  return {
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
  };
};

export default useSocket;
