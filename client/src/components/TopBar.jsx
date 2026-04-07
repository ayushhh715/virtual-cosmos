export default function TopBar({ onlineCount, connectedCount, currentRoom }) {
  return (
    <div className="top-bar" id="top-bar">
      <div className="top-bar-left">
        <div className="top-bar-logo">
          <div className="logo-icon">✦</div>
          <span>Cosmos</span>
        </div>
        <div className="top-bar-divider" />
        <div className="top-bar-space-name">
          <span>🏢</span>
          <span>Virtual Office</span>
        </div>
      </div>

      <div className="top-bar-center">
        {currentRoom && (
          <div className="top-bar-badge online">
            <div className="live-dot" />
            <span>{currentRoom}</span>
          </div>
        )}
      </div>

      <div className="top-bar-right">
        {connectedCount > 0 && (
          <div className="top-bar-btn" style={{ borderColor: 'rgba(52,211,153,0.3)', color: '#34d399' }}>
            🔗 {connectedCount} Connected
          </div>
        )}
        <div className="top-bar-users">
          <span>👥</span>
          <span>{onlineCount}/50</span>
        </div>
      </div>
    </div>
  );
}
