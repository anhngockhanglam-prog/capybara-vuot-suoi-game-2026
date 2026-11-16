import { MutableRefObject, useCallback, useEffect, useRef } from 'react';
import {
  getPetAutoCollectRadius,
  getPetDef,
  getPetEffectiveGoldenBonus,
  getPetItemDurationMultiplier,
} from '../game/pets';
import { renderGameScene } from '../game/renderer';
import { BOSS_SKILLS, getSkillDef } from '../game/skills';
import { DIFFICULTY_CONFIGS } from '../game/skins';
import { soundEngine } from '../game/sound';
import {
  ActiveWeather,
  BossEntity,
  BossKind,
  CapybaraAppearance,
  Collectible,
  CollectibleKind,
  Difficulty,
  FloatingText,
  GameState,
  HudSnapshot,
  Obstacle,
  ObstacleKind,
  Particle,
  PetId,
  PhotoPose,
  PlayMode,
  Projectile,
  RunSummary,
  SkillCooldowns,
  SkillId,
  StageConfig,
  WeatherMode,
} from '../game/types';
import { createWeatherParticles, resolveActiveWeather } from '../game/weather';

interface GameCanvasProps {
  gameState: GameState;
  playMode: Exclude<PlayMode, 'multiplayer'>;
  difficulty: Difficulty;
  appearance: CapybaraAppearance;
  weatherMode: WeatherMode;
  forecastWeather: ActiveWeather;
  unlockedSkills: SkillId[];
  wellFedBuff?: boolean;
  petId: PetId;
  petBond: number;
  stageConfig: StageConfig;
  photoMode: boolean;
  photoPose: PhotoPose;
  captureApiRef: MutableRefObject<((withSignature: boolean) => boolean) | null>;
  highScore: number;
  yuzuBank: number;
  runKey: number;
  potionHue?: number | null;
  glowingFoodActive?: boolean;
  balloonsActive?: boolean;
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onBossActiveChange: (active: boolean) => void;
  onGameOver: (summary: RunSummary) => void;
  onTogglePause: () => void;
}

const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 440;
const GROUND_Y = 356;
const PLAYER_X = 128;
const BASE_PLAYER_W = 66;
const BASE_PLAYER_H = 50;
const DUCK_PLAYER_H = 34;
const GRAVITY = 2200;
const JUMP_VELOCITY = -760;
const DOUBLE_JUMP_VELOCITY = -690;
const FAST_FALL_GRAVITY = 4200;
const DAY_NIGHT_HALF_CYCLE_SEC = 300; // 5 minutes day, 5 minutes night

function createBossForLevel(level: number): BossEntity {
  const kinds: BossKind[] = ['croc_king', 'onsen_crab', 'bamboo_dragon'];
  const kind = kinds[(level - 1) % kinds.length];
  const names: Record<BossKind, string> = {
    croc_king: 'Vua Cá Sấu Đầm Lầy',
    onsen_crab: 'Cự Giải Suối Nóng',
    bamboo_dragon: 'Rồng Tre Bóng Đêm',
  };
  const maxHp = 220 + (level - 1) * 110;
  return {
    kind,
    name: `${names[kind]} (Cấp ${level})`,
    x: LOGICAL_WIDTH - 190,
    y: kind === 'bamboo_dragon' ? GROUND_Y - 175 : GROUND_Y - 88,
    width: 112,
    height: 88,
    vx: 0,
    vy: 0,
    hp: maxHp,
    maxHp,
    phase: 0,
    attackTimer: 1.6,
    dashTimer: 0,
    hitFlash: 0,
    level,
    animState: 'walking',
    runCycle: 0,
    facing: -1,
  };
}

export function GameCanvas({
  gameState,
  playMode,
  difficulty,
  appearance,
  weatherMode,
  forecastWeather,
  unlockedSkills,
  wellFedBuff = false,
  petId,
  petBond,
  stageConfig,
  photoMode,
  photoPose,
  captureApiRef,
  highScore,
  yuzuBank,
  runKey,
  potionHue = null,
  glowingFoodActive = false,
  balloonsActive = false,
  onHudUpdate,
  onBossActiveChange,
  onGameOver,
  onTogglePause,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  const playModeRef = useRef(playMode);
  const difficultyRef = useRef<Difficulty>(difficulty);
  const appearanceRef = useRef<CapybaraAppearance>(appearance);
  const weatherModeRef = useRef<WeatherMode>(weatherMode);
  const forecastWeatherRef = useRef<ActiveWeather>(forecastWeather);
  const unlockedSkillsRef = useRef<SkillId[]>(unlockedSkills);
  const wellFedBuffRef = useRef<boolean>(wellFedBuff);
  const petIdRef = useRef<PetId>(petId);
  const petBondRef = useRef<number>(petBond);
  const stageConfigRef = useRef<StageConfig>(stageConfig);
  const photoModeRef = useRef<boolean>(photoMode);
  const photoPoseRef = useRef<PhotoPose>(photoPose);
  const highScoreRef = useRef<number>(highScore);
  const yuzuBankRef = useRef<number>(yuzuBank);
  const potionHueRef = useRef<number | null>(potionHue);
  const glowingFoodActiveRef = useRef<boolean>(glowingFoodActive);
  const balloonsActiveRef = useRef<boolean>(balloonsActive);

  useEffect(() => {
    potionHueRef.current = potionHue;
  }, [potionHue]);

  useEffect(() => {
    glowingFoodActiveRef.current = glowingFoodActive;
  }, [glowingFoodActive]);

  useEffect(() => {
    balloonsActiveRef.current = balloonsActive;
  }, [balloonsActive]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    playModeRef.current = playMode;
  }, [playMode]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    appearanceRef.current = appearance;
  }, [appearance]);

  useEffect(() => {
    weatherModeRef.current = weatherMode;
  }, [weatherMode]);

  useEffect(() => {
    forecastWeatherRef.current = forecastWeather;
  }, [forecastWeather]);

  useEffect(() => {
    unlockedSkillsRef.current = unlockedSkills;
  }, [unlockedSkills]);

  useEffect(() => {
    wellFedBuffRef.current = wellFedBuff;
  }, [wellFedBuff]);

  useEffect(() => {
    petIdRef.current = petId;
  }, [petId]);

  useEffect(() => {
    petBondRef.current = petBond;
  }, [petBond]);

  useEffect(() => {
    stageConfigRef.current = stageConfig;
  }, [stageConfig]);

  useEffect(() => {
    photoModeRef.current = photoMode;
  }, [photoMode]);

  useEffect(() => {
    photoPoseRef.current = photoPose;
  }, [photoPose]);

  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  useEffect(() => {
    yuzuBankRef.current = yuzuBank;
  }, [yuzuBank]);

  const simRef = useRef({
    time: 0,
    dayNightClock: 0,
    distance: 0,
    scoreExact: 0,
    yuzuRun: 0,
    combo: 0,
    maxCombo: 0,
    obstaclesPassed: 0,
    feverCount: 0,
    bossesDefeated: 0,
    nextBossDistance: 300,
    bossSpawnDelay: 0,
    hearts: 3,
    maxHearts: 3,
    hasShield: false,
    magnetTimer: 0,
    magnetMaxDuration: 7,
    feverMeter: 0,
    feverActive: false,
    feverTimer: 0,
    feverMaxDuration: 6,
    shakeTimer: 0,
    shakeDuration: 0.25,
    shakeIntensity: 0,
    hitVignetteTimer: 0,
    nextId: 1,
    spawnTimer: 1.1,
    collectibleTimer: 0.7,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    duckHeld: false,
    leftHeld: false,
    rightHeld: false,
    skillCooldowns: {
      yuzu_shot: 0,
      onsen_wave: 0,
      lotus_shield: 0,
      yuzu_meteor: 0,
      bamboo_storm: 0,
      thunder_yuzu: 0,
      cherry_heal: 0,
    } as SkillCooldowns,
    prevWeather: 'clear' as string,
    rainbowTimer: 0,
    weatherParticles: createWeatherParticles(LOGICAL_WIDTH, LOGICAL_HEIGHT, 64),
    player: {
      x: PLAYER_X,
      y: GROUND_Y - BASE_PLAYER_H,
      width: BASE_PLAYER_W,
      height: BASE_PLAYER_H,
      vx: 0,
      vy: 0,
      facing: 1 as 1 | -1,
      jumpsUsed: 0,
      isGrounded: true,
      isDucking: false,
      scaleX: 1,
      scaleY: 1,
      invulnTimer: 0,
      runCycle: 0,
      blinkTimer: 0,
      nextBlinkIn: 2.5,
    },
    pet: {
      x: PLAYER_X - 46,
      y: GROUND_Y,
      hopPhase: 0,
      facing: 1 as 1 | -1,
      dartTimer: 0,
    },
    boss: null as BossEntity | null,
    projectiles: [] as Projectile[],
    obstacles: [] as Obstacle[],
    collectibles: [] as Collectible[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
  });

  // Expose HUD-free Photo Mode capture function
  useEffect(() => {
    captureApiRef.current = (withSignature: boolean) => {
      const source = canvasRef.current;
      if (!source || source.width === 0 || source.height === 0) return false;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = source.width;
      exportCanvas.height = source.height;
      const ectx = exportCanvas.getContext('2d');
      if (!ectx) return false;

      ectx.drawImage(source, 0, 0);

      if (withSignature) {
        const scale = source.width / LOGICAL_WIDTH;
        ectx.save();
        ectx.scale(scale, scale);
        const capName = appearanceRef.current.name || 'Mochi';
        const stageName = stageConfigRef.current.name;
        const label = `${capName} · ${stageName}`;
        ectx.font = '700 13px "Outfit", sans-serif';
        const textWidth = ectx.measureText(label).width;
        const boxW = textWidth + 24;
        const boxH = 30;
        const bx = LOGICAL_WIDTH - boxW - 18;
        const by = LOGICAL_HEIGHT - boxH - 16;
        ectx.fillStyle = 'rgba(13, 22, 18, 0.72)';
        ectx.beginPath();
        ectx.roundRect(bx, by, boxW, boxH, 8);
        ectx.fill();
        ectx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ectx.lineWidth = 1.2;
        ectx.stroke();
        ectx.fillStyle = '#FDE68A';
        ectx.textBaseline = 'middle';
        ectx.fillText(label, bx + 12, by + boxH / 2);
        ectx.restore();
      }

      const dataUrl = exportCanvas.toDataURL('image/png');
      const slug = (appearanceRef.current.name || 'capybara')
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '') || 'capybara';
      const link = document.createElement('a');
      link.download = `capybara-${slug}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    };
    return () => {
      captureApiRef.current = null;
    };
  }, [captureApiRef]);

  const emitParticles = useCallback(
    (x: number, y: number, color: string, count: number, speed: number = 140) => {
      const sim = simRef.current;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = speed * (0.35 + Math.random() * 0.75);
        sim.particles.push({
          x,
          y,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag - 45,
          radius: 2.2 + Math.random() * 3.2,
          color,
          alpha: 1,
          life: 0.35 + Math.random() * 0.35,
          maxLife: 0.7,
        });
      }
    },
    []
  );

  const pushFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    simRef.current.floatingTexts.push({
      x,
      y,
      vy: -55,
      text,
      color,
      life: 0.85,
      maxLife: 0.85,
    });
  }, []);

  const triggerShake = useCallback((intensity: number, duration: number) => {
    const sim = simRef.current;
    if (intensity >= sim.shakeIntensity * (sim.shakeTimer / Math.max(0.01, sim.shakeDuration))) {
      sim.shakeIntensity = intensity;
      sim.shakeDuration = duration;
      sim.shakeTimer = duration;
    } else {
      sim.shakeTimer = Math.max(sim.shakeTimer, duration * 0.7);
    }
  }, []);

  const spawnBoss = useCallback(
    (level: number) => {
      const sim = simRef.current;
      sim.boss = createBossForLevel(level);
      sim.obstacles = [];
      sim.projectiles = [];
      onBossActiveChange(true);
      triggerShake(11, 0.3);
      pushFloatingText(LOGICAL_WIDTH / 2, 130, `Boss xuất hiện: ${sim.boss.name}!`, '#FCA5A5');
      soundEngine.playFeverStart();
    },
    [onBossActiveChange, pushFloatingText, triggerShake]
  );

  const resetSimulation = useCallback(() => {
    const sim = simRef.current;
    sim.distance = 0;
    sim.scoreExact = 0;
    sim.yuzuRun = 0;
    sim.combo = 0;
    sim.maxCombo = 0;
    sim.obstaclesPassed = 0;
    sim.feverCount = 0;
    sim.bossesDefeated = 0;
    sim.nextBossDistance = 300;
    sim.bossSpawnDelay = 0;
    const startHearts = wellFedBuffRef.current ? 4 : 3;
    const petDef = getPetDef(petIdRef.current);
    const startsWithShield = Boolean(petDef.startsWithShield);
    sim.hearts = startHearts;
    sim.maxHearts = startHearts;
    sim.hasShield = startsWithShield;
    sim.magnetTimer = 0;
    sim.magnetMaxDuration = 7;
    sim.feverMeter = 0;
    sim.feverActive = false;
    sim.feverTimer = 0;
    sim.feverMaxDuration = 6;
    sim.shakeTimer = 0;
    sim.shakeDuration = 0.25;
    sim.shakeIntensity = 0;
    sim.hitVignetteTimer = 0;
    sim.spawnTimer = 1.05;
    sim.collectibleTimer = 0.45;
    sim.coyoteTimer = 0;
    sim.jumpBufferTimer = 0;
    sim.duckHeld = false;
    sim.leftHeld = false;
    sim.rightHeld = false;
    sim.skillCooldowns = {
      yuzu_shot: 0,
      onsen_wave: 0,
      lotus_shield: 0,
      yuzu_meteor: 0,
      bamboo_storm: 0,
      thunder_yuzu: 0,
      cherry_heal: 0,
    };
    sim.rainbowTimer = 0;
    sim.player = {
      x: PLAYER_X,
      y: GROUND_Y - BASE_PLAYER_H,
      width: BASE_PLAYER_W,
      height: BASE_PLAYER_H,
      vx: 0,
      vy: 0,
      facing: 1,
      jumpsUsed: 0,
      isGrounded: true,
      isDucking: false,
      scaleX: 1,
      scaleY: 1,
      invulnTimer: 0,
      runCycle: 0,
      blinkTimer: 0,
      nextBlinkIn: 2.2,
    };
    sim.pet = {
      x: PLAYER_X - 46,
      y: GROUND_Y,
      hopPhase: 0,
      facing: 1,
      dartTimer: 0,
    };
    sim.boss = null;
    sim.projectiles = [];
    sim.obstacles = [];
    sim.collectibles = [];
    sim.particles = [];
    sim.floatingTexts = [];
    onBossActiveChange(false);

    if (gameStateRef.current === 'PLAYING') {
      pushFloatingText(LOGICAL_WIDTH / 2, 108, `Màn mới: ${stageConfigRef.current.name}`, '#FDE68A');
      if (startsWithShield) {
        pushFloatingText(PLAYER_X + 34, GROUND_Y - 76, `${petDef.name}: Tặng Khiên!`, '#5EEAD4');
      }
      if (playModeRef.current === 'boss_rush') {
        sim.boss = createBossForLevel(1);
        onBossActiveChange(true);
      }
    }

    onHudUpdate({
      score: 0,
      highScore: highScoreRef.current,
      yuzuRun: 0,
      yuzuBank: yuzuBankRef.current,
      combo: 0,
      multiplier: 1,
      hearts: startHearts,
      maxHearts: startHearts,
      hasShield: startsWithShield,
      magnetTimer: 0,
      magnetMaxDuration: 7,
      feverMeter: 0,
      feverActive: false,
      feverTimer: 0,
      feverMaxDuration: 6,
      distanceMeters: 0,
      speedFactor: 1,
      activeWeather: resolveActiveWeather(weatherModeRef.current, 0, forecastWeatherRef.current),
      isNight: false,
      cycleRemainingSeconds: DAY_NIGHT_HALF_CYCLE_SEC,
      bossActive: Boolean(sim.boss),
      bossName: sim.boss?.name ?? null,
      bossHp: sim.boss?.hp ?? 0,
      bossMaxHp: sim.boss?.maxHp ?? 1,
      bossesDefeated: 0,
      skillCooldowns: { ...sim.skillCooldowns },
      stageName: stageConfigRef.current.name,
    });
  }, [onBossActiveChange, onHudUpdate, pushFloatingText]);

  useEffect(() => {
    resetSimulation();
  }, [runKey, resetSimulation]);

  const triggerJump = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;
    const sim = simRef.current;
    const p = sim.player;

    if (p.isGrounded || sim.coyoteTimer > 0) {
      p.vy = JUMP_VELOCITY;
      p.isGrounded = false;
      p.jumpsUsed = 1;
      p.isDucking = false;
      p.height = BASE_PLAYER_H;
      sim.coyoteTimer = 0;
      p.scaleX = 0.84;
      p.scaleY = 1.22;
      soundEngine.playJump(false);
      emitParticles(p.x + p.width * 0.4, GROUND_Y, '#E2E8F0', 6, 95);
    } else if (p.jumpsUsed < 2) {
      p.vy = DOUBLE_JUMP_VELOCITY;
      p.jumpsUsed = 2;
      p.isDucking = false;
      p.height = BASE_PLAYER_H;
      p.scaleX = 0.86;
      p.scaleY = 1.18;
      soundEngine.playJump(true);
      emitParticles(p.x + p.width * 0.5, p.y + p.height, '#FDE68A', 8, 110);
    } else {
      sim.jumpBufferTimer = 0.14;
    }
  }, [emitParticles]);

  const useSkill = useCallback(
    (skillId: SkillId) => {
      if (gameStateRef.current !== 'PLAYING') return;
      const sim = simRef.current;
      if (!sim.boss) return;
      if (!unlockedSkillsRef.current.includes(skillId)) return;
      if (sim.skillCooldowns[skillId] > 0) return;

      const def = getSkillDef(skillId);
      sim.skillCooldowns[skillId] = def.cooldown;
      const p = sim.player;
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;
      const dir = p.facing;

      if (skillId === 'yuzu_shot') {
        sim.projectiles.push({
          id: sim.nextId++,
          owner: 'player',
          kind: 'yuzu_orb',
          x: cx + dir * 24,
          y: cy - 6,
          vx: dir * 640,
          vy: 0,
          radius: 12,
          damage: def.damage,
          piercing: false,
          life: 1.8,
        });
        soundEngine.playYuzu(3);
      } else if (skillId === 'onsen_wave') {
        sim.projectiles.push({
          id: sim.nextId++,
          owner: 'player',
          kind: 'wave',
          x: cx + dir * 30,
          y: GROUND_Y - 38,
          vx: dir * 520,
          vy: 0,
          radius: 34,
          damage: def.damage,
          piercing: true,
          life: 2.0,
        });
        emitParticles(cx, cy, '#38BDF8', 12, 160);
        triggerShake(7, 0.2);
        soundEngine.playPowerUp();
      } else if (skillId === 'lotus_shield') {
        sim.hasShield = true;
        if (sim.hearts < sim.maxHearts) {
          sim.hearts += 1;
          pushFloatingText(cx, p.y - 34, '+1 Tim!', '#6EE7B7');
        }
        p.invulnTimer = Math.max(p.invulnTimer, 1.5);
        emitParticles(cx, cy, '#34D399', 14, 150);
        pushFloatingText(cx, p.y - 16, 'Lá Sen Hộ Thể!', '#6EE7B7');
        soundEngine.playPowerUp();
      } else if (skillId === 'yuzu_meteor') {
        const targetX = sim.boss.x + sim.boss.width / 2;
        for (let i = 0; i < 5; i++) {
          sim.projectiles.push({
            id: sim.nextId++,
            owner: 'player',
            kind: 'meteor',
            x: targetX - 80 + i * 40,
            y: -40 - i * 35,
            vx: 0,
            vy: 560,
            radius: 18,
            damage: Math.round(def.damage / 5),
            piercing: false,
            life: 1.8,
          });
        }
        triggerShake(9, 0.25);
        pushFloatingText(targetX, 90, 'Mưa Quýt Vàng!', '#FDE047');
        soundEngine.playGoldenYuzu();
      } else if (skillId === 'bamboo_storm') {
        const angles = [-0.14, 0, 0.14];
        const speed = 680;
        for (const ang of angles) {
          sim.projectiles.push({
            id: sim.nextId++,
            owner: 'player',
            kind: 'bamboo_blade',
            x: cx + dir * 24,
            y: cy - 4,
            vx: dir * Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            radius: 13,
            damage: Math.round(def.damage / 3),
            piercing: true,
            life: 1.8,
          });
        }
        emitParticles(cx + dir * 20, cy, '#4ADE80', 10, 150);
        pushFloatingText(cx, p.y - 16, 'Bão Lá Trúc!', '#4ADE80');
        soundEngine.playYuzu(5);
      } else if (skillId === 'thunder_yuzu') {
        const targetX = sim.boss.x + sim.boss.width / 2;
        sim.projectiles.push({
          id: sim.nextId++,
          owner: 'player',
          kind: 'thunder_bolt',
          x: targetX,
          y: Math.max(20, sim.boss.y - 140),
          vx: 0,
          vy: 960,
          radius: 22,
          damage: def.damage,
          piercing: false,
          life: 1.1,
        });
        emitParticles(targetX, sim.boss.y, '#C084FC', 16, 200);
        triggerShake(11, 0.25);
        pushFloatingText(targetX, sim.boss.y - 44, 'Sét Quýt Thiên Lôi!', '#E9D5FF');
        soundEngine.playFeverStart();
      } else if (skillId === 'cherry_heal') {
        let cleared = 0;
        for (let i = sim.projectiles.length - 1; i >= 0; i--) {
          const other = sim.projectiles[i];
          if (other.owner === 'boss') {
            emitParticles(other.x, other.y, '#F472B6', 10, 140);
            sim.projectiles.splice(i, 1);
            cleared++;
          }
        }
        if (sim.hearts < sim.maxHearts) {
          sim.hearts += 1;
        }
        p.invulnTimer = Math.max(p.invulnTimer, 1.5);
        emitParticles(cx, cy, '#FBCFE8', 22, 190);
        pushFloatingText(
          cx,
          p.y - 24,
          cleared > 0 ? `Anh Đào Hồi +1 Tim · Quét ${cleared} đạn!` : 'Anh Đào Tái Tạo +1 Tim!',
          '#F9A8D4'
        );
        soundEngine.playPowerUp();
      }
    },
    [emitParticles, pushFloatingText, triggerShake]
  );

  const setDucking = useCallback((active: boolean) => {
    const sim = simRef.current;
    if (active && !sim.duckHeld && gameStateRef.current === 'PLAYING') {
      soundEngine.playDuck();
    }
    sim.duckHeld = active;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'KeyW' ||
        e.code === 'KeyL'
      ) {
        if (gameStateRef.current === 'PLAYING') {
          e.preventDefault();
          if (!e.repeat) triggerJump();
        }
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (gameStateRef.current === 'PLAYING') {
          e.preventDefault();
          setDucking(true);
        }
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        simRef.current.leftHeld = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        simRef.current.rightHeld = true;
      } else if (e.code === 'KeyJ') {
        useSkill('yuzu_shot');
      } else if (e.code === 'KeyK') {
        useSkill('onsen_wave');
      } else if (e.code === 'KeyI') {
        useSkill('lotus_shield');
      } else if (e.code === 'KeyU') {
        useSkill('yuzu_meteor');
      } else if (e.code === 'KeyO') {
        useSkill('bamboo_storm');
      } else if (e.code === 'KeyY') {
        useSkill('thunder_yuzu');
      } else if (e.code === 'KeyB') {
        useSkill('cherry_heal');
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (!photoModeRef.current && (gameStateRef.current === 'PLAYING' || gameStateRef.current === 'PAUSED')) {
          e.preventDefault();
          onTogglePause();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') setDucking(false);
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') simRef.current.leftHeld = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') simRef.current.rightHeld = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerJump, setDucking, useSkill, onTogglePause]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();
    let hudSyncAccum = 0;

    const spawnObstacle = (speed: number) => {
      const sim = simRef.current;
      const weights = stageConfigRef.current.obstacleWeights;
      const roll = Math.random();
      const w0 = weights[0];
      const w1 = w0 + weights[1];
      const w2 = w1 + weights[2];
      const w3 = w2 + weights[3];

      let kind: ObstacleKind = 'rock';
      let width = 44;
      let height = 34;
      let y = GROUND_Y - height;

      if (roll < w0) {
        kind = 'rock';
        width = 44;
        height = 32;
        y = GROUND_Y - height;
      } else if (roll < w1) {
        kind = 'bamboo';
        width = 36;
        height = 48;
        y = GROUND_Y - height;
      } else if (roll < w2) {
        kind = 'croc';
        width = 74;
        height = 28;
        y = GROUND_Y - height;
      } else if (roll < w3) {
        kind = 'dragonfly';
        width = 46;
        height = 24;
        y = GROUND_Y - 68;
      } else {
        kind = 'chili';
        width = 30;
        height = 34;
        y = GROUND_Y - height;
      }

      sim.obstacles.push({
        id: sim.nextId++,
        kind,
        x: LOGICAL_WIDTH + 40,
        y,
        width,
        height,
        phase: Math.random() * Math.PI * 2,
        passed: false,
      });

      const goldenChance =
        0.14 + getPetEffectiveGoldenBonus(petIdRef.current, petBondRef.current);

      if (kind !== 'dragonfly' && Math.random() < 0.65) {
        sim.collectibles.push({
          id: sim.nextId++,
          kind: Math.random() < goldenChance ? 'golden_yuzu' : 'yuzu',
          x: LOGICAL_WIDTH + 40 + width / 2,
          y: y - 56,
          radius: 13,
          phase: Math.random() * Math.PI * 2,
          collected: false,
        });
      }

      const effectiveDiff =
        playModeRef.current === 'weekly_tournament' ? 'normal' : difficultyRef.current;
      const cfg = DIFFICULTY_CONFIGS[effectiveDiff];
      const speedRatio = (speed - cfg.baseSpeed) / Math.max(1, cfg.maxSpeed - cfg.baseSpeed);
      const minGap = cfg.spawnIntervalMin * (1 - speedRatio * 0.22);
      const maxGap = cfg.spawnIntervalMax * (1 - speedRatio * 0.22);
      sim.spawnTimer = minGap + Math.random() * (maxGap - minGap);
    };

    const spawnCollectibleLine = () => {
      const sim = simRef.current;
      const roll = Math.random();
      const baseX = LOGICAL_WIDTH + 50;
      const goldenChance =
        0.2 + getPetEffectiveGoldenBonus(petIdRef.current, petBondRef.current) * 1.15;

      if (roll < 0.12 && !sim.hasShield) {
        sim.collectibles.push({
          id: sim.nextId++,
          kind: 'shield',
          x: baseX,
          y: GROUND_Y - 82,
          radius: 14,
          phase: Math.random() * Math.PI * 2,
          collected: false,
        });
      } else if (roll < 0.22 && sim.magnetTimer <= 0) {
        sim.collectibles.push({
          id: sim.nextId++,
          kind: 'magnet',
          x: baseX,
          y: GROUND_Y - 88,
          radius: 14,
          phase: Math.random() * Math.PI * 2,
          collected: false,
        });
      } else {
        const count = 2 + Math.floor(Math.random() * 3);
        const arc = Math.random() < 0.5;
        const baseY = GROUND_Y - (arc ? 46 : 30);
        for (let i = 0; i < count; i++) {
          const kind: CollectibleKind =
            i === count - 1 && Math.random() < goldenChance ? 'golden_yuzu' : 'yuzu';
          sim.collectibles.push({
            id: sim.nextId++,
            kind,
            x: baseX + i * 44,
            y: arc ? baseY - Math.sin((i / Math.max(1, count - 1)) * Math.PI) * 44 : baseY,
            radius: kind === 'golden_yuzu' ? 14 : 12,
            phase: i * 0.5,
            collected: false,
          });
        }
      }
      sim.collectibleTimer = 1.0 + Math.random() * 1.1;
    };

    const damagePlayer = () => {
      const sim = simRef.current;
      const p = sim.player;
      if (sim.feverActive || p.invulnTimer > 0) return;
      if (sim.hasShield) {
        sim.hasShield = false;
        const durMult = getPetItemDurationMultiplier(petIdRef.current, petBondRef.current);
        p.invulnTimer = Number((1.1 * durMult).toFixed(2));
        triggerShake(11, 0.24);
        emitParticles(p.x + p.width / 2, p.y + p.height / 2, '#38BDF8', 14, 180);
        pushFloatingText(p.x + p.width / 2, p.y - 12, 'Khiên đã đỡ!', '#7DD3FC');
        soundEngine.playShieldBreak();
        return;
      }
      sim.hearts -= 1;
      sim.combo = 0;
      p.invulnTimer = 1.4;
      triggerShake(17, 0.36);
      sim.hitVignetteTimer = 0.3;
      emitParticles(p.x + p.width / 2, p.y + p.height / 2, '#FB7185', 14, 190);
      pushFloatingText(p.x + p.width / 2, p.y - 12, '-1 Tim', '#FDA4AF');

      if (sim.hearts <= 0) {
        soundEngine.playGameOver();
        onBossActiveChange(false);
        const finalScore = Math.floor(sim.scoreExact);
        const best = Math.max(highScoreRef.current, finalScore);
        onGameOver({
          score: finalScore,
          highScore: best,
          isNewRecord: finalScore > highScoreRef.current,
          yuzuCollected: sim.yuzuRun,
          distanceMeters: Math.floor(sim.distance / 28),
          maxCombo: sim.maxCombo,
          obstaclesPassed: sim.obstaclesPassed,
          feverCount: sim.feverCount,
          bossesDefeated: sim.bossesDefeated,
        });
      } else {
        soundEngine.playHit();
      }
    };

    const step = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      const sim = simRef.current;

      // Advance 5-minute Day/Night Clock continuously
      if (gameStateRef.current !== 'PAUSED') {
        sim.dayNightClock += dt;
      }

      if (gameStateRef.current === 'TITLE_MENU' || photoModeRef.current) {
        sim.time += dt;
        if (gameStateRef.current === 'TITLE_MENU') {
          sim.distance += 90 * dt;
          sim.player.runCycle += dt * 9;
        }
        sim.player.blinkTimer = Math.max(0, sim.player.blinkTimer - dt);
        sim.player.nextBlinkIn -= dt;
        if (sim.player.nextBlinkIn <= 0) {
          sim.player.blinkTimer = 0.14;
          sim.player.nextBlinkIn = 2.4 + Math.random() * 2.5;
        }
        // Keep trailing pet gently bobbing beside capybara
        const targetPetX = sim.player.x - sim.player.facing * 48;
        const targetPetY = sim.player.y + sim.player.height;
        sim.pet.x += (targetPetX - sim.pet.x) * Math.min(1, dt * 8);
        sim.pet.y += (targetPetY - sim.pet.y) * Math.min(1, dt * 8);
        sim.pet.hopPhase += dt * (gameStateRef.current === 'TITLE_MENU' ? 9 : 4.5);
      }

      if (gameStateRef.current === 'PLAYING') {
        const effectiveDiff =
          playModeRef.current === 'weekly_tournament' ? 'normal' : difficultyRef.current;
        const cfg = DIFFICULTY_CONFIGS[effectiveDiff];
        const progressBoost = Math.min(cfg.maxSpeed - cfg.baseSpeed, sim.distance * 0.022);
        const isBossMode = Boolean(sim.boss);
        const currentSpeed = isBossMode
          ? 0
          : (cfg.baseSpeed + progressBoost) * (sim.feverActive ? 1.25 : 1);

        sim.time += dt;
        sim.distance += currentSpeed * dt;

        const multiplier = Math.min(5, 1 + Math.floor(sim.combo / 5));
        if (!isBossMode) {
          sim.scoreExact += currentSpeed * dt * 0.04 * multiplier * cfg.scoreMultiplier;
        }

        // Check Boss trigger in Endless Mode or Boss Rush respawn
        const distanceMeters = Math.floor(sim.distance / 28);
        if (!sim.boss) {
          if (playModeRef.current === 'boss_rush') {
            sim.bossSpawnDelay -= dt;
            if (sim.bossSpawnDelay <= 0) {
              spawnBoss(sim.bossesDefeated + 1);
            }
          } else if (distanceMeters >= sim.nextBossDistance) {
            sim.nextBossDistance += 320;
            spawnBoss(sim.bossesDefeated + 1);
          }
        }

        // Cooldowns & Timers
        sim.coyoteTimer = Math.max(0, sim.coyoteTimer - dt);
        sim.jumpBufferTimer = Math.max(0, sim.jumpBufferTimer - dt);
        sim.player.invulnTimer = Math.max(0, sim.player.invulnTimer - dt);
        sim.magnetTimer = Math.max(0, sim.magnetTimer - dt);
        sim.shakeTimer = Math.max(0, sim.shakeTimer - dt);
        sim.hitVignetteTimer = Math.max(0, sim.hitVignetteTimer - dt);

        (Object.keys(sim.skillCooldowns) as SkillId[]).forEach((k) => {
          sim.skillCooldowns[k] = Math.max(0, sim.skillCooldowns[k] - dt);
        });

        if (sim.feverActive) {
          sim.feverTimer -= dt;
          if (Math.random() < 0.35) {
            emitParticles(sim.player.x + Math.random() * 40, GROUND_Y - 12, '#FDE68A', 1, 55);
          }
          if (sim.feverTimer <= 0) {
            sim.feverActive = false;
            sim.feverMeter = 0;
            sim.player.invulnTimer = 0.9;
          }
        }

        const p = sim.player;
        p.blinkTimer = Math.max(0, p.blinkTimer - dt);
        p.nextBlinkIn -= dt;
        if (p.nextBlinkIn <= 0) {
          p.blinkTimer = 0.14;
          p.nextBlinkIn = 2.2 + Math.random() * 2.8;
        }
        p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 14);
        p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 14);

        // Free horizontal movement during Boss Battle; smooth return to PLAYER_X in Endless
        if (isBossMode) {
          const moveSpeed = 330;
          let moveDir = 0;
          if (sim.leftHeld) moveDir -= 1;
          if (sim.rightHeld) moveDir += 1;
          p.vx = moveDir * moveSpeed;
          p.x = Math.max(16, Math.min(LOGICAL_WIDTH - p.width - 16, p.x + p.vx * dt));
          if (moveDir !== 0) {
            p.facing = moveDir > 0 ? 1 : -1;
          }
        } else {
          p.facing = 1;
          p.x += (PLAYER_X - p.x) * Math.min(1, dt * 8);
        }

        const wantsDuck = sim.duckHeld && !sim.feverActive;
        if (wantsDuck && p.isGrounded) {
          p.isDucking = true;
          p.height = DUCK_PLAYER_H;
          p.y = GROUND_Y - p.height;
        } else if (!wantsDuck && p.isDucking) {
          p.isDucking = false;
          p.height = BASE_PLAYER_H;
          if (p.isGrounded) p.y = GROUND_Y - p.height;
        }

        if (!p.isGrounded) {
          const g = sim.duckHeld ? FAST_FALL_GRAVITY : GRAVITY;
          p.vy += g * dt;
          p.y += p.vy * dt;

          const targetGroundTop = GROUND_Y - p.height;
          if (p.y >= targetGroundTop) {
            p.y = targetGroundTop;
            p.vy = 0;
            p.isGrounded = true;
            p.jumpsUsed = 0;
            p.scaleX = 1.18;
            p.scaleY = 0.84;
            emitParticles(p.x + p.width * 0.5, GROUND_Y, '#CBD5E1', 5, 70);

            if (sim.jumpBufferTimer > 0) {
              sim.jumpBufferTimer = 0;
              triggerJump();
            }
          }
        } else {
          const cycleSpeed = isBossMode ? (Math.abs(p.vx) > 10 ? 12 : 3) : currentSpeed * 0.032;
          p.runCycle += dt * cycleSpeed;
          sim.coyoteTimer = 0.08;
        }

        // Trailing mini Pet companion follow + auto-collect swoop physics
        sim.pet.dartTimer = Math.max(0, sim.pet.dartTimer - dt);
        const autoRadius = getPetAutoCollectRadius(petIdRef.current, petBondRef.current);
        let autoTarget: Collectible | null = null;
        if (autoRadius > 0) {
          let bestDist = autoRadius;
          const pMidX = p.x + p.width / 2;
          const pMidY = p.y + p.height / 2;
          for (const c of sim.collectibles) {
            if (c.collected || c.x > LOGICAL_WIDTH - 12) continue;
            if (c.kind !== 'yuzu' && c.kind !== 'golden_yuzu') continue;
            const dPet = Math.hypot(c.x - sim.pet.x, c.y - (sim.pet.y - 12));
            const dCap = Math.hypot(c.x - pMidX, c.y - pMidY);
            const d = Math.min(dPet, dCap);
            if (d <= bestDist) {
              bestDist = d;
              autoTarget = c;
            }
          }
        }

        const followX = Math.max(16, p.x - p.facing * 46);
        const followY = Math.min(GROUND_Y, p.y + p.height);
        if (autoTarget) {
          const swoopX = Math.max(20, Math.min(LOGICAL_WIDTH - 24, autoTarget.x));
          const swoopY = Math.min(GROUND_Y, Math.max(GROUND_Y - 120, autoTarget.y + 12));
          sim.pet.x += (swoopX - sim.pet.x) * Math.min(1, dt * 13);
          sim.pet.y += (swoopY - sim.pet.y) * Math.min(1, dt * 11);
          sim.pet.facing = autoTarget.x >= sim.pet.x ? 1 : -1;
          sim.pet.dartTimer = 0.25;

          const pdx = sim.pet.x - autoTarget.x;
          const pdy = sim.pet.y - 12 - autoTarget.y;
          const pdist = Math.hypot(pdx, pdy);
          if (pdist > 1) {
            autoTarget.x += (pdx / pdist) * 420 * dt;
            autoTarget.y += (pdy / pdist) * 420 * dt;
          }
          if (Math.random() < 0.35) {
            emitParticles(sim.pet.x, sim.pet.y - 12, '#FDE047', 1, 40);
          }
        } else {
          sim.pet.x += (followX - sim.pet.x) * Math.min(1, dt * 7);
          sim.pet.y += (followY - sim.pet.y) * Math.min(1, dt * 6.5);
          sim.pet.facing = p.facing;
        }
        sim.pet.hopPhase += dt * (sim.pet.dartTimer > 0 ? 15 : isBossMode ? 7 : 10);

        // Endless Runner Obstacles & Collectibles
        if (!isBossMode) {
          sim.spawnTimer -= dt;
          if (sim.spawnTimer <= 0) spawnObstacle(currentSpeed);
          sim.collectibleTimer -= dt;
          if (sim.collectibleTimer <= 0) spawnCollectibleLine();
        } else {
          // Spawn occasional helpful Yuzu during Boss fights
          sim.collectibleTimer -= dt;
          if (sim.collectibleTimer <= 0) {
            sim.collectibles.push({
              id: sim.nextId++,
              kind: Math.random() < 0.2 ? 'golden_yuzu' : 'yuzu',
              x: 90 + Math.random() * 680,
              y: GROUND_Y - 40 - Math.random() * 85,
              radius: 12,
              phase: Math.random() * Math.PI * 2,
              collected: false,
            });
            sim.collectibleTimer = 2.6;
          }
        }

        // Boss AI & Projectiles
        if (sim.boss) {
          const b = sim.boss;
          b.hitFlash = Math.max(0, b.hitFlash - dt);
          b.phase += dt;

          const prevX = b.x;
          const prevCycle = b.runCycle;
          const playerCenterX = p.x + p.width / 2;
          const bossCenterX = b.x + b.width / 2;
          const distToPlayerX = playerCenterX - bossCenterX;
          const isBossRush = playModeRef.current === 'boss_rush';

          // Boss movement & active chase in Boss Rush
          if (b.dashTimer > 0) {
            b.dashTimer -= dt;
            b.x += b.vx * dt;
            if (b.x < 50 || b.x > LOGICAL_WIDTH - b.width - 30) {
              b.vx = -b.vx;
              b.x = Math.max(50, Math.min(LOGICAL_WIDTH - b.width - 30, b.x));
            }
          } else if (isBossRush) {
            // In Boss Rush, Boss actively accelerates to chase Capybara across the arena
            const chaseSurge = Math.abs(distToPlayerX) > 190 || Math.sin(b.phase * 1.25) > 0.15;
            if (chaseSurge && Math.abs(distToPlayerX) > 68) {
              const chaseDir = distToPlayerX >= 0 ? 1 : -1;
              const chaseSpeed = 200 + b.level * 18;
              b.vx += (chaseDir * chaseSpeed - b.vx) * Math.min(1, dt * 6.5);
              b.x = Math.max(50, Math.min(LOGICAL_WIDTH - b.width - 30, b.x + b.vx * dt));
            } else {
              const patrolTargetX = Math.max(
                140,
                Math.min(LOGICAL_WIDTH - b.width - 40, playerCenterX + (distToPlayerX < 0 ? 130 : -130) + Math.sin(b.phase * 1.8) * 55)
              );
              const nextX = b.x + (patrolTargetX - b.x) * Math.min(1, dt * 3.2);
              b.vx = (nextX - b.x) / Math.max(0.001, dt);
              b.x = nextX;
            }
          } else {
            const targetX = 680 + Math.sin(b.phase * 1.4) * 110;
            const nextX = b.x + (targetX - b.x) * Math.min(1, dt * 2.5);
            b.vx = (nextX - b.x) / Math.max(0.001, dt);
            b.x = nextX;
          }

          if (b.kind === 'bamboo_dragon') {
            const targetY = GROUND_Y - 170 + Math.sin(b.phase * 2.1) * 55;
            b.y += (targetY - b.y) * Math.min(1, dt * 3);
          }

          const actualSpeedX = Math.abs((b.x - prevX) / Math.max(0.001, dt));
          const effectiveSpeed = Math.max(actualSpeedX, Math.abs(b.vx));

          // Trigger 'running' animation state when Boss accelerates to chase in Boss Rush or dashes
          if (b.dashTimer > 0 || (isBossRush && effectiveSpeed >= 145)) {
            b.animState = 'running';
          } else if (effectiveSpeed >= 24) {
            b.animState = 'walking';
          } else {
            b.animState = 'idle';
          }

          // Update facing toward chase direction or Capybara
          if (Math.abs(b.vx) > 32) {
            b.facing = b.vx > 0 ? 1 : -1;
          } else {
            b.facing = distToPlayerX >= 0 ? 1 : -1;
          }

          // Smoothly advance alternating leg gait cycle
          const strideRate =
            b.animState === 'running'
              ? 16.5 + Math.min(8, effectiveSpeed * 0.015)
              : b.animState === 'walking'
                ? 6.2 + Math.min(4, effectiveSpeed * 0.03)
                : 2.2;
          b.runCycle += dt * strideRate;

          // Emit ground dust puffs on alternating running footsteps
          if (
            b.animState === 'running' &&
            b.kind !== 'bamboo_dragon' &&
            Math.floor(prevCycle / Math.PI) !== Math.floor(b.runCycle / Math.PI)
          ) {
            emitParticles(
              b.x + b.width * 0.5 - b.facing * 14,
              GROUND_Y - 2,
              '#E2E8F0',
              4,
              85
            );
          }

          // Boss attacks
          b.attackTimer -= dt;
          if (b.attackTimer <= 0) {
            const attackInterval = Math.max(0.85, 1.85 - b.level * 0.15);
            b.attackTimer = attackInterval;
            const roll = Math.random();
            const bx = b.facing < 0 ? b.x + 12 : b.x + b.width - 12;
            const by = b.y + b.height * 0.55;
            const dashThreshold = isBossRush ? 0.62 : 0.8;

            if (roll < 0.4) {
              // Aimed chili bomb toward player
              const dx = p.x + p.width / 2 - bx;
              const dy = p.y + p.height / 2 - by;
              const dist = Math.max(1, Math.hypot(dx, dy));
              const speed = 340 + b.level * 25;
              triggerShake(6.5, 0.18);
              emitParticles(bx, by, '#FB923C', 8, 120);
              sim.projectiles.push({
                id: sim.nextId++,
                owner: 'boss',
                kind: 'chili_bomb',
                x: bx,
                y: by,
                vx: (dx / dist) * speed,
                vy: (dy / dist) * speed,
                radius: 11,
                damage: 1,
                piercing: false,
                life: 3.5,
              });
            } else if (roll < dashThreshold) {
              // Ground water pulse wave
              triggerShake(10.5, 0.26);
              emitParticles(bx, GROUND_Y - 12, '#38BDF8', 12, 140);
              sim.projectiles.push({
                id: sim.nextId++,
                owner: 'boss',
                kind: 'water_pulse',
                x: bx,
                y: GROUND_Y - 18,
                vx: b.facing * (360 + b.level * 20),
                vy: 0,
                radius: 13,
                damage: 1,
                piercing: false,
                life: 3.2,
              });
            } else {
              // Boss sprints/dashes toward player across arena
              const chaseDir = distToPlayerX >= 0 ? 1 : -1;
              b.dashTimer = 1.25;
              b.animState = 'running';
              b.facing = chaseDir;
              b.vx = chaseDir * (385 + b.level * 20);
              triggerShake(13.5, 0.34);
              emitParticles(b.x + b.width / 2, GROUND_Y - 8, '#FCA5A5', 14, 170);
              pushFloatingText(
                b.x + b.width / 2,
                b.y - 38,
                isBossRush ? 'Boss tăng tốc rượt đuổi!' : 'Boss lao tới!',
                '#FCA5A5'
              );
            }
          }

          // Boss body collision with player
          if (
            p.x + 10 < b.x + b.width - 10 &&
            p.x + p.width - 10 > b.x + 10 &&
            p.y + 8 < b.y + b.height - 8 &&
            p.y + p.height - 4 > b.y + 8
          ) {
            damagePlayer();
          }
        }

        // Update Projectiles + Trail & Impact VFX
        for (let i = sim.projectiles.length - 1; i >= 0; i--) {
          const proj = sim.projectiles[i];
          proj.x += proj.vx * dt;
          proj.y += proj.vy * dt;
          proj.life -= dt;

          // Dynamic skill particle trails
          if (proj.kind === 'yuzu_orb' && Math.random() < 0.55) {
            emitParticles(proj.x, proj.y, '#FDBA74', 1, 50);
          } else if (proj.kind === 'wave' && Math.random() < 0.75) {
            emitParticles(
              proj.x - Math.sign(proj.vx) * 14,
              proj.y + (Math.random() - 0.5) * 26,
              '#BAE6FD',
              2,
              85
            );
          } else if (proj.kind === 'meteor' && Math.random() < 0.8) {
            emitParticles(
              proj.x + (Math.random() - 0.5) * 14,
              proj.y - 12,
              Math.random() < 0.5 ? '#FDE047' : '#FB923C',
              2,
              75
            );
          } else if (proj.kind === 'bamboo_blade' && Math.random() < 0.6) {
            emitParticles(proj.x, proj.y, '#4ADE80', 1, 55);
          } else if (proj.kind === 'thunder_bolt' && Math.random() < 0.85) {
            emitParticles(proj.x, proj.y - 10, '#C084FC', 2, 95);
          } else if (proj.kind === 'chili_bomb' && Math.random() < 0.45) {
            emitParticles(proj.x, proj.y, '#FCA5A5', 1, 45);
          }

          if (proj.owner === 'player') {
            // Wave destroys boss projectiles!
            if (proj.kind === 'wave') {
              for (let j = sim.projectiles.length - 1; j >= 0; j--) {
                const other = sim.projectiles[j];
                if (other.owner === 'boss' && Math.hypot(proj.x - other.x, proj.y - other.y) < proj.radius + other.radius) {
                  emitParticles(other.x, other.y, '#7DD3FC', 8, 130);
                  sim.projectiles.splice(j, 1);
                  if (j < i) i--;
                }
              }
            }

            if (sim.boss) {
              const b = sim.boss;
              if (
                proj.x + proj.radius > b.x &&
                proj.x - proj.radius < b.x + b.width &&
                proj.y + proj.radius > b.y &&
                proj.y - proj.radius < b.y + b.height
              ) {
                b.hp -= proj.damage;
                b.hitFlash = 0.14;
                sim.scoreExact += proj.damage * 3;
                const hitColor =
                  proj.kind === 'wave'
                    ? '#38BDF8'
                    : proj.kind === 'meteor'
                    ? '#FDE047'
                    : proj.kind === 'bamboo_blade'
                    ? '#4ADE80'
                    : proj.kind === 'thunder_bolt'
                    ? '#C084FC'
                    : '#FB923C';
                emitParticles(proj.x, proj.y, hitColor, proj.kind === 'meteor' ? 16 : 11, 175);
                if (proj.damage > 0) {
                  pushFloatingText(proj.x, proj.y - 12, `-${proj.damage}`, '#FDE047');
                }

                if (!proj.piercing) {
                  sim.projectiles.splice(i, 1);
                } else {
                  // Prevent wave from hitting same boss every frame
                  proj.damage = 0;
                }

                if (b.hp <= 0) {
                  // Boss Defeated!
                  sim.bossesDefeated += 1;
                  sim.yuzuRun += 35;
                  sim.scoreExact += 500 * b.level;
                  sim.hearts = Math.min(sim.maxHearts, sim.hearts + 1);
                  triggerShake(16, 0.42);
                  emitParticles(b.x + b.width / 2, b.y + b.height / 2, '#FBBF24', 32, 260);
                  pushFloatingText(
                    b.x + b.width / 2,
                    b.y,
                    `Hạ Boss! +${500 * b.level} điểm · +35 Quýt`,
                    '#FDE047'
                  );
                  soundEngine.playFeverStart();
                  sim.boss = null;
                  sim.projectiles = [];
                  sim.bossSpawnDelay = 2.0;
                  onBossActiveChange(false);
                  break;
                }
                continue;
              }
            }

            // Meteor ground splash
            if (proj.kind === 'meteor' && proj.y >= GROUND_Y - 6) {
              emitParticles(proj.x, GROUND_Y - 6, '#FBBF24', 12, 160);
              sim.projectiles.splice(i, 1);
              continue;
            }
          } else {
            // Boss projectile hitting player
            const pcx = p.x + p.width / 2;
            const pcy = p.y + p.height / 2;
            if (Math.hypot(proj.x - pcx, proj.y - pcy) < proj.radius + 22) {
              sim.projectiles.splice(i, 1);
              damagePlayer();
              if (sim.hearts <= 0) return;
              continue;
            }
          }

          if (
            proj.life <= 0 ||
            proj.x < -60 ||
            proj.x > LOGICAL_WIDTH + 60 ||
            proj.y > LOGICAL_HEIGHT + 40
          ) {
            sim.projectiles.splice(i, 1);
          }
        }

        // Update Obstacles
        const hurtMarginX = 12;
        const hurtMarginY = 8;
        const px1 = p.x + hurtMarginX;
        const py1 = p.y + hurtMarginY;
        const px2 = p.x + p.width - hurtMarginX;
        const py2 = p.y + p.height - 4;

        for (let i = sim.obstacles.length - 1; i >= 0; i--) {
          const obs = sim.obstacles[i];
          obs.x -= currentSpeed * dt;

          if (!obs.passed && obs.x + obs.width < p.x) {
            obs.passed = true;
            sim.obstaclesPassed += 1;
            sim.scoreExact += 5 * multiplier;
          }

          const ox1 = obs.x + 5;
          const oy1 = obs.y + 5;
          const ox2 = obs.x + obs.width - 5;
          const oy2 = obs.y + obs.height - 4;

          if (px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1) {
            if (sim.feverActive) {
              emitParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#FBBF24', 12, 190);
              pushFloatingText(obs.x + obs.width / 2, obs.y, '+25 Chill!', '#FDE047');
              sim.scoreExact += 25;
              sim.obstaclesPassed += 1;
              sim.obstacles.splice(i, 1);
              soundEngine.playYuzu(6);
              continue;
            } else {
              damagePlayer();
              if (sim.hearts <= 0) return;
            }
          }

          if (obs.x + obs.width < -60) sim.obstacles.splice(i, 1);
        }

        // Update Collectibles
        const pCenterX = p.x + p.width / 2;
        const pCenterY = p.y + p.height / 2;
        const petDef = getPetDef(petIdRef.current);
        const petAutoRadius = getPetAutoCollectRadius(petIdRef.current, petBondRef.current);
        const durationMult = getPetItemDurationMultiplier(petIdRef.current, petBondRef.current);
        const scoreBoost = 1 + petDef.scoreBonusPct / 100;
        const feverBoost = 1 + petDef.feverBonusPct / 100;

        for (let i = sim.collectibles.length - 1; i >= 0; i--) {
          const c = sim.collectibles[i];
          c.x -= currentSpeed * dt;

          if ((sim.magnetTimer > 0 || sim.feverActive) && (c.kind === 'yuzu' || c.kind === 'golden_yuzu')) {
            const dx = pCenterX - c.x;
            const dy = pCenterY - c.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 260 && dist > 1) {
              const pull = 460 * dt;
              c.x += (dx / dist) * pull;
              c.y += (dy / dist) * pull;
            }
          }

          const distToPlayer = Math.hypot(pCenterX - c.x, pCenterY - c.y);
          const distToPet = Math.hypot(sim.pet.x - c.x, sim.pet.y - 12 - c.y);
          const collectedByPet =
            petAutoRadius > 0 &&
            (c.kind === 'yuzu' || c.kind === 'golden_yuzu') &&
            distToPet < c.radius + 24 &&
            distToPlayer >= c.radius + 32;

          if (!c.collected && (distToPlayer < c.radius + 32 || collectedByPet)) {
            c.collected = true;

            if (c.kind === 'yuzu') {
              sim.yuzuRun += 1;
              sim.combo += 1;
              sim.maxCombo = Math.max(sim.maxCombo, sim.combo);
              const pts = Math.round(10 * multiplier * scoreBoost);
              sim.scoreExact += pts;
              if (!sim.feverActive) {
                sim.feverMeter = Math.min(100, sim.feverMeter + Math.round(8 * feverBoost));
              }
              emitParticles(c.x, c.y, collectedByPet ? petDef.accentColor : '#FB923C', 8, 130);
              pushFloatingText(
                c.x,
                c.y - 10,
                collectedByPet ? `+${pts} (Thú cưng)` : `+${pts}`,
                collectedByPet ? '#FEF08A' : '#FDBA74'
              );
              soundEngine.playYuzu(sim.combo);
            } else if (c.kind === 'golden_yuzu') {
              sim.yuzuRun += 3;
              sim.combo += 2;
              sim.maxCombo = Math.max(sim.maxCombo, sim.combo);
              const pts = Math.round(50 * multiplier * scoreBoost);
              sim.scoreExact += pts;
              if (!sim.feverActive) {
                sim.feverMeter = Math.min(100, sim.feverMeter + Math.round(18 * feverBoost));
              }
              emitParticles(c.x, c.y, '#FBBF24', 14, 170);
              pushFloatingText(
                c.x,
                c.y - 12,
                collectedByPet ? `+${pts} Quýt vàng (Thú cưng)!` : `+${pts} Quýt vàng!`,
                '#FDE047'
              );
              soundEngine.playGoldenYuzu();
            } else if (c.kind === 'shield') {
              sim.hasShield = true;
              emitParticles(c.x, c.y, '#38BDF8', 12, 150);
              pushFloatingText(c.x, c.y - 12, 'Khiên khăn!', '#7DD3FC');
              soundEngine.playPowerUp();
            } else if (c.kind === 'magnet') {
              const magDur = Number((7.0 * durationMult).toFixed(1));
              sim.magnetTimer = magDur;
              sim.magnetMaxDuration = magDur;
              emitParticles(c.x, c.y, '#34D399', 12, 150);
              pushFloatingText(
                c.x,
                c.y - 12,
                durationMult > 1 ? `Nam châm ${magDur}s (+Thú cưng)!` : 'Nam châm 7s!',
                '#6EE7B7'
              );
              soundEngine.playPowerUp();
            }

            if (!sim.feverActive && sim.feverMeter >= 100) {
              const feverDur = Number((6.0 * durationMult).toFixed(1));
              sim.feverActive = true;
              sim.feverTimer = feverDur;
              sim.feverMaxDuration = feverDur;
              sim.feverCount += 1;
              soundEngine.playFeverStart();
              pushFloatingText(
                pCenterX,
                p.y - 26,
                durationMult > 1 ? `Suối nước nóng ${feverDur}s!` : 'Suối nước nóng Bất tử!',
                '#FDE047'
              );
              emitParticles(pCenterX, pCenterY, '#FDE047', 18, 210);
            }
          }

          if (c.collected || c.x + c.radius < -40) sim.collectibles.splice(i, 1);
        }

        for (let i = sim.particles.length - 1; i >= 0; i--) {
          const pt = sim.particles[i];
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += 320 * dt;
          pt.life -= dt;
          if (pt.life <= 0) sim.particles.splice(i, 1);
        }

        for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
          const ft = sim.floatingTexts[i];
          ft.y += ft.vy * dt;
          ft.life -= dt;
          if (ft.life <= 0) sim.floatingTexts.splice(i, 1);
        }

        // Compute 5-minute day/night status
        const fullCycle = DAY_NIGHT_HALF_CYCLE_SEC * 2;
        const cyclePos = sim.dayNightClock % fullCycle;
        const isNight = cyclePos >= DAY_NIGHT_HALF_CYCLE_SEC;
        const cycleRemainingSeconds = Math.max(
          0,
          Math.ceil(DAY_NIGHT_HALF_CYCLE_SEC - (cyclePos % DAY_NIGHT_HALF_CYCLE_SEC))
        );

        hudSyncAccum += dt;
        if (hudSyncAccum >= 0.08) {
          hudSyncAccum = 0;
          const scoreNow = Math.floor(sim.scoreExact);
          onHudUpdate({
            score: scoreNow,
            highScore: Math.max(highScoreRef.current, scoreNow),
            yuzuRun: sim.yuzuRun,
            yuzuBank: yuzuBankRef.current,
            combo: sim.combo,
            multiplier,
            hearts: sim.hearts,
            maxHearts: sim.maxHearts,
            hasShield: sim.hasShield,
            magnetTimer: sim.magnetTimer,
            magnetMaxDuration: sim.magnetMaxDuration,
            feverMeter: sim.feverMeter,
            feverActive: sim.feverActive,
            feverTimer: sim.feverTimer,
            feverMaxDuration: sim.feverMaxDuration,
            distanceMeters: Math.floor(sim.distance / 28),
            speedFactor: Number((currentSpeed / cfg.baseSpeed).toFixed(2)),
            activeWeather: resolveActiveWeather(
              weatherModeRef.current,
              sim.distance,
              forecastWeatherRef.current
            ),
            isNight,
            cycleRemainingSeconds,
            bossActive: Boolean(sim.boss),
            bossName: sim.boss?.name ?? null,
            bossHp: sim.boss?.hp ?? 0,
            bossMaxHp: sim.boss?.maxHp ?? 1,
            bossesDefeated: sim.bossesDefeated,
            skillCooldowns: { ...sim.skillCooldowns },
            stageName: stageConfigRef.current.name,
          });
        }
      }

      // Compute smooth Day -> Sunset (Hoàng hôn) -> Deep Night (Tối dần) -> Dawn transition
      const fullCycle = DAY_NIGHT_HALF_CYCLE_SEC * 2;
      const cyclePos = sim.dayNightClock % fullCycle;
      let nightFactor = 0;
      let sunsetFactor = 0;

      // Dusk sunset window: last 28s of Day phase: first warms into sunset, then darkens gradually
      const duskStart = DAY_NIGHT_HALF_CYCLE_SEC - 28;
      const duskPeak = DAY_NIGHT_HALF_CYCLE_SEC - 14;
      const dawnStart = fullCycle - 16;

      if (cyclePos >= duskStart && cyclePos < duskPeak) {
        sunsetFactor = (cyclePos - duskStart) / (duskPeak - duskStart);
        nightFactor = 0;
      } else if (cyclePos >= duskPeak && cyclePos < DAY_NIGHT_HALF_CYCLE_SEC) {
        const t = (cyclePos - duskPeak) / (DAY_NIGHT_HALF_CYCLE_SEC - duskPeak);
        sunsetFactor = 1 - t * 0.55;
        nightFactor = t;
      } else if (cyclePos >= DAY_NIGHT_HALF_CYCLE_SEC && cyclePos < DAY_NIGHT_HALF_CYCLE_SEC + 8) {
        const t = (cyclePos - DAY_NIGHT_HALF_CYCLE_SEC) / 8;
        sunsetFactor = (1 - t) * 0.45;
        nightFactor = 1;
      } else if (cyclePos >= DAY_NIGHT_HALF_CYCLE_SEC + 8 && cyclePos < dawnStart) {
        sunsetFactor = 0;
        nightFactor = 1;
      } else if (cyclePos >= dawnStart) {
        const t = (cyclePos - dawnStart) / (fullCycle - dawnStart);
        sunsetFactor = Math.sin(t * Math.PI) * 0.6;
        nightFactor = 1 - t;
      }

      const dpr = window.devicePixelRatio || 1;
      const targetW = LOGICAL_WIDTH * dpr;
      const targetH = LOGICAL_HEIGHT * dpr;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      if (sim.shakeTimer > 0 && !photoModeRef.current) {
        const ratio = Math.min(1, sim.shakeTimer / Math.max(0.01, sim.shakeDuration));
        const ease = ratio * ratio;
        const mag = sim.shakeIntensity * ease;
        const dx = (Math.random() - 0.5) * 2 * mag;
        const dy = (Math.random() - 0.5) * 2 * mag;
        const rot = (Math.random() - 0.5) * 0.012 * ease;
        ctx.translate(LOGICAL_WIDTH / 2 + dx, LOGICAL_HEIGHT / 2 + dy);
        ctx.rotate(rot);
        ctx.translate(-LOGICAL_WIDTH / 2, -LOGICAL_HEIGHT / 2);
      }

      const multiplier = Math.min(5, 1 + Math.floor(sim.combo / 5));
      const visualStack = Math.min(5, Math.floor(sim.yuzuRun / 4) + (sim.yuzuRun > 0 ? 1 : 0));
      const activeWeather = resolveActiveWeather(
        weatherModeRef.current,
        sim.distance,
        forecastWeatherRef.current
      );
      if (
        sim.prevWeather === 'rain' &&
        activeWeather !== 'rain' &&
        activeWeather !== 'snow' &&
        activeWeather !== 'fireflies'
      ) {
        sim.rainbowTimer = 24;
      }
      sim.prevWeather = activeWeather;
      if (sim.rainbowTimer > 0 && gameStateRef.current !== 'PAUSED') {
        sim.rainbowTimer = Math.max(0, sim.rainbowTimer - dt);
      }
      const rainbowAlpha =
        sim.rainbowTimer > 0 ? Math.min(1, sim.rainbowTimer / 4) : 0;
      const effectiveNightFactor =
        activeWeather === 'fireflies' ? Math.max(nightFactor, 0.85) : nightFactor;
      const weatherDt = gameStateRef.current === 'PAUSED' && !photoModeRef.current ? 0 : dt;

      renderGameScene(ctx, {
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        groundY: GROUND_Y,
        time: sim.time,
        dt: weatherDt,
        distance: sim.distance,
        nightFactor: effectiveNightFactor,
        sunsetFactor,
        rainbowAlpha,
        activeWeather,
        weatherParticles: sim.weatherParticles,
        stage: stageConfigRef.current,
        pet:
          petIdRef.current !== 'none'
            ? {
                id: petIdRef.current,
                x: sim.pet.x,
                y: sim.pet.y,
                facing: sim.pet.facing,
                hopPhase: sim.pet.hopPhase,
                isMoving: !photoModeRef.current && (!sim.boss || Math.abs(sim.player.vx) > 8 || sim.pet.dartTimer > 0),
                isDashing: sim.pet.dartTimer > 0,
              }
            : null,
        player: {
          x: sim.player.x,
          y: sim.player.y,
          width: sim.player.width,
          height: sim.player.height,
          vy: sim.player.vy,
          facing: sim.player.facing,
          isGrounded: sim.player.isGrounded,
          isDucking: sim.player.isDucking,
          scaleX: sim.player.scaleX,
          scaleY: sim.player.scaleY,
          invulnTimer: photoModeRef.current ? 0 : sim.player.invulnTimer,
          hasShield: sim.hasShield,
          magnetTimer: sim.magnetTimer,
          feverActive: sim.feverActive || (photoModeRef.current && photoPoseRef.current === 'zen'),
          yuzuStackCount:
            photoModeRef.current && visualStack === 0 ? 2 : visualStack,
          appearance: appearanceRef.current,
          runCycle: sim.player.runCycle,
          blinkTimer: sim.player.blinkTimer,
          photoPose: photoModeRef.current ? photoPoseRef.current : undefined,
          isMoving: !photoModeRef.current && (!sim.boss || Math.abs(sim.player.vx) > 8),
          potionHue: potionHueRef.current,
          glowingFoodActive: glowingFoodActiveRef.current,
          balloonsActive: balloonsActiveRef.current,
        },
        obstacles: sim.obstacles,
        collectibles: sim.collectibles,
        boss: sim.boss,
        projectiles: sim.projectiles,
        particles: sim.particles,
        floatingTexts: photoModeRef.current ? [] : sim.floatingTexts,
      });

      if (gameStateRef.current === 'PLAYING' && !photoModeRef.current && multiplier >= 2 && !sim.boss) {
        ctx.save();
        ctx.font = '700 14px "Outfit", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(17, 26, 22, 0.7)';
        ctx.lineWidth = 3;
        const label = `Chuỗi ${sim.combo} · x${multiplier}`;
        ctx.strokeText(label, 20, 30);
        ctx.fillText(label, 20, 30);
        ctx.restore();
      }

      if (sim.hitVignetteTimer > 0) {
        const alpha = Math.min(0.32, (sim.hitVignetteTimer / 0.3) * 0.32);
        const vig = ctx.createRadialGradient(
          LOGICAL_WIDTH / 2,
          LOGICAL_HEIGHT / 2,
          LOGICAL_WIDTH * 0.25,
          LOGICAL_WIDTH / 2,
          LOGICAL_HEIGHT / 2,
          LOGICAL_WIDTH * 0.65
        );
        vig.addColorStop(0, 'rgba(244, 63, 94, 0)');
        vig.addColorStop(1, `rgba(225, 29, 72, ${alpha.toFixed(3)})`);
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      }

      ctx.restore();
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [
    emitParticles,
    onBossActiveChange,
    onGameOver,
    onHudUpdate,
    pushFloatingText,
    spawnBoss,
    triggerJump,
    triggerShake,
  ]);

  const bossActive = Boolean(simRef.current.boss);

  return (
    <div className="relative w-full select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          if (gameState !== 'PLAYING') return;
          e.preventDefault();
          if (simRef.current.boss) {
            useSkill('yuzu_shot');
          } else {
            triggerJump();
          }
        }}
        className="block h-auto w-full cursor-pointer touch-none bg-[#1B2B23]"
        style={{ aspectRatio: `${LOGICAL_WIDTH} / ${LOGICAL_HEIGHT}` }}
      />

      {/* Boss Battle Skill Bar & Free-Movement Controls */}
      {gameState === 'PLAYING' && bossActive && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#15221B] px-4 py-2.5">
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onPointerDown={() => (simRef.current.leftHeld = true)}
              onPointerUp={() => (simRef.current.leftHeld = false)}
              onPointerLeave={() => (simRef.current.leftHeld = false)}
              className="h-10 rounded-lg border border-white/15 bg-[#21332A] px-3 text-xs font-bold text-white"
            >
              Trái
            </button>
            <button
              type="button"
              onPointerDown={() => (simRef.current.rightHeld = true)}
              onPointerUp={() => (simRef.current.rightHeld = false)}
              onPointerLeave={() => (simRef.current.rightHeld = false)}
              className="h-10 rounded-lg border border-white/15 bg-[#21332A] px-3 text-xs font-bold text-white"
            >
              Phải
            </button>
            <button
              type="button"
              onPointerDown={triggerJump}
              className="h-10 rounded-lg bg-amber-500 px-3 text-xs font-bold text-[#1A1308]"
            >
              Nhảy
            </button>
          </div>

          <div className="hidden text-xs text-emerald-200/80 sm:block">
            Di chuyển tự do: <strong className="text-white">A / D</strong> hoặc <strong className="text-white">← / →</strong> · Nhảy: <strong className="text-white">Space / W / L</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {BOSS_SKILLS.map((skill) => {
              const isUnlocked = unlockedSkills.includes(skill.id);
              const cd = simRef.current.skillCooldowns[skill.id];
              return (
                <button
                  key={skill.id}
                  type="button"
                  disabled={!isUnlocked || cd > 0}
                  title={`${skill.name} (${skill.cooldown}s hồi): ${skill.detailedEffect}`}
                  onClick={() => useSkill(skill.id)}
                  className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition-colors ${
                    !isUnlocked
                      ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/35'
                      : cd > 0
                      ? 'border-white/15 bg-[#1B2B23] text-emerald-200/60'
                      : 'border-amber-400/50 bg-[#23372E] text-white hover:bg-[#2E483C]'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: isUnlocked ? skill.accentColor : '#475569' }}
                    aria-hidden="true"
                  />
                  <span>
                    [{skill.hotkey}] {skill.name}
                  </span>
                  {cd > 0 && <span className="font-mono-num text-amber-300">{cd.toFixed(1)}s</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Endless Runner Mobile Controls */}
      {gameState === 'PLAYING' && !bossActive && (
        <div className="flex items-center justify-between border-t border-white/10 bg-[#15221B] px-5 py-2.5 sm:hidden">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setDucking(true);
            }}
            onPointerUp={() => setDucking(false)}
            onPointerLeave={() => setDucking(false)}
            onPointerCancel={() => setDucking(false)}
            className="h-11 min-w-[120px] rounded-lg border border-white/15 bg-[#21332A] px-4 text-sm font-semibold text-emerald-100 active:bg-[#2C4338]"
          >
            Cúi xuống
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              triggerJump();
            }}
            className="h-11 min-w-[140px] rounded-lg bg-amber-500 px-5 text-sm font-bold text-[#1A1308] active:bg-amber-400"
          >
            Nhảy lên
          </button>
        </div>
      )}
    </div>
  );
}
