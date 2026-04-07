import { useState } from 'react';

const EMOJIS = ['👋', '👍', '❤️', '🎉', '😂', '🔥', '⭐', '💬'];

export default function BottomToolbar({ onChat, onReact, isChatActive, selfPosition }) {
  const [showEmojis, setShowEmojis] = useState(false);

  const handleReact = (emoji) => {
    onReact(emoji);
    if (window.__cosmosAddEmoji && selfPosition) {
      window.__cosmosAddEmoji(emoji, selfPosition.x, selfPosition.y);
    }
    setShowEmojis(false);
  };

  return (
    <>
      {showEmojis && (
        <div className="emoji-picker" id="emoji-picker">
          {EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              className="emoji-btn"
              onClick={() => handleReact(emoji)}
              id={`emoji-btn-${idx}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="bottom-toolbar" id="bottom-toolbar">
        <button className="toolbar-btn" id="toolbar-move" title="Move">
          <span className="toolbar-icon">🚶</span>
          <span>Move</span>
        </button>

        <button className="toolbar-btn" id="toolbar-wave" title="Wave"
          onClick={() => handleReact('👋')}>
          <span className="toolbar-icon">👋</span>
          <span>Wave</span>
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn react-btn`}
          id="toolbar-react"
          title="React"
          onClick={() => setShowEmojis(!showEmojis)}
        >
          <span className="toolbar-icon">😊</span>
          <span>React</span>
        </button>

        <button
          className={`toolbar-btn ${isChatActive ? 'active' : ''}`}
          id="toolbar-chat"
          title="Chat"
          onClick={onChat}
        >
          <span className="toolbar-icon">💬</span>
          <span>Chat</span>
        </button>

        <div className="toolbar-divider" />

        <button className="toolbar-btn" id="toolbar-map" title="Map">
          <span className="toolbar-icon">🗺️</span>
          <span>Map</span>
        </button>

        <button className="toolbar-btn" id="toolbar-settings" title="Settings">
          <span className="toolbar-icon">⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </>
  );
}
