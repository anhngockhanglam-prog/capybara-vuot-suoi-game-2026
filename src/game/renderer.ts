import { resolveNameEffect } from './nameEffects';
import { FUR_OPTIONS } from './skins';
import {
  ActiveWeather,
  BossEntity,
  CapybaraAppearance,
  Collectible,
  CustomMap,
  FloatingText,
  MountId,
  Obstacle,
  Particle,
  PetId,
  PhotoPose,
  Projectile,
  RemotePlayerState,
  StageConfig,
} from './types';
import { stepAndRenderWeather, WeatherParticle } from './weather';

export interface PlayerRenderInput {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  facing?: 1 | -1;
  isGrounded: boolean;
  isDucking: boolean;
  scaleX: number;
  scaleY: number;
  invulnTimer: number;
  hasShield: boolean;
  magnetTimer: number;
  feverActive: boolean;
  yuzuStackCount: number;
  appearance: CapybaraAppearance;
  runCycle: number;
  blinkTimer: number;
  photoPose?: PhotoPose;
  isMoving?: boolean;
  potionHue?: number | null;
  glowingFoodActive?: boolean;
  balloonsActive?: boolean;
}

export interface PetRenderInput {
  id: PetId;
  x: number;
  y: number;
  facing?: 1 | -1;
  hopPhase?: number;
  isMoving?: boolean;
  isDashing?: boolean;
  jumpOffset?: number;
  isExcited?: boolean;
}

export interface RenderContextState {
  width: number;
  height: number;
  groundY: number;
  time: number;
  dt: number;
  distance: number;
  nightFactor: number;
  sunsetFactor?: number;
  rainbowAlpha?: number;
  activeWeather: ActiveWeather;
  weatherParticles: WeatherParticle[];
  stage?: StageConfig;
  pet?: PetRenderInput | null;
  player: PlayerRenderInput;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  boss: BossEntity | null;
  projectiles: Projectile[];
  particles: Particle[];
  floatingTexts: FloatingText[];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, clamped));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, clamped));
  const bl = Math.round(lerp(a & 255, b & 255, clamped));
  return `rgb(${r}, ${g}, ${bl})`;
}

export function renderGameScene(ctx: CanvasRenderingContext2D, state: RenderContextState): void {
  const { width, height, groundY, time, dt, distance, nightFactor, stage } = state;
  const sunsetFactor = Math.max(0, Math.min(1, state.sunsetFactor ?? 0));

  const daySkyTop = stage?.skyTop ?? '#68B0A0';
  const daySkyBottom = stage?.skyBottom ?? '#E4F2E8';
  const dayMtnFar = stage?.mountainFar ?? '#548777';
  const dayMtnNear = stage?.mountainNear ?? '#356654';

  const duskSkyTop = lerpColor(daySkyTop, '#5B346D', sunsetFactor * 0.85);
  const duskSkyBottom = lerpColor(daySkyBottom, '#FB923C', sunsetFactor * 0.9);
  const duskMtnFar = lerpColor(dayMtnFar, '#7C3E4D', sunsetFactor * 0.8);
  const duskMtnNear = lerpColor(dayMtnNear, '#4A2536', sunsetFactor * 0.85);

  const skyTop = lerpColorHexOrRgb(duskSkyTop, '#0F1B2B', nightFactor);
  const skyBottom = lerpColorHexOrRgb(duskSkyBottom, '#203647', nightFactor);
  const mountainFar = lerpColorHexOrRgb(duskMtnFar, '#182833', nightFactor);
  const mountainNear = lerpColorHexOrRgb(duskMtnNear, '#111E24', nightFactor);
  const stageSeed = stage?.seed ?? 0;

  // Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, groundY);

  // Warm Sunset horizon band
  if (sunsetFactor > 0.02) {
    const sunBand = ctx.createLinearGradient(0, groundY * 0.45, 0, groundY);
    sunBand.addColorStop(0, 'rgba(251, 146, 60, 0)');
    sunBand.addColorStop(1, `rgba(249, 115, 22, ${(sunsetFactor * 0.36).toFixed(3)})`);
    ctx.fillStyle = sunBand;
    ctx.fillRect(0, groundY * 0.45, width, groundY * 0.55);
  }

  // Sun (Day -> Sunset lowering warm orb) & Moon + Stars (Night)
  const weatherDim = state.activeWeather === 'rain' ? 0.35 : 1;
  if (nightFactor < 0.88) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - nightFactor * 1.2) * weatherDim;
    const baseSunY = groundY * (stage?.biome === 'sunset_marsh' ? 0.38 : 0.24);
    const sunY = lerp(baseSunY, groundY * 0.72, Math.min(1, sunsetFactor + nightFactor * 0.6));
    const sunRadius = 28 + sunsetFactor * 6;
    ctx.fillStyle =
      sunsetFactor > 0.2
        ? lerpColor('#FEF3C7', '#FB7185', sunsetFactor)
        : stage?.biome === 'sunset_marsh'
        ? '#FED7AA'
        : '#FEF3C7';
    ctx.beginPath();
    ctx.arc(width * 0.82, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha *= 0.28 + sunsetFactor * 0.16;
    ctx.beginPath();
    ctx.arc(width * 0.82, sunY, sunRadius + 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (nightFactor > 0.15) {
    ctx.save();
    // Subtle Milky Way diagonal glow
    const mwGrad = ctx.createLinearGradient(0, groundY * 0.65, width, 0);
    mwGrad.addColorStop(0, 'rgba(147, 197, 253, 0)');
    mwGrad.addColorStop(0.5, `rgba(196, 181, 253, ${(nightFactor * 0.14 * weatherDim).toFixed(3)})`);
    mwGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
    ctx.fillStyle = mwGrad;
    ctx.fillRect(0, 0, width, groundY * 0.72);

    ctx.globalAlpha = nightFactor * weatherDim;
    ctx.fillStyle = '#FEF9C3';
    ctx.beginPath();
    ctx.arc(width * 0.78, groundY * 0.22, 23, 0, Math.PI * 2);
    ctx.fill();
    // Crescent shadow
    ctx.fillStyle = skyTop;
    ctx.beginPath();
    ctx.arc(width * 0.78 + 8, groundY * 0.22 - 4, 18, 0, Math.PI * 2);
    ctx.fill();

    // Twinkling stars
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 42; i++) {
      const sx = (i * 173 + 47 + stageSeed * 7) % width;
      const sy = (i * 89 + 19) % (groundY * 0.62);
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * 2.2 + i));
      ctx.globalAlpha = nightFactor * twinkle * 0.9 * weatherDim;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 4 === 0 ? 2.1 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Periodic Shooting Star
    const meteorCycle = time % 7.5;
    if (meteorCycle < 1.1 && state.activeWeather !== 'rain') {
      const p = meteorCycle / 1.1;
      const mx = width * 0.22 + p * 230;
      const my = 26 + p * 95;
      ctx.globalAlpha = nightFactor * Math.sin(p * Math.PI) * 0.92;
      const tail = ctx.createLinearGradient(mx - 65, my - 26, mx, my);
      tail.addColorStop(0, 'rgba(255, 255, 255, 0)');
      tail.addColorStop(1, '#FEF08A');
      ctx.strokeStyle = tail;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(mx - 65, my - 26);
      ctx.lineTo(mx, my);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Post-Rain Rainbow Arc
  if ((state.rainbowAlpha ?? 0) > 0.02 && state.activeWeather !== 'rain') {
    drawRainbowArc(ctx, width * 0.52, groundY - 12, groundY * 0.84, (state.rainbowAlpha ?? 0) * (1 - nightFactor * 0.55));
  }

  // Drifting Clouds
  ctx.save();
  ctx.fillStyle =
    state.activeWeather === 'rain'
      ? 'rgba(148, 163, 184, 0.55)'
      : nightFactor > 0.5
      ? 'rgba(148, 163, 184, 0.16)'
      : 'rgba(255, 255, 255, 0.65)';
  for (let i = 0; i < 4; i++) {
    const cloudSpeed = 14 + i * 4;
    const cx = width - ((distance * 0.08 + i * 280 + stageSeed * 19 + time * cloudSpeed) % (width + 260)) + 120;
    const cy = 48 + (i % 3) * 34;
    drawCloud(ctx, cx, cy, 0.8 + (i % 2) * 0.25);
  }
  ctx.restore();

  // Biome Horizon Landmarks (Volcano / Ferris Wheel / New Biomes)
  if (stage?.biome === 'volcano_island') {
    drawHorizonVolcano(ctx, width * 0.72, groundY, time, nightFactor);
  } else if (stage?.biome === 'amusement_park') {
    drawHorizonFerrisWheel(ctx, width * 0.78, groundY - 14, time, nightFactor);
  } else if (stage?.biome === 'candy_planet') {
    drawHorizonCakeMountain(ctx, width * 0.74, groundY, time);
  } else if (stage?.biome === 'ocean') {
    drawHorizonAtlantisDomes(ctx, width * 0.75, groundY, time);
  } else if (stage?.biome === 'ice_mountain') {
    drawHorizonCrystalCave(ctx, width * 0.75, groundY, time);
  } else if (stage?.biome === 'glowing_forest') {
    drawHorizonGiantMushrooms(ctx, width * 0.74, groundY, time);
  }

  drawMountainRange(
    ctx,
    width,
    groundY,
    distance * 0.12 + stageSeed * 13,
    stage?.mountainAmpFar ?? 85,
    stage?.mountainFreqFar ?? 0.0055,
    mountainFar
  );
  drawMountainRange(
    ctx,
    width,
    groundY,
    distance * 0.28 + stageSeed * 29,
    stage?.mountainAmpNear ?? 52,
    stage?.mountainFreqNear ?? 0.009,
    mountainNear
  );

  // Horizon Railway & Animated Capybara Express Train
  drawHorizonTrain(ctx, width, groundY - 22, time, nightFactor);

  drawBambooGrove(
    ctx,
    width,
    groundY,
    distance * 0.45 + stageSeed * 11,
    nightFactor,
    stage?.foliageColor,
    stage?.biome
  );

  // Night Paper Lanterns & Glowing Fireflies
  if (nightFactor > 0.15) {
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const lx = width - ((distance * 0.45 + i * 210) % (width + 160)) + 60;
      const ly = groundY - 82 - (i % 2) * 16;
      ctx.globalAlpha = nightFactor * 0.34;
      const lanternGlow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 24);
      lanternGlow.addColorStop(0, 'rgba(253, 224, 71, 0.95)');
      lanternGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = lanternGlow;
      ctx.beginPath();
      ctx.arc(lx, ly, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = nightFactor * 0.94;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(lx - 6, ly - 8, 12, 16, 5);
      ctx.fill();
    }

    if (state.activeWeather !== 'rain') {
      for (let i = 0; i < 24; i++) {
        const fx =
          (((i * 183 - distance * 0.52 + Math.sin(time * 1.45 + i * 1.3) * 34) % width) + width) %
          width;
        const fy =
          groundY - 22 - ((i * 59) % 150) + Math.cos(time * 1.9 + i * 0.85) * 13;
        const pulse = 0.3 + 0.7 * Math.abs(Math.sin(time * 3.4 + i * 1.6));
        const haloRadius = 8 + (i % 3) * 3;
        const alpha = nightFactor * pulse;

        const ffGrad = ctx.createRadialGradient(fx, fy, 0.5, fx, fy, haloRadius);
        ffGrad.addColorStop(0, `rgba(254, 249, 195, ${Math.min(1, alpha * 1.1)})`);
        ffGrad.addColorStop(0.35, `rgba(190, 242, 100, ${alpha * 0.65})`);
        ffGrad.addColorStop(1, 'rgba(190, 242, 100, 0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = ffGrad;
        ctx.beginPath();
        ctx.arc(fx, fy, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle shimmer reflection over the river below low-flying fireflies
        if (fy > groundY - 75) {
          ctx.fillStyle = `rgba(253, 224, 71, ${alpha * 0.24})`;
          ctx.beginPath();
          ctx.ellipse(fx, groundY + 34 + (i % 3) * 6, 4.5, 1.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  // Ground: Grass & Stone Path + Flowing Hot-Spring River
  const riverHeight = Math.max(38, height - groundY - 26);
  const pathHeight = height - groundY - riverHeight;

  ctx.fillStyle =
    state.activeWeather === 'snow'
      ? lerpColor('#DCE8E2', '#94A3B8', nightFactor * 0.5)
      : lerpColor(stage?.grassColor ?? '#3F7D4C', '#22492F', nightFactor);
  ctx.fillRect(0, groundY, width, 9);

  ctx.fillStyle =
    state.activeWeather === 'snow'
      ? lerpColor('#6D655E', '#3E3936', nightFactor)
      : lerpColor(stage?.soilColor ?? '#735742', '#47362A', nightFactor);
  ctx.fillRect(0, groundY + 9, width, pathHeight - 9);

  ctx.fillStyle = 'rgba(255, 245, 230, 0.14)';
  for (let i = 0; i < 16; i++) {
    const px = width - ((distance + i * 78) % (width + 60)) + 20;
    const py = groundY + 14 + (i % 3) * 4;
    ctx.beginPath();
    ctx.ellipse(px, py, 5 + (i % 3) * 2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shimmering Rain Puddles with splash rings on path
  if (state.activeWeather === 'rain') {
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const puddleX = width - ((distance + i * 185) % (width + 140)) + 40;
      const puddleY = groundY + 14 + (i % 2) * 6;
      const pw = 24 + (i % 3) * 8;
      ctx.fillStyle = 'rgba(125, 211, 252, 0.38)';
      ctx.beginPath();
      ctx.ellipse(puddleX, puddleY, pw, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const ripplePhase = (time * 1.9 + i * 0.42) % 1;
      ctx.strokeStyle = `rgba(224, 242, 254, ${(1 - ripplePhase) * 0.65})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(puddleX, puddleY, pw * (0.3 + ripplePhase * 0.65), 1.4 + ripplePhase * 2.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  const riverY = groundY + pathHeight;
  const riverGrad = ctx.createLinearGradient(0, riverY, 0, height);
  riverGrad.addColorStop(0, lerpColor(stage?.riverTop ?? '#1D6B68', '#0E383B', nightFactor));
  riverGrad.addColorStop(1, lerpColor(stage?.riverBottom ?? '#124647', '#082226', nightFactor));
  ctx.fillStyle = riverGrad;
  ctx.fillRect(0, riverY, width, riverHeight);

  ctx.strokeStyle = 'rgba(204, 251, 241, 0.25)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const rx = width - ((distance * 1.15 + i * 115) % (width + 100)) + 30;
    const ry = riverY + 10 + (i % 3) * 10;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 28 + (i % 2) * 14, ry);
    ctx.stroke();
  }

  for (const c of state.collectibles) {
    if (!c.collected) drawCollectible(ctx, c, time);
  }

  for (const obs of state.obstacles) {
    drawObstacle(ctx, obs, time);
  }

  if (state.boss) {
    drawBoss(ctx, state.boss, time);
  }

  for (const proj of state.projectiles) {
    drawProjectile(ctx, proj, time);
  }

  if (state.pet && state.pet.id !== 'none') {
    drawPet(ctx, state.pet, time);
  }

  drawCapybara(ctx, state.player, time);

  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha * (p.life / p.maxLife));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  stepAndRenderWeather(
    ctx,
    state.weatherParticles,
    state.activeWeather,
    width,
    height,
    groundY,
    dt,
    time
  );

  for (const ft of state.floatingTexts) {
    const progress = 1 - ft.life / ft.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - Math.pow(progress, 1.8));
    ctx.font = '700 16px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(17, 26, 22, 0.85)';
    ctx.lineWidth = 4;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

export function renderMultiplayerScene(
  ctx: CanvasRenderingContext2D,
  params: {
    width: number;
    height: number;
    groundY: number;
    time: number;
    dt: number;
    map: CustomMap;
    claimedYuzuIds: Set<string>;
    localPlayer: PlayerRenderInput;
    remotePlayers: RemotePlayerState[];
    projectiles: Projectile[];
    weatherParticles: WeatherParticle[];
    activeWeather: ActiveWeather;
  }
): void {
  const { width, height, groundY, time, dt, map } = params;
  const isNightTheme = map.theme === 'night_lantern';

  let skyTop = '#7AB8A8';
  let skyBottom = '#E7F3E8';
  if (map.theme === 'sakura') {
    skyTop = '#D48AA7';
    skyBottom = '#FDE7F0';
  } else if (map.theme === 'night_lantern') {
    skyTop = '#142030';
    skyBottom = '#27404E';
  } else if (map.theme === 'snow') {
    skyTop = '#647E96';
    skyBottom = '#E2EDF5';
  }

  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, groundY);

  if (isNightTheme) {
    ctx.fillStyle = '#FEF9C3';
    ctx.beginPath();
    ctx.arc(width * 0.82, 72, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 20; i++) {
      ctx.globalAlpha = 0.4 + 0.5 * Math.sin(time * 2 + i);
      ctx.beginPath();
      ctx.arc((i * 157 + 31) % width, (i * 67 + 20) % 190, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawMountainRange(ctx, width, groundY, 0, 72, 0.006, isNightTheme ? '#1B2D39' : 'rgba(55, 102, 84, 0.42)');
  drawBambooGrove(ctx, width, groundY, 0, isNightTheme ? 0.8 : 0);

  // Ground
  ctx.fillStyle = map.theme === 'snow' ? '#DCE8E2' : '#3F7D4C';
  ctx.fillRect(0, groundY, width, 9);
  ctx.fillStyle = '#735742';
  ctx.fillRect(0, groundY + 9, width, 20);

  const riverY = groundY + 29;
  const riverGrad = ctx.createLinearGradient(0, riverY, 0, height);
  riverGrad.addColorStop(0, '#1D6B68');
  riverGrad.addColorStop(1, '#124647');
  ctx.fillStyle = riverGrad;
  ctx.fillRect(0, riverY, width, height - riverY);

  // Draw Map Objects
  for (const obj of map.objects) {
    if (obj.type === 'platform') {
      ctx.fillStyle = '#854D27';
      ctx.beginPath();
      ctx.roundRect(obj.x, obj.y, obj.w, obj.h, 6);
      ctx.fill();
      ctx.fillStyle = map.theme === 'snow' ? '#E2E8F0' : '#4ADE80';
      ctx.beginPath();
      ctx.roundRect(obj.x, obj.y, obj.w, 5, [6, 6, 0, 0]);
      ctx.fill();
    } else if (obj.type === 'spring') {
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(obj.x + 8, obj.y + 7, obj.w - 16, obj.h - 7);
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(obj.x, obj.y, obj.w, 8, 4);
      ctx.fill();
    } else if (obj.type === 'onsen') {
      ctx.fillStyle = '#92400E';
      ctx.beginPath();
      ctx.roundRect(obj.x, obj.y + 4, obj.w, obj.h - 4, 6);
      ctx.fill();
      ctx.fillStyle = '#7DD3FC';
      ctx.beginPath();
      ctx.roundRect(obj.x + 4, obj.y, obj.w - 8, 9, 4);
      ctx.fill();
      // Rising steam
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      for (let s = 0; s < 3; s++) {
        const sx = obj.x + 18 + s * (obj.w / 3.5);
        const sy = obj.y - 6 - ((time * 18 + s * 9) % 22);
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (obj.type === 'yuzu') {
      if (!params.claimedYuzuIds.has(obj.id)) {
        drawCollectible(
          ctx,
          {
            id: 0,
            kind: 'yuzu',
            x: obj.x + obj.w / 2,
            y: obj.y + obj.h / 2,
            radius: 12,
            phase: obj.x * 0.05,
            collected: false,
          },
          time
        );
      }
    } else if (obj.type === 'hazard') {
      drawObstacle(
        ctx,
        {
          id: 0,
          kind: 'chili',
          x: obj.x,
          y: obj.y,
          width: obj.w,
          height: obj.h,
          phase: 0,
          passed: false,
        },
        time
      );
    }
  }

  // Remote Players
  for (const rp of params.remotePlayers) {
    drawCapybara(
      ctx,
      {
        x: rp.x,
        y: rp.y,
        width: 66,
        height: rp.isDucking ? 34 : 50,
        vy: rp.vy,
        facing: rp.facing,
        isGrounded: rp.isGrounded,
        isDucking: rp.isDucking,
        scaleX: 1,
        scaleY: 1,
        invulnTimer: 0,
        hasShield: false,
        magnetTimer: 0,
        feverActive: false,
        yuzuStackCount: Math.min(5, Math.floor(rp.yuzuCount / 3) + (rp.yuzuCount > 0 ? 1 : 0)),
        appearance: rp.appearance,
        runCycle: Math.abs(rp.vx) > 10 ? time * 11 : 0,
        blinkTimer: 0,
        isMoving: Math.abs(rp.vx) > 10,
      },
      time
    );
    drawPlayerNametag(ctx, rp.x + 33, rp.y - 26, rp.appearance.name, rp.emote);
  }

  // Local Player
  drawCapybara(ctx, params.localPlayer, time);
  drawPlayerNametag(
    ctx,
    params.localPlayer.x + 33,
    params.localPlayer.y - 26,
    `${params.localPlayer.appearance.name} (Bạn)`,
    null
  );

  for (const proj of params.projectiles) {
    drawProjectile(ctx, proj, time);
  }

  stepAndRenderWeather(
    ctx,
    params.weatherParticles,
    params.activeWeather,
    width,
    height,
    groundY,
    dt,
    time
  );
}

function drawPlayerNametag(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  name: string,
  emote: string | null
) {
  ctx.save();
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(12, 20, 16, 0.85)';
  ctx.lineWidth = 3;
  ctx.strokeText(name, cx, y);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(name, cx, y);

  if (emote) {
    ctx.font = '700 13px "Outfit", sans-serif';
    ctx.strokeText(emote, cx, y - 18);
    ctx.fillStyle = '#FDE047';
    ctx.fillText(emote, cx, y - 18);
  }
  ctx.restore();
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: BossEntity, time: number) {
  ctx.save();
  const isRunning = boss.animState === 'running' || boss.dashTimer > 0;
  const isWalking = boss.animState === 'walking';
  const cycle = boss.runCycle ?? time * (isRunning ? 16 : 7.5);
  const strideBob = isRunning
    ? Math.abs(Math.sin(cycle)) * 4.5
    : isWalking
      ? Math.abs(Math.sin(cycle)) * 2.2
      : Math.sin(time * 3.5) * 3;
  const cx = boss.x + boss.width / 2;
  const cy = boss.y + boss.height / 2 - strideBob;
  const isFlashing = boss.hitFlash > 0;
  const isTelegraphing = boss.attackTimer < 0.45 || boss.dashTimer > 0;
  const facing = boss.facing ?? -1;

  // Ground shadow under boss (pulses with stride height)
  if (boss.kind !== 'bamboo_dragon') {
    const shadowScale = 1 - Math.min(0.14, strideBob * 0.02);
    ctx.fillStyle = isRunning ? 'rgba(0, 0, 0, 0.34)' : 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(cx, boss.y + boss.height + 2, boss.width * 0.46 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Telegraph / Rage aura ring
  if (isTelegraphing) {
    const aura = ctx.createRadialGradient(cx, cy, 18, cx, cy, boss.width * 0.78);
    aura.addColorStop(0, 'rgba(244, 63, 94, 0.05)');
    aura.addColorStop(0.7, 'rgba(244, 63, 94, 0.25)');
    aura.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, boss.width * 0.78, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flip sprite horizontally based on boss.facing (-1 left, +1 right), then restore before HP/title UI
  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(facing === 1 ? -1 : 1, 1);
  ctx.translate(-cx, 0);

  // Speed streaks behind Boss during 'running' chase state
  if (isRunning) {
    ctx.save();
    ctx.strokeStyle = boss.dashTimer > 0 ? 'rgba(252, 165, 165, 0.55)' : 'rgba(253, 186, 116, 0.42)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let s = 0; s < 4; s++) {
      const sy = cy - 22 + s * 15 + Math.sin(time * 18 + s) * 3;
      const sx = boss.x + boss.width + 8 + ((time * 120 + s * 19) % 24);
      const len = 18 + (s % 2) * 14;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + len, sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (boss.kind === 'croc_king') {
    const bodyTilt = isRunning ? -0.075 : isWalking ? -0.025 : 0;
    const bodyCy = cy - 4;
    const jawAngle = isTelegraphing ? 0.28 : isRunning ? 0.18 + Math.abs(Math.sin(cycle)) * 0.1 : 0.08 + Math.abs(Math.sin(time * 3.2)) * 0.08;
    const tailWave = Math.sin(isRunning ? cycle * 0.8 : time * 6) * (isRunning ? 12 : 8);
    const groundFootY = boss.y + boss.height + 1;
    const strideAmpX = isRunning ? 17 : isWalking ? 9.5 : 2.5;
    const liftAmpY = isRunning ? 11 : isWalking ? 5.5 : 1;

    const drawCrocLeg = (hipX: number, hipY: number, phase: number, isBack: boolean) => {
      const phaseAngle = cycle + phase;
      const stride = Math.sin(phaseAngle);
      const cosPhase = Math.cos(phaseAngle);
      const lift = Math.max(0, -cosPhase) * liftAmpY;
      const kneeX = hipX - 5 + stride * (strideAmpX * 0.65);
      const kneeY = hipY + 11 - lift * 0.55;
      const ankleX = hipX - 7 + stride * strideAmpX;
      const ankleY = groundFootY - 3 - lift;
      const footTilt = lift > 1.5 ? -0.22 * stride : 0.08 * stride;

      ctx.save();
      // Ground dust skid under planted foot while running
      if (!isBack && isRunning && lift < 1.2 && Math.abs(stride) > 0.35) {
        ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
        ctx.beginPath();
        ctx.ellipse(ankleX + 6, groundFootY, 7, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Upper muscular thigh (hip -> knee)
      ctx.strokeStyle = isFlashing
        ? isBack
          ? '#F87171'
          : '#FCA5A5'
        : isBack
          ? '#064E3B'
          : '#15803D';
      ctx.lineWidth = isBack ? 12 : 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.stroke();

      // Lower shin (knee -> ankle)
      ctx.lineWidth = isBack ? 9 : 10.5;
      ctx.beginPath();
      ctx.moveTo(kneeX, kneeY);
      ctx.lineTo(ankleX, ankleY);
      ctx.stroke();

      // Thigh & knee scale highlight on foreground legs
      if (!isBack && !isFlashing) {
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(hipX - 2, hipY + 2);
        ctx.lineTo(kneeX - 2, kneeY);
        ctx.stroke();
      }

      // Articulated Foot Pad + Claws with ankle pitch
      ctx.save();
      ctx.translate(ankleX, ankleY + 2);
      ctx.rotate(footTilt);

      ctx.fillStyle = isFlashing
        ? isBack
          ? '#F87171'
          : '#FECACA'
        : isBack
          ? '#052E16'
          : '#166534';
      ctx.beginPath();
      ctx.ellipse(-4, 0, 11.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Three sharp claws facing forward (left)
      ctx.fillStyle = isBack ? '#CBD5E1' : '#FFFFFF';
      for (let c = 0; c < 3; c++) {
        const cyOff = -3 + c * 2.5;
        ctx.beginPath();
        ctx.moveTo(-12, cyOff - 1.5);
        ctx.lineTo(-20, cyOff + 0.5);
        ctx.lineTo(-11, cyOff + 1.8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      ctx.restore();
    };

    // Far-side background legs (true alternating diagonal gait)
    drawCrocLeg(boss.x + 36, bodyCy + 16, Math.PI, true);
    drawCrocLeg(boss.x + 86, bodyCy + 16, 0, true);

    // Lean torso forward when sprinting/chasing
    ctx.save();
    ctx.translate(cx, bodyCy);
    ctx.rotate(bodyTilt);
    ctx.translate(-cx, -bodyCy);

    // Sweeping serrated tail on the right with dorsal ridge scutes
    ctx.fillStyle = isFlashing ? '#FCA5A5' : '#14532D';
    ctx.beginPath();
    ctx.moveTo(boss.x + boss.width - 14, bodyCy - 8);
    ctx.quadraticCurveTo(
      boss.x + boss.width + 26,
      bodyCy - 20 + tailWave,
      boss.x + boss.width + 48,
      bodyCy + 2 + tailWave * 0.65
    );
    ctx.quadraticCurveTo(
      boss.x + boss.width + 20,
      bodyCy + 23 + tailWave * 0.4,
      boss.x + boss.width - 14,
      bodyCy + 15
    );
    ctx.closePath();
    ctx.fill();

    // Tail ridge spikes
    ctx.fillStyle = isFlashing ? '#FEF08A' : '#4ADE80';
    for (let ts = 0; ts < 3; ts++) {
      const tx = boss.x + boss.width + 2 + ts * 12;
      const ty = bodyCy - 11 + ts * 2 + tailWave * (0.25 + ts * 0.16);
      ctx.beginPath();
      ctx.moveTo(tx - 4, ty + 2);
      ctx.lineTo(tx + 1, ty - 7);
      ctx.lineTo(tx + 5, ty + 3);
      ctx.closePath();
      ctx.fill();
    }

    // Sculpted Armored Body with Swamp Gradient & Scale Rim
    const bodyGrad = ctx.createLinearGradient(boss.x, bodyCy - 36, boss.x, bodyCy + 34);
    if (isFlashing) {
      bodyGrad.addColorStop(0, '#FECACA');
      bodyGrad.addColorStop(1, '#F87171');
    } else {
      bodyGrad.addColorStop(0, '#22C55E');
      bodyGrad.addColorStop(0.45, '#15803D');
      bodyGrad.addColorStop(1, '#052E16');
    }
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(boss.x + 14, bodyCy - 10);
    ctx.quadraticCurveTo(boss.x + 22, bodyCy - 35, boss.x + 62, bodyCy - 34);
    ctx.quadraticCurveTo(boss.x + boss.width - 4, bodyCy - 32, boss.x + boss.width - 4, bodyCy - 2);
    ctx.quadraticCurveTo(boss.x + boss.width - 4, bodyCy + 28, boss.x + boss.width - 28, bodyCy + 30);
    ctx.lineTo(boss.x + 30, bodyCy + 29);
    ctx.quadraticCurveTo(boss.x + 12, bodyCy + 26, boss.x + 14, bodyCy - 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isFlashing ? '#FEE2E2' : '#052E16';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Overlapping Dorsal Scute Plates along back
    for (let i = 0; i < 5; i++) {
      const sx = boss.x + 34 + i * 16;
      const sy = bodyCy - 31 + Math.abs(i - 2) * 1.2;
      ctx.fillStyle = isFlashing ? '#FEF08A' : '#166534';
      ctx.beginPath();
      ctx.moveTo(sx - 8, sy + 2);
      ctx.lineTo(sx - 1, sy - 12);
      ctx.lineTo(sx + 8, sy + 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isFlashing ? '#FEF9C3' : '#4ADE80';
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy + 1);
      ctx.lineTo(sx - 1, sy - 9);
      ctx.lineTo(sx + 3, sy + 1);
      ctx.closePath();
      ctx.fill();
    }

    // Flank scale ridges for depth
    if (!isFlashing) {
      ctx.fillStyle = 'rgba(74, 222, 128, 0.28)';
      for (let sc = 0; sc < 4; sc++) {
        ctx.beginPath();
        ctx.ellipse(boss.x + 48 + sc * 15, bodyCy - 6 + (sc % 2) * 5, 6, 3.2, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Armored Ribbed Belly
    ctx.fillStyle = isFlashing ? '#FEF9C3' : '#A7F3D0';
    ctx.beginPath();
    ctx.roundRect(boss.x + 28, bodyCy + 10, boss.width - 42, 17, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 83, 45, 0.45)';
    ctx.lineWidth = 1.6;
    for (let i = 1; i <= 4; i++) {
      const rx = boss.x + 30 + i * 13;
      ctx.beginPath();
      ctx.moveTo(rx, bodyCy + 11);
      ctx.lineTo(rx, bodyCy + 26);
      ctx.stroke();
    }

    ctx.restore();

    // Near-side foreground legs (drawn in front of lower body, alternating with rear-diagonal pair)
    drawCrocLeg(boss.x + 42, bodyCy + 18, 0, false);
    drawCrocLeg(boss.x + 92, bodyCy + 18, Math.PI, false);

    // Re-apply torso tilt for head/jaws/crown alignment
    ctx.save();
    ctx.translate(cx, bodyCy);
    ctx.rotate(bodyTilt);
    ctx.translate(-cx, -bodyCy);

    // Lower jaw (snapping)
    ctx.save();
    ctx.translate(boss.x + 34, bodyCy + 4);
    ctx.rotate(-jawAngle * 0.4);
    ctx.fillStyle = isFlashing ? '#FECACA' : '#14532D';
    ctx.beginPath();
    ctx.roundRect(-44, 0, 46, 14, [5, 4, 9, 10]);
    ctx.fill();
    ctx.strokeStyle = '#052E16';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // Lower fangs
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-38 + i * 9.5, 0);
      ctx.lineTo(-34 + i * 9.5, -7.5);
      ctx.lineTo(-30 + i * 9.5, 0);
      ctx.fill();
    }
    ctx.restore();

    // Upper snout & jaws with sculpted nostril ridge
    ctx.save();
    ctx.translate(boss.x + 34, bodyCy - 4);
    ctx.rotate(jawAngle * 0.65);
    const snoutGrad = ctx.createLinearGradient(-48, -18, 0, 4);
    snoutGrad.addColorStop(0, isFlashing ? '#FECACA' : '#22C55E');
    snoutGrad.addColorStop(1, isFlashing ? '#F87171' : '#15803D');
    ctx.fillStyle = snoutGrad;
    ctx.beginPath();
    ctx.moveTo(-48, -2);
    ctx.quadraticCurveTo(-48, -16, -34, -17);
    ctx.quadraticCurveTo(-18, -19, -2, -16);
    ctx.lineTo(4, -10);
    ctx.lineTo(4, 4);
    ctx.lineTo(-42, 4);
    ctx.quadraticCurveTo(-48, 4, -48, -2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#052E16';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Upper fangs
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-41 + i * 10, 4);
      ctx.lineTo(-36 + i * 10, 13.5);
      ctx.lineTo(-31 + i * 10, 4);
      ctx.fill();
    }
    // Flared snout nostril + ridge
    ctx.fillStyle = isFlashing ? '#FCA5A5' : '#166534';
    ctx.beginPath();
    ctx.ellipse(-38, -13, 6.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#052E16';
    ctx.beginPath();
    ctx.arc(-40, -12.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fierce Eye Socket + Brow Ridge + Slit Pupil
    ctx.fillStyle = '#052E16';
    ctx.beginPath();
    ctx.arc(boss.x + 34, bodyCy - 20, 11.5, Math.PI * 0.9, Math.PI * 0.1);
    ctx.fill();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(boss.x + 34, bodyCy - 16, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.ellipse(boss.x + 32, bodyCy - 16, 2.8, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(boss.x + 30.5, bodyCy - 19, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Jeweled Royal Gold Crown with Rim Band & Gems
    const crownX = boss.x + 38;
    const crownY = bodyCy - 32;
    const crownGrad = ctx.createLinearGradient(crownX - 18, crownY - 22, crownX + 18, crownY);
    crownGrad.addColorStop(0, '#FDE047');
    crownGrad.addColorStop(0.5, '#F59E0B');
    crownGrad.addColorStop(1, '#B45309');
    ctx.fillStyle = crownGrad;
    ctx.beginPath();
    ctx.moveTo(crownX - 16, crownY);
    ctx.lineTo(crownX - 20, crownY - 19);
    ctx.lineTo(crownX - 7, crownY - 9);
    ctx.lineTo(crownX, crownY - 24);
    ctx.lineTo(crownX + 7, crownY - 9);
    ctx.lineTo(crownX + 20, crownY - 19);
    ctx.lineTo(crownX + 16, crownY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FEF9C3';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Crown trim band & 3 royal gems
    ctx.fillStyle = '#B45309';
    ctx.fillRect(crownX - 15, crownY - 4, 30, 4);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(crownX, crownY - 8, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.arc(crownX - 10, crownY - 7, 2.2, 0, Math.PI * 2);
    ctx.arc(crownX + 10, crownY - 7, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (boss.kind === 'onsen_crab') {
    // Rising Onsen Steam Plumes from Shell
    for (let s = 0; s < 4; s++) {
      const sy = cy - 34 - ((time * 28 + s * 13) % 36);
      const sx = cx - 22 + s * 15 + Math.sin(time * 3 + s) * 4;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, 0.4 - ((cy - 34 - sy) / 36) * 0.38)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5 + s * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6 Articulated Walking Legs — true alternating tripod gait
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const crabStrideAmp = isRunning ? 11.5 : isWalking ? 6.5 : 2;
    const crabLiftAmp = isRunning ? 8.5 : isWalking ? 5 : 1;
    for (const side of [-1, 1]) {
      for (let l = 0; l < 3; l++) {
        const tripodPhase = (l + (side > 0 ? 0 : 1)) % 2 === 0 ? 0 : Math.PI;
        const phase = cycle + tripodPhase + l * 0.25;
        const legSwing = Math.sin(phase) * crabStrideAmp;
        const footLift = Math.max(0, -Math.cos(phase)) * crabLiftAmp;
        const startX = cx + side * (30 + l * 6);
        const startY = cy + 12 + l * 4;
        const kneeX = startX + side * (17 + (isRunning ? 2 : 0)) + legSwing * 0.35;
        const kneeY = startY - 8 - footLift * 0.35 + legSwing * 0.25;
        const footX = startX + side * 26 + legSwing;
        const footY = boss.y + boss.height - footLift;

        // Upper femur segment
        ctx.strokeStyle = isFlashing ? '#FDE68A' : '#9A3412';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(kneeX, kneeY);
        ctx.stroke();

        // Lower tibia segment
        ctx.strokeStyle = isFlashing ? '#FEF08A' : '#C2410C';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();

        // Joint armor cap
        ctx.fillStyle = isFlashing ? '#FEF9C3' : '#FB923C';
        ctx.beginPath();
        ctx.arc(kneeX, kneeY, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7C2D12';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Pointed crab claw foot tip
        ctx.fillStyle = isFlashing ? '#FEF08A' : '#EA580C';
        ctx.beginPath();
        ctx.moveTo(footX - 3, footY - 1);
        ctx.lineTo(footX + side * 7, footY + 1.5);
        ctx.lineTo(footX + 2, footY + 2.5);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Dual Giant Armored Crusher Pincers (Animated Snap)
    const clawSnap = Math.sin(time * 7) * 0.22 + (isTelegraphing ? 0.25 : 0);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(cx + side * 48, cy - 8);
      ctx.rotate(side * (-0.35 + Math.sin(time * 4) * 0.1));

      // Armored forearm segment
      ctx.strokeStyle = isFlashing ? '#FDE68A' : '#9A3412';
      ctx.lineWidth = 8.5;
      ctx.beginPath();
      ctx.moveTo(-side * 14, 13);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // Wrist joint ring
      ctx.fillStyle = isFlashing ? '#FEF08A' : '#FB923C';
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Upper crusher claw half
      ctx.fillStyle = isFlashing ? '#FEF08A' : '#F97316';
      ctx.beginPath();
      ctx.arc(0, -10, 18.5, Math.PI * (0.2 + clawSnap), Math.PI * 1.38);
      ctx.lineTo(0, -10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#7C2D12';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Specular sheen on claw
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(-side * 6, -18, 5, 2.2, -0.4 * side, 0, Math.PI * 2);
      ctx.fill();

      // Lower hinged thumb half
      ctx.fillStyle = isFlashing ? '#FDE68A' : '#DC2626';
      ctx.beginPath();
      ctx.arc(0, -10, 15.5, Math.PI * 1.45, Math.PI * (0.15 - clawSnap));
      ctx.lineTo(0, -10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Side Carapace Chitin Spikes
    ctx.fillStyle = isFlashing ? '#FEF08A' : '#991B1B';
    for (const side of [-1, 1]) {
      for (let sp = 0; sp < 3; sp++) {
        const sx = cx + side * (boss.width * 0.42 - sp * 4);
        const sy = cy - 4 + sp * 7;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 4);
        ctx.lineTo(sx + side * 9, sy);
        ctx.lineTo(sx, sy + 4);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Glossy Domed Shell Carapace with Layered Highlights
    const shellGrad = ctx.createRadialGradient(cx - 12, cy - 14, 8, cx, cy + 4, boss.width * 0.52);
    if (isFlashing) {
      shellGrad.addColorStop(0, '#FEF08A');
      shellGrad.addColorStop(1, '#F59E0B');
    } else {
      shellGrad.addColorStop(0, '#FDA4AF');
      shellGrad.addColorStop(0.28, '#F43F5E');
      shellGrad.addColorStop(0.65, '#DC2626');
      shellGrad.addColorStop(1, '#7F1D1D');
    }
    ctx.fillStyle = shellGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, boss.width * 0.46, boss.height * 0.37, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isFlashing ? '#FEF9C3' : '#7F1D1D';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cream underbelly trim & expressive mouth grin
    ctx.fillStyle = isFlashing ? '#FEF9C3' : '#FFE4E6';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 20, boss.width * 0.32, 9, 0, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#7F1D1D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 16);
    ctx.quadraticCurveTo(cx, cy + 21, cx + 14, cy + 16);
    ctx.stroke();

    // Carapace specular shine & ridge pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.beginPath();
    ctx.ellipse(cx - 14, cy - 11, 14, 5.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Folded Onsen Towel + Lucky Mini Yuzu balancing on top!
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(cx - 17, cy - 28, 34, 11, 4);
    ctx.fill();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(cx - 15, cy - 24, 30, 2.5);
    // Lucky Yuzu fruit on towel
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 33, 6.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy - 39, 3.8, 1.8, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // Eye stalks + expressive fierce eyes
    for (const side of [-1, 1]) {
      ctx.strokeStyle = '#B91C1C';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(cx + side * 15, cy - 10);
      ctx.lineTo(cx + side * 18, cy - 23);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx + side * 18, cy - 24, 7.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(cx + side * 16.2, cy - 24, 3.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx + side * 15.2, cy - 25.5, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Angry brow line
      ctx.strokeStyle = '#7F1D1D';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx + side * 11, cy - 30);
      ctx.lineTo(cx + side * 24, cy - 28);
      ctx.stroke();
    }
  } else {
    // Bamboo Spirit Dragon — Sculpted Eastern Serpentine Spirit Boss
    const dragonStrideAmp = isRunning ? 12.5 : isWalking ? 7 : 3;
    const dragonLiftAmp = isRunning ? 8.5 : 4;
    const drawDragonLeg = (hipX: number, hipY: number, phase: number, isBack: boolean) => {
      const stride = Math.sin(cycle + phase);
      const lift = Math.cos(cycle + phase) * dragonLiftAmp;
      const kneeX = hipX - 6 + stride * (dragonStrideAmp * 0.7);
      const kneeY = hipY + 14 + lift * 0.45;
      const pawX = hipX - 15 + stride * dragonStrideAmp;
      const pawY = hipY + 28 + lift * 0.7;

      ctx.save();
      ctx.strokeStyle = isFlashing
        ? '#FEF08A'
        : isBack
          ? '#064E3B'
          : '#059669';
      ctx.lineWidth = isBack ? 7 : 9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(pawX, pawY);
      ctx.stroke();

      // Jade elbow flame tuft & golden wrist cuff
      if (!isBack) {
        ctx.fillStyle = isFlashing ? '#FEF9C3' : '#34D399';
        ctx.beginPath();
        ctx.arc(kneeX + 2.5, kneeY - 1, 3.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(pawX, pawY - 1, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Three sharp golden Eastern dragon claws
      ctx.strokeStyle = isBack ? '#D97706' : '#FDE047';
      ctx.lineWidth = 2.5;
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath();
        ctx.moveTo(pawX, pawY);
        ctx.quadraticCurveTo(pawX - 7, pawY + 3 + c * 3.5, pawX - 12.5, pawY + 6 + c * 4.5);
        ctx.stroke();
      }
      ctx.restore();
    };

    const dragonSegments = [];
    const spineFreq = isRunning ? cycle * 0.65 : time * 6;
    for (let s = 5; s >= 1; s--) {
      dragonSegments.push({
        s,
        segX: cx + 18 + s * 16,
        segY: cy + 6 + Math.sin(spineFreq - s * 0.75) * (isRunning ? 16 : 14),
        segR: Math.max(10.5, 26.5 - s * 2.8),
      });
    }

    // Far-side dragon legs
    for (const seg of dragonSegments) {
      if (seg.s === 1 || seg.s === 3) {
        drawDragonLeg(seg.segX - 4, seg.segY + seg.segR * 0.45, seg.s === 1 ? Math.PI : 0, true);
      }
    }

    // Feathered Jade Tail Plume behind final segment
    const tailSeg = dragonSegments[0];
    if (tailSeg) {
      ctx.fillStyle = isFlashing ? '#FEF9C3' : '#34D399';
      ctx.beginPath();
      ctx.moveTo(tailSeg.segX + 6, tailSeg.segY - 4);
      ctx.quadraticCurveTo(tailSeg.segX + 28, tailSeg.segY - 18, tailSeg.segX + 36, tailSeg.segY - 2);
      ctx.quadraticCurveTo(tailSeg.segX + 24, tailSeg.segY + 14, tailSeg.segX + 6, tailSeg.segY + 6);
      ctx.closePath();
      ctx.fill();
    }

    // Trailing undulating sculpted jade scale segments + golden belly plates
    for (const { s, segX, segY, segR } of dragonSegments) {
      const segGrad = ctx.createRadialGradient(segX - 4, segY - 4, 2, segX, segY, segR);
      if (isFlashing) {
        segGrad.addColorStop(0, '#FEF9C3');
        segGrad.addColorStop(1, '#FBBF24');
      } else {
        segGrad.addColorStop(0, s % 2 === 0 ? '#34D399' : '#10B981');
        segGrad.addColorStop(1, '#065F46');
      }
      ctx.fillStyle = segGrad;
      ctx.beginPath();
      ctx.arc(segX, segY, segR, 0, Math.PI * 2);
      ctx.fill();

      // Golden belly crescent plate
      ctx.fillStyle = isFlashing ? '#FEF08A' : '#FDE68A';
      ctx.beginPath();
      ctx.arc(segX, segY + segR * 0.28, segR * 0.68, 0.25, Math.PI - 0.25);
      ctx.fill();

      // Jade dorsal crest fin
      ctx.fillStyle = '#6EE7B7';
      ctx.beginPath();
      ctx.moveTo(segX - 4, segY - segR + 2);
      ctx.lineTo(segX + 3, segY - segR - 10);
      ctx.lineTo(segX + 8, segY - segR + 3);
      ctx.closePath();
      ctx.fill();
    }

    // Near-side dragon legs
    for (const seg of dragonSegments) {
      if (seg.s === 1 || seg.s === 3) {
        drawDragonLeg(seg.segX + 2, seg.segY + seg.segR * 0.55, seg.s === 1 ? 0 : Math.PI, false);
      }
    }

    // Orbiting Bamboo Spirit Orbs
    for (let o = 0; o < 3; o++) {
      const ang = time * 3.2 + (o * Math.PI * 2) / 3;
      const ox = cx + Math.cos(ang) * 58;
      const oy = cy + Math.sin(ang) * 34;
      const orbGlow = ctx.createRadialGradient(ox, oy, 1, ox, oy, 12);
      orbGlow.addColorStop(0, '#FEF08A');
      orbGlow.addColorStop(0.5, 'rgba(52, 211, 153, 0.8)');
      orbGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = orbGlow;
      ctx.beginPath();
      ctx.arc(ox, oy, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Luminous Jade Spirit Ring behind head
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.62)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx - 2, cy, 43 + Math.sin(time * 5) * 2.5, 0, Math.PI * 2);
    ctx.stroke();

    // Sculpted Dragon Head + Cheek Mane Tufts
    const headGrad = ctx.createRadialGradient(cx - 10, cy - 8, 6, cx - 4, cy, 38);
    if (isFlashing) {
      headGrad.addColorStop(0, '#FEF9C3');
      headGrad.addColorStop(1, '#FBBF24');
    } else {
      headGrad.addColorStop(0, '#34D399');
      headGrad.addColorStop(0.55, '#059669');
      headGrad.addColorStop(1, '#022C22');
    }
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy, 35, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sculpted Forward Snout + Fangs
    ctx.fillStyle = isFlashing ? '#FDE68A' : '#047857';
    ctx.beginPath();
    ctx.roundRect(cx - 46, cy - 11, 26, 20, [10, 6, 8, 9]);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy + 7);
    ctx.lineTo(cx - 36, cy + 14);
    ctx.lineTo(cx - 32, cy + 7);
    ctx.moveTo(cx - 30, cy + 7);
    ctx.lineTo(cx - 27, cy + 13);
    ctx.lineTo(cx - 24, cy + 7);
    ctx.fill();

    // Jade Cheek Mane Tufts
    ctx.fillStyle = isFlashing ? '#FEF08A' : '#6EE7B7';
    ctx.beginPath();
    ctx.moveTo(cx + 18, cy - 12);
    ctx.lineTo(cx + 38, cy - 18);
    ctx.lineTo(cx + 26, cy);
    ctx.lineTo(cx + 40, cy + 10);
    ctx.lineTo(cx + 16, cy + 12);
    ctx.closePath();
    ctx.fill();

    // Swept Branching Golden Antler Horns
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 22);
    ctx.quadraticCurveTo(cx + 22, cy - 42, cx + 38, cy - 45);
    ctx.moveTo(cx + 18, cy - 34);
    ctx.lineTo(cx + 24, cy - 48);
    ctx.stroke();

    // Flowing Golden Whiskers
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.9)';
    ctx.lineWidth = 2.2;
    const whiskWave = Math.sin(time * 7) * 6;
    ctx.beginPath();
    ctx.moveTo(cx - 38, cy + 2);
    ctx.quadraticCurveTo(cx - 56, cy - 6 + whiskWave, cx - 68, cy + 9 + whiskWave);
    ctx.moveTo(cx - 35, cy + 8);
    ctx.quadraticCurveTo(cx - 52, cy + 18 - whiskWave, cx - 64, cy + 23);
    ctx.stroke();

    // Fierce Dragon Eye & Brow Ridge
    ctx.strokeStyle = '#022C22';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx - 29, cy - 13);
    ctx.lineTo(cx - 15, cy - 10);
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.ellipse(cx - 22, cy - 7, 7.5, 4.8, -0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx - 24.5, cy - 7, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Restore un-flipped transform before rendering Boss HP bar & label
  ctx.restore();

  // Stylized Segmented Boss HP Bar above head
  const barW = 128;
  const barH = 10;
  const barX = cx - barW / 2;
  const barY = boss.y - 28;
  const ratio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));

  ctx.fillStyle = 'rgba(10, 16, 13, 0.86)';
  ctx.beginPath();
  ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (ratio > 0) {
    const hpGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    hpGrad.addColorStop(0, '#DC2626');
    hpGrad.addColorStop(0.6, '#F97316');
    hpGrad.addColorStop(1, '#FBBF24');
    ctx.fillStyle = hpGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, Math.max(4, barW * ratio), barH, 3);
    ctx.fill();

    // Gloss highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.fillRect(barX + 1, barY + 1, Math.max(2, barW * ratio - 2), 3);
  }

  // Quarter-HP divider ticks
  ctx.fillStyle = 'rgba(10, 16, 13, 0.5)';
  for (let q = 1; q <= 3; q++) {
    ctx.fillRect(barX + (barW * q) / 4, barY, 1.5, barH);
  }

  // Boss Ruby Emblem on left of HP bar
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(barX - 6, barY + barH / 2, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(barX - 6, barY + barH / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 12px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(8, 14, 11, 0.88)';
  ctx.lineWidth = 3.5;
  const bossTitle =
    boss.dashTimer > 0
      ? `${boss.name} · ĐANG LAO!`
      : isRunning
        ? `${boss.name} · ĐANG RƯỢT ĐUỔI!`
        : boss.name;
  ctx.strokeText(bossTitle, cx, barY - 7);
  ctx.fillStyle = boss.dashTimer > 0 ? '#FCA5A5' : isRunning ? '#FDBA74' : '#FFFFFF';
  ctx.fillText(bossTitle, cx, barY - 7);

  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile, time: number) {
  ctx.save();
  ctx.translate(proj.x, proj.y);

  if (proj.kind === 'yuzu_orb') {
    const dir = proj.vx >= 0 ? 1 : -1;
    // Luminous motion trail cone
    const trailGrad = ctx.createLinearGradient(-dir * 34, 0, 0, 0);
    trailGrad.addColorStop(0, 'rgba(249, 115, 22, 0)');
    trailGrad.addColorStop(1, 'rgba(251, 146, 60, 0.65)');
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.moveTo(-dir * 34, 0);
    ctx.lineTo(0, -proj.radius * 0.85);
    ctx.lineTo(0, proj.radius * 0.85);
    ctx.closePath();
    ctx.fill();

    // Outer radiant energy halo
    ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius + 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(time * 14);
    const orbGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, proj.radius);
    orbGrad.addColorStop(0, '#FEF08A');
    orbGrad.addColorStop(0.55, '#F97316');
    orbGrad.addColorStop(1, '#C2410C');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();

    // Green citrus leaf crest
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.ellipse(3, -proj.radius + 1, 5, 2.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'meteor') {
    // Blazing comet tail upward
    const flameGrad = ctx.createLinearGradient(0, -proj.radius * 3.4, 0, 0);
    flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    flameGrad.addColorStop(0.45, 'rgba(249, 115, 22, 0.72)');
    flameGrad.addColorStop(1, 'rgba(254, 240, 138, 0.95)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(0, -proj.radius * 3.4);
    ctx.lineTo(-proj.radius * 0.95, 0);
    ctx.lineTo(proj.radius * 0.95, 0);
    ctx.closePath();
    ctx.fill();

    // Golden halo
    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius + 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(time * 16);
    const metGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, proj.radius);
    metGrad.addColorStop(0, '#FFFFFF');
    metGrad.addColorStop(0.4, '#FDE047');
    metGrad.addColorStop(1, '#D97706');
    ctx.fillStyle = metGrad;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'wave') {
    const dir = proj.vx >= 0 ? 1 : -1;
    ctx.scale(dir, 1);

    // Surging translucent tidal wave curve
    const waveGrad = ctx.createLinearGradient(-proj.radius, 0, proj.radius, 0);
    waveGrad.addColorStop(0, 'rgba(14, 165, 233, 0.15)');
    waveGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.85)');
    waveGrad.addColorStop(1, 'rgba(224, 242, 254, 0.95)');
    ctx.fillStyle = waveGrad;

    ctx.beginPath();
    ctx.moveTo(-proj.radius * 0.9, proj.radius * 0.85);
    ctx.quadraticCurveTo(0, -proj.radius * 0.25, proj.radius * 0.85, -proj.radius * 0.85);
    ctx.bezierCurveTo(
      proj.radius * 1.15,
      -proj.radius * 0.2,
      proj.radius * 0.75,
      proj.radius * 0.55,
      proj.radius * 0.35,
      proj.radius * 0.85
    );
    ctx.closePath();
    ctx.fill();

    // Foamy seafoam crest highlight
    ctx.strokeStyle = '#F0F9FF';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(proj.radius * 0.15, -proj.radius * 0.28);
    ctx.quadraticCurveTo(proj.radius * 0.75, -proj.radius * 0.82, proj.radius * 0.9, -proj.radius * 0.32);
    ctx.stroke();

    // Spray droplets
    ctx.fillStyle = '#E0F2FE';
    for (let d = 0; d < 3; d++) {
      ctx.beginPath();
      ctx.arc(-proj.radius * 0.4 + d * 10, -proj.radius * 0.5 + Math.sin(time * 18 + d) * 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (proj.kind === 'chili_bomb') {
    // Ember glow
    ctx.fillStyle = 'rgba(239, 68, 68, 0.32)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius + 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(time * 10);
    const bombGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, proj.radius);
    bombGrad.addColorStop(0, '#FCA5A5');
    bombGrad.addColorStop(0.55, '#EF4444');
    bombGrad.addColorStop(1, '#7F1D1D');
    ctx.fillStyle = bombGrad;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    // Sizzling fuse spark
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(0, -proj.radius - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'bamboo_blade') {
    ctx.rotate(time * 22);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius + 5, 0, Math.PI * 2);
    ctx.fill();
    for (let b = 0; b < 3; b++) {
      ctx.save();
      ctx.rotate((b * Math.PI * 2) / 3);
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(proj.radius * 0.65, -proj.radius * 0.45, proj.radius * 1.25, 0);
      ctx.quadraticCurveTo(proj.radius * 0.65, proj.radius * 0.45, 0, 0);
      ctx.fill();
      ctx.strokeStyle = '#DCFCE7';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'thunder_bolt') {
    const boltGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, proj.radius + 9);
    boltGrad.addColorStop(0, '#FEF08A');
    boltGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.85)');
    boltGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = boltGrad;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius + 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, -proj.radius * 1.5);
    ctx.lineTo(-6, -1);
    ctx.lineTo(1, -1);
    ctx.lineTo(-4, proj.radius * 1.5);
    ctx.lineTo(7, 1);
    ctx.lineTo(0, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Water Pulse Boss ground shockwave
    const pulseGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, proj.radius + 5);
    pulseGrad.addColorStop(0, '#F0ABFC');
    pulseGrad.addColorStop(0.6, '#A855F7');
    pulseGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = pulseGrad;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius + 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#E9D5FF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 0.9, Math.PI * 0.65, Math.PI * 1.35);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.arc(18, -6, 22, 0, Math.PI * 2);
  ctx.arc(38, 0, 16, 0, Math.PI * 2);
  ctx.arc(18, 6, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMountainRange(
  ctx: CanvasRenderingContext2D,
  width: number,
  groundY: number,
  offset: number,
  amplitude: number,
  freq: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let x = 0; x <= width + 20; x += 20) {
    const worldX = x + offset;
    const h =
      Math.sin(worldX * freq) * (amplitude * 0.55) +
      Math.cos(worldX * freq * 2.1) * (amplitude * 0.25) +
      amplitude * 0.8;
    ctx.lineTo(x, groundY - h);
  }
  ctx.lineTo(width, groundY);
  ctx.closePath();
  ctx.fill();
}

function drawBambooGrove(
  ctx: CanvasRenderingContext2D,
  width: number,
  groundY: number,
  offset: number,
  nightAlpha: number,
  customFoliageColor?: string,
  biome?: StageConfig['biome']
) {
  ctx.save();
  const baseColor =
    nightAlpha > 0.5
      ? 'rgba(20, 44, 34, 0.7)'
      : customFoliageColor ?? 'rgba(42, 92, 66, 0.36)';
  ctx.strokeStyle = baseColor;
  ctx.fillStyle = baseColor;

  const spacing = 95;
  const count = Math.ceil(width / spacing) + 2;
  const startIdx = Math.floor(offset / spacing);

  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const bx = idx * spacing - offset;
    const stalkHeight = 110 + ((idx * 37) % 85);
    const tilt = Math.sin(idx * 1.7) * 6;

    ctx.lineWidth = 5 + (idx % 3);
    ctx.beginPath();
    ctx.moveTo(bx, groundY);
    ctx.lineTo(bx + tilt, groundY - stalkHeight);
    ctx.stroke();

    if (biome === 'sakura_valley') {
      ctx.fillStyle = nightAlpha > 0.5 ? 'rgba(131, 68, 96, 0.48)' : 'rgba(244, 114, 182, 0.42)';
      ctx.beginPath();
      ctx.arc(bx + tilt, groundY - stalkHeight, 24 + (idx % 3) * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = baseColor;
    } else if (biome === 'aurora_snow') {
      ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.beginPath();
      ctx.moveTo(bx + tilt, groundY - stalkHeight - 16);
      ctx.lineTo(bx + tilt - 18, groundY - stalkHeight + 24);
      ctx.lineTo(bx + tilt + 18, groundY - stalkHeight + 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = baseColor;
    } else if (biome === 'golden_beach') {
      // Swaying palm fronds
      ctx.fillStyle = nightAlpha > 0.5 ? 'rgba(20, 83, 45, 0.55)' : 'rgba(22, 163, 74, 0.46)';
      for (let f = -2; f <= 2; f++) {
        ctx.beginPath();
        ctx.ellipse(bx + tilt + f * 10, groundY - stalkHeight + Math.abs(f) * 4, 16, 4.5, f * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = baseColor;
    } else if (biome === 'secret_forest' || biome === 'glowing_forest') {
      // Glowing cyan/magenta mushrooms at tree bases
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(45, 212, 191, 0.72)' : 'rgba(232, 121, 249, 0.65)';
      ctx.beginPath();
      ctx.arc(bx + 10, groundY - 10, biome === 'glowing_forest' ? 12 : 7, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = baseColor;
    } else if (biome === 'candy_planet') {
      // Lollipop swirl tops
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(244, 114, 182, 0.65)' : 'rgba(250, 204, 21, 0.65)';
      ctx.beginPath();
      ctx.arc(bx + tilt, groundY - stalkHeight, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = baseColor;
    } else if (biome === 'ocean') {
      // Swaying coral fronds & rising bubbles
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.beginPath();
      ctx.arc(bx + tilt, groundY - stalkHeight - 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = baseColor;
    } else if (biome === 'ice_mountain') {
      // Crystal spires
      ctx.fillStyle = 'rgba(186, 230, 253, 0.6)';
      ctx.beginPath();
      ctx.moveTo(bx + tilt, groundY - stalkHeight - 18);
      ctx.lineTo(bx + tilt - 10, groundY - stalkHeight + 16);
      ctx.lineTo(bx + tilt + 10, groundY - stalkHeight + 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = baseColor;
    } else {
      for (let seg = 1; seg <= 3; seg++) {
        const sy = groundY - (stalkHeight * seg) / 4;
        const sx = bx + (tilt * seg) / 4;
        ctx.beginPath();
        ctx.ellipse(sx + 10, sy - 4, 11, 3.2, -0.35, 0, Math.PI * 2);
        ctx.fill();
        if (seg % 2 === 0) {
          ctx.beginPath();
          ctx.ellipse(sx - 9, sy + 2, 10, 3, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  ctx.restore();
}

export function drawRainbowArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  const bands = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#38BDF8', '#6366F1', '#A855F7'];
  ctx.save();
  ctx.globalAlpha = Math.min(0.45, alpha * 0.45);
  ctx.lineWidth = 7;
  for (let i = 0; i < bands.length; i++) {
    ctx.strokeStyle = bands[i];
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(24, radius - i * 6.5), Math.PI, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHorizonVolcano(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  time: number,
  nightFactor: number
) {
  ctx.save();
  // Volcano cone
  ctx.fillStyle = nightFactor > 0.5 ? '#2B181A' : '#4B2E2B';
  ctx.beginPath();
  ctx.moveTo(cx - 115, groundY);
  ctx.lineTo(cx - 24, groundY - 155);
  ctx.lineTo(cx + 24, groundY - 155);
  ctx.lineTo(cx + 115, groundY);
  ctx.closePath();
  ctx.fill();

  // Lava glow at crater
  const lavaGlow = ctx.createRadialGradient(cx, groundY - 155, 4, cx, groundY - 155, 58);
  lavaGlow.addColorStop(0, 'rgba(251, 146, 60, 0.72)');
  lavaGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = lavaGlow;
  ctx.beginPath();
  ctx.arc(cx, groundY - 155, 58, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F97316';
  ctx.fillRect(cx - 20, groundY - 158, 40, 6);

  // Rising smoke puffs
  for (let s = 0; s < 4; s++) {
    const p = (time * 0.32 + s * 0.25) % 1;
    ctx.fillStyle = `rgba(203, 213, 225, ${(1 - p) * 0.32})`;
    ctx.beginPath();
    ctx.arc(cx + Math.sin(time + s) * 10, groundY - 166 - p * 68, 10 + p * 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHorizonFerrisWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  time: number,
  nightFactor: number
) {
  const cy = groundY - 96;
  const r = 68;
  ctx.save();
  // Support legs
  ctx.strokeStyle = nightFactor > 0.5 ? '#475569' : '#64748B';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 32, groundY + 14);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx + 32, groundY + 14);
  ctx.stroke();

  // Outer rim & spokes
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  const colors = ['#F43F5E', '#F59E0B', '#10B981', '#38BDF8', '#A855F7', '#FACC15'];
  for (let i = 0; i < 8; i++) {
    const ang = time * 0.35 + (i * Math.PI * 2) / 8;
    const gx = cx + Math.cos(ang) * r;
    const gy = cy + Math.sin(ang) * r;
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.32)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(gx, gy);
    ctx.stroke();

    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.roundRect(gx - 5, gy - 4, 10, 9, 3);
    ctx.fill();
  }
  ctx.restore();
}

export function drawHorizonTrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  trackY: number,
  time: number,
  nightFactor: number
) {
  ctx.save();
  // Viaduct railway line
  ctx.fillStyle = nightFactor > 0.5 ? 'rgba(30, 41, 59, 0.6)' : 'rgba(71, 85, 105, 0.42)';
  ctx.fillRect(0, trackY + 12, width, 4);

  const cycleW = width + 260;
  const tx = ((time * 74) % cycleW) - 180;

  // Steam puffs from locomotive
  for (let s = 0; s < 4; s++) {
    const p = (time * 1.4 + s * 0.25) % 1;
    ctx.fillStyle = `rgba(248, 250, 252, ${(1 - p) * 0.45})`;
    ctx.beginPath();
    ctx.arc(tx + 122 - p * 34, trackY - 12 - p * 22, 4 + p * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Two passenger carriages
  for (let c = 0; c < 2; c++) {
    const cx = tx + c * 42;
    ctx.fillStyle = c === 0 ? '#10B981' : '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(cx, trackY - 6, 36, 16, 4);
    ctx.fill();
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(cx + 6, trackY - 2, 7, 5);
    ctx.fillRect(cx + 21, trackY - 2, 7, 5);
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(cx + 9, trackY + 11, 3, 0, Math.PI * 2);
    ctx.arc(cx + 27, trackY + 11, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Locomotive engine
  const lx = tx + 86;
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.roundRect(lx, trackY - 10, 42, 20, 5);
  ctx.fill();
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(lx + 30, trackY - 17, 7, 7);
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(lx + 42, trackY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(lx + 10, trackY + 11, 3.5, 0, Math.PI * 2);
  ctx.arc(lx + 31, trackY + 11, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCollectible(ctx: CanvasRenderingContext2D, c: Collectible, time: number) {
  const bob = Math.sin(time * 4.5 + c.phase) * 5;
  const cx = c.x;
  const cy = c.y + bob;

  ctx.save();
  ctx.translate(cx, cy);

  if (c.kind === 'yuzu' || c.kind === 'golden_yuzu') {
    const isGold = c.kind === 'golden_yuzu';
    ctx.fillStyle = isGold ? 'rgba(251, 191, 36, 0.28)' : 'rgba(249, 115, 22, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, c.radius + 7, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(-4, -5, 2, 0, 0, c.radius);
    if (isGold) {
      grad.addColorStop(0, '#FEF08A');
      grad.addColorStop(0.6, '#FBBF24');
      grad.addColorStop(1, '#D97706');
    } else {
      grad.addColorStop(0, '#FDBA74');
      grad.addColorStop(0.55, '#F97316');
      grad.addColorStop(1, '#C2410C');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 1, c.radius, c.radius * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-4, -4, 3.5, 2, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.ellipse(4, -c.radius + 1, 6, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();

    if (isGold) {
      const angle = time * 4 + c.phase;
      ctx.fillStyle = '#FEF9C3';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * (c.radius + 5), Math.sin(angle) * (c.radius + 5), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (c.kind === 'shield') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, c.radius + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(-10, -5, 20, 10, 4);
    ctx.fill();
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-7, 0, 14, 2);
  } else if (c.kind === 'magnet') {
    ctx.fillStyle = 'rgba(52, 211, 153, 0.22)';
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, c.radius + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.arc(0, -1, 7, 0, Math.PI, false);
    ctx.stroke();
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(-9.2, -6, 4.5, 5);
    ctx.fillRect(4.7, -6, 4.5, 5);
  }

  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number) {
  ctx.save();

  if (obs.kind === 'rock') {
    const cx = obs.x + obs.width / 2;
    const baseY = obs.y + obs.height;
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(obs.x + 2, baseY);
    ctx.quadraticCurveTo(obs.x + 4, obs.y + 6, cx, obs.y + 2);
    ctx.quadraticCurveTo(obs.x + obs.width - 2, obs.y + 8, obs.x + obs.width - 2, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.ellipse(cx - 5, obs.y + 13, obs.width * 0.22, obs.height * 0.16, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ADE80';
    ctx.beginPath();
    ctx.ellipse(cx + 2, obs.y + 6, obs.width * 0.34, 6, 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (obs.kind === 'bamboo') {
    const stalks = 3;
    const gap = obs.width / stalks;
    for (let i = 0; i < stalks; i++) {
      const sx = obs.x + i * gap + 4;
      ctx.fillStyle = i % 2 === 0 ? '#15803D' : '#16A34A';
      ctx.beginPath();
      ctx.roundRect(sx, obs.y, 9, obs.height, 3);
      ctx.fill();

      ctx.fillStyle = '#BBF7D0';
      ctx.fillRect(sx, obs.y + obs.height * 0.35, 9, 2);
      ctx.fillRect(sx, obs.y + obs.height * 0.7, 9, 2);
    }
    ctx.fillStyle = '#D97706';
    ctx.fillRect(obs.x + 1, obs.y + 12, obs.width - 2, 5);
  } else if (obs.kind === 'croc') {
    const cx = obs.x + obs.width / 2;
    const baseY = obs.y + obs.height;
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.ellipse(cx, baseY - 12, obs.width * 0.48, 13, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(obs.x + 4, baseY - 12, obs.width - 8, 12);

    ctx.fillStyle = '#22C55E';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(obs.x + 18 + i * 11, baseY - 23, 4, Math.PI, 0);
      ctx.fill();
    }

    ctx.strokeStyle = '#052E16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(obs.x + 16, baseY - 14, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();

    const zOffset = Math.sin(time * 3 + obs.phase) * 4;
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '700 12px "Outfit", sans-serif';
    ctx.fillText('Z', obs.x + 12, obs.y - 4 + zOffset);
    ctx.font = '700 10px "Outfit", sans-serif';
    ctx.fillText('z', obs.x + 21, obs.y - 11 + zOffset);
  } else if (obs.kind === 'dragonfly') {
    const hover = Math.sin(time * 9 + obs.phase) * 4;
    const cx = obs.x + obs.width / 2;
    const cy = obs.y + obs.height / 2 + hover;

    const wingY = Math.sin(time * 28 + obs.phase) * 5;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.78)';
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy - 9 + wingY * 0.4, 15, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 8, cy - 6 - wingY * 0.4, 12, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.roundRect(cx - 2, cy - 3, 24, 6, 3);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(cx - 8, cy, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(cx - 11, cy - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (obs.kind === 'chili') {
    const cx = obs.x + obs.width / 2;
    const cy = obs.y + obs.height / 2;
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 10, 15, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FCA5A5';
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy, 2.5, 6, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 3, cy - 10);
    ctx.quadraticCurveTo(cx + 6, cy - 17, cx + 10, cy - 15);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawCapybara(
  ctx: CanvasRenderingContext2D,
  p: PlayerRenderInput,
  time: number
) {
  if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 16) % 2 === 0 && !p.feverActive) {
    return;
  }

  const furId = p.appearance.fur;
  const furOption = FUR_OPTIONS.find((f) => f.id === furId) ?? FUR_OPTIONS[0];
  let furMain = furOption.swatchColor;
  let furDark = furOption.secondaryColor ?? '#6B4426';

  if (typeof p.potionHue === 'number') {
    const ph = ((p.potionHue % 360) + 360) % 360;
    furMain = `hsl(${ph.toFixed(0)}, 78%, 60%)`;
    furDark = `hsl(${((ph + 24) % 360).toFixed(0)}, 70%, 38%)`;
  } else if (furId === 'rainbow') {
    const hue = (time * 95) % 360;
    const hue2 = (hue + 48) % 360;
    furMain = `hsl(${hue.toFixed(0)}, 82%, 58%)`;
    furDark = `hsl(${hue2.toFixed(0)}, 76%, 38%)`;
  } else if (furId === 'golden') {
    const shimmer = 58 + Math.sin(time * 5) * 6;
    furMain = `hsl(45, 94%, ${shimmer.toFixed(1)}%)`;
    furDark = '#B45309';
  } else if (furId === 'lava') {
    furMain = '#3F1D13';
    furDark = '#1C0D09';
  } else if (furId === 'ice') {
    furMain = '#BAE6FD';
    furDark = '#0284C7';
  } else if (furId === 'galaxy') {
    furMain = '#312E81';
    furDark = '#1E1B4B';
  } else if (furId === 'angel') {
    furMain = '#F8FAFC';
    furDark = '#CBD5E1';
  } else if (furId === 'ghost') {
    furMain = '#CCFBF1';
    furDark = '#5EEAD4';
  }

  const nameEffect = resolveNameEffect(p.appearance.name);
  const centerX = p.x + p.width / 2;
  const bottomY = p.y + p.height;
  const facing = p.facing ?? 1;

  ctx.save();
  ctx.translate(centerX, bottomY);
  ctx.scale(p.scaleX * facing, p.scaleY);

  // Name-based aura glow behind Capybara
  if (nameEffect.kind !== 'none') {
    const nGlow = ctx.createRadialGradient(0, -24, 6, 0, -24, 52);
    nGlow.addColorStop(0, nameEffect.glowRgba);
    nGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nGlow;
    ctx.beginPath();
    ctx.arc(0, -24, 52, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bioluminescent Glowing Food Aura
  if (p.glowingFoodActive) {
    const gfPulse = 0.45 + Math.sin(time * 6) * 0.12;
    const gfGlow = ctx.createRadialGradient(0, -24, 8, 0, -24, 58);
    gfGlow.addColorStop(0, `rgba(45, 212, 191, ${gfPulse.toFixed(2)})`);
    gfGlow.addColorStop(0.6, 'rgba(253, 224, 71, 0.2)');
    gfGlow.addColorStop(1, 'rgba(45, 212, 191, 0)');
    ctx.fillStyle = gfGlow;
    ctx.beginPath();
    ctx.arc(0, -24, 58, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ultra-Rare aura behind Capybara
  if (furId === 'ghost') {
    ctx.globalAlpha = 0.56 + Math.sin(time * 4) * 0.08;
    const ghostGlow = ctx.createRadialGradient(0, -24, 6, 0, -24, 46);
    ghostGlow.addColorStop(0, 'rgba(153, 246, 228, 0.35)');
    ghostGlow.addColorStop(1, 'rgba(153, 246, 228, 0)');
    ctx.fillStyle = ghostGlow;
    ctx.beginPath();
    ctx.arc(0, -24, 46, 0, Math.PI * 2);
    ctx.fill();
  } else if (furId === 'golden') {
    const goldAura = ctx.createRadialGradient(0, -22, 6, 0, -22, 48);
    goldAura.addColorStop(0, 'rgba(253, 224, 71, 0.42)');
    goldAura.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = goldAura;
    ctx.beginPath();
    ctx.arc(0, -22, 48, 0, Math.PI * 2);
    ctx.fill();
  } else if (furId === 'lava') {
    const lavaGlow = ctx.createRadialGradient(0, -22, 6, 0, -22, 48);
    lavaGlow.addColorStop(0, 'rgba(249, 115, 22, 0.36)');
    lavaGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = lavaGlow;
    ctx.beginPath();
    ctx.arc(0, -22, 48, 0, Math.PI * 2);
    ctx.fill();
  } else if (furId === 'ice') {
    const iceGlow = ctx.createRadialGradient(0, -22, 6, 0, -22, 48);
    iceGlow.addColorStop(0, 'rgba(125, 211, 252, 0.38)');
    iceGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = iceGlow;
    ctx.beginPath();
    ctx.arc(0, -22, 48, 0, Math.PI * 2);
    ctx.fill();
  } else if (furId === 'galaxy') {
    const galGlow = ctx.createRadialGradient(0, -24, 6, 0, -24, 48);
    galGlow.addColorStop(0, 'rgba(167, 139, 250, 0.35)');
    galGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = galGlow;
    ctx.beginPath();
    ctx.arc(0, -24, 48, 0, Math.PI * 2);
    ctx.fill();
  }

  if (p.magnetTimer > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(0, -p.height * 0.5, 44 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (p.feverActive) {
    ctx.save();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, -p.height * 0.45, 52, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const duckSquash = p.isDucking ? 0.68 : 1;
  const bodyH = 38 * duckSquash;
  const bodyW = p.isDucking ? 66 : 56;
  const isWalking = p.isGrounded && (p.isMoving ?? Math.abs(p.runCycle) > 0.01) && !p.feverActive;
  const isAirborne = !p.isGrounded && !p.feverActive;
  const walkBob = isWalking
    ? Math.abs(Math.sin(p.runCycle)) * (p.isDucking ? 2.0 : 4.0)
    : p.isGrounded && !p.feverActive
      ? Math.sin(time * 2.8) * 0.85
      : 0;
  const walkPitch = isWalking
    ? Math.sin(p.runCycle * 2) * 0.042
    : isAirborne
      ? Math.max(-0.16, Math.min(0.16, p.vy * 0.00025))
      : 0;
  const walkSquashX = isWalking ? 1 + Math.sin(p.runCycle * 2) * 0.04 : 1;
  const walkSquashY = isWalking ? 1 - Math.sin(p.runCycle * 2) * 0.04 : 1;
  const bodyY = (p.feverActive ? -30 : -bodyH / 2 - 8) - walkBob;

  if (p.isGrounded && furId !== 'ghost') {
    const shadowScale = 1 - Math.min(0.14, walkBob * 0.03);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 2, p.width * 0.46 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const drawCapyLeg = (hipX: number, hipY: number, phase: number, isBack: boolean) => {
    const isHind = hipX < 0;
    let footX = hipX;
    let footY = -0.5;
    let kneeX = hipX;
    let kneeY = (hipY + footY) * 0.5;
    let pawTilt = 0;

    if (isWalking) {
      const phaseAngle = p.runCycle + phase;
      const stride = Math.sin(phaseAngle);
      const lift = Math.max(0, -Math.cos(phaseAngle)) * (p.isDucking ? 3.8 : 6.4);
      const strideAmp = p.isDucking ? 5.6 : 7.6;
      footX = hipX + stride * strideAmp;
      footY = -0.5 - lift;
      kneeX = (hipX + footX) * 0.5 + (isHind ? 2.4 : -1.2) + stride * 1.4;
      kneeY = (hipY + footY) * 0.5 - lift * 0.24;
      pawTilt = lift > 0.7 ? -0.3 * stride : 0.08 * stride;
    } else if (isAirborne) {
      const riseTuck = p.vy < 0 ? 5.2 : 1.8;
      const reach = p.vy < 0 ? -3.5 : 4.2;
      footX = hipX + (isHind ? -reach : reach);
      footY = -2.2 - riseTuck;
      kneeX = (hipX + footX) * 0.5 + (isHind ? 3.2 : -2);
      kneeY = (hipY + footY) * 0.5 - 1.5;
      pawTilt = p.vy < 0 ? -0.25 : 0.18;
    } else {
      footX = hipX + (isBack ? -1 : 1);
      footY = -0.5;
      kneeX = hipX + (isHind ? 1.5 : -0.8);
      kneeY = (hipY + footY) * 0.5;
    }

    ctx.save();
    ctx.strokeStyle = isBack ? furDark : furMain;
    ctx.lineWidth = p.isDucking ? 6.8 : 8.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY);
    ctx.stroke();

    // Cute rounded chubby paw pad
    ctx.translate(footX + 1.5, footY);
    ctx.rotate(pawTilt);
    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.ellipse(0, -0.4, 4.9, 3.0, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 240, 235, 0.35)';
    ctx.beginPath();
    ctx.arc(-0.5, -0.5, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Angel Back Wing (behind torso)
  if (furId === 'angel') {
    const flap = Math.sin(time * 7.5) * 7;
    ctx.save();
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.moveTo(-6, bodyY - 4);
    ctx.quadraticCurveTo(-30, bodyY - 34 + flap, -38, bodyY - 12 + flap);
    ctx.quadraticCurveTo(-24, bodyY + 4, -6, bodyY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Ghost ethereal tail wisps
  if (furId === 'ghost') {
    ctx.save();
    ctx.fillStyle = 'rgba(153, 246, 228, 0.55)';
    for (let w = 0; w < 3; w++) {
      const wx = -26 - w * 9 + Math.sin(time * 5 + w) * 3;
      const wy = bodyY + 6 + Math.cos(time * 4 + w) * 4;
      ctx.beginPath();
      ctx.arc(wx, wy, 7 - w * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Far-side background legs (true quadruped diagonal trot)
  if (!p.feverActive) {
    const hipY = bodyY + bodyH * 0.28;
    drawCapyLeg(-16, hipY, Math.PI, true);
    drawCapyLeg(12, hipY, 0, true);
  }

  // Subtle gait body pitch + cute squash-and-stretch around torso center
  ctx.save();
  ctx.translate(0, bodyY);
  ctx.rotate(walkPitch);
  ctx.scale(walkSquashX, walkSquashY);
  ctx.translate(0, -bodyY);

  // Cute wagging little nub tail on rump
  if (furId !== 'ghost') {
    const tailWag = isWalking ? Math.sin(p.runCycle * 2.2) * 0.35 : Math.sin(time * 4) * 0.14;
    ctx.save();
    ctx.translate(-29, bodyY + 2);
    ctx.rotate(tailWag);
    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 4.2, 3.1, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Main Body
  ctx.fillStyle = furMain;
  ctx.beginPath();
  ctx.ellipse(-2, bodyY, bodyW * 0.5, bodyH * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ultra-Rare body coat textures (clipped inside torso ellipse)
  if (furId === 'galaxy' || furId === 'lava' || furId === 'ice' || furId === 'golden' || furId === 'rainbow') {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-2, bodyY, bodyW * 0.5, bodyH * 0.5, 0, 0, Math.PI * 2);
    ctx.clip();

    if (furId === 'galaxy') {
      const neb = ctx.createLinearGradient(-30, bodyY - 18, 28, bodyY + 18);
      neb.addColorStop(0, 'rgba(139, 92, 246, 0.65)');
      neb.addColorStop(0.5, 'rgba(14, 165, 233, 0.45)');
      neb.addColorStop(1, 'rgba(236, 72, 153, 0.5)');
      ctx.fillStyle = neb;
      ctx.fillRect(-36, bodyY - 24, 68, 48);
      ctx.fillStyle = '#FEF9C3';
      for (let s = 0; s < 10; s++) {
        const sx = -24 + ((s * 17) % 46);
        const sy = bodyY - 14 + ((s * 13) % 26);
        const tw = 0.45 + 0.55 * Math.sin(time * 4 + s);
        ctx.globalAlpha = tw;
        ctx.beginPath();
        ctx.arc(sx, sy, s % 3 === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (furId === 'lava') {
      const pulse = 0.7 + 0.3 * Math.sin(time * 6);
      ctx.strokeStyle = `rgba(251, 146, 60, ${pulse})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-22, bodyY - 6);
      ctx.lineTo(-10, bodyY + 2);
      ctx.lineTo(-2, bodyY - 8);
      ctx.lineTo(10, bodyY + 5);
      ctx.lineTo(19, bodyY - 3);
      ctx.moveTo(-14, bodyY + 10);
      ctx.lineTo(0, bodyY + 4);
      ctx.lineTo(14, bodyY + 11);
      ctx.stroke();
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (furId === 'ice') {
      const frost = ctx.createLinearGradient(-26, bodyY - 18, 24, bodyY + 18);
      frost.addColorStop(0, 'rgba(240, 249, 255, 0.75)');
      frost.addColorStop(1, 'rgba(56, 189, 248, 0.45)');
      ctx.fillStyle = frost;
      ctx.fillRect(-34, bodyY - 24, 66, 48);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-14, bodyY - 4);
      ctx.lineTo(-6, bodyY - 11);
      ctx.lineTo(2, bodyY - 4);
      ctx.moveTo(8, bodyY + 5);
      ctx.lineTo(15, bodyY - 2);
      ctx.stroke();
    } else if (furId === 'golden') {
      const shineX = -32 + ((time * 55) % 72);
      const goldShine = ctx.createLinearGradient(shineX - 10, bodyY - 20, shineX + 10, bodyY + 20);
      goldShine.addColorStop(0, 'rgba(255, 255, 255, 0)');
      goldShine.addColorStop(0.5, 'rgba(254, 249, 195, 0.65)');
      goldShine.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = goldShine;
      ctx.fillRect(-34, bodyY - 24, 68, 48);
    } else if (furId === 'rainbow') {
      const band = ctx.createLinearGradient(-28, bodyY, 26, bodyY);
      const hOff = (time * 95) % 360;
      band.addColorStop(0, `hsla(${hOff}, 90%, 62%, 0.45)`);
      band.addColorStop(0.5, `hsla(${(hOff + 110) % 360}, 90%, 62%, 0.45)`);
      band.addColorStop(1, `hsla(${(hOff + 220) % 360}, 90%, 62%, 0.45)`);
      ctx.fillStyle = band;
      ctx.fillRect(-34, bodyY - 24, 68, 48);
    }
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(255, 245, 232, 0.2)';
  ctx.beginPath();
  ctx.ellipse(-2, bodyY + bodyH * 0.16, bodyW * 0.34, bodyH * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Equipped Outfits (clipped cleanly to torso silhouette + trailing cape)
  const outfitId = p.appearance.outfit ?? 'none';
  if (outfitId !== 'none') {
    if (outfitId === 'royal_cape') {
      const flutter = Math.sin(time * 8 + p.runCycle) * 4;
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(8, bodyY - 12);
      ctx.quadraticCurveTo(-22, bodyY - 10, -35, bodyY + 12 + flutter);
      ctx.lineTo(-14, bodyY + 15 + flutter * 0.4);
      ctx.quadraticCurveTo(0, bodyY + 10, 12, bodyY - 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(-35, bodyY + 10 + flutter, 21, 4);
    }

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-2, bodyY, bodyW * 0.5, bodyH * 0.5, 0, 0, Math.PI * 2);
    ctx.clip();

    if (outfitId === 'overall') {
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(-32, bodyY - 4, 42, 28);
      // Straps
      ctx.fillRect(0, bodyY - 20, 6, 22);
      ctx.fillRect(-14, bodyY - 20, 5, 22);
      // Golden buttons + belly pocket
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(3, bodyY - 2, 2, 0, Math.PI * 2);
      ctx.arc(-11, bodyY - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1D4ED8';
      ctx.beginPath();
      ctx.roundRect(-12, bodyY + 2, 16, 10, 3);
      ctx.fill();
    } else if (outfitId === 'yukata') {
      ctx.fillStyle = '#0D9488';
      ctx.fillRect(-32, bodyY - 18, 48, 42);
      ctx.strokeStyle = '#99F6E4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, bodyY - 18);
      ctx.lineTo(16, bodyY + 18);
      ctx.stroke();
      // Obi waist sash
      ctx.fillStyle = '#FB7185';
      ctx.fillRect(-14, bodyY - 18, 9, 38);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(-11, bodyY - 4, 4, 8);
    } else if (outfitId === 'strawberry_hoodie') {
      ctx.fillStyle = '#FB7185';
      ctx.fillRect(-32, bodyY - 18, 48, 42);
      // Green strawberry leaf collar + yellow seeds
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.moveTo(6, bodyY - 18);
      ctx.lineTo(18, bodyY - 10);
      ctx.lineTo(10, bodyY - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      for (const [sx, sy] of [[-18, -4], [-8, 6], [2, -2], [-15, 9], [4, 8]]) {
        ctx.beginPath();
        ctx.arc(sx, bodyY + sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (outfitId === 'ninja') {
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(-32, bodyY - 18, 48, 42);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(-10, bodyY - 18, 6, 38);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-2, bodyY - 10);
      ctx.lineTo(14, bodyY + 8);
      ctx.stroke();
    } else if (outfitId === 'astronaut') {
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(-32, bodyY - 18, 48, 42);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-6, bodyY - 18, 4, 38);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(3, bodyY - 4, 7, 5);
    }
    ctx.restore();
  }

  const headBob = isWalking ? Math.sin(p.runCycle * 2) * 1.4 : 0;
  const headX = p.isDucking ? 24 : 20;
  const headY = (p.isDucking ? bodyY - 6 : bodyY - 12) + headBob;

  if (p.appearance.neck === 'scarf') {
    const flutter = Math.sin(time * 10) * 3;
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.roundRect(headX - 18, headY + 4, 24, 9, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(headX - 15, headY + 8);
    ctx.lineTo(headX - 31, headY + 13 + flutter);
    ctx.lineTo(headX - 28, headY + 20 + flutter);
    ctx.lineTo(headX - 12, headY + 12);
    ctx.closePath();
    ctx.fill();
  } else if (p.appearance.neck === 'bell') {
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(headX - 14, headY + 7);
    ctx.quadraticCurveTo(headX - 2, headY + 13, headX + 8, headY + 7);
    ctx.stroke();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(headX + 2, headY + 13, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.appearance.neck === 'sakura') {
    const petals = [-10, -2, 6];
    for (let i = 0; i < petals.length; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#F472B6' : '#FBCFE8';
      ctx.beginPath();
      ctx.arc(headX + petals[i], headY + 9 + (i === 1 ? 2 : 0), 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(headX + petals[i], headY + 9 + (i === 1 ? 2 : 0), 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.appearance.neck === 'bowtie') {
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.moveTo(headX + 2, headY + 12);
    ctx.lineTo(headX - 5, headY + 7);
    ctx.lineTo(headX - 5, headY + 17);
    ctx.closePath();
    ctx.moveTo(headX + 2, headY + 12);
    ctx.lineTo(headX + 9, headY + 7);
    ctx.lineTo(headX + 9, headY + 17);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FDA4AF';
    ctx.beginPath();
    ctx.arc(headX + 2, headY + 12, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.appearance.neck === 'clover_tie') {
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(headX - 13, headY + 7);
    ctx.quadraticCurveTo(headX - 2, headY + 12, headX + 7, headY + 7);
    ctx.stroke();
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.moveTo(headX + 2, headY + 11);
    ctx.lineTo(headX + 6, headY + 19);
    ctx.lineTo(headX + 2, headY + 23);
    ctx.lineTo(headX - 2, headY + 19);
    ctx.closePath();
    ctx.fill();
  } else if (p.appearance.neck === 'gold_chain') {
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(headX - 14, headY + 7);
    ctx.quadraticCurveTo(headX - 1, headY + 15, headX + 8, headY + 7);
    ctx.stroke();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(headX + 1, headY + 15, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  } else if (p.appearance.neck === 'pearl_necklace') {
    for (let i = 0; i < 6; i++) {
      const px = headX - 12 + i * 4.2;
      const py = headY + 8 + Math.sin((i / 5) * Math.PI) * 5;
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.appearance.neck === 'royal_medal') {
    ctx.strokeStyle = '#9333EA';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(headX - 13, headY + 7);
    ctx.quadraticCurveTo(headX - 1, headY + 14, headX + 8, headY + 7);
    ctx.stroke();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(headX + 1, headY + 15, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(headX + 1, headY + 15, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const earWiggle = isWalking ? Math.sin(p.runCycle * 1.5) * 0.16 : 0;
  ctx.fillStyle = furDark;
  ctx.beginPath();
  ctx.ellipse(headX - 8, headY - 14, 5, 7, -0.3 + earWiggle, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = furMain;
  ctx.beginPath();
  ctx.roundRect(headX - 15, headY - 13, 34, 24, [12, 10, 9, 11]);
  ctx.fill();

  if (furId === 'galaxy') {
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(headX - 6, headY - 7, 1.3, 0, Math.PI * 2);
    ctx.arc(headX + 4, headY - 9, 1.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (furId === 'lava') {
    ctx.strokeStyle = '#FB923C';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(headX - 10, headY - 6);
    ctx.lineTo(headX - 3, headY - 1);
    ctx.lineTo(headX + 2, headY - 6);
    ctx.stroke();
  }

  ctx.fillStyle = furDark;
  ctx.beginPath();
  ctx.roundRect(headX + 8, headY - 8, 12, 16, 6);
  ctx.fill();

  ctx.fillStyle = furId === 'lava' ? '#FDE047' : '#291709';
  ctx.beginPath();
  ctx.ellipse(headX + 16, headY - 3, 2.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = furId === 'lava' ? '#FB923C' : '#291709';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(headX + 14, headY + 2);
  ctx.quadraticCurveTo(headX + 12, headY + 5, headX + 9, headY + 4);
  ctx.stroke();

  ctx.fillStyle = furDark;
  ctx.beginPath();
  ctx.ellipse(headX - 12, headY - 12, 4.5, 6.5, -0.2 - earWiggle, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = furId === 'ice' ? 'rgba(125, 211, 252, 0.6)' : 'rgba(251, 113, 133, 0.56)';
  ctx.beginPath();
  ctx.ellipse(headX + 1, headY + 3, 4.8, 3.0, 0, 0, Math.PI * 2);
  ctx.fill();

  if (p.appearance.head === 'sunglasses' || p.photoPose === 'cool') {
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(headX - 4, headY - 8, 13, 8, 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(headX - 12, headY - 5);
    ctx.lineTo(headX - 4, headY - 5);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(headX - 2, headY - 6, 4, 2);
  } else {
    const isBlinking = p.blinkTimer > 0;
    const eyeInk = furId === 'galaxy' ? '#FEF08A' : furId === 'lava' ? '#FB923C' : '#1E1108';
    ctx.strokeStyle = eyeInk;
    ctx.fillStyle = eyeInk;
    ctx.lineWidth = 2.2;
    if (isBlinking || p.feverActive || p.photoPose === 'happy' || p.photoPose === 'zen') {
      ctx.beginPath();
      if (p.photoPose === 'zen') {
        ctx.arc(headX + 1, headY - 4, 3.5, 0.3, Math.PI - 0.3);
      } else {
        ctx.arc(headX + 1, headY - 3, 3.5, Math.PI + 0.3, -0.3);
      }
      ctx.stroke();
    } else if (!p.isGrounded && p.vy < -120) {
      ctx.beginPath();
      ctx.arc(headX + 1, headY - 4, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(headX + 2, headY - 5, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(headX - 3, headY - 4);
      ctx.lineTo(headX + 5, headY - 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(headX + 1, headY - 3, 2.2, 0, Math.PI);
      ctx.fill();
    }
  }

  // Angel Foreground Wing & Floating Golden Halo
  if (furId === 'angel') {
    const flap = Math.sin(time * 7.5 + 0.3) * 6;
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2, bodyY - 2);
    ctx.quadraticCurveTo(-24, bodyY - 28 + flap, -34, bodyY - 8 + flap);
    ctx.quadraticCurveTo(-22, bodyY + 6, -2, bodyY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing golden Halo above head
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(headX - 1, headY - 23 + Math.sin(time * 4) * 1.4, 12, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const accessoryY = headY - 13;
  if (p.appearance.head === 'towel') {
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(headX - 10, accessoryY - 6, 20, 8, 3);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.strokeRect(headX - 7, accessoryY - 4, 14, 3);
  } else if (p.appearance.head === 'lotus') {
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.ellipse(headX - 1, accessoryY - 3, 18, 5, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.ellipse(headX - 1, accessoryY - 5, 11, 2.5, -0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.appearance.head === 'straw_hat') {
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.ellipse(headX - 1, accessoryY - 2, 20, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    ctx.roundRect(headX - 11, accessoryY - 11, 20, 9, [6, 6, 1, 1]);
    ctx.fill();
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(headX - 11, accessoryY - 5, 20, 2.8);
  } else if (p.appearance.head === 'flower_clip') {
    const fx = headX - 8;
    const fy = accessoryY + 1;
    ctx.fillStyle = '#FFFFFF';
    for (let k = 0; k < 5; k++) {
      const ang = (k * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(ang) * 4, fy + Math.sin(ang) * 4, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.appearance.head === 'bunny_ears') {
    const earBop = isWalking ? Math.sin(p.runCycle * 1.6) * 0.14 : 0;
    for (const off of [-6, 2]) {
      ctx.save();
      ctx.translate(headX + off, accessoryY);
      ctx.rotate(earBop - 0.12);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(0, -10, 4, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FBCFE8';
      ctx.beginPath();
      ctx.ellipse(0, -10, 2, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (p.appearance.head === 'chef_hat') {
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(headX - 9, accessoryY - 8, 18, 9);
    ctx.beginPath();
    ctx.arc(headX - 5, accessoryY - 11, 7, 0, Math.PI * 2);
    ctx.arc(headX + 5, accessoryY - 11, 7, 0, Math.PI * 2);
    ctx.arc(headX, accessoryY - 13, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.strokeRect(headX - 9, accessoryY - 3, 18, 3);
  } else if (p.appearance.head === 'wizard_hat') {
    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    ctx.ellipse(headX - 1, accessoryY - 1, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(headX - 11, accessoryY - 1);
    ctx.lineTo(headX - 4, accessoryY - 21);
    ctx.lineTo(headX + 10, accessoryY - 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(headX - 1, accessoryY - 9, 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.appearance.head === 'crown') {
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(headX - 9, accessoryY + 1);
    ctx.lineTo(headX - 11, accessoryY - 9);
    ctx.lineTo(headX - 4, accessoryY - 4);
    ctx.lineTo(headX, accessoryY - 11);
    ctx.lineTo(headX + 4, accessoryY - 4);
    ctx.lineTo(headX + 11, accessoryY - 9);
    ctx.lineTo(headX + 9, accessoryY + 1);
    ctx.closePath();
    ctx.fill();
  }

  const hasTopHat =
    p.appearance.head === 'towel' ||
    p.appearance.head === 'lotus' ||
    p.appearance.head === 'crown' ||
    p.appearance.head === 'straw_hat' ||
    p.appearance.head === 'chef_hat' ||
    p.appearance.head === 'wizard_hat';
  const stackBaseY =
    p.appearance.head === 'wizard_hat' || p.appearance.head === 'chef_hat'
      ? accessoryY - 18
      : hasTopHat
      ? accessoryY - 11
      : accessoryY - 5;
  for (let i = 0; i < p.yuzuStackCount; i++) {
    const wobble = Math.sin(time * 6 + i * 0.9) * (i * 1.1) - p.vy * 0.004 * i;
    const yx = headX - 1 + wobble;
    const yy = stackBaseY - i * 11;
    const r = Math.max(5.5, 7.5 - i * 0.35);

    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.ellipse(yx, yy, r, r * 0.88, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.arc(yx - 2, yy - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    if (i === p.yuzuStackCount - 1) {
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(yx + 2, yy - r, 4, 2, -0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore(); // Close gait body pitch transform

  // Near-side foreground legs (in front of torso, opposite diagonal phase)
  if (!p.feverActive) {
    const hipY = bodyY + bodyH * 0.3;
    drawCapyLeg(-11, hipY, 0, false);
    drawCapyLeg(16, hipY, Math.PI, false);
  }

  // Ultra-Rare Foreground Particles (Golden sparkles, Lava embers, Ice frost mist/crystals)
  if (furId === 'golden') {
    for (let g = 0; g < 4; g++) {
      const ang = time * 2.8 + (g * Math.PI) / 2;
      const gx = Math.cos(ang) * 34;
      const gy = -24 + Math.sin(ang) * 20;
      const sc = 0.6 + 0.4 * Math.sin(time * 7 + g);
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(gx, gy, 2.6 * sc, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (furId === 'lava') {
    for (let e = 0; e < 4; e++) {
      const pProg = (time * 1.1 + e * 0.25) % 1;
      const ex = -18 + e * 14 + Math.sin(time * 5 + e) * 4;
      const ey = -10 - pProg * 36;
      ctx.fillStyle = `rgba(251, 146, 60, ${(1 - pProg).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 2.4 * (1 - pProg * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (furId === 'ice') {
    for (let c = 0; c < 4; c++) {
      const ang = time * 1.9 + (c * Math.PI) / 2;
      const ix = Math.cos(ang) * 35;
      const iy = -24 + Math.sin(ang) * 18;
      ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
      ctx.beginPath();
      ctx.arc(ix, iy, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ix - 3, iy);
      ctx.lineTo(ix + 3, iy);
      ctx.moveTo(ix, iy - 3);
      ctx.lineTo(ix, iy + 3);
      ctx.stroke();
    }
  } else if (furId === 'rainbow') {
    for (let r = 0; r < 4; r++) {
      const ang = time * 3 + (r * Math.PI) / 2;
      const rx = Math.cos(ang) * 36;
      const ry = -24 + Math.sin(ang) * 18;
      ctx.fillStyle = `hsl(${((time * 120 + r * 90) % 360).toFixed(0)}, 90%, 66%)`;
      ctx.beginPath();
      ctx.arc(rx, ry, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (p.feverActive) {
    ctx.fillStyle = '#E0F2FE';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(i * 13, -24 + Math.sin(time * 8 + i) * 1.5, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.roundRect(-36, -24, 72, 24, [4, 4, 12, 12]);
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-36, -15);
    ctx.lineTo(36, -15);
    ctx.stroke();
  }

  // Name-based Orbiting & Rising Foreground Effects
  if (nameEffect.kind !== 'none') {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const ang = time * 2.5 + (i * Math.PI) / 2;
      const ox = Math.cos(ang) * 38;
      const oy = -26 + Math.sin(ang) * 19;
      ctx.fillStyle = i % 2 === 0 ? nameEffect.primaryColor : nameEffect.secondaryColor;
      if (nameEffect.kind === 'fire') {
        const lift = ((time * 1.3 + i * 0.25) % 1);
        ctx.globalAlpha = 1 - lift;
        ctx.beginPath();
        ctx.arc(-16 + i * 11, -10 - lift * 38, 3 * (1 - lift * 0.4), 0, Math.PI * 2);
        ctx.fill();
      } else if (nameEffect.kind === 'royal') {
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(ox, oy, 2.8, 0, Math.PI * 2);
        ctx.fill();
        if (i === 0) {
          ctx.fillStyle = '#FACC15';
          ctx.beginPath();
          ctx.arc(14, -56 + Math.sin(time * 4) * 2, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (nameEffect.kind === 'ocean') {
        const rise = ((time * 0.9 + i * 0.25) % 1);
        ctx.globalAlpha = 0.8 - rise * 0.6;
        ctx.strokeStyle = nameEffect.secondaryColor;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(-18 + i * 12 + Math.sin(time * 4 + i) * 3, -12 - rise * 40, 3.2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (nameEffect.kind === 'rainbow') {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = `hsl(${((time * 120 + i * 90) % 360).toFixed(0)}, 92%, 65%)`;
        ctx.beginPath();
        ctx.arc(ox, oy, 2.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = 0.72 + 0.28 * Math.sin(time * 5 + i);
        ctx.beginPath();
        ctx.arc(ox, oy, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Crafted Floating Balloons trailing Capybara
  if (p.balloonsActive) {
    ctx.save();
    const balloonColors = ['#F43F5E', '#38BDF8', '#FACC15'];
    for (let b = 0; b < 3; b++) {
      const bx = -16 + b * 14 + Math.sin(time * 3.2 + b) * 4;
      const by = -66 - (b === 1 ? 8 : 0) + Math.cos(time * 3.6 + b) * 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(bx, by + 10);
      ctx.lineTo(-4, -22);
      ctx.stroke();
      ctx.fillStyle = balloonColors[b];
      ctx.beginPath();
      ctx.ellipse(bx, by, 7.5, 9.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(bx - 2, by - 3.5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (p.hasShield) {
    const shieldGrad = ctx.createRadialGradient(2, -p.height * 0.48, 8, 2, -p.height * 0.48, 44);
    shieldGrad.addColorStop(0, 'rgba(52, 211, 153, 0.04)');
    shieldGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.16)');
    shieldGrad.addColorStop(1, 'rgba(110, 231, 183, 0.32)');
    ctx.fillStyle = shieldGrad;
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.88)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(2, -p.height * 0.48, 43, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Orbiting Lotus Petals around Shield
    for (let pt = 0; pt < 4; pt++) {
      const a = time * 3.4 + (pt * Math.PI) / 2;
      const px = 2 + Math.cos(a) * 43;
      const py = -p.height * 0.48 + Math.sin(a) * 35;
      ctx.fillStyle = '#6EE7B7';
      ctx.beginPath();
      ctx.ellipse(px, py, 5.5, 2.8, a + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawPet(
  ctx: CanvasRenderingContext2D,
  pet: PetRenderInput,
  time: number
) {
  if (pet.id === 'none') return;
  const facing = pet.facing ?? 1;
  const isMoving = pet.isMoving ?? true;
  const phase = pet.hopPhase ?? time * 7;
  const externalJump = pet.jumpOffset ?? 0;
  const hop =
    externalJump > 0
      ? externalJump
      : isMoving
      ? Math.abs(Math.sin(phase)) * (pet.id === 'frog' ? 9.5 : pet.id === 'shiba' ? 5 : 3.2)
      : pet.isExcited
      ? Math.abs(Math.sin(time * 9)) * 4.5
      : Math.sin(time * 2.5) * 0.8;

  ctx.save();
  ctx.translate(pet.x, pet.y - hop);
  ctx.scale(facing, 1);

  // Subtle ground shadow
  const shadowScale = 1 - Math.min(0.28, hop * 0.022);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, hop + 2, 13 * shadowScale, 3.2 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Active support dash aura when pet swoops to auto-collect yuzu
  if (pet.isDashing) {
    const dashGlow = ctx.createRadialGradient(0, -12, 4, 0, -12, 24);
    dashGlow.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
    dashGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = dashGlow;
    ctx.beginPath();
    ctx.arc(0, -12, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  if (pet.id === 'duckling') {
    const waddle = isMoving ? Math.sin(phase * 1.6) * 0.14 : Math.sin(time * 3) * 0.03;
    const footSwing = isMoving ? Math.sin(phase * 1.8) * 4.8 : 0;
    const wingFlap = isMoving ? Math.sin(time * 22) * 2.8 : Math.sin(time * 6) * 0.8;
    ctx.rotate(waddle);
    // Animated running feet
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.ellipse(-4 - footSwing, -1.5, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(4 + footSwing, -1.5, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Plump yellow body
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.ellipse(-1, -10, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Expressive flapping wing
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    ctx.ellipse(-3, -10 + wingFlap, 6.5, 4, -0.25 - wingFlap * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(7, -18, 7.5, 0, Math.PI * 2);
    ctx.fill();
    // Orange beak
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.ellipse(15, -17, 4.8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye & blush
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(9, -20, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
    ctx.beginPath();
    ctx.arc(6, -16, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (pet.id === 'frog') {
    const kick = isMoving ? Math.sin(phase) * 4 : 0;
    // Hind legs kicking on leap
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.ellipse(-8 - kick * 0.6, -4 + Math.max(0, kick) * 0.4, 6.5, 3.5, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16A34A';
    ctx.beginPath();
    ctx.ellipse(6 + kick * 0.4, -3, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Green body
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.ellipse(0, -10, 13, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cream belly
    ctx.fillStyle = '#DCFCE7';
    ctx.beginPath();
    ctx.ellipse(2, -7, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Big frog eyes
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(3, -19, 4.5, 0, Math.PI * 2);
    ctx.arc(9, -19, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(3, -19, 3, 0, Math.PI * 2);
    ctx.arc(9, -19, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(4, -19, 1.5, 0, Math.PI * 2);
    ctx.arc(10, -19, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Cute mini lotus leaf hat
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.ellipse(0, -23, 9, 2.6, -0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (pet.id === 'turtle') {
    const flipperSwing = isMoving ? Math.sin(phase * 1.6) * 4.2 : 0;
    const shellRock = isMoving ? Math.sin(phase * 1.2) * 0.07 : 0;
    ctx.rotate(shellRock);
    // Animated flippers
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.ellipse(-6 - flipperSwing, -2.5, 4.8, 2.8, -0.15, 0, Math.PI * 2);
    ctx.ellipse(7 + flipperSwing, -2.5, 4.8, 2.8, 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Shell dome
    ctx.fillStyle = '#0D9488';
    ctx.beginPath();
    ctx.arc(0, -6, 13, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#99F6E4';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -6, 8, Math.PI + 0.3, -0.3);
    ctx.stroke();
    // Warm underbelly rim
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(-13, -6, 26, 3);
    // Bobbing Head
    const headBob = isMoving ? Math.sin(phase * 2) * 1.6 : Math.sin(time * 3) * 0.8;
    ctx.fillStyle = '#14B8A6';
    ctx.beginPath();
    ctx.arc(13 + headBob * 0.5, -11 + headBob * 0.4, 5.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(15 + headBob * 0.5, -12 + headBob * 0.4, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (pet.id === 'shiba') {
    const trot = isMoving ? Math.sin(phase * 1.7) * 5.2 : 0;
    const tailWag = Math.sin(time * (isMoving || pet.isExcited ? 18 : 11)) * 0.36;

    // Curled fluffy Shiba tail
    ctx.save();
    ctx.translate(-12, -13);
    ctx.rotate(tailWag);
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.arc(-2, -4, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF7ED';
    ctx.beginPath();
    ctx.arc(-3, -5, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Far legs
    ctx.fillStyle = '#C2410C';
    ctx.beginPath();
    ctx.roundRect(-9 - trot * 0.6, -7, 4.5, 7.5, 2);
    ctx.roundRect(4 + trot * 0.6, -7, 4.5, 7.5, 2);
    ctx.fill();

    // Shiba golden-orange body & cream chest
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.ellipse(-1, -11, 13, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF7ED';
    ctx.beginPath();
    ctx.ellipse(2, -9, 8.5, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Near legs + cream paws
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.roundRect(-6 + trot, -7, 4.5, 7.5, 2);
    ctx.roundRect(7 - trot, -7, 4.5, 7.5, 2);
    ctx.fill();
    ctx.fillStyle = '#FFF7ED';
    ctx.fillRect(-6 + trot, -2, 4.5, 2);
    ctx.fillRect(7 - trot, -2, 4.5, 2);

    // Emerald bandana scarf
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.roundRect(2, -16, 11, 4.5, 2);
    ctx.fill();

    // Shiba head & perky ears
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.moveTo(4, -22);
    ctx.lineTo(1, -30);
    ctx.lineTo(8, -25);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.arc(10, -20, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.moveTo(9, -24);
    ctx.lineTo(10, -32);
    ctx.lineTo(14, -25);
    ctx.closePath();
    ctx.fill();

    // Cream cheeks & muzzle
    ctx.fillStyle = '#FFF7ED';
    ctx.beginPath();
    ctx.ellipse(12, -17.5, 6.8, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(18, -19, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Wet nose, dark bright eyes & rosy cheek
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(20.5, -19.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(13, -21.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
    ctx.beginPath();
    ctx.arc(10.5, -17.5, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (pet.id === 'otter') {
    const glide = isMoving ? Math.sin(phase * 1.5) * 3.5 : 0;
    // Sleek otter tail
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.ellipse(-14, -7 + glide * 0.3, 10, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Feet
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(-5 - glide, -1.8, 3.8, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(5 + glide, -1.8, 3.8, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body + belly
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.ellipse(0, -10, 12.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.ellipse(2, -8, 7.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pink clam shell held by otter
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.arc(4, -9, 4.2, Math.PI, 0);
    ctx.fill();
    // Round head & ears
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(8, -18, 7.5, 0, Math.PI * 2);
    ctx.arc(3, -24, 2.5, 0, Math.PI * 2);
    ctx.arc(12, -24, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.ellipse(10, -16, 4.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(10.5, -19, 1.5, 0, Math.PI * 2);
    ctx.arc(13.8, -17, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (pet.id === 'red_panda') {
    const trot = isMoving ? Math.sin(phase * 1.6) * 4.5 : 0;
    const tailWag = Math.sin(time * 9) * 0.25;
    // Striped fluffy tail
    ctx.save();
    ctx.translate(-11, -11);
    ctx.rotate(tailWag);
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.ellipse(-7, -2, 9.5, 4.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7C2D12';
    ctx.fillRect(-10, -6, 3, 8);
    ctx.fillRect(-4, -6, 3, 8);
    ctx.restore();
    // Legs
    ctx.fillStyle = '#431407';
    ctx.fillRect(-7 - trot * 0.5, -6, 4.5, 6);
    ctx.fillRect(4 + trot * 0.5, -6, 4.5, 6);
    // Body
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.ellipse(0, -10, 12, 8.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cute head + white mask
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.arc(9, -19, 7.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(4, -25, 3.2, 0, Math.PI * 2);
    ctx.arc(13, -25, 3.2, 0, Math.PI * 2);
    ctx.ellipse(11, -17, 5, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#431407';
    ctx.beginPath();
    ctx.arc(11.5, -19.5, 1.4, 0, Math.PI * 2);
    ctx.arc(15.2, -17.2, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (pet.id === 'alpaca') {
    const prance = isMoving ? Math.sin(phase * 1.7) * 4 : 0;
    // Legs
    ctx.fillStyle = '#D97706';
    ctx.fillRect(-7 - prance * 0.5, -7, 3.5, 7);
    ctx.fillRect(4 + prance * 0.5, -7, 3.5, 7);
    // Fluffy cloud wool body & neck
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.ellipse(-1, -12, 12, 8.5, 0, 0, Math.PI * 2);
    ctx.arc(-7, -14, 5, 0, Math.PI * 2);
    ctx.arc(5, -14, 5.5, 0, Math.PI * 2);
    ctx.roundRect(4, -26, 9, 16, 4.5);
    ctx.fill();
    // Alpaca head & long ears
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.ellipse(9, -27, 7, 5.5, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -34, 2.2, 5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(11, -34, 2.2, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(11.5, -28, 1.4, 0, Math.PI * 2);
    ctx.arc(14.8, -26.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(251, 113, 133, 0.55)';
    ctx.beginPath();
    ctx.arc(9.5, -25.5, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (pet.id === 'phoenix_chick') {
    const hover = Math.sin(time * 8) * 3.5;
    const wing = Math.sin(time * 20) * 4;
    ctx.translate(0, -6 + hover);
    // Fiery aura
    const glow = ctx.createRadialGradient(0, -12, 2, 0, -12, 20);
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    glow.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -12, 20, 0, Math.PI * 2);
    ctx.fill();
    // Tail flames
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(-8, -11);
    ctx.lineTo(-19, -17 + wing * 0.4);
    ctx.lineTo(-15, -9);
    ctx.lineTo(-20, -5);
    ctx.closePath();
    ctx.fill();
    // Body
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath();
    ctx.ellipse(0, -11, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Flapping golden wing
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.ellipse(-2, -11 + wing * 0.6, 6.5, 3.6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Head + crown plume
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.arc(6, -18, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(4, -24);
    ctx.lineTo(1, -30);
    ctx.lineTo(7, -25);
    ctx.lineTo(10, -29);
    ctx.lineTo(9, -23);
    ctx.fill();
    // Beak & eye
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(12, -19);
    ctx.lineTo(16.5, -17.5);
    ctx.lineTo(12, -16);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(8, -19, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function getMountSaddleOffset(mountId?: MountId): number {
  switch (mountId) {
    case 'giant_turtle':
      return 22;
    case 'wooden_duck':
      return 19;
    case 'koi_fish':
      return 18;
    case 'fluffy_cloud':
      return 20;
    default:
      return 0;
  }
}

export function drawMount(
  ctx: CanvasRenderingContext2D,
  mountId: MountId,
  x: number,
  groundY: number,
  facing: 1 | -1,
  cycle: number,
  isMoving: boolean,
  time: number
) {
  if (mountId === 'none') return;
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(facing, 1);

  if (mountId === 'giant_turtle') {
    const step = isMoving ? Math.sin(cycle) * 5 : 0;
    const rock = isMoving ? Math.sin(cycle * 0.5) * 0.04 : 0;
    ctx.rotate(rock);
    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 42, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Back flippers
    ctx.fillStyle = '#065F46';
    ctx.beginPath();
    ctx.ellipse(-22 + step * 0.7, -4, 9, 5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(18 - step * 0.7, -4, 9, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Little tail
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.moveTo(-36, -12);
    ctx.lineTo(-47, -10);
    ctx.lineTo(-35, -7);
    ctx.fill();
    // Giant emerald shell
    const shellGrad = ctx.createRadialGradient(-6, -26, 4, 0, -14, 38);
    shellGrad.addColorStop(0, '#34D399');
    shellGrad.addColorStop(0.55, '#059669');
    shellGrad.addColorStop(1, '#064E3B');
    ctx.fillStyle = shellGrad;
    ctx.beginPath();
    ctx.arc(0, -10, 36, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // Gold shell trim & ridge hexagons
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -10, 25, Math.PI + 0.25, -0.25);
    ctx.stroke();
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(-36, -11, 72, 4.5);
    // Front sturdy flippers
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.ellipse(-18 - step, -4, 10, 5.5, -0.15, 0, Math.PI * 2);
    ctx.ellipse(22 + step, -4, 10, 5.5, 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Wise Turtle Head
    const headBob = isMoving ? Math.sin(cycle * 2) * 1.5 : Math.sin(time * 2.5) * 1;
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.roundRect(28, -23 + headBob, 18, 13, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(44, -20 + headBob, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(47, -22 + headBob, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(251, 113, 133, 0.5)';
    ctx.beginPath();
    ctx.arc(45, -18 + headBob, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (mountId === 'wooden_duck') {
    const bounce = isMoving ? Math.abs(Math.sin(cycle * 1.4)) * 2.5 : 0;
    const wheelRot = isMoving ? cycle * 1.6 : 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 34, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(0, -bounce);
    // Wooden carriage body
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.ellipse(-2, -16, 30, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    // Carved wood-grain wing
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(-4, -15, 16, 7.5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // Tail carved crest
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.moveTo(-28, -18);
    ctx.lineTo(-39, -27);
    ctx.lineTo(-32, -13);
    ctx.closePath();
    ctx.fill();
    // Neck & duck head
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.roundRect(16, -34, 12, 18, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(24, -35, 10, 0, Math.PI * 2);
    ctx.fill();
    // Painted orange wooden bill
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.ellipse(36, -34, 7, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cute painted eye
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(27, -37, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Wooden wheels underneath
    for (const wx of [-17, 15]) {
      ctx.save();
      ctx.translate(wx, -4);
      ctx.rotate(wheelRot);
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.moveTo(0, -5);
      ctx.lineTo(0, 5);
      ctx.stroke();
      ctx.restore();
    }
  } else if (mountId === 'koi_fish') {
    const swim = Math.sin(time * 5 + cycle * 0.5) * 3.5;
    const tailSwish = Math.sin(time * 9 + cycle) * 6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 34, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(0, -14 + swim);
    // Flowing Koi tail fin
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.quadraticCurveTo(-40, -14 + tailSwish, -44, -10 + tailSwish);
    ctx.lineTo(-34, 0);
    ctx.lineTo(-44, 11 + tailSwish);
    ctx.quadraticCurveTo(-36, 13 + tailSwish, -26, 2);
    ctx.fill();
    // Koi plump white & orange-spotted body
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.ellipse(0, 0, 31, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.ellipse(-9, -3, 11, 7, 0.2, 0, Math.PI * 2);
    ctx.ellipse(14, -2, 10, 7.5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // Side pectoral fin
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(6, 7, 8, 4, 0.35 + Math.sin(time * 7) * 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Koi eye & cute whisker
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(23, -3, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (mountId === 'fluffy_cloud') {
    const hover = Math.sin(time * 3.6 + cycle * 0.3) * 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 34, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(0, -13 + hover);
    // Soft pastel cloud puffs
    ctx.fillStyle = '#F0F9FF';
    ctx.beginPath();
    ctx.arc(-20, 2, 13, 0, Math.PI * 2);
    ctx.arc(-6, -4, 16, 0, Math.PI * 2);
    ctx.arc(12, -3, 15, 0, Math.PI * 2);
    ctx.arc(24, 3, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FBCFE8';
    ctx.beginPath();
    ctx.ellipse(-18, 4, 4, 2.2, 0, 0, Math.PI * 2);
    ctx.ellipse(16, 4, 4, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Sparkles around cloud
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(-32, -8 + Math.sin(time * 6) * 2, 2.2, 0, Math.PI * 2);
    ctx.arc(34, -6 + Math.cos(time * 6) * 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function parseRgbOrHex(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    const val = parseInt(color.slice(1), 16);
    return [(val >> 16) & 255, (val >> 8) & 255, val & 255];
  }
  const m = color.match(/\d+/g);
  if (m && m.length >= 3) {
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  }
  return [104, 176, 160];
}

function lerpColorHexOrRgb(colorA: string, colorB: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = parseRgbOrHex(colorA);
  const [r2, g2, b2] = parseRgbOrHex(colorB);
  return `rgb(${Math.round(lerp(r1, r2, clamped))}, ${Math.round(lerp(g1, g2, clamped))}, ${Math.round(lerp(b1, b2, clamped))})`;
}

function drawHorizonCakeMountain(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  time: number
) {
  ctx.save();
  // Sponge cake mountain base
  ctx.fillStyle = '#F472B6';
  ctx.beginPath();
  ctx.moveTo(cx - 108, groundY);
  ctx.lineTo(cx - 56, groundY - 122);
  ctx.lineTo(cx + 56, groundY - 122);
  ctx.lineTo(cx + 108, groundY);
  ctx.closePath();
  ctx.fill();

  // Dripping cream frosting top
  ctx.fillStyle = '#FFF1F2';
  ctx.beginPath();
  ctx.roundRect(cx - 62, groundY - 134, 124, 24, 12);
  ctx.fill();

  // Cherry on summit
  ctx.fillStyle = '#E11D48';
  ctx.beginPath();
  ctx.arc(cx, groundY - 144 + Math.sin(time * 2) * 1.2, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHorizonAtlantisDomes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  time: number
) {
  ctx.save();
  ctx.fillStyle = 'rgba(56, 189, 248, 0.36)';
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, groundY - 8, 56, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx - 72, groundY - 4, 34, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // Floating bubbles
  for (let b = 0; b < 5; b++) {
    const p = (time * 0.45 + b * 0.2) % 1;
    ctx.fillStyle = `rgba(224, 242, 254, ${(1 - p) * 0.55})`;
    ctx.beginPath();
    ctx.arc(cx - 40 + b * 22, groundY - 40 - p * 80, 3 + (b % 2) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHorizonCrystalCave(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  time: number
) {
  ctx.save();
  const cols = ['#7DD3FC', '#38BDF8', '#C4B5FD'];
  for (let i = -2; i <= 2; i++) {
    const x = cx + i * 26;
    const h = 115 - Math.abs(i) * 22 + Math.sin(time * 2 + i) * 3;
    ctx.fillStyle = cols[Math.abs(i) % cols.length];
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(x, groundY - h);
    ctx.lineTo(x - 16, groundY);
    ctx.lineTo(x + 16, groundY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawHorizonGiantMushrooms(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  time: number
) {
  ctx.save();
  const pulse = 0.65 + 0.3 * Math.sin(time * 3);
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(cx - 9, groundY - 82, 18, 82);
  ctx.fillStyle = `rgba(45, 212, 191, ${pulse.toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(cx, groundY - 82, 48, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(cx - 18, groundY - 102, 5, 0, Math.PI * 2);
  ctx.arc(cx + 12, groundY - 108, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

