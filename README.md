# 🌌 Virtual Cosmos

A 2D virtual environment where users can move around and interact with each other in real time through **proximity-based chat**. When users come close, chat connects. When they move apart, chat disconnects — simulating real-world interactions in a virtual space.

## ✨ Features

### Core Features
- **2D World Rendering** — PixiJS-powered canvas with grid, stars, and nebula effects
- **User Avatars** — Customizable color avatars with name labels
- **WASD/Arrow Key Movement** — Smooth keyboard-based movement with diagonal support
- **Real-Time Multiplayer** — Live position syncing via Socket.IO
- **Proximity Detection** — Automatic connection when users are within radius
- **Chat System** — Context-aware messaging that auto-connects/disconnects
- **Minimap** — Overview of the world with user positions and viewport indicator

### UI/UX
- Space-themed dark design with glassmorphism effects
- Smooth camera follow with easing
- Twinkling star animations
- Connection lines between linked users
- Pulsing proximity radius indicator
- Chat tabs for multiple simultaneous connections
- Unread message counters

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) |
| Canvas | PixiJS v8 |
| Styling | Tailwind CSS + Custom CSS |
| Backend | Node.js (Express) |
| Real-time | Socket.IO |
| Database | MongoDB (Mongoose) |

## 📁 Project Structure

```
virtual-cosmos/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── JoinScreen.jsx      # Entry screen with name & color picker
│   │   │   ├── CosmosCanvas.jsx    # PixiJS 2D world renderer
│   │   │   ├── ChatPanel.jsx       # Chat UI with messages
│   │   │   ├── ChatTabs.jsx        # Multiple chat connection tabs
│   │   │   ├── HUD.jsx             # Heads-up display overlay
│   │   │   ├── UserList.jsx        # Online users sidebar
│   │   │   └── Minimap.jsx         # World minimap
│   │   ├── hooks/
│   │   │   └── useSocket.js        # Socket.IO connection hook
│   │   ├── App.jsx                 # Main application logic
│   │   └── index.css               # Global styles & design system
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                  # Node.js backend
│   ├── index.js             # Express + Socket.IO server
│   ├── .env                 # Environment variables
│   └── package.json
└── package.json             # Root package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (running locally or Atlas connection string)

### Installation

```bash
# Clone the repo
cd virtual-cosmos

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running

**Terminal 1 — Start the server:**
```bash
cd server
npm run dev
```

**Terminal 2 — Start the client:**
```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

> 💡 To test multiplayer, open the URL in multiple browser tabs!

### Environment Variables

Server `.env`:
```env
PORT=3001
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/virtual-cosmos
```

## 🎮 User Flow

1. **Enter the Cosmos** — Input your name and choose an avatar color
2. **Explore the World** — Move with WASD or Arrow keys in the 2D space
3. **Get Close** — Move near another user (within proximity radius)
4. **Chat Opens** — Chat panel appears automatically; connection line drawn
5. **Message** — Send real-time messages to nearby users
6. **Move Away** — Chat disconnects when you leave the proximity zone

## ⚙️ Architecture

### Proximity Detection (Server-Side)
- Each user has a position `(x, y)` tracked on the server
- On every movement, Euclidean distance is calculated to all other users
- If `distance < PROXIMITY_RADIUS` → connection event emitted
- If `distance ≥ PROXIMITY_RADIUS` → disconnection event emitted
- Chat rooms are created/destroyed dynamically for each pair

### Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `user:join` | Client → Server | User joins the cosmos |
| `user:spawned` | Server → Client | Spawn data returned |
| `users:state` | Server → All | All user positions |
| `user:move` | Client → Server | Position update |
| `user:moved` | Server → Others | Broadcast position |
| `user:left` | Server → All | User disconnected |
| `proximity:connected` | Server → Pair | Users are close |
| `proximity:disconnected` | Server → Pair | Users moved apart |
| `chat:message` | Bidirectional | Chat message in room |

## 📜 License

MIT
