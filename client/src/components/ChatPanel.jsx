import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ activeChat, messages, onSend, onClose, selfId }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(activeChat.roomId, input.trim());
      setInput('');
    }
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!activeChat) return null;

  const chatMessages = messages.filter(m => m.roomId === activeChat.roomId);

  return (
    <div className="chat-panel" id="chat-panel">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-avatar" style={{ background: activeChat.peerColor }}>
            {activeChat.peerName?.charAt(0)?.toUpperCase()}
          </div>
          <div className="chat-header-details">
            <div className="chat-header-name">{activeChat.peerName}</div>
            <div className="chat-header-status">
              <span className="status-dot" />
              Connected nearby
            </div>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose} id="chat-close-btn" aria-label="Close chat">✕</button>
      </div>

      <div className="chat-messages" id="chat-messages">
        <div className="chat-system-message">
          <span>🔗 Chat started with {activeChat.peerName}</span>
        </div>
        <div className="chat-system-message">
          <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>
            Move away to end the conversation
          </span>
        </div>

        {chatMessages.map((msg, idx) => {
          if (msg.isSystem) {
            return (
              <div key={idx} className="chat-system-message">
                <span>{msg.message}</span>
              </div>
            );
          }
          const isOwn = msg.senderId === selfId;
          return (
            <div key={idx} className={`chat-message ${isOwn ? 'own' : 'other'}`}>
              {!isOwn && (
                <div className="chat-message-sender" style={{ color: msg.senderColor }}>
                  {msg.senderName}
                </div>
              )}
              <div className="chat-message-bubble">{msg.message}</div>
              <div className="chat-message-time">{formatTime(msg.timestamp)}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          className="chat-input"
          type="text"
          placeholder={`Message ${activeChat.peerName}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          id="chat-input"
          autoComplete="off"
          autoFocus
        />
        <button type="submit" className="chat-send-btn" id="chat-send-btn" aria-label="Send message">
          ➤
        </button>
      </form>
    </div>
  );
}
