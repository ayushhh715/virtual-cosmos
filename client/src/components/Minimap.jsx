export default function Minimap({
  users, selfId, selfPosition,
  worldWidth, worldHeight,
  viewportWidth, viewportHeight,
  cameraX, cameraY, rooms,
}) {
  const mapWidth = 180;
  const mapHeight = 120;
  const scaleX = mapWidth / worldWidth;
  const scaleY = mapHeight / worldHeight;

  return (
    <div className="minimap" id="minimap">
      <div className="minimap-inner">
        {/* Room shapes */}
        {rooms?.map((room, idx) => (
          <div
            key={idx}
            className="minimap-room"
            style={{
              left: `${room.x * scaleX}px`,
              top: `${room.y * scaleY}px`,
              width: `${room.width * scaleX}px`,
              height: `${room.height * scaleY}px`,
              background: room.color,
            }}
          />
        ))}

        {/* Viewport */}
        <div
          className="minimap-viewport"
          style={{
            left: `${Math.max(0, cameraX) * scaleX}px`,
            top: `${Math.max(0, cameraY) * scaleY}px`,
            width: `${viewportWidth * scaleX}px`,
            height: `${viewportHeight * scaleY}px`,
          }}
        />

        {/* User dots */}
        {Object.entries(users).map(([id, user]) => {
          const isSelf = id === selfId;
          const x = isSelf ? selfPosition.x : user.x;
          const y = isSelf ? selfPosition.y : user.y;
          return (
            <div
              key={id}
              className={`minimap-dot ${isSelf ? 'self' : ''}`}
              style={{
                left: `${x * scaleX}px`,
                top: `${y * scaleY}px`,
                background: user.avatarColor,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
