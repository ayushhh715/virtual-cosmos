export default function UserList({ users, selfId }) {
  const userEntries = Object.entries(users);

  if (userEntries.length === 0) return null;

  return (
    <div className="user-list" id="user-list">
      <div className="user-list-title">Explorers ({userEntries.length})</div>
      {userEntries.map(([id, user]) => (
        <div key={id} className={`user-list-item ${id === selfId ? 'you' : ''}`}>
          <div
            className="avatar-dot"
            style={{ background: user.avatarColor }}
          />
          <span className="username">{user.username}</span>
        </div>
      ))}
    </div>
  );
}
