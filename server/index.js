const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// ── MongoDB Connection ──
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/virtual-cosmos';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.log('⚠️  MongoDB not available – running in-memory only:', err.message));

// ── Mongoose Model ──
const UserSession = mongoose.model(
  'UserSession',
  new mongoose.Schema({
    socketId: String,
    username: String,
    avatarColor: String,
    avatarStyle: Number,
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    connectedTo: [String],
    currentRoom: String,
    createdAt: { type: Date, default: Date.now },
  })
);

// ── In-Memory State ──
const users = new Map();
const chatRooms = new Map();

const PROXIMITY_RADIUS = 120;
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1600;

// ── Room / Zone definitions ──
const ROOMS = [
  { id: 'lobby', name: 'Lobby', x: 100, y: 100, width: 500, height: 400, color: '#2a1f3d' },
  { id: 'room1', name: 'Room 1', x: 700, y: 100, width: 450, height: 400, color: '#1f2d3d' },
  { id: 'room2', name: 'Room 2', x: 1250, y: 100, width: 450, height: 400, color: '#1f3d2a' },
  { id: 'lounge', name: 'Lounge', x: 100, y: 600, width: 500, height: 400, color: '#3d2a1f' },
  { id: 'meeting', name: 'Meeting Room', x: 700, y: 600, width: 450, height: 400, color: '#2a3d3d' },
  { id: 'cafe', name: 'Café', x: 1250, y: 600, width: 450, height: 400, color: '#3d1f2a' },
  { id: 'garden', name: 'Garden', x: 400, y: 1100, width: 900, height: 380, color: '#1a3d1a' },
];

// ── Furniture items for each room ──
const FURNITURE = [
  // Lobby
  { type: 'desk', x: 200, y: 200, width: 80, height: 50 },
  { type: 'desk', x: 400, y: 200, width: 80, height: 50 },
  { type: 'plant', x: 130, y: 130, radius: 15 },
  { type: 'plant', x: 560, y: 130, radius: 15 },
  { type: 'couch', x: 250, y: 380, width: 120, height: 40 },
  // Room 1
  { type: 'table', x: 850, y: 250, width: 120, height: 80 },
  { type: 'chair', x: 810, y: 230, width: 25, height: 25 },
  { type: 'chair', x: 980, y: 230, width: 25, height: 25 },
  { type: 'chair', x: 810, y: 330, width: 25, height: 25 },
  { type: 'chair', x: 980, y: 330, width: 25, height: 25 },
  { type: 'whiteboard', x: 730, y: 120, width: 80, height: 10 },
  // Room 2
  { type: 'desk', x: 1350, y: 200, width: 80, height: 50 },
  { type: 'desk', x: 1350, y: 320, width: 80, height: 50 },
  { type: 'desk', x: 1530, y: 200, width: 80, height: 50 },
  { type: 'desk', x: 1530, y: 320, width: 80, height: 50 },
  { type: 'plant', x: 1280, y: 130, radius: 15 },
  // Lounge
  { type: 'couch', x: 200, y: 700, width: 140, height: 50 },
  { type: 'couch', x: 200, y: 850, width: 140, height: 50 },
  { type: 'table', x: 250, y: 780, width: 60, height: 40 },
  { type: 'tv', x: 440, y: 620, width: 80, height: 10 },
  // Meeting Room
  { type: 'table', x: 830, y: 720, width: 180, height: 100 },
  { type: 'chair', x: 800, y: 700, width: 25, height: 25 },
  { type: 'chair', x: 870, y: 700, width: 25, height: 25 },
  { type: 'chair', x: 940, y: 700, width: 25, height: 25 },
  { type: 'chair', x: 800, y: 830, width: 25, height: 25 },
  { type: 'chair', x: 870, y: 830, width: 25, height: 25 },
  { type: 'chair', x: 940, y: 830, width: 25, height: 25 },
  { type: 'whiteboard', x: 730, y: 620, width: 80, height: 10 },
  // Café
  { type: 'table', x: 1350, y: 700, width: 50, height: 50 },
  { type: 'table', x: 1500, y: 700, width: 50, height: 50 },
  { type: 'table', x: 1350, y: 860, width: 50, height: 50 },
  { type: 'table', x: 1500, y: 860, width: 50, height: 50 },
  { type: 'counter', x: 1580, y: 630, width: 90, height: 30 },
  // Garden
  { type: 'tree', x: 500, y: 1200, radius: 30 },
  { type: 'tree', x: 700, y: 1350, radius: 25 },
  { type: 'tree', x: 1100, y: 1200, radius: 30 },
  { type: 'bench', x: 600, y: 1280, width: 60, height: 20 },
  { type: 'bench', x: 900, y: 1280, width: 60, height: 20 },
  { type: 'fountain', x: 850, y: 1230, radius: 35 },
];

// ── Helpers ──
function getRoomId(id1, id2) {
  return [id1, id2].sort().join('::');
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getCurrentRoom(x, y) {
  for (const room of ROOMS) {
    if (x >= room.x && x <= room.x + room.width && y >= room.y && y <= room.y + room.height) {
      return room.id;
    }
  }
  return 'outdoor';
}

function updateProximity(socketId) {
  const currentUser = users.get(socketId);
  if (!currentUser) return;

  const newConnections = new Set();
  const prevConnections = new Set(currentUser.connectedTo || []);

  users.forEach((otherUser, otherId) => {
    if (otherId === socketId) return;
    const dist = distance(currentUser, otherUser);

    if (dist < PROXIMITY_RADIUS) {
      newConnections.add(otherId);
      const roomId = getRoomId(socketId, otherId);

      if (!prevConnections.has(otherId)) {
        if (!chatRooms.has(roomId)) {
          chatRooms.set(roomId, new Set());
        }
        chatRooms.get(roomId).add(socketId);
        chatRooms.get(roomId).add(otherId);

        const socketA = io.sockets.sockets.get(socketId);
        const socketB = io.sockets.sockets.get(otherId);
        if (socketA) socketA.join(roomId);
        if (socketB) socketB.join(roomId);

        io.to(socketId).emit('proximity:connected', {
          peerId: otherId,
          peerName: otherUser.username,
          peerColor: otherUser.avatarColor,
          peerStyle: otherUser.avatarStyle,
          roomId,
        });
        io.to(otherId).emit('proximity:connected', {
          peerId: socketId,
          peerName: currentUser.username,
          peerColor: currentUser.avatarColor,
          peerStyle: currentUser.avatarStyle,
          roomId,
        });
      }
    }
  });

  prevConnections.forEach((prevId) => {
    if (!newConnections.has(prevId)) {
      const roomId = getRoomId(socketId, prevId);

      const socketA = io.sockets.sockets.get(socketId);
      const socketB = io.sockets.sockets.get(prevId);
      if (socketA) socketA.leave(roomId);
      if (socketB) socketB.leave(roomId);

      chatRooms.delete(roomId);

      io.to(socketId).emit('proximity:disconnected', { peerId: prevId, roomId });
      io.to(prevId).emit('proximity:disconnected', { peerId: socketId, roomId });

      const otherUser = users.get(prevId);
      if (otherUser) {
        otherUser.connectedTo = (otherUser.connectedTo || []).filter((id) => id !== socketId);
      }
    }
  });

  currentUser.connectedTo = Array.from(newConnections);
}

// ── Socket.IO Events ──
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('user:join', async (data) => {
    const { username, avatarColor, avatarStyle } = data;
    // Spawn in lobby
    const spawnX = 250 + Math.random() * 200;
    const spawnY = 250 + Math.random() * 150;

    const userData = {
      username,
      avatarColor,
      avatarStyle: avatarStyle || 0,
      x: spawnX,
      y: spawnY,
      connectedTo: [],
      currentRoom: 'lobby',
    };

    users.set(socket.id, userData);

    try {
      await UserSession.create({ socketId: socket.id, ...userData });
    } catch (e) { /* MongoDB might not be available */ }

    socket.emit('user:spawned', {
      id: socket.id,
      ...userData,
      worldWidth: WORLD_WIDTH,
      worldHeight: WORLD_HEIGHT,
      proximityRadius: PROXIMITY_RADIUS,
      rooms: ROOMS,
      furniture: FURNITURE,
    });

    const allUsers = {};
    users.forEach((u, id) => {
      allUsers[id] = {
        username: u.username,
        x: u.x,
        y: u.y,
        avatarColor: u.avatarColor,
        avatarStyle: u.avatarStyle,
        currentRoom: u.currentRoom,
      };
    });
    io.emit('users:state', allUsers);
  });

  socket.on('user:move', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    user.x = Math.max(20, Math.min(WORLD_WIDTH - 20, data.x));
    user.y = Math.max(20, Math.min(WORLD_HEIGHT - 20, data.y));
    user.currentRoom = getCurrentRoom(user.x, user.y);

    socket.broadcast.emit('user:moved', {
      id: socket.id,
      x: user.x,
      y: user.y,
      currentRoom: user.currentRoom,
    });

    updateProximity(socket.id);
  });

  socket.on('chat:message', (data) => {
    const { roomId, message } = data;
    const user = users.get(socket.id);
    if (!user) return;

    const chatMessage = {
      senderId: socket.id,
      senderName: user.username,
      senderColor: user.avatarColor,
      message,
      timestamp: Date.now(),
      roomId,
    };

    io.to(roomId).emit('chat:message', chatMessage);
  });

  // Emoji reactions
  socket.on('user:react', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    io.emit('user:reacted', {
      id: socket.id,
      emoji: data.emoji,
      x: user.x,
      y: user.y,
    });
  });

  socket.on('disconnect', async () => {
    console.log(`❌ User disconnected: ${socket.id}`);

    const user = users.get(socket.id);
    if (user) {
      (user.connectedTo || []).forEach((peerId) => {
        const roomId = getRoomId(socket.id, peerId);
        chatRooms.delete(roomId);
        io.to(peerId).emit('proximity:disconnected', { peerId: socket.id, roomId });

        const otherUser = users.get(peerId);
        if (otherUser) {
          otherUser.connectedTo = (otherUser.connectedTo || []).filter((id) => id !== socket.id);
        }
      });
    }

    users.delete(socket.id);
    try { await UserSession.deleteOne({ socketId: socket.id }); } catch (e) {}
    io.emit('user:left', { id: socket.id });
  });
});

// ── REST endpoints ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', users: users.size });
});

app.get('/api/world', (req, res) => {
  res.json({
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    proximityRadius: PROXIMITY_RADIUS,
    rooms: ROOMS,
    furniture: FURNITURE,
  });
});

// ── Start Server ──
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Virtual Cosmos server running on port ${PORT}`);
});
