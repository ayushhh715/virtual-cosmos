export default function ChatTabs({
  connectedPeers,
  activeChat,
  onSelectChat,
  unreadCounts,
  hasPanelOpen,
}) {
  if (connectedPeers.length === 0) return null;

  return (
    <div className={`chat-tabs ${hasPanelOpen ? 'with-panel' : ''}`} id="chat-tabs">
      {connectedPeers.map((peer) => {
        const isActive = activeChat?.peerId === peer.peerId;
        const unread = unreadCounts[peer.roomId] || 0;

        return (
          <div
            key={peer.peerId}
            className={`chat-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelectChat(peer)}
            id={`chat-tab-${peer.peerId}`}
            role="button"
            tabIndex={0}
          >
            <div className="tab-dot" style={{ background: peer.peerColor }} />
            <span className="tab-name">{peer.peerName}</span>
            {unread > 0 && !isActive && (
              <span className="tab-unread">{unread}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
