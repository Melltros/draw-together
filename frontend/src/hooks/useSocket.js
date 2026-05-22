import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://draw-together-xckc.onrender.com';

export const useSocket = (roomId, username, onDrawReceived, onCanvasStateReceived, onCanvasCleared) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userColor, setUserColor] = useState('#ffffff');
  const [activeUsers, setActiveUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [cursors, setCursors] = useState({}); // userId -> { username, color, x, y }

  useEffect(() => {
    if (!roomId || !username) return;

    // Connect to Socket.IO backend
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Connected to socket server');
      setIsConnected(true);
      
      // Request to join room
      socket.emit('join-room', { roomId, username });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from socket server');
      setIsConnected(false);
    });

    // 1. Initial State from Server
    socket.on('canvas-state', ({ strokes, chatMessages: messages, userColor: color, userId: assignedId }) => {
      if (color) setUserColor(color);
      if (assignedId) setUserId(assignedId);
      if (messages) setChatMessages(messages);
      
      // Trigger canvas state rendering
      if (onCanvasStateReceived && strokes) {
        onCanvasStateReceived(strokes);
      }
    });

    // 2. Real-time Draw Event
    socket.on('draw', (drawData) => {
      if (onDrawReceived) {
        onDrawReceived(drawData);
      }
    });

    // 3. User joined notification
    socket.on('user-joined', ({ userId: joinedUserId, username: uName, color }) => {
      console.log(`👤 User joined: ${uName}`);
      // Toast notification or notification message can be added to chat
      setChatMessages((prev) => [
        ...prev,
        {
          username: 'System',
          text: `${uName} has joined the room.`,
          color: '#10B981', // green
          isSystem: true,
          timestamp: new Date()
        }
      ]);
    });

    // 4. User left notification
    socket.on('user-left', ({ userId: leftUserId, username: uName }) => {
      console.log(`👤 User left: ${uName}`);
      
      // Clean up cursor for disconnected user
      setCursors((prev) => {
        const copy = { ...prev };
        delete copy[leftUserId];
        return copy;
      });

      setChatMessages((prev) => [
        ...prev,
        {
          username: 'System',
          text: `${uName} has left the room.`,
          color: '#EF4444', // red
          isSystem: true,
          timestamp: new Date()
        }
      ]);
    });

    // 5. User List Updates
    socket.on('user-list-update', (users) => {
      setActiveUsers(users);
    });

    // 6. Live Cursor Updates
    socket.on('cursor-update', ({ userId: cursorUserId, username: cursorUsername, color: cursorColor, x, y }) => {
      setCursors((prev) => ({
        ...prev,
        [cursorUserId]: { username: cursorUsername, color: cursorColor, x, y }
      }));
    });

    // 7. New Chat Messages
    socket.on('new-message', (message) => {
      setChatMessages((prev) => [...prev, message]);
    });

    // 8. Canvas Cleared Event
    socket.on('canvas-cleared', () => {
      if (onCanvasCleared) {
        onCanvasCleared();
      }
    });

    // Clean up connections on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [roomId, username]);

  // Emit draw actions to all other clients
  const emitDraw = (drawData) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('draw', { roomId, drawData });
    }
  };

  // Emit mouse/cursor coordinates
  const emitCursorMove = (x, y) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('cursor-move', { roomId, x, y, username });
    }
  };

  // Request undo action
  const emitUndo = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('undo', { roomId, userId });
    }
  };

  // Request redo action
  const emitRedo = (stroke) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('redo', { roomId, stroke });
    }
  };

  // Request clear canvas
  const emitClearCanvas = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('clear-canvas', { roomId });
    }
  };

  // Send a chat message
  const sendMessage = (text) => {
    if (socketRef.current && isConnected && text.trim()) {
      socketRef.current.emit('send-message', { roomId, text });
    }
  };

  return {
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
  };
};

export default useSocket;
