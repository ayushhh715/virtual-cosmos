import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './hooks/useSocket';
import JoinScreen from './components/JoinScreen';
import CosmosCanvas from './components/CosmosCanvas';
import ChatPanel from './components/ChatPanel';
import ChatTabs from './components/ChatTabs';
import TopBar from './components/TopBar';
import BottomToolbar from './components/BottomToolbar';
import UserList from './components/UserList';
import Minimap from './components/Minimap';
import './index.css';

export default function App() {
  const { socket, emit, on, off, isConnected } = useSocket();

  const [joined, setJoined] = useState(false);
  const [selfId, setSelfId] = useState(null);
  const [selfData, setSelfData] = useState(null);
  const [worldConfig, setWorldConfig] = useState({ width: 2400, height: 1600, radius: 120 });
  const [users, setUsers] = useState({});
  const [connectedPeers, setConnectedPeers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [selfPosition, setSelfPosition] = useState({ x: 0, y: 0 });
  const [currentRoom, setCurrentRoom] = useState('Lobby');
  const [rooms, setRooms] = useState([]);
  const [furniture, setFurniture] = useState([]);

  const connectedPeersRef = useRef([]);
  useEffect(() => { connectedPeersRef.current = connectedPeers; }, [connectedPeers]);

  // ── Socket events ──
  useEffect(() => {
    if (!socket.current) return;

    const handleSpawned = (data) => {
      setSelfId(data.id);
      setSelfData({
        username: data.username,
        avatarColor: data.avatarColor,
        avatarStyle: data.avatarStyle,
        x: data.x,
        y: data.y,
      });
      setSelfPosition({ x: data.x, y: data.y });
      setWorldConfig({ width: data.worldWidth, height: data.worldHeight, radius: data.proximityRadius });
      setRooms(data.rooms || []);
      setFurniture(data.furniture || []);
      setJoined(true);
    };

    const handleUsersState = (allUsers) => setUsers(allUsers);

    const handleUserMoved = (data) => {
      setUsers(prev => ({
        ...prev,
        [data.id]: prev[data.id]
          ? { ...prev[data.id], x: data.x, y: data.y, currentRoom: data.currentRoom }
          : prev[data.id],
      }));
    };

    const handleUserLeft = (data) => {
      setUsers(prev => { const c = { ...prev }; delete c[data.id]; return c; });
      setConnectedPeers(prev => prev.filter(p => p.peerId !== data.id));
      setActiveChat(prev => prev?.peerId === data.id ? null : prev);
    };

    const handleProximityConnected = (data) => {
      setConnectedPeers(prev => {
        if (prev.find(p => p.peerId === data.peerId)) return prev;
        const updated = [...prev, data];
        if (prev.length === 0) setActiveChat(data);
        return updated;
      });
      setMessages(prev => [...prev, {
        roomId: data.roomId, senderId: 'system', senderName: 'System',
        message: `${data.peerName} is now nearby`, timestamp: Date.now(), isSystem: true,
      }]);
    };

    const handleProximityDisconnected = (data) => {
      setConnectedPeers(prev => prev.filter(p => p.peerId !== data.peerId));
      setActiveChat(prev => prev?.peerId === data.peerId ? null : prev);
      setMessages(prev => [...prev, {
        roomId: data.roomId, senderId: 'system', senderName: 'System',
        message: `Moved too far — chat ended`, timestamp: Date.now(), isSystem: true,
      }]);
    };

    const handleChatMessage = (data) => {
      setMessages(prev => [...prev, data]);
      setUnreadCounts(prev => {
        if (data.senderId !== socket.current?.id) {
          return { ...prev, [data.roomId]: (prev[data.roomId] || 0) + 1 };
        }
        return prev;
      });
    };

    const handleUserReacted = (data) => {
      if (window.__cosmosAddEmoji) {
        window.__cosmosAddEmoji(data.emoji, data.x, data.y);
      }
    };

    on('user:spawned', handleSpawned);
    on('users:state', handleUsersState);
    on('user:moved', handleUserMoved);
    on('user:left', handleUserLeft);
    on('proximity:connected', handleProximityConnected);
    on('proximity:disconnected', handleProximityDisconnected);
    on('chat:message', handleChatMessage);
    on('user:reacted', handleUserReacted);

    return () => {
      off('user:spawned', handleSpawned);
      off('users:state', handleUsersState);
      off('user:moved', handleUserMoved);
      off('user:left', handleUserLeft);
      off('proximity:connected', handleProximityConnected);
      off('proximity:disconnected', handleProximityDisconnected);
      off('chat:message', handleChatMessage);
      off('user:reacted', handleUserReacted);
    };
  }, [on, off, socket]);

  // ── Handlers ──
  const handleJoin = useCallback((data) => emit('user:join', data), [emit]);
  const handleMove = useCallback((x, y) => {
    emit('user:move', { x, y });
    setSelfPosition({ x, y });
  }, [emit]);
  const handleSendMessage = useCallback((roomId, message) => emit('chat:message', { roomId, message }), [emit]);
  const handleSelectChat = useCallback((peer) => {
    setActiveChat(peer);
    setUnreadCounts(prev => ({ ...prev, [peer.roomId]: 0 }));
  }, []);
  const handleCloseChat = useCallback(() => setActiveChat(null), []);
  const handleRoomChange = useCallback((roomName) => setCurrentRoom(roomName), []);

  const handleReact = useCallback((emoji) => {
    emit('user:react', { emoji });
  }, [emit]);

  const handleChatToggle = useCallback(() => {
    if (connectedPeers.length > 0) {
      if (activeChat) {
        setActiveChat(null);
      } else {
        setActiveChat(connectedPeers[0]);
        setUnreadCounts(prev => ({ ...prev, [connectedPeers[0].roomId]: 0 }));
      }
    }
  }, [connectedPeers, activeChat]);

  // ── Render ──
  if (!joined) return <JoinScreen onJoin={handleJoin} />;

  return (
    <div className="cosmos-wrapper" id="cosmos-wrapper">
      <TopBar
        onlineCount={Object.keys(users).length}
        connectedCount={connectedPeers.length}
        currentRoom={currentRoom}
      />

      <CosmosCanvas
        selfId={selfId}
        selfData={selfData}
        users={users}
        worldWidth={worldConfig.width}
        worldHeight={worldConfig.height}
        proximityRadius={worldConfig.radius}
        onMove={handleMove}
        connectedPeers={connectedPeers}
        rooms={rooms}
        furniture={furniture}
        onRoomChange={handleRoomChange}
      />

      <UserList users={users} selfId={selfId} />

      <Minimap
        users={users}
        selfId={selfId}
        selfPosition={selfPosition}
        worldWidth={worldConfig.width}
        worldHeight={worldConfig.height}
        viewportWidth={window.innerWidth}
        viewportHeight={window.innerHeight - 104}
        cameraX={selfPosition.x - window.innerWidth / 2}
        cameraY={selfPosition.y - (window.innerHeight - 104) / 2}
        rooms={rooms}
      />

      {connectedPeers.length > 0 && (
        <>
          <ChatTabs
            connectedPeers={connectedPeers}
            activeChat={activeChat}
            onSelectChat={handleSelectChat}
            unreadCounts={unreadCounts}
            hasPanelOpen={!!activeChat}
          />
          {activeChat && (
            <ChatPanel
              activeChat={activeChat}
              messages={messages}
              onSend={handleSendMessage}
              onClose={handleCloseChat}
              selfId={selfId}
            />
          )}
        </>
      )}

      {connectedPeers.length > 0 && !activeChat && (
        <div className="proximity-badge" id="proximity-badge">
          <div className="dot" />
          <span>Near {connectedPeers.map(p => p.peerName).join(', ')}</span>
        </div>
      )}

      <BottomToolbar
        onChat={handleChatToggle}
        onReact={handleReact}
        isChatActive={!!activeChat}
        selfPosition={selfPosition}
      />
    </div>
  );
}
