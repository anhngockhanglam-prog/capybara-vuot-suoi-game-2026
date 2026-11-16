import { useEffect, useRef } from 'react';
import {
  drawCapybara,
  drawHorizonTrain,
  drawMount,
  drawPet,
  drawRainbowArc,
  getMountSaddleOffset,
} from '../game/renderer';
import { soundEngine } from '../game/sound';
import {
  ActiveWeather,
  CapybaraActivityId,
  CapybaraAppearance,
  EnvironmentalActionId,
  HomeItemId,
  IngredientId,
  KingdomState,
  PetId,
  SideQuestId,
  WorldLocationId,
} from '../game/types';
import { createWeatherParticles, stepAndRenderWeather } from '../game/weather';
import {
  EXOTIC_CREATURES,
  KINGDOM_FESTIVALS,
} from '../game/world';
import {
  drawAlienDimensionBackdrop,
  drawCandyPlanetBackdrop,
  drawDimensionalPortal,
  drawGlowingForestBackdrop,
  drawIceMountainBackdrop,
  drawKingdomBackdrop,
  drawNightSecretsLayer,
  drawOceanBackdrop,
  drawSmoothSkyLayer,
  drawSpaceshipScene,
  SpaceMeteor,
} from './worldSceneExtras';

export type InteractiveSceneArea = WorldLocationId;

export interface ScenePulseEvent {
  seq: number;
  kind:
    | 'feed'
    | 'rest'
    | 'swim'
    | 'toss_yuzu'
    | 'forage'
    | 'meditate'
    | 'bounce'
    | 'minigame_start'
    | 'activity'
    | 'env_action'
    | 'fish_cast'
    | 'jump'
    | 'interact'
    | 'open_portal'
    | 'exit_portal'
    | 'greet_royals';
  activityId?: CapybaraActivityId;
  envActionId?: EnvironmentalActionId;
  label?: string;
}

interface WorldSceneCanvasProps {
  area: InteractiveSceneArea;
  appearance: CapybaraAppearance;
  petId?: PetId;
  weather: ActiveWeather;
  starryNight?: boolean;
  skyPhase?: 'day' | 'sunset' | 'night';
  rainbowActive?: boolean;
  trainEnabled?: boolean;
  activeHomeItems: HomeItemId[];
  pulseEvent: ScenePulseEvent | null;
  playgroundGameActive: boolean;
  manualMoveDir?: -1 | 0 | 1;
  manualSpaceDir?: { dx: -1 | 0 | 1; dy: -1 | 0 | 1 };
  potionHue?: number | null;
  glowingFoodActive?: boolean;
  balloonsActive?: boolean;
  kingdom?: KingdomState;
  midnightChestClaimed?: boolean;
  discoveredCreatures?: string[];
  onPlaygroundTargetHit?: (isGolden: boolean) => void;
  onScenePet?: () => void;
  onSelfieReady?: (dataUrl: string) => void;
  onSideQuestProgress?: (questId: SideQuestId, detail: string) => void;
  onFishingCatch?: (rewardYuzu: number, fishName: string) => void;
  onCollectIngredient?: (id: IngredientId, amount: number, sourceLabel: string) => void;
  onCollectMeteorStone?: () => void;
  onMeetAlien?: () => void;
  onClaimMidnightChest?: () => void;
  onDiscoverCreature?: (creatureId: string, name: string, rewardYuzu: number) => void;
  onPortalStateChange?: (inDimension: boolean) => void;
  onGreetRoyals?: () => void;
}

interface SceneParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  text?: string;
}

interface PlaygroundTarget {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  golden: boolean;
}

interface WorldFruitNode {
  id: number;
  x: number;
  y: number;
  kind: 'watermelon' | 'golden_yuzu';
  respawnTimer: number;
}

const W = 540;
const H = 260;

export function WorldSceneCanvas({
  area,
  appearance,
  petId = 'none',
  weather,
  starryNight = false,
  skyPhase,
  rainbowActive = false,
  trainEnabled = true,
  activeHomeItems,
  pulseEvent,
  playgroundGameActive,
  manualMoveDir = 0,
  manualSpaceDir = { dx: 0, dy: 0 },
  potionHue = null,
  glowingFoodActive = false,
  balloonsActive = false,
  kingdom,
  midnightChestClaimed = false,
  discoveredCreatures = [],
  onPlaygroundTargetHit,
  onScenePet,
  onSelfieReady,
  onSideQuestProgress,
  onFishingCatch,
  onCollectIngredient,
  onCollectMeteorStone,
  onMeetAlien,
  onClaimMidnightChest,
  onDiscoverCreature,
  onPortalStateChange,
  onGreetRoyals,
}: WorldSceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const areaRef = useRef(area);
  const appearanceRef = useRef(appearance);
  const petIdRef = useRef(petId);
  const weatherRef = useRef(weather);
  const starryRef = useRef(starryNight);
  const skyPhaseRef = useRef<'day' | 'sunset' | 'night'>(
    skyPhase ?? (starryNight ? 'night' : 'day')
  );
  const rainbowPropRef = useRef(rainbowActive);
  const trainEnabledRef = useRef(trainEnabled);
  const homeItemsRef = useRef(activeHomeItems);
  const gameActiveRef = useRef(playgroundGameActive);
  const manualMoveRef = useRef<-1 | 0 | 1>(manualMoveDir);
  const manualSpaceRef = useRef(manualSpaceDir);
  const potionHueRef = useRef<number | null>(potionHue);
  const glowingFoodRef = useRef<boolean>(glowingFoodActive);
  const balloonsRef = useRef<boolean>(balloonsActive);
  const kingdomRef = useRef<KingdomState | undefined>(kingdom);
  const chestClaimedRef = useRef<boolean>(midnightChestClaimed);
  const discoveredRef = useRef<string[]>(discoveredCreatures);
  const onHitRef = useRef(onPlaygroundTargetHit);
  const onPetRef = useRef(onScenePet);
  const onSelfieRef = useRef(onSelfieReady);
  const onQuestProgressRef = useRef(onSideQuestProgress);
  const onFishingCatchRef = useRef(onFishingCatch);
  const onCollectIngredientRef = useRef(onCollectIngredient);
  const onCollectMeteorRef = useRef(onCollectMeteorStone);
  const onMeetAlienRef = useRef(onMeetAlien);
  const onClaimChestRef = useRef(onClaimMidnightChest);
  const onDiscoverCreatureRef = useRef(onDiscoverCreature);
  const onPortalChangeRef = useRef(onPortalStateChange);
  const onGreetRoyalsRef = useRef(onGreetRoyals);

  useEffect(() => {
    areaRef.current = area;
  }, [area]);

  useEffect(() => {
    appearanceRef.current = appearance;
  }, [appearance]);

  useEffect(() => {
    petIdRef.current = petId;
  }, [petId]);

  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  useEffect(() => {
    starryRef.current = starryNight;
    skyPhaseRef.current = skyPhase ?? (starryNight ? 'night' : 'day');
  }, [starryNight, skyPhase]);

  useEffect(() => {
    rainbowPropRef.current = rainbowActive;
  }, [rainbowActive]);

  useEffect(() => {
    trainEnabledRef.current = trainEnabled;
  }, [trainEnabled]);

  useEffect(() => {
    homeItemsRef.current = activeHomeItems;
  }, [activeHomeItems]);

  useEffect(() => {
    gameActiveRef.current = playgroundGameActive;
  }, [playgroundGameActive]);

  useEffect(() => {
    manualMoveRef.current = manualMoveDir;
  }, [manualMoveDir]);

  useEffect(() => {
    manualSpaceRef.current = manualSpaceDir;
  }, [manualSpaceDir]);

  useEffect(() => {
    potionHueRef.current = potionHue;
  }, [potionHue]);

  useEffect(() => {
    glowingFoodRef.current = glowingFoodActive;
  }, [glowingFoodActive]);

  useEffect(() => {
    balloonsRef.current = balloonsActive;
  }, [balloonsActive]);

  useEffect(() => {
    kingdomRef.current = kingdom;
  }, [kingdom]);

  useEffect(() => {
    chestClaimedRef.current = midnightChestClaimed;
  }, [midnightChestClaimed]);

  useEffect(() => {
    discoveredRef.current = discoveredCreatures;
  }, [discoveredCreatures]);

  useEffect(() => {
    onHitRef.current = onPlaygroundTargetHit;
  }, [onPlaygroundTargetHit]);

  useEffect(() => {
    onPetRef.current = onScenePet;
  }, [onScenePet]);

  useEffect(() => {
    onSelfieRef.current = onSelfieReady;
  }, [onSelfieReady]);

  useEffect(() => {
    onQuestProgressRef.current = onSideQuestProgress;
  }, [onSideQuestProgress]);

  useEffect(() => {
    onFishingCatchRef.current = onFishingCatch;
  }, [onFishingCatch]);

  useEffect(() => {
    onCollectIngredientRef.current = onCollectIngredient;
  }, [onCollectIngredient]);

  useEffect(() => {
    onCollectMeteorRef.current = onCollectMeteorStone;
  }, [onCollectMeteorStone]);

  useEffect(() => {
    onMeetAlienRef.current = onMeetAlien;
  }, [onMeetAlien]);

  useEffect(() => {
    onClaimChestRef.current = onClaimMidnightChest;
  }, [onClaimMidnightChest]);

  useEffect(() => {
    onDiscoverCreatureRef.current = onDiscoverCreature;
  }, [onDiscoverCreature]);

  useEffect(() => {
    onPortalChangeRef.current = onPortalStateChange;
  }, [onPortalStateChange]);

  useEffect(() => {
    onGreetRoyalsRef.current = onGreetRoyals;
  }, [onGreetRoyals]);

  const simRef = useRef({
    capyX: 230,
    capyTargetX: 230,
    capyYOffset: 0,
    capyVy: 0,
    facing: 1 as 1 | -1,
    petX: 184,
    petJumpY: 0,
    petJumpVy: 0,
    petLeapCooldown: 0,
    petExcitedTimer: 0,
    petSparkAccum: 0,
    skyProgress: skyPhase === 'night' || starryNight ? 1 : skyPhase === 'sunset' ? 0.5 : 0,
    sleepTimer: 0,
    activeActivity: null as CapybaraActivityId | null,
    activeEnvAction: null as EnvironmentalActionId | null,
    envActionTimer: 0,
    activityTimer: 0,
    flashAlpha: 0,
    pendingSelfieCapture: false,
    prevWeather: weather as ActiveWeather,
    rainbowTimer: 0,
    particles: [] as SceneParticle[],
    ripples: [] as { x: number; y: number; r: number; life: number }[],
    targets: [] as PlaygroundTarget[],
    nextTargetId: 1,
    targetSpawnTimer: 0.4,
    lastPulseSeq: 0,
    keysHeld: { left: false, right: false, up: false, down: false },
    fishingState: 'idle' as 'idle' | 'casting' | 'bite',
    fishingTimer: 0,
    duckNpc: { x: 370, dir: -1 as -1 | 1, friendSparkTimer: 0 },
    birdNpc: { x: 128, dir: 1 as -1 | 1, friendSparkTimer: 0 },
    fruits: [
      { id: 1, x: 112, y: 196, kind: 'watermelon', respawnTimer: 0 },
      { id: 2, x: 318, y: 194, kind: 'golden_yuzu', respawnTimer: 0 },
      { id: 3, x: 452, y: 196, kind: 'watermelon', respawnTimer: 0 },
    ] as WorldFruitNode[],
    shipX: 120,
    shipY: 132,
    shipTilt: 0,
    meteors: [
      { id: 1, x: 380, y: 74, vx: -42, r: 12 },
      { id: 2, x: 510, y: 158, vx: -56, r: 14 },
      { id: 3, x: 290, y: 206, vx: -36, r: 11 },
    ] as SpaceMeteor[],
    nextMeteorId: 4,
    alienX: 396,
    alienY: 130,
    alienGreetTimer: 0,
    portalActive: false,
    portalX: 462,
    portalTimer: 11,
    inAlienDimension: false,
    resourceCooldown: 0,
  });

  // Auto-trigger rainbow when weather changes from rain -> non-rain
  useEffect(() => {
    const s = simRef.current;
    if (
      s.prevWeather === 'rain' &&
      weather !== 'rain' &&
      weather !== 'snow' &&
      weather !== 'fireflies'
    ) {
      s.rainbowTimer = 18;
    }
    s.prevWeather = weather;
  }, [weather]);

  // React to explicit user action buttons & 10 animated activities
  useEffect(() => {
    if (!pulseEvent || pulseEvent.seq === simRef.current.lastPulseSeq) return;
    simRef.current.lastPulseSeq = pulseEvent.seq;
    const s = simRef.current;

    const pushBurst = (
      x: number,
      y: number,
      color: string,
      count: number,
      floatingText?: string
    ) => {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 85;
        s.particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 35,
          life: 0.7 + Math.random() * 0.4,
          maxLife: 1.1,
          color,
          size: 3 + Math.random() * 2.5,
        });
      }
      if (floatingText) {
        s.particles.push({
          x,
          y: y - 16,
          vx: 0,
          vy: -36,
          life: 1.35,
          maxLife: 1.35,
          color: '#FEF08A',
          size: 13,
          text: floatingText,
        });
      }
    };

    const interactWithNearest = () => {
      const capyCx = s.capyX + 33;
      const curArea = areaRef.current;

      // Alien Dimension exit or creature discovery
      if (s.inAlienDimension) {
        if (Math.abs(capyCx - 72) < 55) {
          s.inAlienDimension = false;
          s.flashAlpha = 0.7;
          soundEngine.playPortalWarp();
          onPortalChangeRef.current?.(false);
          pushBurst(capyCx, 155, '#7DD3FC', 14, 'Trở về thế giới cũ!');
          return;
        }
        const creaturePositions = [165, 265, 355, 432, 308];
        for (let idx = 0; idx < EXOTIC_CREATURES.length; idx++) {
          if (Math.abs(capyCx - creaturePositions[idx]) < 52) {
            const cr = EXOTIC_CREATURES[idx];
            soundEngine.playGoldenYuzu();
            pushBurst(creaturePositions[idx], 150, cr.color, 14, `Gặp ${cr.name}!`);
            onDiscoverCreatureRef.current?.(cr.id, cr.name, cr.rewardYuzu);
            return;
          }
        }
      }

      // Dimensional Portal entry
      if (s.portalActive && !s.inAlienDimension && Math.abs(capyCx - s.portalX) < 54) {
        s.inAlienDimension = true;
        s.portalActive = false;
        s.flashAlpha = 0.85;
        s.capyX = 120;
        s.capyTargetX = 120;
        soundEngine.playPortalWarp();
        onPortalChangeRef.current?.(true);
        pushBurst(155, 145, '#E879F9', 18, 'Bước vào Dị Giới Huyền Bí!');
        return;
      }

      // Nighttime Midnight Treasure Chest & Friendly Ghost Village
      if (s.skyProgress >= 0.72 && curArea !== 'home' && curArea !== 'spaceship') {
        if (s.skyProgress >= 0.84 && !chestClaimedRef.current && Math.abs(capyCx - 478) < 56) {
          soundEngine.playChestOpen();
          pushBurst(478, 168, '#FBBF24', 18, 'Mở Kho báu Nửa đêm!');
          onClaimChestRef.current?.();
          return;
        }
        if (Math.abs(capyCx - 74) < 58) {
          soundEngine.playYuzu(5);
          pushBurst(74, 166, '#5EEAD4', 12, 'Ma Capy: Tặng bạn kẹo đêm!');
          onCollectIngredientRef.current?.('glow_mushroom', 1, 'Làng Ma Thân Thiện');
          return;
        }
      }

      // New Biome Interactive Landmarks (Ingredients)
      if (s.resourceCooldown <= 0) {
        if (curArea === 'glowing_forest' && (Math.abs(capyCx - 418) < 68 || Math.abs(capyCx - 162) < 58)) {
          s.resourceCooldown = 3.5;
          soundEngine.playCraft();
          pushBurst(capyCx, 158, '#2DD4BF', 14, '+1 Nấm Phát Sáng!');
          onCollectIngredientRef.current?.('glow_mushroom', 1, 'Rừng Phát Sáng');
          return;
        }
        if (curArea === 'ice_mountain' && Math.abs(capyCx - 110) < 88) {
          s.resourceCooldown = 3.5;
          soundEngine.playCraft();
          pushBurst(capyCx, 158, '#38BDF8', 14, '+1 Pha Lê Băng!');
          onCollectIngredientRef.current?.('ice_crystal', 1, 'Hang Pha Lê');
          return;
        }
        if (curArea === 'ocean' && (Math.abs(capyCx - 126) < 70 || Math.abs(capyCx - 396) < 70)) {
          s.resourceCooldown = 3.5;
          soundEngine.playCraft();
          pushBurst(capyCx, 158, '#FDE047', 14, '+1 Ngọc Trai Biển!');
          onCollectIngredientRef.current?.('sea_pearl', 1, 'Thành phố Dưới Biển');
          return;
        }
        if (curArea === 'candy_planet') {
          s.resourceCooldown = 3.5;
          soundEngine.playCraft();
          pushBurst(capyCx, 158, '#F472B6', 14, '+1 Đường Kẹo Ngọt!');
          onCollectIngredientRef.current?.('candy_sugar', 1, 'Sông Sô-cô-la');
          return;
        }
      }

      // Kingdom Royals Greeting
      if (curArea === 'kingdom' && Math.abs(capyCx - 438) < 80) {
        soundEngine.playGoldenYuzu();
        pushBurst(438, 156, '#FBBF24', 16, 'Vua & Hoàng hậu ban phước!');
        onGreetRoyalsRef.current?.();
        return;
      }

      // 1. Collect nearby Side Quest fruit
      if (curArea !== 'home' && curArea !== 'spaceship' && curArea !== 'kingdom') {
        for (const fruit of s.fruits) {
          if (fruit.respawnTimer <= 0 && Math.abs(capyCx - fruit.x) < 46) {
            fruit.respawnTimer = 8;
            soundEngine.playGoldenYuzu();
            pushBurst(
              fruit.x,
              fruit.y - 8,
              fruit.kind === 'golden_yuzu' ? '#FBBF24' : '#FB7185',
              12,
              fruit.kind === 'golden_yuzu' ? 'Hái Quýt Vàng!' : 'Hái Dưa Hấu!'
            );
            onQuestProgressRef.current?.('find_fruit', 'Đã tìm thấy trái cây quý trong khu vực!');
            return;
          }
        }

        // 2. Befriend nearby Duck or Bird NPC
        if (Math.abs(capyCx - s.duckNpc.x) < 58) {
          s.duckNpc.friendSparkTimer = 2.4;
          soundEngine.playYuzu(4);
          pushBurst(s.duckNpc.x, 168, '#FDE047', 12, '♥ Quạc! Kết bạn Vịt Suối!');
          onQuestProgressRef.current?.('befriend_bird_duck', 'Đã làm quen thân thiết với Vịt Suối!');
          return;
        }
        if (Math.abs(capyCx - s.birdNpc.x) < 58) {
          s.birdNpc.friendSparkTimer = 2.4;
          soundEngine.playYuzu(5);
          pushBurst(s.birdNpc.x, 165, '#38BDF8', 12, '♪ Chíp! Kết bạn Chim Sơn Ca!');
          onQuestProgressRef.current?.('befriend_bird_duck', 'Đã kết bạn với Chim Sơn Ca!');
          return;
        }
      }

      // 3. Fishing Pier interaction at Pool or Beach
      if ((curArea === 'pool' || curArea === 'beach') && Math.abs(capyCx - 395) < 75) {
        s.fishingState = 'casting';
        s.fishingTimer = 1.65;
        s.capyTargetX = 355;
        s.facing = 1;
        soundEngine.playSplash();
        pushBurst(432, 186, '#7DD3FC', 8, 'Thả cần câu...');
        return;
      }

      // 4. Contextual Environmental interaction (Grass or Shade)
      if (curArea === 'forest' || curArea === 'secret_forest' || curArea === 'playground' || curArea === 'beach') {
        if (Math.abs(capyCx - 165) < 55 && curArea !== 'beach') {
          s.activeEnvAction = 'chew_grass';
          s.envActionTimer = 4.2;
          soundEngine.playChew();
          pushBurst(capyCx, 178, '#4ADE80', 10, 'Nhai cỏ xanh mơn mởn!');
          return;
        }
        if (Math.abs(capyCx - 425) < 62) {
          s.activeEnvAction = 'rest_shade';
          s.envActionTimer = 4.5;
          s.sleepTimer = 4.5;
          soundEngine.playSnore();
          pushBurst(capyCx, 162, '#A78BFA', 10, 'Nghỉ ngơi dưới bóng râm...');
          return;
        }
      }

      // Default gentle hop emote
      s.capyVy = -220;
      soundEngine.playYuzu(2);
      pushBurst(capyCx, 152, '#FDA4AF', 8, 'Capy vui vẻ!');
    };

    if (pulseEvent.kind === 'open_portal') {
      s.portalActive = true;
      s.portalX = s.capyX < 250 ? 442 : 98;
      soundEngine.playPortalWarp();
      pushBurst(s.portalX, 156, '#E879F9', 16, 'Cổng Không Gian vừa mở!');
      return;
    }

    if (pulseEvent.kind === 'exit_portal') {
      s.inAlienDimension = false;
      s.flashAlpha = 0.7;
      soundEngine.playPortalWarp();
      onPortalChangeRef.current?.(false);
      pushBurst(s.capyX + 33, 155, '#7DD3FC', 14, 'Rời khỏi Dị Giới!');
      return;
    }

    if (pulseEvent.kind === 'greet_royals') {
      s.capyTargetX = 370;
      soundEngine.playGoldenYuzu();
      pushBurst(438, 155, '#FBBF24', 16, 'Vua & Hoàng hậu Capy ban lộc!');
      return;
    }

    if (pulseEvent.kind === 'jump') {
      if (s.capyYOffset === 0) {
        s.capyVy = -320;
        soundEngine.playJump(false);
        pushBurst(s.capyX + 33, 198, '#E2E8F0', 6);
      }
      return;
    }

    if (pulseEvent.kind === 'interact') {
      interactWithNearest();
      return;
    }

    if (pulseEvent.kind === 'fish_cast') {
      s.activeActivity = null;
      s.activeEnvAction = null;
      s.capyTargetX = 355;
      s.facing = 1;
      s.fishingState = 'casting';
      s.fishingTimer = 1.65;
      soundEngine.playSplash();
      pushBurst(432, 186, '#7DD3FC', 10, 'Thả cần câu cá...');
      return;
    }

    if (pulseEvent.kind === 'env_action' && pulseEvent.envActionId) {
      const env = pulseEvent.envActionId;
      s.activeActivity = null;
      s.activeEnvAction = env;
      s.envActionTimer = 5.2;
      if (env === 'swim_water') {
        s.sleepTimer = 0;
        s.capyTargetX = areaRef.current === 'beach' ? 88 : 230;
        s.ripples.push({ x: s.capyX + 33, y: 188, r: 10, life: 1 });
        pushBurst(s.capyX + 33, 176, '#38BDF8', 14, 'Bơi lội tung tăng!');
      } else if (env === 'chew_grass') {
        s.sleepTimer = 0;
        s.capyTargetX = 152;
        pushBurst(178, 176, '#4ADE80', 12, 'Măm cỏ xanh giòn ngọt!');
      } else if (env === 'rest_shade') {
        s.capyTargetX = areaRef.current === 'beach' ? 404 : 418;
        s.sleepTimer = 5.2;
        pushBurst(436, 158, '#A78BFA', 10, 'Zzz... Mát rượi dưới tán râm');
      }
      return;
    }

    if (pulseEvent.kind === 'activity' && pulseEvent.activityId) {
      const act = pulseEvent.activityId;
      s.activeEnvAction = null;
      s.activeActivity = act;
      s.activityTimer = 5.5;
      s.sleepTimer = act === 'nap_snore' || act === 'sleep_teddy' ? 5.5 : 0;

      if (act === 'skateboard') {
        s.capyTargetX = s.capyX < 250 ? 390 : 110;
        s.capyVy = -260;
        pushBurst(s.capyX + 32, 185, '#38BDF8', 12, pulseEvent.label || 'Lướt ván!');
      } else if (act === 'bubble_bath') {
        s.capyTargetX = 235;
        pushBurst(268, 175, '#E0F2FE', 16, pulseEvent.label || 'Bong bóng!');
      } else if (act === 'nap_snore') {
        s.capyTargetX = 225;
        pushBurst(s.capyX + 42, 160, '#93C5FD', 10, 'Zzz... Khò!');
      } else if (act === 'dance') {
        s.capyTargetX = 235;
        s.capyVy = -200;
        pushBurst(268, 160, '#C084FC', 14, '♪ Quẩy hết mình ♪');
      } else if (act === 'eat_watermelon') {
        s.capyTargetX = 235;
        pushBurst(268, 168, '#FB7185', 14, 'Măm măm! Ngon mát!');
      } else if (act === 'dive_swim') {
        s.capyTargetX = 140 + Math.random() * 220;
        s.ripples.push({ x: s.capyX + 32, y: 184, r: 10, life: 1 });
        pushBurst(s.capyX + 32, 172, '#38BDF8', 16, 'Lặn ngắm cá!');
      } else if (act === 'balloon') {
        s.capyTargetX = 235;
        s.capyVy = -310;
        pushBurst(268, 150, '#F472B6', 14, 'Tung bóng bay!');
      } else if (act === 'sleep_teddy') {
        s.capyTargetX = 225;
        pushBurst(260, 165, '#FDA4AF', 12, 'Ôm gấu ngủ ngoan ♥');
      } else if (act === 'selfie') {
        s.capyTargetX = 235;
        s.facing = 1;
        s.flashAlpha = 0.95;
        s.pendingSelfieCapture = true;
        pushBurst(272, 155, '#FEF08A', 14, 'Tách! Selfie xịn!');
      } else if (act === 'arcade_game') {
        s.capyTargetX = 215;
        s.facing = 1;
        pushBurst(295, 165, '#4ADE80', 14, '+1UP! Phá đảo!');
      }
      return;
    }

    if (pulseEvent.kind === 'rest') {
      s.activeActivity = 'nap_snore';
      s.activeEnvAction = null;
      s.activityTimer = 3.2;
      s.sleepTimer = 2.8;
      s.capyTargetX = homeItemsRef.current.includes('plush_bed') ? 165 : 220;
      pushBurst(s.capyX + 32, 165, '#93C5FD', 10, pulseEvent.label || 'Zzz... +Năng lượng');
    } else if (pulseEvent.kind === 'feed') {
      s.sleepTimer = 0;
      s.activeEnvAction = null;
      s.activeActivity = 'eat_watermelon';
      s.activityTimer = 3.0;
      s.capyVy = -180;
      pushBurst(s.capyX + 32, 160, '#FB923C', 12, pulseEvent.label || 'Ngon quá!');
    } else if (pulseEvent.kind === 'swim' || pulseEvent.kind === 'toss_yuzu') {
      s.sleepTimer = 0;
      s.activeActivity = null;
      s.activeEnvAction = pulseEvent.kind === 'swim' ? 'swim_water' : null;
      s.envActionTimer = pulseEvent.kind === 'swim' ? 4.2 : 0;
      s.capyTargetX = 110 + Math.random() * 260;
      s.ripples.push({ x: s.capyX + 32, y: 186, r: 8, life: 1 });
      pushBurst(
        s.capyX + 32,
        175,
        pulseEvent.kind === 'toss_yuzu' ? '#FBBF24' : '#7DD3FC',
        12,
        pulseEvent.label
      );
    } else if (pulseEvent.kind === 'forage' || pulseEvent.kind === 'meditate') {
      s.sleepTimer = 0;
      s.activeActivity = null;
      s.activeEnvAction = null;
      s.capyTargetX = pulseEvent.kind === 'forage' ? 95 + Math.random() * 300 : 235;
      pushBurst(s.capyX + 32, 165, '#4ADE80', 12, pulseEvent.label);
    } else if (pulseEvent.kind === 'bounce') {
      s.sleepTimer = 0;
      s.activeActivity = null;
      s.activeEnvAction = null;
      s.capyTargetX = 235;
      s.capyVy = -430;
      pushBurst(268, 195, '#F472B6', 14, pulseEvent.label || 'Nhảy cao!');
    } else if (pulseEvent.kind === 'minigame_start') {
      s.targets = [];
      s.targetSpawnTimer = 0.05;
    }
  }, [pulseEvent]);

  // Keyboard movement inside World Hub when not typing into inputs
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const s = simRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') s.keysHeld.left = true;
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') s.keysHeld.right = true;
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') s.keysHeld.up = true;
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') s.keysHeld.down = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const s = simRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') s.keysHeld.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') s.keysHeld.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') s.keysHeld.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') s.keysHeld.down = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const weatherParticles = createWeatherParticles(W, H, 38);
    let animId = 0;
    let last = performance.now();
    let time = 0;
    let blinkTimer = 0;
    let nextBlink = 2.4;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;

      const s = simRef.current;
      const curArea = areaRef.current;

      blinkTimer = Math.max(0, blinkTimer - dt);
      nextBlink -= dt;
      if (nextBlink <= 0) {
        blinkTimer = 0.14;
        nextBlink = 2.2 + Math.random() * 2.5;
      }

      if (s.rainbowTimer > 0) {
        s.rainbowTimer = Math.max(0, s.rainbowTimer - dt);
      }
      if (s.flashAlpha > 0) {
        s.flashAlpha = Math.max(0, s.flashAlpha - dt * 2.4);
      }
      if (s.activityTimer > 0) {
        s.activityTimer = Math.max(0, s.activityTimer - dt);
        if (s.activityTimer === 0) {
          s.activeActivity = null;
        }
      }

      // Activity ambient motion & particles
      if (s.activeActivity === 'skateboard') {
        if (Math.abs(s.capyTargetX - s.capyX) < 12) {
          s.capyTargetX = s.capyX < 250 ? 415 : 85;
        }
        if (Math.random() < dt * 7) {
          s.particles.push({
            x: s.capyX + (s.facing > 0 ? 4 : 62),
            y: 202,
            vx: -s.facing * 45,
            vy: -18,
            life: 0.45,
            maxLife: 0.45,
            color: '#FDE047',
            size: 2.5,
          });
        }
      } else if (s.activeActivity === 'bubble_bath') {
        if (Math.random() < dt * 5.5) {
          s.particles.push({
            x: s.capyX - 10 + Math.random() * 88,
            y: 174 + Math.random() * 14,
            vx: (Math.random() - 0.5) * 22,
            vy: -32 - Math.random() * 22,
            life: 1.2,
            maxLife: 1.2,
            color: '#E0F2FE',
            size: 4 + Math.random() * 4,
          });
        }
      } else if (s.activeActivity === 'dance') {
        if (s.capyYOffset === 0 && Math.random() < dt * 2.8) {
          s.capyVy = -190;
        }
        if (Math.random() < dt * 3.5) {
          const notes = ['♪', '♫', '★'];
          s.particles.push({
            x: s.capyX + 10 + Math.random() * 50,
            y: 145,
            vx: (Math.random() - 0.5) * 35,
            vy: -40,
            life: 1.1,
            maxLife: 1.1,
            color: Math.random() < 0.5 ? '#F472B6' : '#FDE047',
            size: 13,
            text: notes[Math.floor(Math.random() * notes.length)],
          });
        }
      } else if (s.activeActivity === 'eat_watermelon') {
        if (Math.random() < dt * 3.8) {
          s.particles.push({
            x: s.capyX + 48,
            y: 170,
            vx: (Math.random() - 0.5) * 45,
            vy: -30 - Math.random() * 35,
            life: 0.7,
            maxLife: 0.7,
            color: Math.random() < 0.35 ? '#1E293B' : '#FB7185',
            size: 2.6,
          });
        }
      } else if (s.activeActivity === 'dive_swim') {
        if (Math.random() < dt * 6) {
          s.particles.push({
            x: s.capyX + 20 + Math.random() * 30,
            y: 205,
            vx: (Math.random() - 0.5) * 16,
            vy: -42,
            life: 0.9,
            maxLife: 0.9,
            color: '#BAE6FD',
            size: 3 + Math.random() * 2.5,
          });
        }
      } else if (s.activeActivity === 'balloon') {
        if (s.capyYOffset === 0 && Math.random() < dt * 2.0) {
          s.capyVy = -280;
        }
      } else if (s.activeActivity === 'sleep_teddy') {
        if (Math.random() < dt * 2.1) {
          s.particles.push({
            x: s.capyX + 42,
            y: 155,
            vx: 8,
            vy: -24,
            life: 1.1,
            maxLife: 1.1,
            color: '#FDA4AF',
            size: 12,
            text: Math.random() < 0.45 ? '♥' : 'Zzz',
          });
        }
      }

      if (s.envActionTimer > 0) {
        s.envActionTimer = Math.max(0, s.envActionTimer - dt);
        if (s.envActionTimer === 0) {
          s.activeEnvAction = null;
        }
      }

      // Environmental action animations & particles
      if (s.activeEnvAction === 'swim_water') {
        if (Math.random() < dt * 4.5) {
          s.ripples.push({ x: s.capyX + 33, y: 188, r: 8, life: 1 });
        }
        if (Math.random() < dt * 5) {
          s.particles.push({
            x: s.capyX + 18 + Math.random() * 32,
            y: 180,
            vx: (Math.random() - 0.5) * 44,
            vy: -36 - Math.random() * 24,
            life: 0.65,
            maxLife: 0.65,
            color: '#BAE6FD',
            size: 2.8,
          });
        }
      } else if (s.activeEnvAction === 'chew_grass') {
        if (Math.random() < dt * 4.5) {
          s.particles.push({
            x: s.capyX + (s.facing > 0 ? 52 : 12),
            y: 186,
            vx: (Math.random() - 0.5) * 40,
            vy: -34 - Math.random() * 22,
            life: 0.7,
            maxLife: 0.7,
            color: Math.random() < 0.5 ? '#4ADE80' : '#86EFAC',
            size: 2.5,
          });
        }
      }

      // Side Quest entities (Fishing timer, Fruit respawns, Duck & Bird NPC patrol)
      if (s.fishingState === 'casting') {
        s.fishingTimer -= dt;
        if (Math.random() < dt * 2.5) {
          s.ripples.push({ x: 446, y: 192, r: 5, life: 0.8 });
        }
        if (s.fishingTimer <= 0) {
          s.fishingState = 'idle';
          const catches = [
            { name: 'Cá Chép Vàng', yuzu: 4 },
            { name: 'Cá Suối Bạc', yuzu: 3 },
            { name: 'Kho Báu Quýt Cổ', yuzu: 6 },
          ];
          const caught = catches[Math.floor(Math.random() * catches.length)];
          soundEngine.playGoldenYuzu();
          s.particles.push({
            x: 420,
            y: 155,
            vx: 0,
            vy: -36,
            life: 1.5,
            maxLife: 1.5,
            color: '#FDE047',
            size: 13,
            text: `Câu được ${caught.name}! (+${caught.yuzu} Quýt)`,
          });
          onFishingCatchRef.current?.(caught.yuzu, caught.name);
          onQuestProgressRef.current?.('catch_fish', `Đã câu được ${caught.name}!`);
        }
      }

      for (const f of s.fruits) {
        if (f.respawnTimer > 0) f.respawnTimer = Math.max(0, f.respawnTimer - dt);
      }
      s.duckNpc.x += s.duckNpc.dir * 26 * dt;
      if (s.duckNpc.x < 290) s.duckNpc.dir = 1;
      if (s.duckNpc.x > 465) s.duckNpc.dir = -1;
      s.duckNpc.friendSparkTimer = Math.max(0, s.duckNpc.friendSparkTimer - dt);

      s.birdNpc.x += s.birdNpc.dir * 32 * dt;
      if (s.birdNpc.x < 70) s.birdNpc.dir = 1;
      if (s.birdNpc.x > 215) s.birdNpc.dir = -1;
      s.birdNpc.friendSparkTimer = Math.max(0, s.birdNpc.friendSparkTimer - dt);

      if (s.sleepTimer > 0) {
        s.sleepTimer = Math.max(0, s.sleepTimer - dt);
        if (s.activeActivity !== 'sleep_teddy' && Math.random() < dt * 2.4) {
          s.particles.push({
            x: s.capyX + 48,
            y: 152,
            vx: 10,
            vy: -24,
            life: 1.1,
            maxLife: 1.1,
            color: '#BAE6FD',
            size: 12,
            text: Math.random() < 0.3 ? 'Khò!' : 'Zzz',
          });
        }
      } else if (
        !s.activeActivity &&
        !s.activeEnvAction &&
        manualMoveRef.current === 0 &&
        !s.keysHeld.left &&
        !s.keysHeld.right &&
        Math.random() < dt * 0.25 &&
        curArea !== 'playground'
      ) {
        s.capyTargetX = 90 + Math.random() * 290;
      }

      // Direct D-pad / Keyboard Movement overrides target wander cleanly
      const activeMount = curArea === 'home' ? (appearanceRef.current.mount ?? 'none') : 'none';
      const isMounted = activeMount !== 'none' && !s.activeActivity;
      let manualDir = manualMoveRef.current;
      if (s.keysHeld.left && !s.keysHeld.right) manualDir = -1;
      else if (s.keysHeld.right && !s.keysHeld.left) manualDir = 1;

      if (manualDir !== 0) {
        s.sleepTimer = 0;
        s.activeActivity = null;
        s.facing = manualDir;
        const speed = activeMount !== 'none' ? 195 : 165;
        s.capyX = Math.max(24, Math.min(W - 90, s.capyX + manualDir * speed * dt));
        s.capyTargetX = s.capyX;
      } else {
        // Move capybara smoothly toward target X
        const dx = s.capyTargetX - s.capyX;
        if (Math.abs(dx) > 3) {
          const moveSpeed =
            s.activeActivity === 'skateboard'
              ? 185
              : isMounted
              ? 140
              : curArea === 'pool'
              ? 75
              : 105;
          s.facing = dx > 0 ? 1 : -1;
          s.capyX += Math.sign(dx) * Math.min(Math.abs(dx), moveSpeed * dt);
        }
      }
      const targetPetX = Math.max(24, Math.min(W - 24, s.capyX + (s.facing > 0 ? -24 : 88)));
      const petDist = targetPetX - s.petX;
      const activePet = petIdRef.current;
      const petIsChasing = Math.abs(petDist) > 4;

      // Distinct follow physics & characteristic animations per pet (especially lively inside Home!)
      const petSpeedFactor =
        activePet === 'shiba' || activePet === 'phoenix_chick'
          ? 5.8
          : activePet === 'otter' || activePet === 'red_panda'
          ? 5.1
          : activePet === 'turtle'
          ? 2.8
          : activePet === 'frog' || activePet === 'alpaca'
          ? 4.6
          : 4.5;
      s.petX += petDist * Math.min(1, dt * petSpeedFactor);

      if (s.petLeapCooldown > 0) s.petLeapCooldown = Math.max(0, s.petLeapCooldown - dt);
      if (s.petExcitedTimer > 0) s.petExcitedTimer = Math.max(0, s.petExcitedTimer - dt);
      if (s.resourceCooldown > 0) s.resourceCooldown = Math.max(0, s.resourceCooldown - dt);

      if (activePet !== 'none') {
        if (activePet === 'frog') {
          if (petIsChasing && s.petJumpY === 0 && s.petLeapCooldown <= 0) {
            s.petJumpVy = curArea === 'home' ? 245 : 210;
            s.petLeapCooldown = curArea === 'home' ? 0.36 : 0.45;
            s.particles.push({
              x: s.petX,
              y: 202,
              vx: (Math.random() - 0.5) * 32,
              vy: -24,
              life: 0.45,
              maxLife: 0.45,
              color: '#86EFAC',
              size: 2.5,
            });
          }
        } else if (activePet === 'shiba' || activePet === 'red_panda' || activePet === 'alpaca') {
          if (petIsChasing && s.petJumpY === 0 && s.petLeapCooldown <= 0) {
            s.petJumpVy = activePet === 'alpaca' ? 195 : 175;
            s.petLeapCooldown = activePet === 'alpaca' ? 0.48 : 0.55;
          }
          if (!petIsChasing && Math.abs(petDist) <= 4 && s.petExcitedTimer <= 0 && curArea === 'home' && Math.random() < dt * 0.8) {
            s.petExcitedTimer = 1.1;
          }
        } else if (activePet === 'duckling' && curArea === 'home' && petIsChasing) {
          s.petSparkAccum += dt;
          if (s.petSparkAccum >= 0.32) {
            s.petSparkAccum = 0;
            s.particles.push({
              x: s.petX,
              y: 184,
              vx: -s.facing * 18,
              vy: -26,
              life: 0.7,
              maxLife: 0.7,
              color: '#FDE047',
              size: 11,
              text: '♪',
            });
          }
        } else if ((activePet === 'turtle' || activePet === 'otter') && curArea === 'home' && petIsChasing) {
          s.petSparkAccum += dt;
          if (s.petSparkAccum >= 0.28) {
            s.petSparkAccum = 0;
            s.particles.push({
              x: s.petX - s.facing * 8,
              y: 200,
              vx: -s.facing * 12,
              vy: -14,
              life: 0.55,
              maxLife: 0.55,
              color: activePet === 'otter' ? '#7DD3FC' : '#5EEAD4',
              size: 2.6,
            });
          }
        } else if (activePet === 'phoenix_chick' && curArea === 'home' && petIsChasing) {
          s.petSparkAccum += dt;
          if (s.petSparkAccum >= 0.24) {
            s.petSparkAccum = 0;
            s.particles.push({
              x: s.petX - s.facing * 6,
              y: 186,
              vx: -s.facing * 15,
              vy: -20,
              life: 0.5,
              maxLife: 0.5,
              color: '#FBBF24',
              size: 2.8,
            });
          }
        }
      }

      if (s.petJumpY > 0 || s.petJumpVy !== 0) {
        s.petJumpY += s.petJumpVy * dt;
        s.petJumpVy -= 980 * dt;
        if (s.petJumpY <= 0) {
          s.petJumpY = 0;
          s.petJumpVy = 0;
        }
      }

      // Smooth Day -> Sunset (0.5) -> Deep Night (1.0) progression
      const targetSkyProgress =
        skyPhaseRef.current === 'night'
          ? 1
          : skyPhaseRef.current === 'sunset'
          ? 0.5
          : 0;
      if (Math.abs(s.skyProgress - targetSkyProgress) > 0.002) {
        const stepDir = Math.sign(targetSkyProgress - s.skyProgress);
        s.skyProgress = Math.max(
          0,
          Math.min(1, s.skyProgress + stepDir * Math.min(Math.abs(targetSkyProgress - s.skyProgress), dt * 0.36))
        );
      }

      // Spaceship Steering, Meteor Stones & Alien Encounter
      if (curArea === 'spaceship') {
        let sxDir = manualSpaceRef.current.dx || manualMoveRef.current;
        let syDir = manualSpaceRef.current.dy;
        if (s.keysHeld.left && !s.keysHeld.right) sxDir = -1;
        else if (s.keysHeld.right && !s.keysHeld.left) sxDir = 1;
        if (s.keysHeld.up && !s.keysHeld.down) syDir = -1;
        else if (s.keysHeld.down && !s.keysHeld.up) syDir = 1;

        s.shipX = Math.max(42, Math.min(W - 42, s.shipX + sxDir * 195 * dt));
        s.shipY = Math.max(36, Math.min(H - 36, s.shipY + syDir * 170 * dt));
        s.shipTilt += (syDir * 0.22 - s.shipTilt) * Math.min(1, dt * 8);

        if (s.alienGreetTimer > 0) s.alienGreetTimer = Math.max(0, s.alienGreetTimer - dt);
        s.alienY = 128 + Math.sin(time * 2.2) * 26;

        if (Math.hypot(s.shipX - s.alienX, s.shipY - s.alienY) < 42 && s.alienGreetTimer <= 0) {
          s.alienGreetTimer = 4.0;
          soundEngine.playGoldenYuzu();
          s.particles.push({
            x: s.alienX,
            y: s.alienY - 24,
            vx: 0,
            vy: -32,
            life: 1.4,
            maxLife: 1.4,
            color: '#5EEAD4',
            size: 13,
            text: 'Gặp Capy Ngoài Hành Tinh! +5 Quýt',
          });
          onMeetAlienRef.current?.();
        }

        for (let i = s.meteors.length - 1; i >= 0; i--) {
          const m = s.meteors[i];
          m.x += m.vx * dt;
          if (Math.hypot(s.shipX - m.x, s.shipY - m.y) < m.r + 24) {
            soundEngine.playSpaceCollect();
            s.particles.push({
              x: m.x,
              y: m.y,
              vx: 0,
              vy: -32,
              life: 1.1,
              maxLife: 1.1,
              color: '#D8B4FE',
              size: 13,
              text: '+1 Đá Thiên Thạch!',
            });
            m.x = W + 30 + Math.random() * 120;
            m.y = 40 + Math.random() * (H - 80);
            onCollectMeteorRef.current?.();
          } else if (m.x < -30) {
            m.x = W + 24;
            m.y = 40 + Math.random() * (H - 80);
          }
        }
      }

      // Random Dimensional Portal spawn outdoors / explore / kingdom
      if (
        curArea !== 'spaceship' &&
        curArea !== 'playground' &&
        !s.inAlienDimension
      ) {
        s.portalTimer -= dt;
        if (s.portalTimer <= 0) {
          if (!s.portalActive) {
            s.portalActive = true;
            s.portalX = s.capyX < 250 ? 450 : 88;
            s.portalTimer = 14;
          } else {
            s.portalActive = false;
            s.portalTimer = 16;
          }
        }
      }

      // Vertical bounce physics
      if (s.capyYOffset < 0 || s.capyVy !== 0) {
        s.capyVy += 1100 * dt;
        s.capyYOffset += s.capyVy * dt;
        if (s.capyYOffset >= 0) {
          s.capyYOffset = 0;
          s.capyVy = 0;
        }
      }

      // Playground targets mini-game
      if (curArea === 'playground' && gameActiveRef.current) {
        s.targetSpawnTimer -= dt;
        if (s.targetSpawnTimer <= 0 && s.targets.length < 5) {
          s.targetSpawnTimer = 0.72;
          s.targets.push({
            id: s.nextTargetId++,
            x: 55 + Math.random() * (W - 110),
            y: H - 45,
            vx: (Math.random() - 0.5) * 90,
            vy: -135 - Math.random() * 85,
            radius: 19,
            golden: Math.random() < 0.28,
          });
        }
        for (let i = s.targets.length - 1; i >= 0; i--) {
          const t = s.targets[i];
          t.x += t.vx * dt;
          t.y += t.vy * dt;
          t.vy += 120 * dt;
          if (t.x < 24 || t.x > W - 24) t.vx = -t.vx;
          if (t.y > H + 30) s.targets.splice(i, 1);
        }
      } else if (s.targets.length > 0) {
        s.targets = [];
      }

      // Ripples & particles
      for (let i = s.ripples.length - 1; i >= 0; i--) {
        const rp = s.ripples[i];
        rp.r += 34 * dt;
        rp.life -= dt * 0.9;
        if (rp.life <= 0) s.ripples.splice(i, 1);
      }
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        if (!pt.text && s.activeActivity !== 'bubble_bath' && s.activeActivity !== 'dive_swim') {
          pt.vy += 140 * dt;
        }
        pt.life -= dt;
        if (pt.life <= 0) s.particles.splice(i, 1);
      }

      // Render Canvas
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      let groundY = 204;
      const isNightBackdrop =
        s.skyProgress >= 0.65 || curArea === 'campsite' || curArea === 'secret_forest' || curArea === 'glowing_forest';
      const activeWeather =
        (curArea === 'winter' || curArea === 'ice_mountain') && weatherRef.current === 'clear'
          ? 'snow'
          : weatherRef.current;

      const drawStarrySkyLayer = (skyHeight: number, topHex: string, botHex: string) => {
        drawSmoothSkyLayer(ctx, W, skyHeight, topHex, botHex, Math.max(s.skyProgress, 0.72), time);
      };

      const renderRainbowIfActive = () => {
        const showRainbow =
          (rainbowPropRef.current || s.rainbowTimer > 0) && activeWeather !== 'rain';
        if (showRainbow) {
          const alpha = rainbowPropRef.current
            ? 0.95
            : Math.min(1, s.rainbowTimer / 3);
          drawRainbowArc(ctx, W * 0.52, groundY - 10, 162, alpha);
        }
      };

      // ================= RENDER SCENE BACKDROP BY LOCATION =================
      if (curArea === 'home') {
        const wallGrad = ctx.createLinearGradient(0, 0, 0, groundY);
        wallGrad.addColorStop(0, '#3C2A21');
        wallGrad.addColorStop(1, '#583E30');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, W, groundY);

        ctx.strokeStyle = 'rgba(24, 15, 10, 0.25)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 48) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, groundY);
          ctx.stroke();
        }

        // Window showing smooth Day -> Sunset -> Starry Night
        ctx.fillStyle =
          s.skyProgress > 0.65
            ? '#0F1B2E'
            : s.skyProgress > 0.25
            ? '#F97316'
            : '#8BC6BA';
        ctx.fillRect(36, 32, 128, 86);
        if (s.skyProgress > 0.65) {
          ctx.fillStyle = '#FEF9C3';
          ctx.beginPath();
          ctx.arc(136, 52, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          for (let st = 0; st < 8; st++) {
            ctx.fillRect(46 + st * 14, 44 + ((st * 19) % 50), 2, 2);
          }
        } else if (s.skyProgress > 0.25) {
          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          ctx.arc(124, 92, 11, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = '#8B5E3C';
        ctx.lineWidth = 5;
        ctx.strokeRect(36, 32, 128, 86);
        ctx.beginPath();
        ctx.moveTo(100, 32);
        ctx.lineTo(100, 118);
        ctx.moveTo(36, 75);
        ctx.lineTo(164, 75);
        ctx.stroke();

        ctx.fillStyle = '#6B4C35';
        ctx.fillRect(0, groundY, W, H - groundY);

        if (homeItemsRef.current.includes('tatami')) {
          ctx.fillStyle = '#97A97C';
          ctx.beginPath();
          ctx.roundRect(120, groundY + 6, 300, 36, 8);
          ctx.fill();
          ctx.strokeStyle = '#586F49';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (homeItemsRef.current.includes('lantern')) {
          const glow = ctx.createRadialGradient(270, 44, 4, 270, 44, 65);
          glow.addColorStop(0, 'rgba(253, 224, 71, 0.36)');
          glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(270, 44, 65, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(270, 0);
          ctx.lineTo(270, 26);
          ctx.stroke();
          ctx.fillStyle = '#FBBF24';
          ctx.beginPath();
          ctx.roundRect(256, 26, 28, 34, 10);
          ctx.fill();
        }

        if (homeItemsRef.current.includes('plush_bed')) {
          ctx.fillStyle = '#1D4ED8';
          ctx.beginPath();
          ctx.roundRect(110, groundY - 22, 110, 26, 10);
          ctx.fill();
          ctx.fillStyle = '#E0F2FE';
          ctx.beginPath();
          ctx.roundRect(116, groundY - 26, 32, 14, 6);
          ctx.fill();
        }

        if (homeItemsRef.current.includes('tea_table')) {
          ctx.fillStyle = '#8B5A2B';
          ctx.fillRect(342, groundY - 24, 86, 8);
          ctx.fillRect(352, groundY - 16, 8, 16);
          ctx.fillRect(410, groundY - 16, 8, 16);
          ctx.fillStyle = '#F97316';
          ctx.beginPath();
          ctx.arc(372, groundY - 30, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#E2E8F0';
          ctx.beginPath();
          ctx.roundRect(394, groundY - 36, 18, 12, 4);
          ctx.fill();
        }

        if (homeItemsRef.current.includes('bonsai')) {
          ctx.fillStyle = '#B45309';
          ctx.fillRect(458, groundY - 22, 34, 22);
          ctx.strokeStyle = '#5C3A21';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(475, groundY - 22);
          ctx.quadraticCurveTo(466, groundY - 46, 480, groundY - 62);
          ctx.stroke();
          ctx.fillStyle = '#15803D';
          ctx.beginPath();
          ctx.arc(482, groundY - 66, 18, 0, Math.PI * 2);
          ctx.arc(466, groundY - 54, 13, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (s.inAlienDimension) {
        groundY = 204;
        drawAlienDimensionBackdrop(ctx, W, H, groundY, time, discoveredRef.current);
        drawDimensionalPortal(ctx, 72, groundY - 26, time, true);
      } else if (curArea === 'spaceship') {
        drawSpaceshipScene(
          ctx,
          W,
          H,
          time,
          s.shipX,
          s.shipY,
          s.shipTilt,
          s.meteors,
          s.alienX,
          s.alienY,
          s.alienGreetTimer,
          appearanceRef.current,
          potionHueRef.current,
          balloonsRef.current
        );
      } else if (curArea === 'kingdom') {
        groundY = 204;
        const k = kingdomRef.current;
        const festivalActive = Boolean(k && k.activeFestivalUntil > Date.now());
        const festMeta = KINGDOM_FESTIVALS.find((f) => f.id === k?.activeFestivalId);
        drawKingdomBackdrop(
          ctx,
          W,
          H,
          groundY,
          time,
          s.skyProgress,
          k?.castleLevel ?? 0,
          k?.citizens ?? [],
          festivalActive,
          festMeta?.accentColor ?? '#FBBF24'
        );
        renderRainbowIfActive();
      } else if (curArea === 'glowing_forest') {
        groundY = 204;
        drawGlowingForestBackdrop(ctx, W, H, groundY, time, s.skyProgress);
        renderRainbowIfActive();
      } else if (curArea === 'ice_mountain') {
        groundY = 204;
        drawIceMountainBackdrop(ctx, W, H, groundY, time, s.skyProgress);
        renderRainbowIfActive();
      } else if (curArea === 'ocean') {
        groundY = 204;
        drawOceanBackdrop(ctx, W, H, groundY, time);
      } else if (curArea === 'candy_planet') {
        groundY = 204;
        drawCandyPlanetBackdrop(ctx, W, H, groundY, time, s.skyProgress);
        renderRainbowIfActive();
      } else if (curArea === 'pool') {
        groundY = 188;
        drawSmoothSkyLayer(ctx, W, 140, '#5FA89C', '#C9E8DE', s.skyProgress, time);
        renderRainbowIfActive();
        if (trainEnabledRef.current) {
          drawHorizonTrain(ctx, W, 118, time, s.skyProgress);
        }

        ctx.fillStyle = '#8E6D4E';
        ctx.fillRect(0, 128, W, 24);
        ctx.fillStyle = '#D6C7B2';
        ctx.fillRect(0, 146, W, 22);

        const pool = ctx.createLinearGradient(0, 168, 0, H);
        pool.addColorStop(0, '#22B8CF');
        pool.addColorStop(1, '#0B7285');
        ctx.fillStyle = pool;
        ctx.fillRect(0, 168, W, H - 168);

        const bob = Math.sin(time * 2.5) * 3;
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.ellipse(435, 196 + bob, 14, 9, 0, 0, Math.PI * 2);
        ctx.arc(444, 186 + bob, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.arc(92, 206 - bob, 8, 0, Math.PI * 2);
        ctx.fill();

        for (const rp of s.ripples) {
          ctx.strokeStyle = `rgba(224, 247, 250, ${Math.max(0, rp.life * 0.7)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(rp.x, rp.y, rp.r * 1.5, rp.r * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (curArea === 'forest') {
        groundY = 204;
        drawSmoothSkyLayer(ctx, W, groundY, '#3D7A66', '#A7D7C5', s.skyProgress, time);
        renderRainbowIfActive();
        if (trainEnabledRef.current) {
          drawHorizonTrain(ctx, W, 148, time, s.skyProgress);
        }

        if (s.skyProgress < 0.45) {
          ctx.fillStyle = 'rgba(254, 249, 195, 0.12)';
          ctx.beginPath();
          ctx.moveTo(80, 0);
          ctx.lineTo(175, 0);
          ctx.lineTo(270, groundY);
          ctx.lineTo(130, groundY);
          ctx.closePath();
          ctx.fill();
        }

        for (let i = 0; i < 6; i++) {
          const bx = 42 + i * 92;
          ctx.fillStyle = i % 2 === 0 ? '#2F6F4E' : '#3E885B';
          ctx.fillRect(bx, 18, 12, groundY - 18);
          ctx.fillStyle = '#4ADE80';
          ctx.beginPath();
          ctx.ellipse(bx + 18, 52 + (i % 2) * 20, 18, 6, -0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        for (const bx of [84, 385, 470]) {
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.arc(bx, groundY - 10, 26, Math.PI, 0);
          ctx.arc(bx + 22, groundY - 8, 20, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#FB923C';
          ctx.beginPath();
          ctx.arc(bx + 6, groundY - 18, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#3F7D4C';
        ctx.fillRect(0, groundY, W, 12);
        ctx.fillStyle = '#5C4330';
        ctx.fillRect(0, groundY + 12, W, H - groundY - 12);
      } else if (curArea === 'playground') {
        groundY = 206;
        drawSmoothSkyLayer(ctx, W, groundY, '#59A5D8', '#DDF2EB', s.skyProgress, time);
        renderRainbowIfActive();
        if (trainEnabledRef.current) {
          drawHorizonTrain(ctx, W, 152, time, s.skyProgress);
        }

        ctx.fillStyle = '#4D9B56';
        ctx.fillRect(0, groundY, W, H - groundY);

        ctx.fillStyle = '#1E293B';
        ctx.fillRect(214, groundY - 10, 108, 10);
        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.roundRect(222, groundY - 15, 92, 7, 4);
        ctx.fill();

        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(64, groundY - 62);
        ctx.quadraticCurveTo(96, groundY - 24, 134, groundY - 4);
        ctx.stroke();
      } else if (curArea === 'city') {
        groundY = 204;
        drawSmoothSkyLayer(ctx, W, groundY, '#38BDF8', '#E0F2FE', s.skyProgress, time);
        renderRainbowIfActive();

        // City buildings silhouette
        const bldgs = [
          { x: 18, w: 58, h: 120, c: '#334155' },
          { x: 84, w: 48, h: 148, c: '#475569' },
          { x: 142, w: 64, h: 105, c: '#3B4D63' },
          { x: 325, w: 58, h: 138, c: '#334155' },
          { x: 392, w: 68, h: 112, c: '#475569' },
          { x: 468, w: 56, h: 144, c: '#1E293B' },
        ];
        for (const b of bldgs) {
          ctx.fillStyle = b.c;
          ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
          ctx.fillStyle = s.skyProgress >= 0.55 ? '#FDE047' : 'rgba(224, 242, 254, 0.55)';
          for (let wy = groundY - b.h + 12; wy < groundY - 22; wy += 18) {
            for (let wx = b.x + 9; wx < b.x + b.w - 12; wx += 15) {
              ctx.fillRect(wx, wy, 7, 9);
            }
          }
        }
        if (trainEnabledRef.current) {
          drawHorizonTrain(ctx, W, groundY - 46, time, s.skyProgress);
        }

        // Streetlamps
        for (const lx of [125, 365]) {
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(lx, groundY - 76, 4, 76);
          ctx.fillStyle = '#FACC15';
          ctx.beginPath();
          ctx.arc(lx + 2, groundY - 78, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Asphalt street + crosswalk stripes
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, groundY, W, H - groundY);
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(0, groundY, W, 5);
        ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
        for (let cx = 42; cx < W; cx += 64) {
          ctx.fillRect(cx, groundY + 22, 32, 7);
        }
      } else if (curArea === 'beach') {
        groundY = 200;
        drawSmoothSkyLayer(ctx, W, groundY, '#0EA5E9', '#BAE6FD', s.skyProgress, time);
        renderRainbowIfActive();

        // Ocean horizon strip
        const ocean = ctx.createLinearGradient(0, 145, 0, groundY);
        ocean.addColorStop(0, '#0284C7');
        ocean.addColorStop(1, '#22D3EE');
        ctx.fillStyle = ocean;
        ctx.fillRect(0, 145, W, groundY - 145);

        if (trainEnabledRef.current) {
          drawHorizonTrain(ctx, W, 134, time, starryRef.current ? 0.8 : 0);
        }

        // Animated ocean wave crest
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let wx = 0; wx < W; wx += 48) {
          ctx.beginPath();
          ctx.ellipse(wx + 24, groundY - 2 + Math.sin(time * 2.6 + wx) * 2.5, 26, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Palm tree on left
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(58, groundY + 4);
        ctx.quadraticCurveTo(48, 128, 72, 72);
        ctx.stroke();
        ctx.fillStyle = '#16A34A';
        for (let f = -2; f <= 2; f++) {
          ctx.beginPath();
          ctx.ellipse(72 + f * 15, 72 + Math.abs(f) * 6, 22, 6, f * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }

        // Beach umbrella on right
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(430, groundY + 2);
        ctx.lineTo(430, 122);
        ctx.stroke();
        ctx.fillStyle = '#F43F5E';
        ctx.beginPath();
        ctx.arc(430, 128, 36, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#FEF9C3';
        ctx.beginPath();
        ctx.arc(430, 128, 36, Math.PI * 1.25, Math.PI * 1.75);
        ctx.lineTo(430, 128);
        ctx.closePath();
        ctx.fill();

        // Golden Sand beach
        ctx.fillStyle = '#FDE68A';
        ctx.fillRect(0, groundY, W, H - groundY);

        // Little scuttling crab
        const crabX = 355 + Math.sin(time * 1.6) * 26;
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.ellipse(crabX, groundY + 26, 9, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(crabX - 10, groundY + 28, 3, 4);
        ctx.fillRect(crabX + 7, groundY + 28, 3, 4);
      } else if (curArea === 'volcano') {
        groundY = 204;
        if (starryRef.current) {
          drawStarrySkyLayer(groundY, '#1C0D12', '#5B1F1B');
        } else {
          const sky = ctx.createLinearGradient(0, 0, 0, groundY);
          sky.addColorStop(0, '#581C1C');
          sky.addColorStop(1, '#F59E6C');
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, W, groundY);
        }
        renderRainbowIfActive();

        // Main Volcano Peak
        const vx = 375;
        ctx.fillStyle = '#3B2322';
        ctx.beginPath();
        ctx.moveTo(vx - 150, groundY);
        ctx.lineTo(vx - 34, 62);
        ctx.lineTo(vx + 34, 62);
        ctx.lineTo(vx + 150, groundY);
        ctx.closePath();
        ctx.fill();

        // Lava glow & magma stream down mountain
        const craterGlow = ctx.createRadialGradient(vx, 62, 6, vx, 62, 70);
        craterGlow.addColorStop(0, 'rgba(251, 146, 60, 0.85)');
        craterGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = craterGlow;
        ctx.beginPath();
        ctx.arc(vx, 62, 70, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.moveTo(vx - 18, 62);
        ctx.quadraticCurveTo(vx - 28, 128, vx - 46, groundY);
        ctx.lineTo(vx - 26, groundY);
        ctx.quadraticCurveTo(vx - 8, 130, vx + 8, 62);
        ctx.closePath();
        ctx.fill();

        // Smoke & embers
        for (let e = 0; e < 6; e++) {
          const p = (time * 0.45 + e * 0.16) % 1;
          ctx.fillStyle =
            e % 2 === 0
              ? `rgba(203, 213, 225, ${(1 - p) * 0.4})`
              : `rgba(251, 191, 36, ${(1 - p) * 0.85})`;
          ctx.beginPath();
          ctx.arc(
            vx + Math.sin(time * 2 + e) * 18,
            54 - p * 54,
            e % 2 === 0 ? 8 + p * 12 : 2.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        if (trainEnabledRef.current) {
          drawHorizonTrain(ctx, W, groundY - 22, time, 0.4);
        }

        // Basalt rock ground & glowing lava stream below
        ctx.fillStyle = '#443330';
        ctx.fillRect(0, groundY, W, 24);
        const lavaFloor = ctx.createLinearGradient(0, groundY + 24, 0, H);
        lavaFloor.addColorStop(0, '#EA580C');
        lavaFloor.addColorStop(1, '#9A3412');
        ctx.fillStyle = lavaFloor;
        ctx.fillRect(0, groundY + 24, W, H - groundY - 24);
      } else if (curArea === 'secret_forest') {
        groundY = 204;
        drawStarrySkyLayer(groundY, '#0B242B', '#174E4F');
        renderRainbowIfActive();
        if (trainEnabledRef.current) {
          drawHorizonTrain(ctx, W, 146, time, 0.85);
        }

        // Mystical sunbeam / moonbeams
        ctx.fillStyle = 'rgba(94, 234, 212, 0.08)';
        ctx.beginPath();
        ctx.moveTo(140, 0);
        ctx.lineTo(220, 0);
        ctx.lineTo(310, groundY);
        ctx.lineTo(175, groundY);
        ctx.closePath();
        ctx.fill();

        // Ancient trees & glowing cyan mushrooms
        for (const tx of [48, 150, 390, 488]) {
          ctx.fillStyle = '#113A36';
          ctx.fillRect(tx, 10, 22, groundY - 10);
          ctx.fillStyle = '#0F766E';
          ctx.beginPath();
          ctx.arc(tx + 11, 24, 34, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const mx of [75, 165, 368, 455]) {
          const mg = ctx.createRadialGradient(mx, groundY - 8, 2, mx, groundY - 8, 20);
          mg.addColorStop(0, 'rgba(45, 212, 191, 0.55)');
          mg.addColorStop(1, 'rgba(45, 212, 191, 0)');
          ctx.fillStyle = mg;
          ctx.beginPath();
          ctx.arc(mx, groundY - 8, 20, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(mx - 2, groundY - 10, 4, 10);
          ctx.fillStyle = '#2DD4BF';
          ctx.beginPath();
          ctx.arc(mx, groundY - 10, 10, Math.PI, 0);
          ctx.fill();
        }

        // Blue fireflies
        for (let f = 0; f < 10; f++) {
          const fx = ((f * 61 + time * 16) % (W - 20)) + 10;
          const fy = 65 + Math.sin(time * 2 + f) * 45 + (f % 3) * 20;
          ctx.fillStyle = `rgba(103, 232, 249, ${(0.45 + 0.5 * Math.sin(time * 4 + f)).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(fx, fy, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#145345';
        ctx.fillRect(0, groundY, W, 12);
        ctx.fillStyle = '#273832';
        ctx.fillRect(0, groundY + 12, W, H - groundY - 12);
      } else if (curArea === 'campsite') {
        groundY = 204;
        drawStarrySkyLayer(groundY, '#0C1729', '#1D3549');
        renderRainbowIfActive();
        if (trainEnabledRef.current) {
          drawHorizonTrain(ctx, W, 148, time, 0.9);
        }

        // Pine silhouette behind camp
        ctx.fillStyle = '#14312B';
        for (let p = 0; p < 7; p++) {
          const px = 32 + p * 84;
          ctx.beginPath();
          ctx.moveTo(px, groundY - 72);
          ctx.lineTo(px - 26, groundY);
          ctx.lineTo(px + 26, groundY);
          ctx.closePath();
          ctx.fill();
        }

        // Cozy A-frame Tent
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.moveTo(118, groundY - 68);
        ctx.lineTo(54, groundY);
        ctx.lineTo(182, groundY);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#431407';
        ctx.beginPath();
        ctx.moveTo(118, groundY - 46);
        ctx.lineTo(94, groundY);
        ctx.lineTo(142, groundY);
        ctx.closePath();
        ctx.fill();

        // Warm Crackling Campfire on right
        const fx = 415;
        const fireGlow = ctx.createRadialGradient(fx, groundY - 14, 4, fx, groundY - 14, 64);
        fireGlow.addColorStop(0, 'rgba(251, 146, 60, 0.45)');
        fireGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = fireGlow;
        ctx.beginPath();
        ctx.arc(fx, groundY - 14, 64, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#78350F';
        ctx.fillRect(fx - 16, groundY - 6, 32, 6);
        const flicker = Math.sin(time * 14) * 3;
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(fx - 12, groundY - 4);
        ctx.quadraticCurveTo(fx, groundY - 38 + flicker, fx + 12, groundY - 4);
        ctx.fill();
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.moveTo(fx - 6, groundY - 4);
        ctx.quadraticCurveTo(fx, groundY - 25 - flicker, fx + 6, groundY - 4);
        ctx.fill();

        ctx.fillStyle = '#2B4C38';
        ctx.fillRect(0, groundY, W, H - groundY);
      } else if (curArea === 'winter') {
        groundY = 204;
        if (starryRef.current) {
          drawStarrySkyLayer(groundY, '#122238', '#2C4B6E');
        } else {
          const sky = ctx.createLinearGradient(0, 0, 0, groundY);
          sky.addColorStop(0, '#4B799B');
          sky.addColorStop(1, '#E0F2FE');
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, W, groundY);
        }
        renderRainbowIfActive();
        if (trainEnabledRef.current) {
          drawHorizonTrain(ctx, W, 150, time, starryRef.current ? 0.7 : 0);
        }

        // Snowy pine trees
        for (const px of [62, 130, 405, 478]) {
          ctx.fillStyle = '#1E463B';
          ctx.beginPath();
          ctx.moveTo(px, groundY - 82);
          ctx.lineTo(px - 24, groundY);
          ctx.lineTo(px + 24, groundY);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#F1F5F9';
          ctx.beginPath();
          ctx.moveTo(px, groundY - 82);
          ctx.lineTo(px - 11, groundY - 48);
          ctx.lineTo(px + 11, groundY - 48);
          ctx.closePath();
          ctx.fill();
        }

        // Cute Snowman on right
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(442, groundY - 16, 17, 0, Math.PI * 2);
        ctx.arc(442, groundY - 38, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(432, groundY - 30, 20, 4);
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.moveTo(442, groundY - 38);
        ctx.lineTo(452, groundY - 36);
        ctx.lineTo(442, groundY - 34);
        ctx.fill();

        ctx.fillStyle = '#E2EEF4';
        ctx.fillRect(0, groundY, W, 18);
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(0, groundY + 18, W, H - groundY - 18);
      } else {
        // Amusement Park
        groundY = 204;
        if (starryRef.current) {
          drawStarrySkyLayer(groundY, '#141B38', '#2E3A66');
        } else {
          const sky = ctx.createLinearGradient(0, 0, 0, groundY);
          sky.addColorStop(0, '#4C9ED9');
          sky.addColorStop(1, '#FCE7F3');
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, W, groundY);
        }
        renderRainbowIfActive();

        // Spinning Giant Ferris Wheel
        const fx = 390;
        const fy = 104;
        const fr = 72;
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(fx - 34, groundY);
        ctx.lineTo(fx, fy);
        ctx.lineTo(fx + 34, groundY);
        ctx.stroke();

        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.stroke();

        const gondolaColors = ['#F43F5E', '#F59E0B', '#10B981', '#38BDF8', '#A855F7', '#FACC15'];
        for (let i = 0; i < 8; i++) {
          const ang = time * 0.45 + (i * Math.PI * 2) / 8;
          const gx = fx + Math.cos(ang) * fr;
          const gy = fy + Math.sin(ang) * fr;
          ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(gx, gy);
          ctx.stroke();
          ctx.fillStyle = gondolaColors[i % gondolaColors.length];
          ctx.beginPath();
          ctx.roundRect(gx - 6, gy - 5, 12, 11, 3);
          ctx.fill();
        }

        // Bunting flags across top left
        const flagCols = ['#F43F5E', '#FBBF24', '#34D399', '#38BDF8', '#F472B6'];
        for (let i = 0; i < 9; i++) {
          const flx = 24 + i * 28;
          ctx.fillStyle = flagCols[i % flagCols.length];
          ctx.beginPath();
          ctx.moveTo(flx, 12);
          ctx.lineTo(flx + 18, 12);
          ctx.lineTo(flx + 9, 26);
          ctx.closePath();
          ctx.fill();
        }

        if (trainEnabledRef.current) {
          drawHorizonTrain(ctx, W, groundY - 22, time, starryRef.current ? 0.8 : 0);
        }

        // Festive park lawn & cobblestone path
        ctx.fillStyle = '#4ADE80';
        ctx.fillRect(0, groundY, W, 10);
        ctx.fillStyle = '#8B6247';
        ctx.fillRect(0, groundY + 10, W, H - groundY - 10);
      }

      // Shimmering rain puddles on ground outdoors during rain
      if (curArea !== 'home' && activeWeather === 'rain') {
        for (let i = 0; i < 4; i++) {
          const px = 75 + i * 125;
          const py = groundY + 14 + (i % 2) * 5;
          ctx.fillStyle = 'rgba(125, 211, 252, 0.42)';
          ctx.beginPath();
          ctx.ellipse(px, py, 22, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();

          const ph = (time * 2.1 + i * 0.35) % 1;
          ctx.strokeStyle = `rgba(224, 242, 254, ${(1 - ph) * 0.7})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(px, py, 8 + ph * 14, 1.5 + ph * 2.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ================= ACTIVITY PROPS BEHIND CAPYBARA =================
      const cx = s.capyX + 33;

      if (s.activeActivity === 'dance') {
        // Disco spotlights
        for (let l = 0; l < 2; l++) {
          const swing = Math.sin(time * 4 + l * 2) * 35;
          const beam = ctx.createLinearGradient(cx, 0, cx + swing, groundY);
          beam.addColorStop(0, l === 0 ? 'rgba(244, 114, 182, 0.35)' : 'rgba(56, 189, 248, 0.35)');
          beam.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(cx - 8 + l * 16, 0);
          ctx.lineTo(cx + 52 + swing, groundY);
          ctx.lineTo(cx - 52 + swing, groundY);
          ctx.closePath();
          ctx.fill();
        }
      }

      if (s.activeActivity === 'arcade_game') {
        // Glowing retro arcade cabinet beside Capybara
        const ax = s.capyX + 76;
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.roundRect(ax, groundY - 76, 40, 76, [6, 6, 2, 2]);
        ctx.fill();
        ctx.fillStyle = '#EC4899';
        ctx.fillRect(ax + 3, groundY - 73, 34, 11);
        // Animated pixel screen
        ctx.fillStyle = Math.floor(time * 6) % 2 === 0 ? '#22C55E' : '#38BDF8';
        ctx.fillRect(ax + 6, groundY - 56, 28, 22);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(ax + 12 + Math.sin(time * 8) * 6, groundY - 46, 5, 5);
        // Joystick
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(ax + 10, groundY - 30, 4, 6);
      }

      if (s.activeActivity === 'balloon') {
        const bCols = ['#F43F5E', '#38BDF8', '#FACC15'];
        for (let b = 0; b < 3; b++) {
          const bx = cx - 22 + b * 24 + Math.sin(time * 3 + b) * 6;
          const by = 92 + Math.cos(time * 3.5 + b) * 8 + s.capyYOffset * 0.4;
          ctx.strokeStyle = 'rgba(255,255,255,0.65)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(bx, by + 14);
          ctx.lineTo(cx, groundY - 26 + s.capyYOffset);
          ctx.stroke();
          ctx.fillStyle = bCols[b];
          ctx.beginPath();
          ctx.ellipse(bx, by, 11, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath();
          ctx.arc(bx - 3, by - 5, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ================= ENVIRONMENTAL ZONES, PIER, FRUITS & DUCK/BIRD NPCs =================
      // Wooden Fishing Pier in Pool & Beach
      if (curArea === 'pool' || curArea === 'beach') {
        const pierX = 338;
        const pierY = groundY - 6;
        ctx.fillStyle = '#78350F';
        ctx.fillRect(pierX + 12, pierY + 6, 7, 26);
        ctx.fillRect(pierX + 76, pierY + 6, 7, 26);
        ctx.fillStyle = '#B45309';
        ctx.beginPath();
        ctx.roundRect(pierX, pierY, 96, 9, 3);
        ctx.fill();
        // Pier sign post
        ctx.fillStyle = '#92400E';
        ctx.fillRect(pierX + 82, pierY - 24, 4, 24);
        ctx.fillStyle = '#FDE68A';
        ctx.beginPath();
        ctx.roundRect(pierX + 68, pierY - 36, 36, 13, 3);
        ctx.fill();
        ctx.fillStyle = '#451A03';
        ctx.font = '700 8px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CÂU CÁ', pierX + 86, pierY - 27);
      }

      // Lush Green Grass Patch & Cool Tree Shade Zone outdoors (non-home, non-pool)
      if (curArea !== 'home' && curArea !== 'pool' && curArea !== 'volcano') {
        // Fresh edible grass tuft around x = 152..192
        for (let b = 0; b < 7; b++) {
          const gx = 148 + b * 6;
          const sway = Math.sin(time * 3.5 + b) * 1.5;
          ctx.strokeStyle = b % 2 === 0 ? '#22C55E' : '#4ADE80';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(gx, groundY + 2);
          ctx.quadraticCurveTo(gx + sway, groundY - 9, gx + sway * 1.8, groundY - 14 - (b % 3) * 3);
          ctx.stroke();
        }
        // Cool Dappled Shade Spot around x = 408..460
        ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
        ctx.beginPath();
        ctx.ellipse(432, groundY + 6, 44, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Night Secrets (Bioluminescent creatures, Guiding firefly, Friendly Ghost Village, Midnight Chest)
      if (
        curArea !== 'home' &&
        curArea !== 'spaceship' &&
        !s.inAlienDimension &&
        s.skyProgress >= 0.65
      ) {
        drawNightSecretsLayer(
          ctx,
          W,
          groundY,
          time,
          s.skyProgress,
          s.capyX,
          chestClaimedRef.current
        );
      }

      // Random Dimensional Portal in World
      if (s.portalActive && !s.inAlienDimension && curArea !== 'spaceship') {
        drawDimensionalPortal(ctx, s.portalX, groundY - 26, time, false);
      }

      // Collectible Side Quest Fruits & Wandering Duck + Songbird (outside home/spaceship/kingdom/dimension)
      if (
        curArea !== 'home' &&
        curArea !== 'spaceship' &&
        curArea !== 'kingdom' &&
        !s.inAlienDimension
      ) {
        for (const fruit of s.fruits) {
          if (fruit.respawnTimer > 0) continue;
          const bob = Math.sin(time * 4 + fruit.id) * 3;
          const fy = groundY - 12 + bob;
          if (fruit.kind === 'golden_yuzu') {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
            ctx.beginPath();
            ctx.arc(fruit.x, fy, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FBBF24';
            ctx.beginPath();
            ctx.arc(fruit.x, fy, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#16A34A';
            ctx.beginPath();
            ctx.ellipse(fruit.x + 2, fy - 8, 4, 2, -0.4, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = '#16A34A';
            ctx.beginPath();
            ctx.arc(fruit.x, fy, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FB7185';
            ctx.beginPath();
            ctx.arc(fruit.x, fy, 6.5, 0.2, Math.PI - 0.2);
            ctx.fill();
          }
        }

        // Friendly Duck NPC (Vịt Suối)
        {
          const dx = s.duckNpc.x;
          const dy = curArea === 'pool' ? 194 + Math.sin(time * 3.5) * 2.5 : groundY;
          const df = s.duckNpc.dir;
          ctx.save();
          ctx.translate(dx, dy);
          ctx.scale(df, 1);
          ctx.fillStyle = '#FACC15';
          ctx.beginPath();
          ctx.ellipse(0, -8, 11, 8, 0, 0, Math.PI * 2);
          ctx.arc(7, -16, 6.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#F97316';
          ctx.beginPath();
          ctx.ellipse(14, -15, 4.5, 2.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.arc(9, -17, 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          if (s.duckNpc.friendSparkTimer > 0) {
            ctx.fillStyle = '#FDA4AF';
            ctx.font = '700 12px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('♥ Bạn mới!', dx, dy - 26);
          }
        }

        // Friendly Songbird NPC (Chim Sơn Ca)
        {
          const bx = s.birdNpc.x;
          const by = groundY - Math.abs(Math.sin(time * 5)) * 12 - 2;
          const bf = s.birdNpc.dir;
          ctx.save();
          ctx.translate(bx, by);
          ctx.scale(bf, 1);
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.ellipse(0, -7, 8.5, 6.5, 0, 0, Math.PI * 2);
          ctx.arc(5, -13, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          ctx.moveTo(9, -13);
          ctx.lineTo(13, -12);
          ctx.lineTo(9, -11);
          ctx.fill();
          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.arc(6.5, -14, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          if (s.birdNpc.friendSparkTimer > 0) {
            ctx.fillStyle = '#BAE6FD';
            ctx.font = '700 12px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('♪ Bạn mới!', bx, by - 22);
          }
        }
      }

      // ================= PET & CAPYBARA =================
      if (curArea !== 'spaceship') {
        if (petIdRef.current !== 'none') {
          const petY =
            curArea === 'pool'
              ? 190 + Math.sin(time * 3.4) * 3
              : groundY - (curArea === 'playground' ? 12 : 0);
          const petHopSpeed =
            petIdRef.current === 'duckling'
              ? 10.5
              : petIdRef.current === 'shiba'
              ? 9.2
              : petIdRef.current === 'turtle'
              ? 5.5
              : 7.5;
          drawPet(
            ctx,
            {
              id: petIdRef.current,
              x: s.petX,
              y: petY,
              facing: s.facing,
              hopPhase: time * petHopSpeed,
              jumpOffset: s.petJumpY,
              isExcited: s.petExcitedTimer > 0,
              isMoving:
                Math.abs(targetPetX - s.petX) > 3 ||
                Math.abs(s.capyTargetX - s.capyX) > 4 ||
                manualDir !== 0 ||
                curArea === 'pool',
            },
            time
          );
        }

        let capyBaseY =
          curArea === 'pool'
            ? 144 + Math.sin(time * 3) * 3 + s.capyYOffset
            : groundY - (curArea === 'playground' ? 62 : 50) + s.capyYOffset;

        if (s.activeActivity === 'skateboard') {
          capyBaseY -= 11;
        } else if (s.activeActivity === 'dive_swim') {
          capyBaseY = 172 + Math.sin(time * 4) * 6;
        } else if (s.activeActivity === 'bubble_bath') {
          capyBaseY = groundY - 62 + Math.sin(time * 2.5) * 1.5;
        } else if (s.activeEnvAction === 'swim_water') {
          capyBaseY = (curArea === 'pool' ? 150 : groundY - 34) + Math.sin(time * 4) * 3;
        } else if (s.activeEnvAction === 'chew_grass') {
          capyBaseY += 4 + Math.sin(time * 14) * 2;
        }

        const isCapyMoving =
          s.activeActivity === 'dance' ||
          Math.abs(s.capyTargetX - s.capyX) > 4 ||
          curArea === 'pool' ||
          manualDir !== 0 ||
          s.activeEnvAction === 'swim_water';

        if (isMounted) {
          const saddleOffset = getMountSaddleOffset(activeMount);
          drawMount(
            ctx,
            activeMount,
            s.capyX + 33,
            groundY + s.capyYOffset,
            s.facing,
            isCapyMoving ? time * 9.5 : 0,
            isCapyMoving,
            time
          );
          capyBaseY -= saddleOffset;
        }

        const danceSway =
          s.activeActivity === 'dance' ? Math.sin(time * 10) * 0.1 : 0;

        ctx.save();
        if (danceSway !== 0) {
          ctx.translate(cx, capyBaseY + 25);
          ctx.rotate(danceSway);
          ctx.translate(-cx, -(capyBaseY + 25));
        }

        drawCapybara(
          ctx,
          {
            x: s.capyX,
            y: capyBaseY,
            width: 66,
            height: 50,
            vy: s.capyVy,
            facing: s.facing,
            isGrounded: s.capyYOffset >= 0,
            isDucking: s.sleepTimer > 0 || s.activeEnvAction === 'chew_grass',
            scaleX: 1,
            scaleY: 1,
            invulnTimer: 0,
            hasShield: false,
            magnetTimer: 0,
            feverActive: false,
            yuzuStackCount: curArea === 'home' ? 1 : 2,
            appearance: appearanceRef.current,
            runCycle: isMounted
              ? 0
              : s.activeActivity === 'dance'
              ? time * 14
              : isCapyMoving
              ? time * 9
              : 0,
            isMoving: isMounted ? false : isCapyMoving,
            blinkTimer: s.sleepTimer > 0 ? 1 : blinkTimer,
            photoPose: s.activeActivity === 'selfie' ? 'happy' : undefined,
            potionHue: potionHueRef.current,
            glowingFoodActive: glowingFoodRef.current,
            balloonsActive: balloonsRef.current,
          },
          time
        );
        ctx.restore();
      }
      const capyBaseY =
        curArea === 'pool'
          ? 144 + Math.sin(time * 3) * 3 + s.capyYOffset
          : groundY - (curArea === 'playground' ? 62 : 50) + s.capyYOffset;

      // Animated Fishing Rod + Bobber when fishing
      if (s.fishingState === 'casting') {
        const rodStartX = s.capyX + 54;
        const rodStartY = capyBaseY + 22;
        const rodTipX = rodStartX + 34;
        const rodTipY = rodStartY - 26;
        ctx.strokeStyle = '#92400E';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rodStartX, rodStartY);
        ctx.lineTo(rodTipX, rodTipY);
        ctx.stroke();

        const lureY = groundY + 18 + Math.sin(time * 8) * 3;
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(rodTipX, rodTipY);
        ctx.lineTo(rodTipX + 8, lureY);
        ctx.stroke();

        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(rodTipX + 8, lureY, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ================= FOREGROUND ACTIVITY OVERLAYS =================
      if (s.activeActivity === 'skateboard') {
        // Skateboard deck & spinning wheels right under paws
        const sx = s.capyX + 4;
        const sy = capyBaseY + 49;
        ctx.fillStyle = '#0EA5E9';
        ctx.beginPath();
        ctx.roundRect(sx, sy, 60, 7, 4);
        ctx.fill();
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(sx + 8, sy + 2, 44, 2);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(sx + 13, sy + 9, 4.5, 0, Math.PI * 2);
        ctx.arc(sx + 47, sy + 9, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.activeActivity === 'bubble_bath') {
        // Porcelain clawfoot tub + foamy soap bubbles in front
        const tx = s.capyX - 18;
        const ty = groundY - 34;
        ctx.fillStyle = '#E0F2FE';
        for (let b = 0; b < 7; b++) {
          ctx.beginPath();
          ctx.arc(tx + 12 + b * 13, ty + Math.sin(time * 4 + b) * 2, 9, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.roundRect(tx, ty, 102, 32, [4, 4, 18, 18]);
        ctx.fill();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(tx + 12, ty + 32, 6, 4);
        ctx.fillRect(tx + 84, ty + 32, 6, 4);
      } else if (s.activeActivity === 'eat_watermelon') {
        // Watermelon slice held near Capybara mouth with chewing bob
        const chew = Math.sin(time * 16) * 3;
        const wx = s.capyX + (s.facing > 0 ? 54 : 10);
        const wy = capyBaseY + 28 + chew;
        ctx.fillStyle = '#16A34A';
        ctx.beginPath();
        ctx.arc(wx, wy, 12, 0.2, Math.PI - 0.2);
        ctx.fill();
        ctx.fillStyle = '#FB7185';
        ctx.beginPath();
        ctx.arc(wx, wy, 9.5, 0.2, Math.PI - 0.2);
        ctx.fill();
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(wx - 4, wy + 3, 2, 2);
        ctx.fillRect(wx + 2, wy + 4, 2, 2);
      } else if (s.activeActivity === 'sleep_teddy') {
        // Cute brown teddy bear nestled beside Capybara
        const bx = s.capyX + 46;
        const by = capyBaseY + 34;
        ctx.fillStyle = '#92400E';
        ctx.beginPath();
        ctx.arc(bx, by, 10, 0, Math.PI * 2);
        ctx.arc(bx + 2, by - 11, 8, 0, Math.PI * 2);
        ctx.arc(bx - 4, by - 17, 3.5, 0, Math.PI * 2);
        ctx.arc(bx + 8, by - 17, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FDE68A';
        ctx.beginPath();
        ctx.arc(bx + 2, by - 9, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.activeActivity === 'selfie') {
        // Mini selfie stick & camera
        const sx = s.capyX + 58;
        const sy = capyBaseY + 26;
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 18, sy - 22);
        ctx.stroke();
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(sx + 12, sy - 30, 14, 10, 3);
        ctx.fill();
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(sx + 19, sy - 25, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.activeActivity === 'dive_swim') {
        // Translucent diving water tank overlay with little fish
        ctx.fillStyle = 'rgba(14, 165, 233, 0.38)';
        ctx.fillRect(0, 164, W, H - 164);
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 164);
        for (let wx = 0; wx <= W; wx += 20) {
          ctx.lineTo(wx, 164 + Math.sin(time * 4 + wx * 0.05) * 3);
        }
        ctx.stroke();
        // Little swimming orange fish
        const fishX = ((time * 55) % (W + 40)) - 20;
        ctx.fillStyle = '#FB923C';
        ctx.beginPath();
        ctx.ellipse(fishX, 224, 8, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(fishX - 7, 224);
        ctx.lineTo(fishX - 13, 219);
        ctx.lineTo(fishX - 13, 229);
        ctx.closePath();
        ctx.fill();
      }

      // Pool water foreground wave overlay
      if (curArea === 'pool' && s.activeActivity !== 'dive_swim') {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
        ctx.fillRect(0, 184, W, H - 184);
      }

      // Playground interactive targets
      for (const t of s.targets) {
        ctx.save();
        ctx.fillStyle = t.golden ? '#FBBF24' : '#FB923C';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FEF3C7';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#16A34A';
        ctx.beginPath();
        ctx.ellipse(t.x + 3, t.y - t.radius + 1, 6, 3, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Weather overlay outdoors
      if (curArea !== 'home' && curArea !== 'spaceship' && !s.inAlienDimension) {
        stepAndRenderWeather(ctx, weatherParticles, activeWeather, W, H, groundY, dt, time);
      }

      // Scene particles & floating labels
      for (const pt of s.particles) {
        const alpha = Math.max(0, pt.life / pt.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pt.color;
        if (pt.text) {
          ctx.font = '700 13px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(pt.text, pt.x, pt.y);
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Camera flash overlay for Selfie
      if (s.flashAlpha > 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.flashAlpha.toFixed(2)})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Subtle atmospheric phase badge (Sunset / Night / Alien Dimension)
      if (s.inAlienDimension) {
        ctx.fillStyle = 'rgba(59, 7, 100, 0.72)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 132, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#F5D0FE';
        ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Dị Giới Huyền Bí', 18, 24);
      } else if (curArea !== 'home' && curArea !== 'spaceship' && s.skyProgress > 0.2) {
        const label =
          s.skyProgress >= 0.84
            ? 'Nửa đêm · Kho báu'
            : s.skyProgress >= 0.62
            ? 'Đêm sao · Làng ma'
            : 'Hoàng hôn dịu êm';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.52)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 128, 22, 6);
        ctx.fill();
        ctx.fillStyle = s.skyProgress < 0.62 ? '#FDBA74' : '#E0F2FE';
        ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(label, 18, 24);
      }

      ctx.restore();

      // Export selfie frame cleanly after drawing without flash
      if (s.pendingSelfieCapture && s.flashAlpha < 0.35) {
        s.pendingSelfieCapture = false;
        try {
          const url = canvas.toDataURL('image/png');
          onSelfieRef.current?.(url);
        } catch {
          // Ignore canvas export error if blocked
        }
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const s = simRef.current;

    if (area === 'spaceship') {
      s.shipX = Math.max(42, Math.min(W - 42, x));
      s.shipY = Math.max(36, Math.min(H - 36, y));
      return;
    }

    if (s.inAlienDimension) {
      if (Math.hypot(x - 72, y - 178) <= 34) {
        s.inAlienDimension = false;
        s.flashAlpha = 0.7;
        soundEngine.playPortalWarp();
        onPortalStateChange?.(false);
        return;
      }
      const positions = [
        { x: 165, y: 166 },
        { x: 265, y: 178 },
        { x: 355, y: 158 },
        { x: 432, y: 180 },
        { x: 308, y: 98 },
      ];
      for (let idx = 0; idx < EXOTIC_CREATURES.length; idx++) {
        if (Math.hypot(x - positions[idx].x, y - positions[idx].y) <= 28) {
          const cr = EXOTIC_CREATURES[idx];
          soundEngine.playGoldenYuzu();
          s.particles.push({
            x: positions[idx].x,
            y: positions[idx].y - 16,
            vx: 0,
            vy: -34,
            life: 1.2,
            maxLife: 1.2,
            color: cr.color,
            size: 13,
            text: `Khám phá ${cr.name}!`,
          });
          onDiscoverCreature?.(cr.id, cr.name, cr.rewardYuzu);
          return;
        }
      }
    }

    if (s.portalActive && !s.inAlienDimension && Math.hypot(x - s.portalX, y - 178) <= 34) {
      s.inAlienDimension = true;
      s.portalActive = false;
      s.flashAlpha = 0.85;
      s.capyX = 120;
      s.capyTargetX = 120;
      soundEngine.playPortalWarp();
      onPortalStateChange?.(true);
      return;
    }

    if (s.skyProgress >= 0.84 && area !== 'home' && !midnightChestClaimed && Math.hypot(x - 478, y - 190) <= 32) {
      soundEngine.playChestOpen();
      s.particles.push({
        x: 478,
        y: 166,
        vx: 0,
        vy: -34,
        life: 1.3,
        maxLife: 1.3,
        color: '#FBBF24',
        size: 13,
        text: 'Mở Kho báu Nửa đêm!',
      });
      onClaimMidnightChest?.();
      return;
    }

    if (area === 'playground' && playgroundGameActive) {
      for (let i = s.targets.length - 1; i >= 0; i--) {
        const t = s.targets[i];
        if (Math.hypot(x - t.x, y - t.y) <= t.radius + 12) {
          s.targets.splice(i, 1);
          soundEngine.playYuzu(t.golden ? 5 : 2);
          s.particles.push({
            x: t.x,
            y: t.y,
            vx: 0,
            vy: -36,
            life: 0.9,
            maxLife: 0.9,
            color: '#FDE047',
            size: 13,
            text: t.golden ? '+3 Quýt!' : '+1 Quýt!',
          });
          onPlaygroundTargetHit?.(t.golden);
          return;
        }
      }
    }

    if (area !== 'home' && area !== 'kingdom' && !s.inAlienDimension) {
      for (const fruit of s.fruits) {
        if (fruit.respawnTimer <= 0 && Math.hypot(x - fruit.x, y - 190) <= 26) {
          fruit.respawnTimer = 8;
          soundEngine.playGoldenYuzu();
          s.particles.push({
            x: fruit.x,
            y: 174,
            vx: 0,
            vy: -36,
            life: 1.1,
            maxLife: 1.1,
            color: '#FDE047',
            size: 13,
            text: fruit.kind === 'golden_yuzu' ? 'Hái Quýt Vàng!' : 'Hái Dưa Hấu!',
          });
          onSideQuestProgress?.('find_fruit', 'Đã thu hoạch trái cây quý trong khu vực!');
          return;
        }
      }
      if (Math.hypot(x - s.duckNpc.x, y - 190) <= 28) {
        s.duckNpc.friendSparkTimer = 2.4;
        soundEngine.playYuzu(4);
        s.particles.push({
          x: s.duckNpc.x,
          y: 162,
          vx: 0,
          vy: -34,
          life: 1.1,
          maxLife: 1.1,
          color: '#FDA4AF',
          size: 13,
          text: '♥ Quạc! Kết bạn Vịt Suối!',
        });
        onSideQuestProgress?.('befriend_bird_duck', 'Đã kết bạn thân thiết với Vịt Suối!');
        return;
      }
      if (Math.hypot(x - s.birdNpc.x, y - 190) <= 28) {
        s.birdNpc.friendSparkTimer = 2.4;
        soundEngine.playYuzu(5);
        s.particles.push({
          x: s.birdNpc.x,
          y: 160,
          vx: 0,
          vy: -34,
          life: 1.1,
          maxLife: 1.1,
          color: '#BAE6FD',
          size: 13,
          text: '♪ Chíp! Kết bạn Chim Sơn Ca!',
        });
        onSideQuestProgress?.('befriend_bird_duck', 'Đã làm quen với Chim Sơn Ca!');
        return;
      }
    }

    if (x >= s.capyX - 10 && x <= s.capyX + 76 && y >= 110 && y <= 220) {
      s.sleepTimer = 0;
      s.capyVy = -210;
      soundEngine.playYuzu(2);
      s.particles.push({
        x: s.capyX + 32,
        y: 135,
        vx: 0,
        vy: -34,
        life: 1.0,
        maxLife: 1.0,
        color: '#FDA4AF',
        size: 13,
        text: '♥ Vui vẻ!',
      });
      onScenePet?.();
      return;
    }

    s.sleepTimer = 0;
    s.activeEnvAction = null;
    s.capyTargetX = Math.max(40, Math.min(W - 100, x - 33));
    if (area === 'pool') {
      s.ripples.push({ x, y: Math.max(176, y), r: 6, life: 1 });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      className="block h-auto w-full cursor-pointer rounded-xl border border-white/10 bg-[#14201A]"
      style={{ aspectRatio: `${W} / ${H}` }}
    />
  );
}
