import { useState, useRef, useEffect } from 'react';

const AVATAR_COLORS = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4',
  '#10b981', '#84cc16', '#eab308', '#f97316',
  '#ef4444', '#ec4899', '#d946ef', '#a78bfa',
];

// Character style preview drawn on canvas
const AVATAR_STYLES = [
  { id: 0, label: 'Classic' },
  { id: 1, label: 'Cool' },
  { id: 2, label: 'Happy' },
  { id: 3, label: 'Chill' },
];

function drawMiniAvatar(canvas, color, styleId) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const bodyY = h * 0.72;
  const headY = h * 0.32;
  const headR = w * 0.22;

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, bodyY, w * 0.22, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#f5e6d3';
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = color;
  ctx.beginPath();
  if (styleId === 0) {
    ctx.arc(cx, headY - 2, headR + 1, Math.PI, 0);
    ctx.fill();
  } else if (styleId === 1) {
    ctx.arc(cx, headY - 2, headR + 1, Math.PI * 0.85, Math.PI * 0.15);
    ctx.fill();
    // Spiky
    ctx.fillRect(cx - headR - 2, headY - headR - 4, headR * 2 + 4, 6);
  } else if (styleId === 2) {
    ctx.ellipse(cx, headY - headR * 0.3, headR + 3, headR * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.arc(cx, headY - 4, headR + 2, Math.PI * 1.1, Math.PI * -0.1);
    ctx.fill();
  }

  // Eyes
  ctx.fillStyle = '#1a1a2e';
  const eyeOffset = headR * 0.35;
  const eyeY = headY + 1;
  const eyeR = 2;
  ctx.beginPath();
  ctx.arc(cx - eyeOffset, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + eyeOffset, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = '#c44';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (styleId === 2) {
    ctx.arc(cx, eyeY + 5, 3, 0, Math.PI);
  } else {
    ctx.moveTo(cx - 3, eyeY + 6);
    ctx.lineTo(cx + 3, eyeY + 6);
  }
  ctx.stroke();
}

export default function JoinScreen({ onJoin }) {
  const [username, setUsername] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [selectedStyle, setSelectedStyle] = useState(0);
  const canvasRefs = useRef([]);
  const previewRef = useRef(null);

  // Draw avatar previews
  useEffect(() => {
    AVATAR_STYLES.forEach((style, idx) => {
      const canvas = canvasRefs.current[idx];
      if (canvas) drawMiniAvatar(canvas, selectedColor, style.id);
    });
    if (previewRef.current) {
      drawMiniAvatar(previewRef.current, selectedColor, selectedStyle);
    }
  }, [selectedColor, selectedStyle]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onJoin({ username: username.trim(), avatarColor: selectedColor, avatarStyle: selectedStyle });
    }
  };

  return (
    <div className="join-screen">
      <form className="join-card" onSubmit={handleSubmit} id="join-form">
        <h1 className="join-title">Virtual Cosmos</h1>
        <p className="join-subtitle">
          Enter the virtual office. Walk around, meet people nearby, and start chatting — just like real life.
        </p>

        {/* Avatar Preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <canvas
            ref={previewRef}
            width={80}
            height={100}
            style={{ borderRadius: 12, background: 'rgba(0,0,0,0.2)', padding: 8 }}
          />
        </div>

        <div className="input-group">
          <label htmlFor="username-input">Your Name</label>
          <input
            id="username-input"
            type="text"
            placeholder="Enter your display name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            autoFocus
            autoComplete="off"
          />
        </div>

        <div className="input-group">
          <label>Avatar Color</label>
          <div className="color-picker-wrapper">
            {AVATAR_COLORS.map((color, idx) => (
              <div
                key={idx}
                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                style={{ background: color }}
                onClick={() => setSelectedColor(color)}
                id={`color-option-${idx}`}
                role="button"
                tabIndex={0}
              />
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>Avatar Style</label>
          <div className="avatar-style-picker">
            {AVATAR_STYLES.map((style, idx) => (
              <div
                key={style.id}
                className={`avatar-style-option ${selectedStyle === style.id ? 'selected' : ''}`}
                onClick={() => setSelectedStyle(style.id)}
                id={`avatar-style-${style.id}`}
                role="button"
                tabIndex={0}
              >
                <canvas
                  ref={el => canvasRefs.current[idx] = el}
                  width={48}
                  height={64}
                  style={{ imageRendering: 'auto' }}
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="join-btn" disabled={!username.trim()} id="join-btn">
          Enter the Space →
        </button>

        <div className="join-hint">Use WASD or Arrow Keys to move around</div>
      </form>
    </div>
  );
}
