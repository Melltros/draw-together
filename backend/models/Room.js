import mongoose from 'mongoose';

const StrokeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  tool: { type: String, required: true }, // 'pen', 'eraser', 'line', 'rect', 'circle', 'text'
  color: { type: String, required: true },
  size: { type: Number, required: true },
  points: [{ x: Number, y: Number }], // For freehand pen and eraser
  text: { type: String }, // For text tool
  startPoint: { x: Number, y: Number }, // For shapes (line, rect, circle)
  endPoint: { x: Number, y: Number }    // For shapes (line, rect, circle)
});

const ChatMessageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  text: { type: String, required: true },
  color: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  strokes: { type: [StrokeSchema], default: [] },
  chatMessages: { type: [ChatMessageSchema], default: [] },
  lastActiveAt: { type: Date, default: Date.now }
});

// Auto-delete index to remove rooms older than 30 minutes of no activity
// RoomSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 1800 });

export const Room = mongoose.model('Room', RoomSchema);
export default Room;
