import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from './models/Room.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure CORS for Express and Socket.IO
const corsOptions = {
  origin: '*', // In development, allow all origins. Can be restricted to frontend URL in production.
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collab-draw';

// MongoDB Connection with graceful fallback to in-memory store
let isDbConnected = false;
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✨ Connected to MongoDB successfully.');
    isDbConnected = true;
  })
  .catch((err) => {
    console.error('⚠️ MongoDB connection error:', err.message);
    console.log('🚀 Running backend with In-Memory fallback store. Data will not persist across restarts.');
  });

// In-Memory Database fallback store
const inMemoryRooms = new Map();

// Helper functions for room operations to abstract DB vs In-Memory
const getRoomData = async (roomId) => {
  if (isDbConnected) {
    try {
      let room = await Room.findOne({ roomId });
      if (room) {
        // Update activity timestamp
        room.lastActiveAt = new Date();
        await room.save();
        return room;
      }
    } catch (err) {
      console.error('Error fetching room from MongoDB:', err);
    }
  }
  
  if (inMemoryRooms.has(roomId)) {
    const room = inMemoryRooms.get(roomId);
    room.lastActiveAt = new Date();
    return room;
  }
  return null;
};

const createRoomData = async (roomId) => {
  const newRoom = {
    roomId,
    strokes: [],
    chatMessages: [],
    lastActiveAt: new Date()
  };

  if (isDbConnected) {
    try {
      const room = new Room(newRoom);
      await room.save();
      return room;
    } catch (err) {
      console.error('Error saving new room to MongoDB:', err);
    }
  }

  inMemoryRooms.set(roomId, newRoom);
  return newRoom;
};

const saveRoomStrokes = async (roomId, strokes) => {
  if (isDbConnected) {
    try {
      await Room.updateOne({ roomId }, { $set: { strokes, lastActiveAt: new Date() } });
      return;
    } catch (err) {
      console.error('Error updating strokes in MongoDB:', err);
    }
  }

  if (inMemoryRooms.has(roomId)) {
    const room = inMemoryRooms.get(roomId);
    room.strokes = strokes;
    room.lastActiveAt = new Date();
  }
};

const saveChatMessage = async (roomId, msg) => {
  if (isDbConnected) {
    try {
      await Room.updateOne(
        { roomId }, 
        { 
          $push: { chatMessages: msg },
          $set: { lastActiveAt: new Date() }
        }
      );
      return;
    } catch (err) {
      console.error('Error adding message in MongoDB:', err);
    }
  }

  if (inMemoryRooms.has(roomId)) {
    const room = inMemoryRooms.get(roomId);
    room.chatMessages.push(msg);
    room.lastActiveAt = new Date();
  }
};

// Auto-cleanup background job for deleting inactive rooms (after 30 mins)
const CLEANUP_INTERVAL = 60 * 1000; // Check every 1 minute
const MAX_INACTIVE_TIME = 30 * 60 * 1000; // 30 minutes in ms

setInterval(async () => {
  const threshold = new Date(Date.now() - MAX_INACTIVE_TIME);

  if (isDbConnected) {
    try {
      const result = await Room.deleteMany({ lastActiveAt: { $lt: threshold } });
      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} inactive rooms from MongoDB.`);
      }
    } catch (err) {
      console.error('Error cleaning up rooms in MongoDB:', err);
    }
  }

  // Also clean up in-memory rooms
  for (const [roomId, room] of inMemoryRooms.entries()) {
    if (room.lastActiveAt < threshold) {
      inMemoryRooms.delete(roomId);
      console.log(`🧹 Cleaned up inactive room ${roomId} from In-Memory store.`);
    }
  }
}, CLEANUP_INTERVAL);


// --- API ROUTES ---

// Generate unique 6-character room ID
function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid easily confused chars (I, O, 0, 1)
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/room/create -> Create a room
app.post('/api/room/create', async (req, res) => {
  try {
    let roomId = generateRoomId();
    // Ensure uniqueness
    let exists = await getRoomData(roomId);
    let attempts = 0;
    while (exists && attempts < 10) {
      roomId = generateRoomId();
      exists = await getRoomData(roomId);
      attempts++;
    }
    
    await createRoomData(roomId);
    console.log(`Room Created: ${roomId}`);
    res.status(201).json({ roomId });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /api/room/:roomId -> Check if room exists
app.get('/api/room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await getRoomData(roomId.toUpperCase());
    if (room) {
      res.status(200).json({ exists: true, roomId: room.roomId });
    } else {
      res.status(404).json({ exists: false, message: 'Room not found' });
    }
  } catch (error) {
    console.error('Error checking room:', error);
    res.status(500).json({ error: 'Server error checking room' });
  }
});


// --- SOCKET.IO REAL-TIME COLLABORATION ---

const io = new Server(httpServer, {
  cors: corsOptions
});

// Track active users inside rooms
// roomId -> Map(socketId -> { username, color, userId })
const roomUsers = new Map();

// Helper: Curated modern colors for users
const MODERN_COLORS = [
  '#FF4D4D', '#FF9F43', '#FECA57', '#1DD1A1', '#00D2D3', 
  '#54A0FF', '#5F27CD', '#FF9FF3', '#48DBFB', '#FF6B6B'
];

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // 1. Join Room
  socket.on('join-room', async ({ roomId, username }) => {
    const rId = roomId.toUpperCase();
    socket.join(rId);

    // Get room details
    const room = await getRoomData(rId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Assign a unique color to this user
    if (!roomUsers.has(rId)) {
      roomUsers.set(rId, new Map());
    }
    
    const usersInRoom = roomUsers.get(rId);
    const colorIndex = usersInRoom.size % MODERN_COLORS.length;
    const userColor = MODERN_COLORS[colorIndex];
    const userId = socket.id;

    const userProfile = {
      userId,
      username: username || 'Anonymous Painter',
      color: userColor
    };

    usersInRoom.set(socket.id, userProfile);

    console.log(`👤 User [${userProfile.username}] joined Room [${rId}]`);

    // Send the current canvas state & chat messages & assigned color to the new user
    socket.emit('canvas-state', {
      strokes: room.strokes || [],
      chatMessages: room.chatMessages || [],
      userColor,
      userId
    });

    // Notify other users that a new user joined
    socket.to(rId).emit('user-joined', {
      userId,
      username: userProfile.username,
      color: userProfile.color
    });

    // Broadcast current user list to all in the room
    const userList = Array.from(usersInRoom.values());
    io.to(rId).emit('user-list-update', userList);
  });

  // 2. Draw Events (real-time stream of segments/shapes/actions)
  socket.on('draw', async ({ roomId, drawData }) => {
    const rId = roomId.toUpperCase();
    const usersInRoom = roomUsers.get(rId);
    if (!usersInRoom || !usersInRoom.has(socket.id)) return;

    // Broadcast the draw event to all other clients in the room
    socket.to(rId).emit('draw', drawData);

    // Save final stroke (drawData contains flag or represents a completed drawing action)
    if (drawData && drawData.isComplete) {
      const room = await getRoomData(rId);
      if (room) {
        const updatedStrokes = [...room.strokes, drawData.stroke];
        await saveRoomStrokes(rId, updatedStrokes);
      }
    }
  });

  // 3. Live Cursor Movement
  socket.on('cursor-move', ({ roomId, x, y, username }) => {
    const rId = roomId.toUpperCase();
    const usersInRoom = roomUsers.get(rId);
    if (!usersInRoom || !usersInRoom.has(socket.id)) return;

    const userProfile = usersInRoom.get(socket.id);
    
    // Broadcast cursor positions to all other users in the room
    socket.to(rId).emit('cursor-update', {
      userId: socket.id,
      username: userProfile.username,
      color: userProfile.color,
      x,
      y
    });
  });

  // 4. Undo Stroke Action (Last 20 per client is managed on client side or server)
  // Let's filter out the last stroke drawn by this user
  socket.on('undo', async ({ roomId, userId }) => {
    const rId = roomId.toUpperCase();
    const room = await getRoomData(rId);
    if (!room) return;

    const targetUserId = userId || socket.id;

    // Find the last stroke by targetUserId and remove it
    const strokes = [...room.strokes];
    let lastIndex = -1;
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].userId === targetUserId) {
        lastIndex = i;
        break;
      }
    }

    if (lastIndex !== -1) {
      strokes.splice(lastIndex, 1);
      await saveRoomStrokes(rId, strokes);
      // Broadcast the updated strokes to everyone in the room
      io.to(rId).emit('canvas-state', {
        strokes,
        chatMessages: room.chatMessages
      });
    }
  });

  // 5. Redo Stroke Action
  socket.on('redo', async ({ roomId, stroke }) => {
    const rId = roomId.toUpperCase();
    const room = await getRoomData(rId);
    if (!room || !stroke) return;

    const strokes = [...room.strokes, stroke];
    await saveRoomStrokes(rId, strokes);
    
    io.to(rId).emit('canvas-state', {
      strokes,
      chatMessages: room.chatMessages
    });
  });

  // 6. Clear Canvas
  socket.on('clear-canvas', async ({ roomId }) => {
    const rId = roomId.toUpperCase();
    const room = await getRoomData(rId);
    if (!room) return;

    await saveRoomStrokes(rId, []);
    io.to(rId).emit('canvas-cleared');
  });

  // 7. Chat Message System
  socket.on('send-message', async ({ roomId, text }) => {
    const rId = roomId.toUpperCase();
    const usersInRoom = roomUsers.get(rId);
    if (!usersInRoom || !usersInRoom.has(socket.id)) return;

    const userProfile = usersInRoom.get(socket.id);
    const msg = {
      username: userProfile.username,
      text,
      color: userProfile.color,
      timestamp: new Date()
    };

    await saveChatMessage(rId, msg);

    // Broadcast message to everyone in the room (including sender)
    io.to(rId).emit('new-message', msg);
  });

  // 8. Disconnect Handler
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    // Find the rooms this user was in, remove them and notify
    for (const [roomId, users] of roomUsers.entries()) {
      if (users.has(socket.id)) {
        const disconnectedUser = users.get(socket.id);
        users.delete(socket.id);
        
        console.log(`👤 User [${disconnectedUser.username}] left Room [${roomId}]`);
        
        // Notify room
        socket.to(roomId).emit('user-left', {
          userId: socket.id,
          username: disconnectedUser.username
        });

        // Broadcast updated user list
        const updatedList = Array.from(users.values());
        io.to(roomId).emit('user-list-update', updatedList);

        // If room is completely empty, we can clean from memory or let TTL background cleanup handle it
        if (users.size === 0) {
          // Just update activity timestamp for database TTL or manual cleanup
          getRoomData(roomId);
        }
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 PaintSync Express + Socket.IO server running on http://localhost:${PORT}`);
});
