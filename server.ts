import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import { PRESET_MAPS } from './src/game/maps.ts';
import type {
  CapybaraAppearance,
  CustomMap,
  DuelPhase,
  DuelStanding,
  DuelState,
  MapObject,
  RemotePlayerState,
  RoomMode,
  RoomSummary,
} from './src/game/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RoomPlayer extends RemotePlayerState {
  ws: WebSocket;
}

interface InternalDuelState {
  phase: DuelPhase;
  hostId: string;
  durationSec: number;
  countdownEndsAt: number;
  endsAt: number;
  readyPlayerIds: Set<string>;
  winnerId: string | null;
  lastBroadcastSec: number;
}

interface ServerRoom {
  id: string;
  code: string;
  mode: RoomMode;
  isPrivate: boolean;
  name: string;
  password: string;
  isPreset: boolean;
  maxPlayers: number;
  map: CustomMap;
  players: Map<string, RoomPlayer>;
  claimedYuzu: Set<string>;
  duel: InternalDuelState | null;
}

const rooms = new Map<string, ServerRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    let exists = false;
    for (const r of rooms.values()) {
      if (r.code === code) {
        exists = true;
        break;
      }
    }
    if (!exists) return code;
  }
  return `CP${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function seedPresetRooms(): void {
  const presets: { id: string; code: string; name: string; map: CustomMap }[] = [
    {
      id: 'preset_suoi_khoang',
      code: 'SUOI01',
      name: 'Suối Khoáng Bình Minh',
      map: PRESET_MAPS[0],
    },
    {
      id: 'preset_vuon_dao',
      code: 'VUON02',
      name: 'Vườn Hoa Anh Đào',
      map: PRESET_MAPS[1],
    },
    {
      id: 'preset_dem_dom_dom',
      code: 'HOANG3',
      name: 'Đấu Trường Hoàng Hôn',
      map: PRESET_MAPS[2],
    },
  ];

  for (const p of presets) {
    rooms.set(p.id, {
      id: p.id,
      code: p.code,
      mode: 'free',
      isPrivate: false,
      name: p.name,
      password: '',
      isPreset: true,
      maxPlayers: 10,
      map: p.map,
      players: new Map(),
      claimedYuzu: new Set(),
      duel: null,
    });
  }
}

seedPresetRooms();

function getRoomSummaries(): RoomSummary[] {
  const list: RoomSummary[] = [];
  for (const room of rooms.values()) {
    if (room.isPrivate) continue;
    list.push({
      id: room.id,
      code: room.code,
      mode: room.mode,
      name: room.name,
      hasPassword: room.password.length > 0,
      isPreset: room.isPreset,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      mapName: room.map.name,
      theme: room.map.theme,
    });
  }
  return list;
}

function buildDuelStandings(room: ServerRoom): DuelStanding[] {
  return Array.from(room.players.values())
    .map((p) => ({
      id: p.id,
      name: p.appearance.name || 'Mochi',
      score: p.score,
      yuzuCount: p.yuzuCount,
      appearance: p.appearance,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.yuzuCount - a.yuzuCount;
    });
}

function serializeDuelState(room: ServerRoom): DuelState | null {
  if (!room.duel) return null;
  const now = Date.now();
  const countdownSec =
    room.duel.phase === 'countdown'
      ? Math.max(0, Math.ceil((room.duel.countdownEndsAt - now) / 1000))
      : 0;
  const remainingSec =
    room.duel.phase === 'active'
      ? Math.max(0, Math.ceil((room.duel.endsAt - now) / 1000))
      : room.duel.phase === 'waiting' || room.duel.phase === 'countdown'
      ? room.duel.durationSec
      : 0;

  return {
    phase: room.duel.phase,
    hostId: room.duel.hostId,
    durationSec: room.duel.durationSec,
    countdownSec,
    remainingSec,
    readyPlayerIds: Array.from(room.duel.readyPlayerIds),
    winnerId: room.duel.winnerId,
    standings: buildDuelStandings(room),
  };
}

function sendJson(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastToRoom(room: ServerRoom, payload: unknown, excludeId?: string): void {
  const raw = JSON.stringify(payload);
  for (const player of room.players.values()) {
    if (player.id !== excludeId && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(raw);
    }
  }
}

function broadcastDuelState(room: ServerRoom): void {
  const duelState = serializeDuelState(room);
  if (!duelState) return;
  broadcastToRoom(room, { type: 'duel:state', duel: duelState });
}

function startDuelCountdown(room: ServerRoom): void {
  if (!room.duel || room.players.size < 2) return;
  room.duel.phase = 'countdown';
  room.duel.countdownEndsAt = Date.now() + 3000;
  room.duel.winnerId = null;
  room.duel.lastBroadcastSec = 3;
  room.claimedYuzu.clear();

  let idx = 0;
  for (const p of room.players.values()) {
    p.score = 0;
    p.yuzuCount = 0;
    p.x = idx % 2 === 0 ? 110 + idx * 45 : 780 - idx * 45;
    p.y = 306;
    p.vx = 0;
    p.vy = 0;
    idx++;
  }

  broadcastToRoom(room, {
    type: 'duel:reset',
    players: Array.from(room.players.values()).map(serializeRemotePlayer),
    duel: serializeDuelState(room),
  });
}

function sanitizeMap(rawMap: unknown): CustomMap {
  if (!rawMap || typeof rawMap !== 'object') {
    return PRESET_MAPS[0];
  }
  const m = rawMap as Partial<CustomMap>;
  const validThemes = new Set(['bamboo', 'sakura', 'night_lantern', 'snow']);
  const validTypes = new Set(['platform', 'spring', 'onsen', 'yuzu', 'hazard']);
  const theme = typeof m.theme === 'string' && validThemes.has(m.theme) ? m.theme : 'bamboo';

  const objects: MapObject[] = Array.isArray(m.objects)
    ? m.objects.slice(0, 80).map((o, idx) => ({
        id: typeof o?.id === 'string' ? o.id.slice(0, 32) : `obj_${idx}`,
        type:
          typeof o?.type === 'string' && validTypes.has(o.type)
            ? (o.type as MapObject['type'])
            : 'platform',
        x: Math.max(0, Math.min(940, Number(o?.x) || 0)),
        y: Math.max(40, Math.min(350, Number(o?.y) || 200)),
        w: Math.max(20, Math.min(260, Number(o?.w) || 60)),
        h: Math.max(14, Math.min(60, Number(o?.h) || 18)),
      }))
    : [];

  return {
    id: typeof m.id === 'string' ? m.id.slice(0, 48) : `map_${Date.now()}`,
    name:
      typeof m.name === 'string' && m.name.trim()
        ? m.name.trim().slice(0, 28)
        : 'Bản đồ tùy chỉnh',
    author:
      typeof m.author === 'string' && m.author.trim()
        ? m.author.trim().slice(0, 24)
        : 'Người chơi',
    theme: theme as CustomMap['theme'],
    objects,
  };
}

function sanitizeAppearance(raw: unknown): CapybaraAppearance {
  const a = (raw ?? {}) as Partial<CapybaraAppearance>;
  return {
    name: typeof a.name === 'string' && a.name.trim() ? a.name.trim().slice(0, 16) : 'Mochi',
    fur: a.fur ?? 'classic',
    head: a.head ?? 'none',
    neck: a.neck ?? 'none',
  };
}

function serializeRemotePlayer(p: RoomPlayer): RemotePlayerState {
  return {
    id: p.id,
    x: p.x,
    y: p.y,
    vx: p.vx,
    vy: p.vy,
    facing: p.facing,
    isDucking: p.isDucking,
    isGrounded: p.isGrounded,
    appearance: p.appearance,
    score: p.score,
    yuzuCount: p.yuzuCount,
    emote: p.emote,
    emoteUntil: p.emoteUntil,
  };
}

function findRoomByIdOrCode(roomIdOrCode: string): ServerRoom | undefined {
  const direct = rooms.get(roomIdOrCode);
  if (direct) return direct;
  const normalized = roomIdOrCode.trim().toUpperCase();
  if (!normalized) return undefined;
  for (const r of rooms.values()) {
    if (r.code.toUpperCase() === normalized) return r;
  }
  return undefined;
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', rooms: rooms.size });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Server-authoritative duel clock loop
  const duelTickInterval = setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      if (!room.duel) continue;

      if (room.duel.phase === 'countdown') {
        const sec = Math.max(0, Math.ceil((room.duel.countdownEndsAt - now) / 1000));
        if (sec <= 0) {
          room.duel.phase = 'active';
          room.duel.endsAt = now + room.duel.durationSec * 1000;
          room.duel.lastBroadcastSec = room.duel.durationSec;
          broadcastDuelState(room);
        } else if (sec !== room.duel.lastBroadcastSec) {
          room.duel.lastBroadcastSec = sec;
          broadcastDuelState(room);
        }
      } else if (room.duel.phase === 'active') {
        const sec = Math.max(0, Math.ceil((room.duel.endsAt - now) / 1000));
        if (sec <= 0 || room.players.size < 2) {
          room.duel.phase = 'finished';
          room.duel.lastBroadcastSec = 0;
          const standings = buildDuelStandings(room);
          room.duel.winnerId = standings[0]?.id ?? null;
          broadcastDuelState(room);
        } else if (sec !== room.duel.lastBroadcastSec) {
          room.duel.lastBroadcastSec = sec;
          broadcastDuelState(room);
        }
      }
    }
  }, 250);

  const broadcastRoomsList = (): void => {
    const raw = JSON.stringify({ type: 'rooms:list', rooms: getRoomSummaries() });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  };

  const leaveCurrentRoom = (clientId: string, currentRoomId: string | null): string | null => {
    if (!currentRoomId) return null;
    const room = rooms.get(currentRoomId);
    if (!room) return null;
    if (room.players.has(clientId)) {
      room.players.delete(clientId);
      if (room.duel) {
        room.duel.readyPlayerIds.delete(clientId);
        if (room.duel.hostId === clientId) {
          const nextHost = room.players.keys().next().value;
          if (nextHost) room.duel.hostId = nextHost;
        }
        if (room.players.size < 2 && room.duel.phase === 'countdown') {
          room.duel.phase = 'waiting';
        }
      }
      broadcastToRoom(room, { type: 'player:left', playerId: clientId });
      if (room.players.size > 0 && room.duel) {
        broadcastDuelState(room);
      }
      if (!room.isPreset && room.players.size === 0) {
        rooms.delete(room.id);
      }
      broadcastRoomsList();
    }
    return null;
  };

  wss.on('connection', (ws) => {
    const clientId = `capy_${Math.random().toString(36).slice(2, 10)}`;
    let currentRoomId: string | null = null;

    sendJson(ws, { type: 'welcome', clientId, rooms: getRoomSummaries() });

    ws.on('message', (data) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(data)) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = msg.type;

      if (type === 'rooms:list') {
        sendJson(ws, { type: 'rooms:list', rooms: getRoomSummaries() });
        return;
      }

      if (type === 'room:create') {
        const mode: RoomMode = msg.mode === 'duel' ? 'duel' : 'free';
        const isPrivate = mode === 'duel' ? Boolean(msg.isPrivate ?? true) : false;
        const name =
          typeof msg.name === 'string' && msg.name.trim()
            ? msg.name.trim().slice(0, 32)
            : mode === 'duel'
            ? `Thách đấu #${rooms.size + 1}`
            : `Phòng Capybara #${rooms.size + 1}`;
        const password =
          typeof msg.password === 'string' ? msg.password.trim().slice(0, 20) : '';
        const maxPlayers =
          mode === 'duel'
            ? Math.max(2, Math.min(4, Number(msg.maxPlayers) || 2))
            : Math.max(2, Math.min(12, Number(msg.maxPlayers) || 8));
        const durationRaw = Number(msg.durationSec) || 60;
        const durationSec = [45, 60, 90].includes(durationRaw) ? durationRaw : 60;
        const map = sanitizeMap(msg.map);
        const roomId = `room_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const code = generateRoomCode();

        const newRoom: ServerRoom = {
          id: roomId,
          code,
          mode,
          isPrivate,
          name,
          password,
          isPreset: false,
          maxPlayers,
          map,
          players: new Map(),
          claimedYuzu: new Set(),
          duel:
            mode === 'duel'
              ? {
                  phase: 'waiting',
                  hostId: clientId,
                  durationSec,
                  countdownEndsAt: 0,
                  endsAt: 0,
                  readyPlayerIds: new Set(),
                  winnerId: null,
                  lastBroadcastSec: 0,
                }
              : null,
        };
        rooms.set(roomId, newRoom);
        broadcastRoomsList();
        sendJson(ws, { type: 'room:created', roomId, roomCode: code, mode });
        return;
      }

      if (type === 'room:join') {
        const lookup =
          typeof msg.roomCode === 'string' && msg.roomCode.trim()
            ? msg.roomCode
            : typeof msg.roomId === 'string'
            ? msg.roomId
            : '';
        const room = findRoomByIdOrCode(lookup);
        if (!room) {
          sendJson(ws, {
            type: 'room:error',
            message: 'Mã phòng hoặc máy chủ không tồn tại hoặc đã đóng.',
          });
          return;
        }
        if (room.password && String(msg.password ?? '') !== room.password) {
          sendJson(ws, { type: 'room:error', message: 'Mật khẩu máy chủ không chính xác.' });
          return;
        }
        if (room.players.size >= room.maxPlayers && !room.players.has(clientId)) {
          sendJson(ws, { type: 'room:error', message: 'Phòng đã đầy người chơi.' });
          return;
        }

        currentRoomId = leaveCurrentRoom(clientId, currentRoomId);
        currentRoomId = room.id;

        const appearance = sanitizeAppearance(msg.appearance);
        const playerIdx = room.players.size;
        const spawnX =
          room.mode === 'duel'
            ? playerIdx % 2 === 0
              ? 120 + playerIdx * 40
              : 780 - playerIdx * 40
            : 120 + (playerIdx % 5) * 60;

        const player: RoomPlayer = {
          id: clientId,
          ws,
          x: spawnX,
          y: 306,
          vx: 0,
          vy: 0,
          facing: room.mode === 'duel' && playerIdx % 2 === 1 ? -1 : 1,
          isDucking: false,
          isGrounded: true,
          appearance,
          score: 0,
          yuzuCount: 0,
          emote: null,
          emoteUntil: 0,
        };
        room.players.set(clientId, player);

        if (room.duel && room.players.size === 1) {
          room.duel.hostId = clientId;
        }

        const others: RemotePlayerState[] = [];
        for (const p of room.players.values()) {
          if (p.id !== clientId) others.push(serializeRemotePlayer(p));
        }

        sendJson(ws, {
          type: 'room:init',
          room: {
            id: room.id,
            code: room.code,
            mode: room.mode,
            name: room.name,
            hasPassword: room.password.length > 0,
            isPreset: room.isPreset,
            playerCount: room.players.size,
            maxPlayers: room.maxPlayers,
            mapName: room.map.name,
            theme: room.map.theme,
          },
          map: room.map,
          claimedYuzuIds: Array.from(room.claimedYuzu),
          players: others,
          selfPlayer: serializeRemotePlayer(player),
          duel: serializeDuelState(room),
        });

        broadcastToRoom(
          room,
          { type: 'player:joined', player: serializeRemotePlayer(player) },
          clientId
        );
        if (room.duel) {
          broadcastDuelState(room);
        }
        broadcastRoomsList();
        return;
      }

      if (type === 'room:leave') {
        currentRoomId = leaveCurrentRoom(clientId, currentRoomId);
        return;
      }

      if (type === 'duel:ready' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (!room || !room.duel || room.duel.phase !== 'waiting') return;
        if (room.duel.readyPlayerIds.has(clientId)) {
          room.duel.readyPlayerIds.delete(clientId);
        } else {
          room.duel.readyPlayerIds.add(clientId);
        }

        if (
          room.players.size >= 2 &&
          room.duel.readyPlayerIds.size >= room.players.size
        ) {
          startDuelCountdown(room);
        } else {
          broadcastDuelState(room);
        }
        return;
      }

      if (type === 'duel:start' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (
          !room ||
          !room.duel ||
          room.duel.hostId !== clientId ||
          room.duel.phase !== 'waiting' ||
          room.players.size < 2
        ) {
          return;
        }
        startDuelCountdown(room);
        return;
      }

      if (type === 'duel:rematch' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (!room || !room.duel || room.duel.phase !== 'finished') return;
        room.duel.phase = 'waiting';
        room.duel.winnerId = null;
        room.duel.readyPlayerIds.clear();
        room.claimedYuzu.clear();
        for (const p of room.players.values()) {
          p.score = 0;
          p.yuzuCount = 0;
        }
        broadcastToRoom(room, {
          type: 'duel:reset',
          players: Array.from(room.players.values()).map(serializeRemotePlayer),
          duel: serializeDuelState(room),
        });
        return;
      }

      if (type === 'duel:hazardHit' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        const player = room?.players.get(clientId);
        if (!room || !player || !room.duel || room.duel.phase !== 'active') return;
        player.score = Math.max(0, player.score - 10);
        broadcastDuelState(room);
        return;
      }

      if (type === 'player:move' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        const player = room?.players.get(clientId);
        if (!room || !player) return;

        player.x = Math.max(0, Math.min(900, Number(msg.x) || 0));
        player.y = Math.max(0, Math.min(400, Number(msg.y) || 0));
        player.vx = Number(msg.vx) || 0;
        player.vy = Number(msg.vy) || 0;
        player.facing = msg.facing === -1 ? -1 : 1;
        player.isDucking = Boolean(msg.isDucking);
        player.isGrounded = Boolean(msg.isGrounded);
        if (msg.appearance) {
          player.appearance = sanitizeAppearance(msg.appearance);
        }
        if (room.mode === 'free') {
          player.score = Math.max(0, Number(msg.score) || 0);
          player.yuzuCount = Math.max(0, Number(msg.yuzuCount) || 0);
        }

        broadcastToRoom(
          room,
          {
            type: 'player:moved',
            player: serializeRemotePlayer(player),
          },
          clientId
        );
        return;
      }

      if (type === 'player:emote' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        const player = room?.players.get(clientId);
        if (!room || !player) return;
        const emote = typeof msg.emote === 'string' ? msg.emote.slice(0, 28) : '';
        if (!emote) return;
        player.emote = emote;
        player.emoteUntil = Date.now() + 2600;
        broadcastToRoom(
          room,
          { type: 'player:emoted', playerId: clientId, emote },
          clientId
        );
        return;
      }

      if (type === 'collectible:claim' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        const player = room?.players.get(clientId);
        const objectId = typeof msg.objectId === 'string' ? msg.objectId : '';
        if (!room || !player || !objectId) return;

        if (room.mode === 'duel' && room.duel?.phase !== 'active') {
          return;
        }

        const targetObj = room.map.objects.find(
          (o) => o.id === objectId && o.type === 'yuzu'
        );
        if (!targetObj || room.claimedYuzu.has(objectId)) return;

        room.claimedYuzu.add(objectId);
        player.yuzuCount += 1;
        player.score += 20;

        broadcastToRoom(room, {
          type: 'collectible:claimed',
          objectId,
          playerId: clientId,
        });

        if (room.duel) {
          broadcastDuelState(room);
        }

        const respawnMs = room.mode === 'duel' ? 3500 : 7000;
        setTimeout(() => {
          if (rooms.has(room.id)) {
            room.claimedYuzu.delete(objectId);
            broadcastToRoom(room, {
              type: 'collectible:respawned',
              objectId,
            });
          }
        }, respawnMs);
      }
    });

    ws.on('close', () => {
      currentRoomId = leaveCurrentRoom(clientId, currentRoomId);
    });
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  const distPath = path.resolve(__dirname, 'dist');
  const distIndexPath = path.join(distPath, 'index.html');
  const isDevLifecycle =
    process.env.NODE_ENV === 'development' ||
    process.env.npm_lifecycle_event === 'dev';
  const hasBuiltDist = fs.existsSync(distIndexPath);
  const shouldUseViteDev =
    process.env.NODE_ENV !== 'production' && (isDevLifecycle || !hasBuiltDist);

  if (shouldUseViteDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      if (!fs.existsSync(distIndexPath)) {
        res.status(503).send('Application build not found.');
        return;
      }
      res.sendFile(distIndexPath);
    });
  }

  const PORT = Number(process.env.PORT || 3000);

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  wss.on('error', (err) => {
    console.error('WebSocketServer error:', err);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    clearInterval(duelTickInterval);
    for (const client of wss.clients) {
      client.close(1001, 'Server shutting down');
    }
    wss.close(() => {
      server.close(() => {
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(0), 4000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  server.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Server running on http://0.0.0.0:${PORT} (${shouldUseViteDev ? 'vite-dev' : 'production-static'})`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
