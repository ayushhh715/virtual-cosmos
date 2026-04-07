# 🌌 Virtual Cosmos — Proximity-Based Virtual Office

A **2D virtual environment** where users can move around and interact with each other in **real time**. When users come close, chat connects. When they move apart, chat disconnects — simulating **real-world proximity-based interaction** in a virtual space.

> 🎯 Inspired by [Cosmos.video](https://cosmos.video)

---

## ✨ Features

### ✅ Core Features (Must Have)

#### 1. User Movement
- 2D office space rendered with **PixiJS** (WebGL canvas)
- Character avatars with **4 customizable styles** and **12 color options**
- Movement via **WASD or Arrow Keys** with diagonal support
- Smooth camera follow with easing interpolation

#### 2. Real-Time Multiplayer
- Multiple users visible on screen simultaneously
- Real-time position sync using **Socket.IO** WebSockets
- Smooth remote player interpolation (no jitter)

#### 3. Proximity Detection (Core Logic)
- Server-authoritative **Euclidean distance** calculation
- Configurable proximity radius (default: 120px)
- Visual proximity ring shown around your character
- **Dashed connection lines** drawn between connected users

#### 4. Chat System
- **Auto-connects** when two users enter proximity → chat panel appears
- **Auto-disconnects** when users move apart → chat panel closes
- Real-time messaging via Socket.IO rooms
- Multiple simultaneous chat connections with **tabbed interface**
- Unread message counters per connection
- System messages for connect/disconnect events

#### 5. UI/UX
- **Top Header Bar** — Logo, space name, current room indicator, online count
- **Bottom Toolbar** — Move, Wave, React, Chat, Map, Settings buttons
- **User List Sidebar** — Shows all online explorers
- **Minimap** — Bird's-eye view with room zones and user positions
- **Room Labels** — Named zones (Lobby, Room 1, Room 2, Lounge, Meeting Room, Café, Garden)
- Clean, dark-themed design with **glassmorphism** and smooth animations

### 🌟 Bonus Features
- **Office-style Room Zones** — 7 distinct rooms with unique color themes
- **Furniture Rendering** — Desks, tables, chairs, couches, plants, trees, whiteboards, TV, fountains, counters
- **Chibi Character Avatars** — 4 hair styles with head, body, face, blush, and highlights
- **Emoji Reactions** — Wave (👋) and React (😊🎉🔥❤️ etc.) with floating animations
- **Room Tracking** — Current room displayed in top bar, updates as you move
- **Connection Indicators** — Green status dots and pulsing dashed lines between connected users
- **Corridor/Pathways** — Visual paths connecting rooms
- **Avatar Style Preview** — Live character preview on join screen

---

## 🛠 Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | React (Vite) | Fast HMR, modern build tooling |
| **Canvas** | PixiJS v8 | High-performance 2D WebGL rendering at 60fps |
| **Styling** | Tailwind CSS + Custom CSS | Utility-first base + custom design system |
| **Backend** | Node.js (Express) | Lightweight, event-driven server |
| **Real-time** | Socket.IO | Reliable WebSocket with fallback support |
| **Database** | MongoDB (Mongoose) | Flexible document store for user sessions |

---

## 📁 Project Structure

```
virtual-cosmos/
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── JoinScreen.jsx       # Entry screen (name, color, style picker)
│   │   │   ├── CosmosCanvas.jsx     # PixiJS 2D world renderer (rooms, furniture, avatars)
│   │   │   ├── ChatPanel.jsx        # Chat UI with messages
│   │   │   ├── ChatTabs.jsx         # Multi-chat connection tabs
│   │   │   ├── TopBar.jsx           # Header bar (logo, room, users)
│   │   │   ├── BottomToolbar.jsx    # Action toolbar (move, wave, react, chat)
│   │   │   ├── UserList.jsx         # Online users sidebar
│   │   │   └── Minimap.jsx          # World minimap with rooms
│   │   ├── hooks/
│   │   │   └── useSocket.js         # Socket.IO connection hook
│   │   ├── App.jsx                  # Main application orchestrator
│   │   ├── index.css                # Global design system & styles
│   │   └── main.jsx                 # Entry point
│   ├── index.html
│   ├── vite.config.js               # Vite config with proxy
│   └── package.json
├── server/                          # Node.js backend
│   ├── index.js                     # Express + Socket.IO + proximity logic
│   ├── .env                         # Environment variables
│   └── package.json
├── .gitignore
├── package.json                     # Root package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **MongoDB** (running locally or use MongoDB Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/ayushhh715/virtual-cosmos.git
cd virtual-cosmos

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running the Application

**Terminal 1 — Start the backend server:**
```bash
cd server
npm run dev
```
> Server starts at `http://localhost:3001`

**Terminal 2 — Start the frontend client:**
```bash
cd client
npm run dev
```
> Client starts at `http://localhost:5173`

### Environment Variables

Create a `.env` file in `/server`:
```env
PORT=3001
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/virtual-cosmos
```

---

## 🎮 User Flow

```
1. User opens the app → Join Screen appears
2. Enters name, picks avatar color & style → Clicks "Enter the Space"
3. Spawns in the Lobby → Sees other users moving in real time
4. Moves with WASD/Arrow keys → Explores rooms (Lobby, Meeting Room, Café...)
5. Gets close to another user (within proximity radius)
   → Connection line appears → Chat panel opens automatically
6. Sends messages in real-time chat
7. Moves away from the user
   → Chat disconnects → Panel closes automatically
8. Can react with emojis (👋 🎉 🔥 ❤️) that float above character
```

---

## ⚙️ Architecture & System Design

### Proximity Detection (Server-Side)
The proximity logic runs **server-side** to ensure authoritative, cheat-proof detection:

```
For each user move:
  1. Update position (x, y) in memory
  2. Calculate Euclidean distance to ALL other users
  3. If distance < PROXIMITY_RADIUS (120px):
     → Emit "proximity:connected" to both users
     → Create Socket.IO room for the pair
  4. If distance ≥ PROXIMITY_RADIUS (was previously connected):
     → Emit "proximity:disconnected" to both users
     → Destroy the chat room
```

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `user:join` | Client → Server | User enters the cosmos with name/avatar |
| `user:spawned` | Server → Client | Returns spawn position + world config |
| `users:state` | Server → All | Broadcasts all user positions |
| `user:move` | Client → Server | Position update on movement |
| `user:moved` | Server → Others | Broadcasts position to other clients |
| `user:left` | Server → All | User disconnected notification |
| `proximity:connected` | Server → Pair | Two users are within radius |
| `proximity:disconnected` | Server → Pair | Two users moved out of radius |
| `chat:message` | Bidirectional | Chat message within a room |
| `user:react` | Client → Server | Emoji reaction |
| `user:reacted` | Server → All | Broadcast emoji to all clients |

### Data Flow Diagram

```
┌─────────────┐     WebSocket      ┌──────────────┐      MongoDB
│   Browser    │ ◄──────────────►  │  Node.js     │ ◄──────────►  User Sessions
│   (React +   │   Socket.IO       │  Server      │
│    PixiJS)   │                   │  (Express)   │
│              │                   │              │
│  - Canvas    │  user:move ──►    │  - Position  │
│  - Chat UI   │  ◄── user:moved   │    Tracking  │
│  - Minimap   │                   │  - Proximity │
│  - Toolbar   │  ◄── proximity:*  │    Detection │
│              │                   │  - Chat Room │
│              │  chat:message ──► │    Management│
│              │  ◄── chat:message │              │
└─────────────┘                   └──────────────┘
```

---

## 🧪 Testing Multiplayer

To test the proximity-based chat:

1. Open `http://localhost:5173` in **Tab 1** → Join as "User A"
2. Open `http://localhost:5173` in **Tab 2** → Join as "User B"
3. In both tabs, use WASD to move the characters **close to each other**
4. When within proximity → Chat panel opens automatically in both tabs
5. Send messages → They appear in real-time in the other tab
6. Move apart → Chat disconnects automatically

---

## 📜 License

MIT
