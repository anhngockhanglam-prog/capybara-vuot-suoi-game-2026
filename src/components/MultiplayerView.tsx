import {
  ArrowLeft,
  Check,
  Copy,
  Link2,
  Lock,
  Map as MapIcon,
  Plus,
  RefreshCw,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PRESET_MAPS } from '../game/maps';
import { renderMultiplayerScene } from '../game/renderer';
import { soundEngine } from '../game/sound';
import {
  ActiveWeather,
  CapybaraAppearance,
  CustomMap,
  DuelState,
  RemotePlayerState,
  RoomSummary,
  WeatherMode,
} from '../game/types';
import { createWeatherParticles, resolveActiveWeather } from '../game/weather';
import { MapEditor } from './MapEditor';

interface MultiplayerViewProps {
  appearance: CapybaraAppearance;
  weatherMode: WeatherMode;
  customMaps: CustomMap[];
  initialRoomCode?: string;
  onSaveCustomMap: (map: CustomMap) => void;
  onDeleteCustomMap: (mapId: string) => void;
  onAddYuzu: (amount: number) => void;
  onExitMultiplayer: () => void;
}

type LobbyTab = 'duel' | 'servers';

const LOGICAL_W = 960;
const LOGICAL_H = 440;
const GROUND_Y = 356;
const GRAVITY = 2200;

export function MultiplayerView({
  appearance,
  weatherMode,
  customMaps,
  initialRoomCode = '',
  onSaveCustomMap,
  onDeleteCustomMap,
  onAddYuzu,
  onExitMultiplayer,
}: MultiplayerViewProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [clientId, setClientId] = useState<string>('');
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [activeRoom, setActiveRoom] = useState<RoomSummary | null>(null);
  const [activeMap, setActiveMap] = useState<CustomMap | null>(null);
  const [duelState, setDuelState] = useState<DuelState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lobby sub-views
  const [lobbyTab, setLobbyTab] = useState<LobbyTab>(initialRoomCode ? 'duel' : 'duel');
  const [showMapEditor, setShowMapEditor] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [selectedMapId, setSelectedMapId] = useState<string>(PRESET_MAPS[0].id);
  const [duelDuration, setDuelDuration] = useState<45 | 60 | 90>(60);
  const [duelMaxPlayers, setDuelMaxPlayers] = useState<2 | 4>(2);
  const [duelRoomName, setDuelRoomName] = useState('');
  const [duelPassword, setDuelPassword] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState(initialRoomCode.toUpperCase());
  const [joinCodePassword, setJoinCodePassword] = useState('');
  const [passwordPromptRoom, setPasswordPromptRoom] = useState<string | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

  // Room Arena state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const remotePlayersRef = useRef<Map<string, RemotePlayerState>>(new Map());
  const claimedYuzuRef = useRef<Set<string>>(new Set());
  const duelStateRef = useRef<DuelState | null>(null);
  const activeRoomRef = useRef<RoomSummary | null>(null);
  const clientIdRef = useRef<string>('');
  const rewardedMatchKeyRef = useRef<string | null>(null);
  const pendingCreatePassRef = useRef<string>('');
  const autoJoinedInitialCodeRef = useRef<boolean>(false);

  const [playerCountDisplay, setPlayerCountDisplay] = useState(1);
  const [roomYuzuCount, setRoomYuzuCount] = useState(0);
  const [duelRewardBanner, setDuelRewardBanner] = useState<string | null>(null);

  const appearanceRef = useRef(appearance);
  const weatherModeRef = useRef(weatherMode);
  const onAddYuzuRef = useRef(onAddYuzu);
  useEffect(() => {
    appearanceRef.current = appearance;
  }, [appearance]);
  useEffect(() => {
    weatherModeRef.current = weatherMode;
  }, [weatherMode]);
  useEffect(() => {
    onAddYuzuRef.current = onAddYuzu;
  }, [onAddYuzu]);
  useEffect(() => {
    duelStateRef.current = duelState;
  }, [duelState]);
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);
  useEffect(() => {
    clientIdRef.current = clientId;
  }, [clientId]);

  const localSimRef = useRef({
    x: 120,
    y: GROUND_Y - 50,
    vx: 0,
    vy: 0,
    width: 66,
    height: 50,
    facing: 1 as 1 | -1,
    jumpsUsed: 0,
    isGrounded: true,
    isDucking: false,
    score: 0,
    yuzuCount: 0,
    hazardCooldown: 0,
    leftHeld: false,
    rightHeld: false,
    duckHeld: false,
    runCycle: 0,
    weatherParticles: createWeatherParticles(LOGICAL_W, LOGICAL_H, 48),
  });

  // Grant bonus Yuzu once when a duel match finishes
  useEffect(() => {
    if (!duelState || duelState.phase !== 'finished' || !activeRoom) return;
    const matchKey = `${activeRoom.id}_${duelState.standings.map((s) => `${s.id}:${s.score}`).join('|')}`;
    if (rewardedMatchKeyRef.current === matchKey) return;
    rewardedMatchKeyRef.current = matchKey;

    if (duelState.standings.length >= 2) {
      const isWinner = duelState.winnerId === clientId;
      const bonus = isWinner ? 25 : 8;
      onAddYuzuRef.current(bonus);
      setDuelRewardBanner(
        isWinner ? `Thắng thách đấu! Nhận +${bonus} Quýt thưởng.` : `Hoàn thành trận đấu! Nhận +${bonus} Quýt.`
      );
      if (isWinner) {
        soundEngine.playFeverStart();
      } else {
        soundEngine.playPowerUp();
      }
    }
  }, [duelState, activeRoom, clientId]);

  // Connect WebSocket
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    let socket: WebSocket | null = null;
    let closedByUnmount = false;

    const connect = () => {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsConnected(true);
        setErrorMsg(null);
        socket?.send(JSON.stringify({ type: 'rooms:list' }));

        if (initialRoomCode && !autoJoinedInitialCodeRef.current) {
          autoJoinedInitialCodeRef.current = true;
          socket?.send(
            JSON.stringify({
              type: 'room:join',
              roomCode: initialRoomCode.trim().toUpperCase(),
              password: '',
              appearance: appearanceRef.current,
            })
          );
        }
      };

      socket.onmessage = (evt) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(String(evt.data)) as Record<string, unknown>;
        } catch {
          return;
        }

        if (msg.type === 'welcome') {
          if (typeof msg.clientId === 'string') setClientId(msg.clientId);
          if (Array.isArray(msg.rooms)) setRooms(msg.rooms as RoomSummary[]);
        } else if (msg.type === 'rooms:list') {
          if (Array.isArray(msg.rooms)) {
            setRooms(msg.rooms as RoomSummary[]);
          }
        } else if (msg.type === 'room:error') {
          setErrorMsg(String(msg.message ?? 'Không thể tham gia máy chủ.'));
        } else if (msg.type === 'room:created') {
          const roomId = String(msg.roomId ?? '');
          if (roomId && socket?.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: 'room:join',
                roomId,
                password: pendingCreatePassRef.current,
                appearance: appearanceRef.current,
              })
            );
          }
        } else if (msg.type === 'room:init') {
          const room = msg.room as RoomSummary;
          const map = msg.map as CustomMap;
          const players = (msg.players as RemotePlayerState[]) ?? [];
          const claimed = (msg.claimedYuzuIds as string[]) ?? [];
          const selfPlayer = msg.selfPlayer as RemotePlayerState | undefined;
          const duel = (msg.duel as DuelState | null) ?? null;

          remotePlayersRef.current.clear();
          for (const p of players) {
            remotePlayersRef.current.set(p.id, p);
          }
          claimedYuzuRef.current = new Set(claimed);
          if (selfPlayer) {
            localSimRef.current.x = selfPlayer.x;
            localSimRef.current.y = selfPlayer.y;
            localSimRef.current.facing = selfPlayer.facing;
          }
          localSimRef.current.vx = 0;
          localSimRef.current.vy = 0;
          localSimRef.current.score = 0;
          localSimRef.current.yuzuCount = 0;
          localSimRef.current.hazardCooldown = 0;
          rewardedMatchKeyRef.current = null;
          setDuelRewardBanner(null);
          setRoomYuzuCount(0);
          setActiveRoom(room);
          setActiveMap(map);
          setDuelState(duel);
          setPlayerCountDisplay(players.length + 1);
          setErrorMsg(null);
          setPasswordPromptRoom(null);
          setJoinPassword('');
        } else if (msg.type === 'duel:state') {
          setDuelState((msg.duel as DuelState) ?? null);
        } else if (msg.type === 'duel:reset') {
          const players = (msg.players as RemotePlayerState[]) ?? [];
          const duel = (msg.duel as DuelState | null) ?? null;
          claimedYuzuRef.current.clear();
          localSimRef.current.score = 0;
          localSimRef.current.yuzuCount = 0;
          localSimRef.current.vx = 0;
          localSimRef.current.vy = 0;
          rewardedMatchKeyRef.current = null;
          setDuelRewardBanner(null);
          setRoomYuzuCount(0);
          for (const p of players) {
            if (p.id === clientIdRef.current) {
              localSimRef.current.x = p.x;
              localSimRef.current.y = p.y;
              localSimRef.current.facing = p.facing;
            } else {
              remotePlayersRef.current.set(p.id, p);
            }
          }
          setDuelState(duel);
        } else if (msg.type === 'player:joined') {
          const p = msg.player as RemotePlayerState;
          if (p?.id) {
            remotePlayersRef.current.set(p.id, p);
            setPlayerCountDisplay(remotePlayersRef.current.size + 1);
          }
        } else if (msg.type === 'player:moved') {
          const p = msg.player as RemotePlayerState;
          if (p?.id) {
            const existing = remotePlayersRef.current.get(p.id);
            remotePlayersRef.current.set(p.id, {
              ...p,
              emote: existing?.emote ?? p.emote ?? null,
              emoteUntil: existing?.emoteUntil ?? p.emoteUntil ?? 0,
            });
          }
        } else if (msg.type === 'player:emoted') {
          const pid = String(msg.playerId ?? '');
          const emote = String(msg.emote ?? '');
          const existing = remotePlayersRef.current.get(pid);
          if (existing) {
            existing.emote = emote;
            existing.emoteUntil = Date.now() + 2600;
          }
        } else if (msg.type === 'player:left') {
          const pid = String(msg.playerId ?? '');
          remotePlayersRef.current.delete(pid);
          setPlayerCountDisplay(remotePlayersRef.current.size + 1);
        } else if (msg.type === 'collectible:claimed') {
          const oid = String(msg.objectId ?? '');
          claimedYuzuRef.current.add(oid);
        } else if (msg.type === 'collectible:respawned') {
          const oid = String(msg.objectId ?? '');
          claimedYuzuRef.current.delete(oid);
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        if (!closedByUnmount) {
          setTimeout(connect, 2000);
        }
      };
    };

    connect();
    return () => {
      closedByUnmount = true;
      socket?.close();
    };
  }, [initialRoomCode]);

  const allAvailableMaps = [...PRESET_MAPS, ...customMaps];

  const handleCreateFreeRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const chosenMap =
      allAvailableMaps.find((m) => m.id === selectedMapId) ?? PRESET_MAPS[0];
    pendingCreatePassRef.current = newRoomPassword.trim();
    wsRef.current.send(
      JSON.stringify({
        type: 'room:create',
        mode: 'free',
        isPrivate: false,
        name: newRoomName.trim() || `Phòng của ${appearance.name || 'Mochi'}`,
        password: newRoomPassword.trim(),
        maxPlayers: 10,
        map: chosenMap,
      })
    );
  };

  const handleCreateDuelRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const chosenMap =
      allAvailableMaps.find((m) => m.id === selectedMapId) ?? PRESET_MAPS[0];
    pendingCreatePassRef.current = duelPassword.trim();
    wsRef.current.send(
      JSON.stringify({
        type: 'room:create',
        mode: 'duel',
        isPrivate: true,
        name: duelRoomName.trim() || `Thách đấu của ${appearance.name || 'Mochi'}`,
        password: duelPassword.trim(),
        maxPlayers: duelMaxPlayers,
        durationSec: duelDuration,
        map: chosenMap,
      })
    );
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = joinCodeInput.trim().toUpperCase();
    if (!cleaned || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'room:join',
        roomCode: cleaned,
        password: joinCodePassword.trim(),
        appearance,
      })
    );
  };

  const handleJoinRoom = (room: RoomSummary, password: string = '') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (room.hasPassword && !password && passwordPromptRoom !== room.id) {
      setPasswordPromptRoom(room.id);
      return;
    }
    wsRef.current.send(
      JSON.stringify({
        type: 'room:join',
        roomId: room.id,
        password,
        appearance,
      })
    );
  };

  const handleLeaveRoom = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'room:leave' }));
    }
    setActiveRoom(null);
    setActiveMap(null);
    setDuelState(null);
    setDuelRewardBanner(null);
    remotePlayersRef.current.clear();
  }, []);

  const handleCopyInvite = async (kind: 'code' | 'link') => {
    if (!activeRoom) return;
    const url = new URL(window.location.href);
    url.searchParams.set('room', activeRoom.code);
    const text = kind === 'code' ? activeRoom.code : url.toString();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(kind);
      window.setTimeout(() => setCopiedType(null), 1800);
    } catch {
      // Clipboard blocked in non-HTTPS contexts
    }
  };

  const triggerJump = useCallback(() => {
    const sim = localSimRef.current;
    if (sim.isGrounded) {
      sim.vy = -740;
      sim.isGrounded = false;
      sim.jumpsUsed = 1;
      soundEngine.playJump(false);
    } else if (sim.jumpsUsed < 2) {
      sim.vy = -670;
      sim.jumpsUsed = 2;
      soundEngine.playJump(true);
    }
  }, []);

  const sendEmote = (emote: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'player:emote', emote }));
    }
  };

  // Keyboard controls inside Multiplayer Room
  useEffect(() => {
    if (!activeRoom) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') localSimRef.current.leftHeld = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') localSimRef.current.rightHeld = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') localSimRef.current.duckHeld = true;
      if (
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'KeyW' ||
        e.code === 'KeyL'
      ) {
        e.preventDefault();
        if (!e.repeat) triggerJump();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') localSimRef.current.leftHeld = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') localSimRef.current.rightHeld = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') localSimRef.current.duckHeld = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeRoom, triggerJump]);

  // Multiplayer 60fps Canvas Loop + 25Hz WebSocket Sync
  useEffect(() => {
    if (!activeRoom || !activeMap) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let last = performance.now();
    let time = 0;
    let netSyncAccum = 0;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      const sim = localSimRef.current;
      sim.hazardCooldown = Math.max(0, sim.hazardCooldown - dt);

      const currentDuel = duelStateRef.current;
      const isDuelRoom = activeRoomRef.current?.mode === 'duel';
      const movementLocked = isDuelRoom && currentDuel?.phase === 'countdown';

      // Horizontal free movement
      const speed = 310;
      let dir = 0;
      if (!movementLocked) {
        if (sim.leftHeld) dir -= 1;
        if (sim.rightHeld) dir += 1;
      }
      sim.vx = dir * speed;
      if (dir !== 0) sim.facing = dir > 0 ? 1 : -1;
      sim.x = Math.max(10, Math.min(LOGICAL_W - sim.width - 10, sim.x + sim.vx * dt));

      sim.isDucking = sim.duckHeld && sim.isGrounded;
      sim.height = sim.isDucking ? 34 : 50;

      // Vertical physics + Platform collisions
      const prevBottom = sim.y + sim.height;
      sim.vy += GRAVITY * dt;
      sim.y += sim.vy * dt;
      let grounded = false;

      if (sim.vy >= 0) {
        for (const obj of activeMap.objects) {
          if (obj.type === 'platform') {
            const overlapsX = sim.x + sim.width - 14 > obj.x && sim.x + 14 < obj.x + obj.w;
            if (overlapsX && prevBottom <= obj.y + 8 && sim.y + sim.height >= obj.y) {
              sim.y = obj.y - sim.height;
              sim.vy = 0;
              grounded = true;
              sim.jumpsUsed = 0;
              break;
            }
          }
        }
      }

      if (!grounded && sim.y + sim.height >= GROUND_Y) {
        sim.y = GROUND_Y - sim.height;
        sim.vy = 0;
        grounded = true;
        sim.jumpsUsed = 0;
      }
      sim.isGrounded = grounded;
      sim.runCycle += dt * (Math.abs(sim.vx) > 10 ? 12 : 2);

      // Map Interactive Objects (Springs, Yuzu, Hazards)
      const pCx = sim.x + sim.width / 2;
      const pCy = sim.y + sim.height / 2;
      const canClaimYuzu = !isDuelRoom || currentDuel?.phase === 'active';

      for (const obj of activeMap.objects) {
        if (obj.type === 'spring') {
          if (
            sim.x + sim.width - 10 > obj.x &&
            sim.x + 10 < obj.x + obj.w &&
            sim.y + sim.height >= obj.y &&
            sim.y + sim.height <= obj.y + obj.h + 10 &&
            sim.vy >= 0
          ) {
            sim.vy = -960;
            sim.isGrounded = false;
            sim.jumpsUsed = 1;
            soundEngine.playJump(true);
          }
        } else if (obj.type === 'yuzu' && canClaimYuzu) {
          if (!claimedYuzuRef.current.has(obj.id)) {
            const dist = Math.hypot(pCx - (obj.x + obj.w / 2), pCy - (obj.y + obj.h / 2));
            if (dist < 36) {
              claimedYuzuRef.current.add(obj.id);
              sim.yuzuCount += 1;
              sim.score += 20;
              setRoomYuzuCount(sim.yuzuCount);
              if (!isDuelRoom) {
                onAddYuzuRef.current(1);
              }
              soundEngine.playYuzu(sim.yuzuCount);
              wsRef.current?.send(
                JSON.stringify({ type: 'collectible:claim', objectId: obj.id })
              );
            }
          }
        } else if (obj.type === 'hazard') {
          if (
            sim.x + sim.width - 14 > obj.x &&
            sim.x + 14 < obj.x + obj.w &&
            sim.y + sim.height > obj.y + 4 &&
            sim.y < obj.y + obj.h
          ) {
            sim.vy = -560;
            sim.isGrounded = false;
            soundEngine.playHit();
            if (isDuelRoom && currentDuel?.phase === 'active' && sim.hazardCooldown <= 0) {
              sim.hazardCooldown = 1.0;
              sim.score = Math.max(0, sim.score - 10);
              wsRef.current?.send(JSON.stringify({ type: 'duel:hazardHit' }));
            }
          }
        }
      }

      // Expire old remote emotes
      const nowMs = Date.now();
      const remotes = Array.from(remotePlayersRef.current.values()).map((rp) => ({
        ...rp,
        emote: rp.emote && rp.emoteUntil > nowMs ? rp.emote : null,
      }));

      // Sync position to WebSocket server at ~25Hz
      netSyncAccum += dt;
      if (netSyncAccum >= 0.04 && wsRef.current?.readyState === WebSocket.OPEN) {
        netSyncAccum = 0;
        wsRef.current.send(
          JSON.stringify({
            type: 'player:move',
            x: Math.round(sim.x),
            y: Math.round(sim.y),
            vx: Math.round(sim.vx),
            vy: Math.round(sim.vy),
            facing: sim.facing,
            isDucking: sim.isDucking,
            isGrounded: sim.isGrounded,
            appearance: appearanceRef.current,
            score: sim.score,
            yuzuCount: sim.yuzuCount,
          })
        );
      }

      // Render Arena
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== LOGICAL_W * dpr || canvas.height !== LOGICAL_H * dpr) {
        canvas.width = LOGICAL_W * dpr;
        canvas.height = LOGICAL_H * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const themeWeather: ActiveWeather =
        weatherModeRef.current === 'auto'
          ? activeMap.theme === 'sakura'
            ? 'sakura'
            : activeMap.theme === 'snow'
            ? 'snow'
            : activeMap.theme === 'night_lantern'
            ? 'fireflies'
            : 'clear'
          : resolveActiveWeather(weatherModeRef.current, 0);

      renderMultiplayerScene(ctx, {
        width: LOGICAL_W,
        height: LOGICAL_H,
        groundY: GROUND_Y,
        time,
        dt,
        map: activeMap,
        claimedYuzuIds: claimedYuzuRef.current,
        localPlayer: {
          x: sim.x,
          y: sim.y,
          width: sim.width,
          height: sim.height,
          vy: sim.vy,
          facing: sim.facing,
          isGrounded: sim.isGrounded,
          isDucking: sim.isDucking,
          scaleX: 1,
          scaleY: 1,
          invulnTimer: 0,
          hasShield: false,
          magnetTimer: 0,
          feverActive: false,
          yuzuStackCount: Math.min(5, Math.floor(sim.yuzuCount / 3) + (sim.yuzuCount > 0 ? 1 : 0)),
          appearance: appearanceRef.current,
          runCycle: sim.runCycle,
          blinkTimer: 0,
        },
        remotePlayers: remotes,
        projectiles: [],
        weatherParticles: sim.weatherParticles,
        activeWeather: themeWeather,
      });

      ctx.restore();
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [activeMap, activeRoom]);

  if (activeRoom && activeMap) {
    const isDuel = activeRoom.mode === 'duel' && duelState !== null;
    const isHost = duelState?.hostId === clientId;
    const isReady = duelState?.readyPlayerIds.includes(clientId) ?? false;

    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#16231D] shadow-2xl">
        {/* Room HUD & Invite Code Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#18261F] px-5 py-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg font-bold text-white">{activeRoom.name}</span>
              <span className="text-xs text-emerald-200/75">· Map: {activeMap.name}</span>
              <span className="text-xs text-amber-300">
                · Mã phòng: <strong className="font-mono-num tracking-wider">{activeRoom.code}</strong>
              </span>
            </div>
            <div className="mt-0.5 text-xs text-emerald-200/75">
              Người chơi: <span className="font-mono-num font-bold text-white">{playerCountDisplay}/{activeRoom.maxPlayers}</span>
              <span className="mx-2 text-white/25">·</span>
              Quýt nhặt: <span className="font-mono-num font-bold text-amber-400">{roomYuzuCount}</span>
              {isDuel && (
                <>
                  <span className="mx-2 text-white/25">·</span>
                  <span>
                    Thời gian:{' '}
                    <strong className="font-mono-num text-white">
                      {duelState.phase === 'active'
                        ? `${duelState.remainingSec}s`
                        : duelState.phase === 'countdown'
                        ? `Bắt đầu sau ${duelState.countdownSec}s`
                        : duelState.phase === 'finished'
                        ? 'Đã kết thúc'
                        : `${duelState.durationSec}s (Đang chờ)`}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopyInvite('code')}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
            >
              {copiedType === 'code' ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{copiedType === 'code' ? 'Đã chép mã!' : `Chép mã: ${activeRoom.code}`}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopyInvite('link')}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-[#21332A] px-3 text-xs font-semibold text-emerald-100 hover:bg-[#2B4236]"
            >
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{copiedType === 'link' ? 'Đã chép link!' : 'Chép link mời'}</span>
            </button>

            {['Xin chào!', 'Cố lên!', 'Quýt nè!'].map((emote) => (
              <button
                key={emote}
                type="button"
                onClick={() => sendEmote(emote)}
                className="hidden h-9 rounded-lg border border-white/10 bg-[#21332A] px-3 text-xs font-medium text-emerald-100 hover:bg-[#2B4236] md:inline-flex md:items-center"
              >
                {emote}
              </button>
            ))}

            <button
              type="button"
              onClick={handleLeaveRoom}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-rose-500/20 px-3.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Rời phòng</span>
            </button>
          </div>
        </div>

        {/* Live Duel Scoreboard & Ready Strip */}
        {isDuel && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#14201A] px-5 py-2.5">
            <div className="flex flex-wrap items-center gap-4">
              {duelState.standings.map((player, idx) => {
                const ready = duelState.readyPlayerIds.includes(player.id);
                const isSelf = player.id === clientId;
                return (
                  <div key={player.id} className="flex items-center gap-2 text-xs">
                    <span className="font-mono-num font-bold text-amber-300">#{idx + 1}</span>
                    <span className={`font-semibold ${isSelf ? 'text-white' : 'text-emerald-100/85'}`}>
                      {player.name}
                      {isSelf ? ' (Bạn)' : ''}
                    </span>
                    <span className="font-mono-num font-bold text-emerald-300">
                      {player.score} đ
                    </span>
                    <span className="font-mono-num text-emerald-200/70">
                      ({player.yuzuCount} quýt)
                    </span>
                    {duelState.phase === 'waiting' && (
                      <span className={ready ? 'text-emerald-400' : 'text-white/40'}>
                        · {ready ? 'Sẵn sàng' : 'Đang chờ'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {duelState.phase === 'waiting' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => wsRef.current?.send(JSON.stringify({ type: 'duel:ready' }))}
                  className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-xs font-bold transition-colors ${
                    isReady
                      ? 'border border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                      : 'bg-amber-500 text-[#1A1308] hover:bg-amber-400'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isReady ? 'Đã sẵn sàng' : 'Sẵn sàng đấu'}</span>
                </button>

                {isHost && (
                  <button
                    type="button"
                    disabled={playerCountDisplay < 2}
                    onClick={() => wsRef.current?.send(JSON.stringify({ type: 'duel:start' }))}
                    className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-500 px-3.5 text-xs font-bold text-[#082216] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Swords className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {playerCountDisplay < 2 ? 'Đợi bạn vào phòng...' : 'Bắt đầu ngay'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <canvas
            ref={canvasRef}
            className="block h-auto w-full bg-[#1B2B23]"
            style={{ aspectRatio: `${LOGICAL_W} / ${LOGICAL_H}` }}
          />

          {/* Duel Countdown Overlay */}
          {isDuel && duelState.phase === 'countdown' && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-[#0D1712]/55">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                Chuẩn bị tranh quýt!
              </div>
              <div className="font-display mt-1 text-6xl font-extrabold text-white">
                {duelState.countdownSec || 1}
              </div>
            </div>
          )}

          {/* Duel Finished Podium Overlay */}
          {isDuel && duelState.phase === 'finished' && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0D1712]/80 p-4 backdrop-blur-[2px]">
              <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#16231D] p-5 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-300">
                  <Trophy className="h-5 w-5" aria-hidden="true" />
                  <h2 className="font-display text-lg font-bold text-white">
                    Kết quả Thách đấu
                  </h2>
                </div>
                {duelRewardBanner && (
                  <p className="mt-1 text-xs font-medium text-emerald-300">{duelRewardBanner}</p>
                )}

                <div className="mt-3 space-y-2">
                  {duelState.standings.map((player, idx) => {
                    const winner = player.id === duelState.winnerId;
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                          winner
                            ? 'border-amber-400/50 bg-[#23372C]'
                            : 'border-white/10 bg-[#14201A]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono-num font-bold text-amber-300">#{idx + 1}</span>
                          <span className="font-semibold text-white">
                            {player.name}
                            {player.id === clientId ? ' (Bạn)' : ''}
                          </span>
                        </div>
                        <div className="font-mono-num text-xs text-emerald-200">
                          <strong className="text-white">{player.score} điểm</strong> · {player.yuzuCount} quýt
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => wsRef.current?.send(JSON.stringify({ type: 'duel:rematch' }))}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-4 text-xs font-bold text-[#1A1308] hover:bg-amber-400"
                  >
                    <Swords className="h-4 w-4" aria-hidden="true" />
                    <span>Tái đấu</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLeaveRoom}
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-white/15 bg-[#21332A] px-4 text-xs font-semibold text-white hover:bg-[#2B4236]"
                  >
                    Về sảnh
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Touch controls for mobile */}
        <div className="flex items-center justify-between border-t border-white/10 bg-[#15221B] px-4 py-2.5 sm:hidden">
          <div className="flex gap-2">
            <button
              type="button"
              onPointerDown={() => (localSimRef.current.leftHeld = true)}
              onPointerUp={() => (localSimRef.current.leftHeld = false)}
              onPointerLeave={() => (localSimRef.current.leftHeld = false)}
              className="h-11 rounded-lg border border-white/15 bg-[#21332A] px-4 text-xs font-bold text-white"
            >
              Trái
            </button>
            <button
              type="button"
              onPointerDown={() => (localSimRef.current.rightHeld = true)}
              onPointerUp={() => (localSimRef.current.rightHeld = false)}
              onPointerLeave={() => (localSimRef.current.rightHeld = false)}
              className="h-11 rounded-lg border border-white/15 bg-[#21332A] px-4 text-xs font-bold text-white"
            >
              Phải
            </button>
          </div>
          <button
            type="button"
            onPointerDown={triggerJump}
            className="h-11 rounded-lg bg-amber-500 px-5 text-xs font-bold text-[#1A1308]"
          >
            Nhảy lên
          </button>
        </div>

        <div className="border-t border-white/10 bg-[#14201A] px-5 py-2.5 text-xs text-emerald-200/80">
          Di chuyển tự do: <strong className="text-white">A / D</strong> hoặc <strong className="text-white">← / →</strong> · Nhảy đôi: <strong className="text-white">Space / W / L / ↑</strong> ·{' '}
          {isDuel
            ? 'Tranh nhặt thật nhiều quýt (+20đ) và tránh gai nhọn (-10đ) trước khi hết giờ!'
            : 'Bật lò xo và nhặt quýt cùng bạn bè!'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Multiplayer Lobby Header */}
      <div className="rounded-2xl border border-white/10 bg-[#16231D] p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              <h1 className="font-display text-xl font-bold text-white">
                Chơi Nhiều Người & Thách Đấu Bạn Bè
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-emerald-100/75">
              {wsConnected
                ? 'Đã kết nối máy chủ thời gian thực · Gửi mã phòng để thi đấu trực tiếp với bạn bè hoặc tham gia phòng tự do.'
                : 'Đang kết nối tới máy chủ WebSocket...'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowMapEditor((v) => !v)}
              className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" />
              <span>{showMapEditor ? 'Ẩn trình tạo Map' : 'Tạo Map mới'}</span>
            </button>

            <button
              type="button"
              onClick={() => wsRef.current?.send(JSON.stringify({ type: 'rooms:list' }))}
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/12 bg-[#21332A] px-3.5 text-xs font-semibold text-emerald-100 hover:bg-[#2B4236]"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={onExitMultiplayer}
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/12 bg-[#21332A] px-3.5 text-xs font-semibold text-white hover:bg-[#2B4236]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Về chơi đơn</span>
            </button>
          </div>
        </div>

        {/* Mode Tabs: Thách đấu bạn bè vs Phòng công khai */}
        <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl bg-[#0F1814] p-1.5 sm:max-w-lg">
          <button
            type="button"
            onClick={() => setLobbyTab('duel')}
            className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors ${
              lobbyTab === 'duel'
                ? 'bg-[#263C31] text-amber-300 shadow-sm'
                : 'text-emerald-100/75 hover:text-white'
            }`}
          >
            <Swords className="h-4 w-4" aria-hidden="true" />
            <span>Thách đấu bạn bè (Mã phòng)</span>
          </button>
          <button
            type="button"
            onClick={() => setLobbyTab('servers')}
            className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors ${
              lobbyTab === 'servers'
                ? 'bg-[#263C31] text-amber-300 shadow-sm'
                : 'text-emerald-100/75 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>Máy chủ công khai ({rooms.length})</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-950/30 px-4 py-2.5 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Friend Duel Tab */}
        {lobbyTab === 'duel' && (
          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Create Duel Room */}
            <form
              onSubmit={handleCreateDuelRoom}
              className="rounded-xl border border-white/10 bg-[#14201A] p-5 lg:col-span-7"
            >
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <h2 className="font-display text-base font-bold text-white">
                  Tạo phòng Thách đấu bạn bè
                </h2>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-emerald-100/75">
                Tạo phòng riêng kèm mã mời 6 ký tự. Gửi mã hoặc link cho bạn bè để cùng vào tranh
                tài thu thập quýt trong thời gian thực. Người thắng nhận +25 Quýt thưởng!
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="duel-room-name" className="block text-xs font-medium text-emerald-200/80">
                    Tên trận thách đấu
                  </label>
                  <input
                    id="duel-room-name"
                    type="text"
                    maxLength={32}
                    value={duelRoomName}
                    onChange={(e) => setDuelRoomName(e.target.value)}
                    placeholder={`Thách đấu của ${appearance.name || 'Mochi'}`}
                    className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-[#0F1814] px-3 text-sm text-white placeholder:text-white/35"
                  />
                </div>

                <div>
                  <label htmlFor="duel-room-map" className="block text-xs font-medium text-emerald-200/80">
                    Chọn Map thi đấu
                  </label>
                  <select
                    id="duel-room-map"
                    value={selectedMapId}
                    onChange={(e) => setSelectedMapId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-[#0F1814] px-3 text-sm text-white"
                  >
                    {allAvailableMaps.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.author === 'Hệ thống' ? 'Mặc định' : 'Tự tạo'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-200/80">
                    Thời lượng trận đấu
                  </label>
                  <div className="mt-1 grid grid-cols-3 gap-1.5 rounded-lg bg-[#0F1814] p-1">
                    {([45, 60, 90] as const).map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setDuelDuration(sec)}
                        className={`h-8 rounded-md text-xs font-bold transition-colors ${
                          duelDuration === sec
                            ? 'bg-[#263C31] text-amber-300'
                            : 'text-emerald-100/70 hover:text-white'
                        }`}
                      >
                        {sec} giây
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-200/80">
                    Số người chơi
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-1.5 rounded-lg bg-[#0F1814] p-1">
                    {([2, 4] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setDuelMaxPlayers(cnt)}
                        className={`h-8 rounded-md text-xs font-bold transition-colors ${
                          duelMaxPlayers === cnt
                            ? 'bg-[#263C31] text-amber-300'
                            : 'text-emerald-100/70 hover:text-white'
                        }`}
                      >
                        {cnt === 2 ? '1v1 (2 người)' : 'Tối đa 4 người'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label htmlFor="duel-room-pass" className="block text-xs font-medium text-emerald-200/80">
                  Mật khẩu bảo vệ (tùy chọn)
                </label>
                <input
                  id="duel-room-pass"
                  type="password"
                  maxLength={20}
                  value={duelPassword}
                  onChange={(e) => setDuelPassword(e.target.value)}
                  placeholder="Để trống nếu chỉ cần mã phòng để vào"
                  className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-[#0F1814] px-3 text-sm text-white placeholder:text-white/35"
                />
              </div>

              <button
                type="submit"
                disabled={!wsConnected}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-[#1A1308] hover:bg-amber-400 disabled:opacity-50"
              >
                <Swords className="h-4 w-4" aria-hidden="true" />
                <span>Tạo phòng & Lấy mã mời</span>
              </button>
            </form>

            {/* Join by Room Code */}
            <form
              onSubmit={handleJoinByCode}
              className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#14201A] p-5 lg:col-span-5"
            >
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  Nhập mã phòng từ bạn bè
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-emerald-100/75">
                  Nhập mã 6 ký tự (hoặc mã máy chủ công khai như SUOI01) để kết nối trực tiếp vào
                  đấu trường của bạn bè.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label htmlFor="join-code-input" className="block text-xs font-medium text-emerald-200/80">
                      Mã phòng (6 ký tự)
                    </label>
                    <input
                      id="join-code-input"
                      type="text"
                      maxLength={12}
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="VD: AB12CD"
                      className="font-mono-num mt-1 h-11 w-full rounded-lg border border-white/15 bg-[#0F1814] px-3 text-base font-bold uppercase tracking-widest text-amber-300 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-white/35"
                    />
                  </div>

                  <div>
                    <label htmlFor="join-code-pass" className="block text-xs font-medium text-emerald-200/80">
                      Mật khẩu phòng (nếu có)
                    </label>
                    <input
                      id="join-code-pass"
                      type="password"
                      maxLength={20}
                      value={joinCodePassword}
                      onChange={(e) => setJoinCodePassword(e.target.value)}
                      placeholder="Nhập mật khẩu nếu chủ phòng cài đặt"
                      className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-[#0F1814] px-3 text-sm text-white placeholder:text-white/35"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!wsConnected || !joinCodeInput.trim()}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-bold text-[#082216] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>Vào phòng thách đấu</span>
              </button>
            </form>
          </div>
        )}

        {/* Public Servers Tab */}
        {lobbyTab === 'servers' && (
          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Active & Preset Servers */}
            <div className="lg:col-span-7">
              <h2 className="font-display text-sm font-bold text-emerald-200">
                Danh sách máy chủ ({rooms.length})
              </h2>

              <div className="mt-3 space-y-2.5">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-xl border border-white/10 bg-[#14201A] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base font-bold text-white">
                            {room.name}
                          </span>
                          {room.hasPassword && (
                            <Lock className="h-3.5 w-3.5 text-amber-300" aria-label="Có mật khẩu" />
                          )}
                        </div>
                        <div className="mt-1 text-xs text-emerald-200/75">
                          <span>{room.isPreset ? 'Máy chủ mặc định' : 'Máy chủ người chơi'}</span>
                          <span className="mx-1.5 text-white/25">·</span>
                          <span>
                            Mã: <strong className="font-mono-num text-amber-300">{room.code}</strong>
                          </span>
                          <span className="mx-1.5 text-white/25">·</span>
                          <span>Map: {room.mapName}</span>
                          <span className="mx-1.5 text-white/25">·</span>
                          <span className="font-mono-num text-emerald-300">
                            {room.playerCount}/{room.maxPlayers} người
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!wsConnected || room.playerCount >= room.maxPlayers}
                        onClick={() => handleJoinRoom(room)}
                        className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-amber-500 px-4 text-xs font-bold text-[#1A1308] hover:bg-amber-400 disabled:opacity-50"
                      >
                        {room.playerCount >= room.maxPlayers ? 'Đã đầy' : 'Vào máy chủ'}
                      </button>
                    </div>

                    {passwordPromptRoom === room.id && (
                      <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                        <input
                          type="password"
                          value={joinPassword}
                          onChange={(e) => setJoinPassword(e.target.value)}
                          placeholder="Nhập mật khẩu máy chủ..."
                          className="h-9 flex-1 rounded-lg border border-white/15 bg-[#0F1814] px-3 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleJoinRoom(room, joinPassword)}
                          className="h-9 rounded-lg bg-emerald-500 px-4 text-xs font-bold text-[#091C12]"
                        >
                          Xác nhận
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Create Free Server Panel */}
            <form
              onSubmit={handleCreateFreeRoom}
              className="rounded-xl border border-white/10 bg-[#14201A] p-4 lg:col-span-5"
            >
              <h2 className="font-display text-sm font-bold text-white">Tạo máy chủ tự do</h2>
              <p className="mt-1 text-xs text-emerald-100/70">
                Chọn bản đồ có sẵn hoặc bản đồ bạn vừa thiết kế để mọi người cùng chạy giao lưu.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="new-room-name" className="block text-xs font-medium text-emerald-200/80">
                    Tên máy chủ
                  </label>
                  <input
                    id="new-room-name"
                    type="text"
                    maxLength={32}
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder={`Phòng của ${appearance.name || 'Mochi'}`}
                    className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-[#0F1814] px-3 text-sm text-white placeholder:text-white/35"
                  />
                </div>

                <div>
                  <label htmlFor="new-room-map" className="block text-xs font-medium text-emerald-200/80">
                    Chọn Map cho máy chủ
                  </label>
                  <select
                    id="new-room-map"
                    value={selectedMapId}
                    onChange={(e) => setSelectedMapId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-[#0F1814] px-3 text-sm text-white"
                  >
                    {allAvailableMaps.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.author === 'Hệ thống' ? 'Mặc định' : 'Tự tạo'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="new-room-pass" className="block text-xs font-medium text-emerald-200/80">
                    Mật khẩu (tùy chọn)
                  </label>
                  <input
                    id="new-room-pass"
                    type="password"
                    maxLength={20}
                    value={newRoomPassword}
                    onChange={(e) => setNewRoomPassword(e.target.value)}
                    placeholder="Để trống nếu là phòng công khai"
                    className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-[#0F1814] px-3 text-sm text-white placeholder:text-white/35"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!wsConnected}
                  className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-[#1A1308] hover:bg-amber-400 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Tạo & Vào máy chủ</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Interactive Custom Map Builder */}
      {showMapEditor && (
        <MapEditor
          authorName={appearance.name || 'Mochi'}
          appearance={appearance}
          existingMaps={customMaps}
          onSaveMap={(map) => {
            onSaveCustomMap(map);
            setSelectedMapId(map.id);
          }}
          onDeleteMap={onDeleteCustomMap}
          onClose={() => setShowMapEditor(false)}
        />
      )}
    </div>
  );
}
