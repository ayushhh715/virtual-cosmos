import { useEffect, useRef, useCallback } from 'react';
import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js';

const MOVE_SPEED = 3.5;

// ── Color palettes for rooms ──
const ROOM_COLORS = {
  '#2a1f3d': { floor: 0x1e1633, wall: 0x2a1f3d, accent: 0x8b5cf6 },
  '#1f2d3d': { floor: 0x162030, wall: 0x1f2d3d, accent: 0x3b82f6 },
  '#1f3d2a': { floor: 0x152d1e, wall: 0x1f3d2a, accent: 0x10b981 },
  '#3d2a1f': { floor: 0x302015, wall: 0x3d2a1f, accent: 0xf97316 },
  '#2a3d3d': { floor: 0x1e3030, wall: 0x2a3d3d, accent: 0x06b6d4 },
  '#3d1f2a': { floor: 0x30151e, wall: 0x3d1f2a, accent: 0xec4899 },
  '#1a3d1a': { floor: 0x143014, wall: 0x1a3d1a, accent: 0x84cc16 },
};

const FURNITURE_COLORS = {
  desk: { fill: 0x3d3552, border: 0x524870 },
  table: { fill: 0x4a3f2f, border: 0x635538 },
  chair: { fill: 0x2d2840, border: 0x3d3552 },
  couch: { fill: 0x5c3d6b, border: 0x7a5290 },
  plant: { fill: 0x2d8a4e, border: 0x3cb860 },
  tree: { fill: 0x1a6b35, border: 0x25944a, trunk: 0x5c3d2a },
  whiteboard: { fill: 0xd0d0e0, border: 0x8888a0 },
  tv: { fill: 0x1a1a2e, border: 0x3a3a5e },
  bench: { fill: 0x6b5c4a, border: 0x8a7860 },
  fountain: { fill: 0x2a5a8a, border: 0x3a7ab0 },
  counter: { fill: 0x4a3520, border: 0x6b4d30 },
};

export default function CosmosCanvas({
  selfId, selfData, users, worldWidth, worldHeight,
  proximityRadius, onMove, connectedPeers, rooms, furniture,
  onRoomChange,
}) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef(new Set());
  const positionRef = useRef({ x: selfData?.x || 0, y: selfData?.y || 0 });
  const usersRef = useRef({});
  const selfIdRef = useRef(selfId);
  const avatarGraphicsRef = useRef({});
  const worldContainerRef = useRef(null);
  const proximityRef = useRef(proximityRadius);
  const connectedPeersRef = useRef(new Set());
  const currentRoomRef = useRef('');
  const emojisRef = useRef([]);

  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { selfIdRef.current = selfId; }, [selfId]);
  useEffect(() => { proximityRef.current = proximityRadius; }, [proximityRadius]);
  useEffect(() => {
    connectedPeersRef.current = new Set(connectedPeers.map(p => p.peerId));
  }, [connectedPeers]);

  // ── Draw character avatar ──
  const drawCharacter = useCallback((container, color, styleId, isSelf, username, isConnected) => {
    const colorHex = parseInt(color.replace('#', ''), 16);
    const avatarGroup = new Container();

    // Shadow
    const shadow = new Graphics();
    shadow.ellipse(0, 20, 14, 5);
    shadow.fill({ color: 0x000000, alpha: 0.25 });
    avatarGroup.addChild(shadow);

    // Body
    const body = new Graphics();
    body.roundRect(-12, 0, 24, 22, 6);
    body.fill({ color: colorHex });
    avatarGroup.addChild(body);

    // Head
    const skinColor = 0xf5deb3;
    const head = new Graphics();
    head.circle(0, -8, 13);
    head.fill({ color: skinColor });
    avatarGroup.addChild(head);

    // Hair based on style
    const hair = new Graphics();
    switch (styleId) {
      case 0: // Classic
        hair.arc(0, -10, 14, Math.PI, 0, false);
        hair.fill({ color: colorHex });
        hair.rect(-14, -18, 28, 6);
        hair.fill({ color: colorHex });
        break;
      case 1: // Cool - spiky
        hair.moveTo(-15, -14);
        hair.lineTo(-10, -26);
        hair.lineTo(-4, -16);
        hair.lineTo(0, -28);
        hair.lineTo(4, -16);
        hair.lineTo(10, -26);
        hair.lineTo(15, -14);
        hair.lineTo(-15, -14);
        hair.fill({ color: colorHex });
        hair.rect(-14, -18, 28, 6);
        hair.fill({ color: colorHex });
        break;
      case 2: // Happy - round
        hair.circle(0, -14, 15);
        hair.fill({ color: colorHex });
        break;
      case 3: // Chill - side
        hair.arc(0, -10, 14, Math.PI, 0, false);
        hair.fill({ color: colorHex });
        hair.rect(-14, -18, 28, 6);
        hair.fill({ color: colorHex });
        // Side bangs
        hair.moveTo(-14, -14);
        hair.lineTo(-18, -6);
        hair.lineTo(-12, -6);
        hair.fill({ color: colorHex });
        break;
      default:
        hair.arc(0, -10, 14, Math.PI, 0, false);
        hair.fill({ color: colorHex });
    }
    avatarGroup.addChild(hair);

    // Eyes
    const eyes = new Graphics();
    eyes.circle(-5, -6, 2);
    eyes.fill({ color: 0x1a1a2e });
    eyes.circle(5, -6, 2);
    eyes.fill({ color: 0x1a1a2e });
    // Eye highlights
    eyes.circle(-4, -7, 0.8);
    eyes.fill({ color: 0xffffff, alpha: 0.8 });
    eyes.circle(6, -7, 0.8);
    eyes.fill({ color: 0xffffff, alpha: 0.8 });
    avatarGroup.addChild(eyes);

    // Blush
    const blush = new Graphics();
    blush.circle(-8, -3, 2.5);
    blush.fill({ color: 0xff9999, alpha: 0.3 });
    blush.circle(8, -3, 2.5);
    blush.fill({ color: 0xff9999, alpha: 0.3 });
    avatarGroup.addChild(blush);

    // Mouth
    const mouth = new Graphics();
    if (isConnected || isSelf) {
      mouth.arc(0, -2, 3, 0, Math.PI);
      mouth.setStrokeStyle({ width: 1.2, color: 0xcc4444 });
      mouth.stroke();
    } else {
      mouth.moveTo(-2, -1);
      mouth.lineTo(2, -1);
      mouth.setStrokeStyle({ width: 1, color: 0xcc6666 });
      mouth.stroke();
    }
    avatarGroup.addChild(mouth);

    // Name tag
    const nameStyle = new TextStyle({
      fontFamily: 'Inter, sans-serif',
      fontSize: 11,
      fill: '#f1f1f5',
      fontWeight: isSelf ? '700' : '500',
      dropShadow: { alpha: 0.9, color: '#000000', blur: 4, distance: 0 },
    });
    const nameText = new Text({ text: username || 'User', style: nameStyle });
    nameText.anchor.set(0.5, 0);
    nameText.position.set(0, 26);
    avatarGroup.addChild(nameText);

    // Status indicator when connected
    if (isConnected) {
      const statusDot = new Graphics();
      statusDot.circle(16, -22, 4);
      statusDot.fill({ color: 0x34d399 });
      statusDot.circle(16, -22, 6);
      statusDot.setStrokeStyle({ width: 1.5, color: 0x34d399, alpha: 0.3 });
      statusDot.stroke();
      statusDot.name = 'statusDot';
      avatarGroup.addChild(statusDot);
    }

    // Self indicator glow
    if (isSelf) {
      const glow = new Graphics();
      glow.circle(0, 6, 30);
      glow.fill({ color: colorHex, alpha: 0.06 });
      glow.name = 'selfGlow';
      avatarGroup.addChildAt(glow, 0);

      // Proximity ring
      const ring = new Graphics();
      ring.circle(0, 6, proximityRef.current);
      ring.fill({ color: colorHex, alpha: 0.02 });
      ring.setStrokeStyle({ width: 1, color: colorHex, alpha: 0.08 });
      ring.circle(0, 6, proximityRef.current);
      ring.stroke();
      ring.name = 'proximityRing';
      avatarGroup.addChildAt(ring, 0);
    }

    return avatarGroup;
  }, []);

  // ── Draw office room ──
  const drawRoom = useCallback((container, room) => {
    const colors = ROOM_COLORS[room.color] || { floor: 0x1a1a2e, wall: 0x2a2a3e, accent: 0x8b5cf6 };

    // Floor
    const floor = new Graphics();
    floor.roundRect(room.x, room.y, room.width, room.height, 8);
    floor.fill({ color: colors.floor });
    container.addChild(floor);

    // Floor grid pattern
    const grid = new Graphics();
    grid.setStrokeStyle({ width: 0.5, color: 0xffffff, alpha: 0.03 });
    for (let x = room.x; x <= room.x + room.width; x += 40) {
      grid.moveTo(x, room.y);
      grid.lineTo(x, room.y + room.height);
    }
    for (let y = room.y; y <= room.y + room.height; y += 40) {
      grid.moveTo(room.x, y);
      grid.lineTo(room.x + room.width, y);
    }
    grid.stroke();
    container.addChild(grid);

    // Walls (top and left thick borders)
    const walls = new Graphics();
    walls.setStrokeStyle({ width: 4, color: colors.wall, alpha: 0.8 });
    walls.roundRect(room.x, room.y, room.width, room.height, 8);
    walls.stroke();
    container.addChild(walls);

    // Room accent corners
    const corners = new Graphics();
    const cornerLen = 16;
    corners.setStrokeStyle({ width: 2, color: colors.accent, alpha: 0.4 });
    // Top-left
    corners.moveTo(room.x + 4, room.y + cornerLen);
    corners.lineTo(room.x + 4, room.y + 4);
    corners.lineTo(room.x + cornerLen, room.y + 4);
    // Top-right
    corners.moveTo(room.x + room.width - cornerLen, room.y + 4);
    corners.lineTo(room.x + room.width - 4, room.y + 4);
    corners.lineTo(room.x + room.width - 4, room.y + cornerLen);
    // Bottom-left
    corners.moveTo(room.x + 4, room.y + room.height - cornerLen);
    corners.lineTo(room.x + 4, room.y + room.height - 4);
    corners.lineTo(room.x + cornerLen, room.y + room.height - 4);
    // Bottom-right
    corners.moveTo(room.x + room.width - cornerLen, room.y + room.height - 4);
    corners.lineTo(room.x + room.width - 4, room.y + room.height - 4);
    corners.lineTo(room.x + room.width - 4, room.y + room.height - cornerLen);
    corners.stroke();
    container.addChild(corners);

    // Room label
    const labelStyle = new TextStyle({
      fontFamily: 'Outfit, sans-serif',
      fontSize: 13,
      fill: colors.accent,
      fontWeight: '700',
      letterSpacing: 1,
      dropShadow: { alpha: 0.8, color: '#000', blur: 6, distance: 0 },
    });
    const label = new Text({ text: `🏷 ${room.name}`, style: labelStyle });
    label.anchor.set(0, 0);
    label.position.set(room.x + 12, room.y + 10);
    container.addChild(label);
  }, []);

  // ── Draw furniture ──
  const drawFurniture = useCallback((container, item) => {
    const g = new Graphics();
    const colors = FURNITURE_COLORS[item.type] || { fill: 0x333355, border: 0x444470 };

    switch (item.type) {
      case 'desk':
      case 'counter':
        g.roundRect(item.x, item.y, item.width, item.height, 4);
        g.fill({ color: colors.fill });
        g.setStrokeStyle({ width: 1, color: colors.border, alpha: 0.6 });
        g.roundRect(item.x, item.y, item.width, item.height, 4);
        g.stroke();
        // Monitor/screen
        if (item.type === 'desk') {
          g.roundRect(item.x + item.width/2 - 8, item.y + 6, 16, 12, 2);
          g.fill({ color: 0x2a4a7a, alpha: 0.6 });
        }
        break;

      case 'table':
        g.roundRect(item.x, item.y, item.width, item.height, 6);
        g.fill({ color: colors.fill });
        g.setStrokeStyle({ width: 1.5, color: colors.border, alpha: 0.5 });
        g.roundRect(item.x, item.y, item.width, item.height, 6);
        g.stroke();
        break;

      case 'chair':
        g.circle(item.x + item.width/2, item.y + item.height/2, item.width/2);
        g.fill({ color: colors.fill });
        g.setStrokeStyle({ width: 1, color: colors.border, alpha: 0.5 });
        g.circle(item.x + item.width/2, item.y + item.height/2, item.width/2);
        g.stroke();
        break;

      case 'couch':
        g.roundRect(item.x, item.y, item.width, item.height, 8);
        g.fill({ color: colors.fill });
        // Cushion lines
        g.setStrokeStyle({ width: 1, color: colors.border, alpha: 0.4 });
        g.moveTo(item.x + item.width * 0.33, item.y + 4);
        g.lineTo(item.x + item.width * 0.33, item.y + item.height - 4);
        g.moveTo(item.x + item.width * 0.66, item.y + 4);
        g.lineTo(item.x + item.width * 0.66, item.y + item.height - 4);
        g.stroke();
        break;

      case 'plant':
        g.circle(item.x, item.y, item.radius);
        g.fill({ color: colors.fill });
        g.circle(item.x - 4, item.y - 6, item.radius * 0.6);
        g.fill({ color: colors.border, alpha: 0.7 });
        g.circle(item.x + 5, item.y - 4, item.radius * 0.5);
        g.fill({ color: colors.fill, alpha: 0.8 });
        break;

      case 'tree':
        // Trunk
        g.rect(item.x - 4, item.y, 8, 16);
        g.fill({ color: colors.trunk });
        // Canopy layers
        g.circle(item.x, item.y - 6, item.radius);
        g.fill({ color: colors.fill });
        g.circle(item.x - 6, item.y + 2, item.radius * 0.7);
        g.fill({ color: colors.border, alpha: 0.7 });
        g.circle(item.x + 6, item.y, item.radius * 0.6);
        g.fill({ color: colors.fill, alpha: 0.8 });
        break;

      case 'whiteboard':
      case 'tv':
        g.roundRect(item.x, item.y, item.width, item.height, 2);
        g.fill({ color: colors.fill });
        g.setStrokeStyle({ width: 1.5, color: colors.border, alpha: 0.6 });
        g.roundRect(item.x, item.y, item.width, item.height, 2);
        g.stroke();
        break;

      case 'bench':
        g.roundRect(item.x, item.y, item.width, item.height, 3);
        g.fill({ color: colors.fill });
        g.setStrokeStyle({ width: 1, color: colors.border, alpha: 0.5 });
        g.roundRect(item.x, item.y, item.width, item.height, 3);
        g.stroke();
        break;

      case 'fountain':
        g.circle(item.x, item.y, item.radius);
        g.fill({ color: colors.fill, alpha: 0.6 });
        g.setStrokeStyle({ width: 2, color: colors.border, alpha: 0.5 });
        g.circle(item.x, item.y, item.radius);
        g.stroke();
        g.circle(item.x, item.y, item.radius * 0.5);
        g.fill({ color: 0x4a8ac0, alpha: 0.5 });
        break;
    }

    container.addChild(g);
  }, []);

  // ── Initialize PixiJS ──
  useEffect(() => {
    if (!containerRef.current || !selfData) return;

    let destroyed = false;
    const ww = worldWidth;
    const wh = worldHeight;

    async function init() {
      const app = new Application();
      await app.init({
        resizeTo: containerRef.current,
        background: 0x0a0a18,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (destroyed) { app.destroy(true); return; }

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      const worldContainer = new Container();
      worldContainerRef.current = worldContainer;
      app.stage.addChild(worldContainer);

      // ── Background ──
      const bg = new Graphics();
      bg.rect(0, 0, ww, wh);
      bg.fill({ color: 0x0c0c1a });
      worldContainer.addChild(bg);

      // Subtle dot grid for outdoor
      const dotGrid = new Graphics();
      for (let x = 0; x < ww; x += 60) {
        for (let y = 0; y < wh; y += 60) {
          dotGrid.circle(x, y, 1);
          dotGrid.fill({ color: 0xffffff, alpha: 0.04 });
        }
      }
      worldContainer.addChild(dotGrid);

      // ── Draw rooms ──
      if (rooms && rooms.length > 0) {
        rooms.forEach(room => drawRoom(worldContainer, room));
      }

      // Corridors / pathways between rooms
      const paths = new Graphics();
      paths.setStrokeStyle({ width: 60, color: 0x121222, alpha: 0.5 });
      // Horizontal corridor top row
      paths.moveTo(600, 300);
      paths.lineTo(700, 300);
      paths.moveTo(1150, 300);
      paths.lineTo(1250, 300);
      // Horizontal corridor bottom row
      paths.moveTo(600, 800);
      paths.lineTo(700, 800);
      paths.moveTo(1150, 800);
      paths.lineTo(1250, 800);
      // Vertical corridors
      paths.moveTo(350, 500);
      paths.lineTo(350, 600);
      paths.moveTo(925, 500);
      paths.lineTo(925, 600);
      paths.moveTo(1475, 500);
      paths.lineTo(1475, 600);
      // To garden
      paths.moveTo(850, 1000);
      paths.lineTo(850, 1100);
      paths.stroke();
      worldContainer.addChild(paths);

      // ── Draw furniture ──
      if (furniture && furniture.length > 0) {
        furniture.forEach(item => drawFurniture(worldContainer, item));
      }

      // ── World boundary ──
      const border = new Graphics();
      border.setStrokeStyle({ width: 2, color: 0x8b5cf6, alpha: 0.15 });
      border.roundRect(2, 2, ww - 4, wh - 4, 12);
      border.stroke();
      worldContainer.addChild(border);

      // Initialize position
      positionRef.current = { x: selfData.x, y: selfData.y };
      cameraRef.current = {
        x: selfData.x - app.screen.width / 2,
        y: selfData.y - app.screen.height / 2,
      };

      // ── Game loop ──
      let frameCount = 0;
      app.ticker.add(() => {
        if (destroyed) return;
        frameCount++;

        const keys = keysRef.current;
        let dx = 0, dy = 0;

        if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= MOVE_SPEED;
        if (keys.has('ArrowRight') || keys.has('KeyD')) dx += MOVE_SPEED;
        if (keys.has('ArrowUp') || keys.has('KeyW')) dy -= MOVE_SPEED;
        if (keys.has('ArrowDown') || keys.has('KeyS')) dy += MOVE_SPEED;

        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

        if (dx !== 0 || dy !== 0) {
          positionRef.current.x = Math.max(20, Math.min(ww - 20, positionRef.current.x + dx));
          positionRef.current.y = Math.max(20, Math.min(wh - 20, positionRef.current.y + dy));
          if (frameCount % 2 === 0) {
            onMove(positionRef.current.x, positionRef.current.y);
          }

          // Check room change
          if (rooms) {
            let newRoom = 'Outdoor';
            for (const r of rooms) {
              if (positionRef.current.x >= r.x && positionRef.current.x <= r.x + r.width &&
                  positionRef.current.y >= r.y && positionRef.current.y <= r.y + r.height) {
                newRoom = r.name;
                break;
              }
            }
            if (newRoom !== currentRoomRef.current) {
              currentRoomRef.current = newRoom;
              onRoomChange?.(newRoom);
            }
          }
        }

        // Camera follow
        const targetCamX = positionRef.current.x - app.screen.width / 2;
        const targetCamY = positionRef.current.y - app.screen.height / 2;
        cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.1;
        cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.1;

        cameraRef.current.x = Math.max(0, Math.min(ww - app.screen.width, cameraRef.current.x));
        cameraRef.current.y = Math.max(0, Math.min(wh - app.screen.height, cameraRef.current.y));

        worldContainer.position.set(-cameraRef.current.x, -cameraRef.current.y);

        // Update avatars
        const allUsers = usersRef.current;
        const currentSelfId = selfIdRef.current;

        if (allUsers[currentSelfId]) {
          allUsers[currentSelfId] = {
            ...allUsers[currentSelfId],
            x: positionRef.current.x,
            y: positionRef.current.y,
          };
        }

        Object.entries(allUsers).forEach(([id, userData]) => {
          const existing = avatarGraphicsRef.current[id];
          if (existing && !existing.destroyed) {
            if (id !== currentSelfId) {
              existing.position.x += (userData.x - existing.position.x) * 0.12;
              existing.position.y += (userData.y - existing.position.y) * 0.12;
            } else {
              existing.position.set(positionRef.current.x, positionRef.current.y);
            }

            // Breathing animation
            const selfGlow = existing.children.find(c => c.name === 'selfGlow');
            if (selfGlow) {
              selfGlow.alpha = 0.06 + Math.sin(frameCount * 0.03) * 0.02;
            }

            // Status dot pulse
            const statusDot = existing.children.find(c => c.name === 'statusDot');
            if (statusDot) {
              statusDot.alpha = 0.7 + Math.sin(frameCount * 0.05) * 0.3;
            }
          } else {
            const isSelf = id === currentSelfId;
            const isConnected = connectedPeersRef.current.has(id);
            const avatar = drawCharacter(
              worldContainer, userData.avatarColor || '#8b5cf6',
              userData.avatarStyle || 0, isSelf, userData.username, isConnected
            );
            avatar.position.set(userData.x, userData.y);
            avatar.name = id;
            worldContainer.addChild(avatar);
            avatarGraphicsRef.current[id] = avatar;
          }
        });

        // Connection lines
        const oldLines = worldContainer.children.filter(c => c.name === 'connLine');
        oldLines.forEach(l => { worldContainer.removeChild(l); l.destroy(); });

        connectedPeersRef.current.forEach(peerId => {
          const peerData = allUsers[peerId];
          if (!peerData) return;

          const line = new Graphics();
          line.name = 'connLine';

          const peerAvatar = avatarGraphicsRef.current[peerId];
          const peerX = peerAvatar ? peerAvatar.position.x : peerData.x;
          const peerY = peerAvatar ? peerAvatar.position.y : peerData.y;

          // Dashed line effect with gradient
          const sx = positionRef.current.x;
          const sy = positionRef.current.y;
          const dist = Math.sqrt((peerX - sx) ** 2 + (peerY - sy) ** 2);
          const segments = Math.floor(dist / 10);

          for (let i = 0; i < segments; i++) {
            if (i % 2 === 0) {
              const t1 = i / segments;
              const t2 = (i + 1) / segments;
              const x1 = sx + (peerX - sx) * t1;
              const y1 = sy + (peerY - sy) * t1;
              const x2 = sx + (peerX - sx) * t2;
              const y2 = sy + (peerY - sy) * t2;
              line.moveTo(x1, y1);
              line.lineTo(x2, y2);
            }
          }
          line.setStrokeStyle({ width: 1.5, color: 0x34d399, alpha: 0.35 + Math.sin(frameCount * 0.04) * 0.1 });
          line.stroke();
          worldContainer.addChild(line);
        });

        // Emoji animations
        emojisRef.current = emojisRef.current.filter(e => {
          e.life -= 1;
          if (e.graphic && !e.graphic.destroyed) {
            e.graphic.position.y -= 1;
            e.graphic.alpha = e.life / e.maxLife;
            if (e.life <= 0) {
              worldContainer.removeChild(e.graphic);
              e.graphic.destroy();
              return false;
            }
          }
          return e.life > 0;
        });

        // Remove avatars of disconnected users
        Object.keys(avatarGraphicsRef.current).forEach(id => {
          if (!allUsers[id]) {
            const avatar = avatarGraphicsRef.current[id];
            if (avatar && !avatar.destroyed) {
              worldContainer.removeChild(avatar);
              avatar.destroy();
            }
            delete avatarGraphicsRef.current[id];
          }
        });
      });
    }

    init();

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      keysRef.current.add(e.code);
    };

    const handleKeyUp = (e) => { keysRef.current.delete(e.code); };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      destroyed = true;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (appRef.current) { appRef.current.destroy(true); appRef.current = null; }
    };
  }, [selfData, worldWidth, worldHeight]);

  // Recreate avatars on connections change
  useEffect(() => {
    if (!worldContainerRef.current) return;
    const allUsers = usersRef.current;
    Object.entries(allUsers).forEach(([id, userData]) => {
      const old = avatarGraphicsRef.current[id];
      if (old && !old.destroyed) {
        worldContainerRef.current.removeChild(old);
        old.destroy();
      }
      const isSelf = id === selfIdRef.current;
      const isConnected = connectedPeersRef.current.has(id);
      const avatar = drawCharacter(
        worldContainerRef.current, userData.avatarColor || '#8b5cf6',
        userData.avatarStyle || 0, isSelf, userData.username, isConnected
      );
      avatar.position.set(userData.x, userData.y);
      avatar.name = id;
      worldContainerRef.current.addChild(avatar);
      avatarGraphicsRef.current[id] = avatar;
    });
  }, [connectedPeers, drawCharacter]);

  // Public method to add emoji
  useEffect(() => {
    window.__cosmosAddEmoji = (emoji, x, y) => {
      if (!worldContainerRef.current) return;
      const style = new TextStyle({ fontSize: 28 });
      const text = new Text({ text: emoji, style });
      text.anchor.set(0.5, 0.5);
      text.position.set(x, y - 30);
      worldContainerRef.current.addChild(text);
      emojisRef.current.push({ graphic: text, life: 60, maxLife: 60 });
    };
    return () => { delete window.__cosmosAddEmoji; };
  }, []);

  return (
    <div ref={containerRef} className="cosmos-canvas-container" id="cosmos-canvas" tabIndex={0} />
  );
}
