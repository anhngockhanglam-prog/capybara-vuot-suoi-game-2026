import {
  CapybaraAppearance,
  CitizenId,
} from '../game/types';
import {
  EXOTIC_CREATURES,
  KINGDOM_CITIZENS,
} from '../game/world';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const c = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return `rgb(${Math.round(lerp(r1, r2, c))}, ${Math.round(lerp(g1, g2, c))}, ${Math.round(lerp(b1, b2, c))})`;
}

function lerpColorStr(a: string, b: string, t: number): string {
  const parse = (s: string): [number, number, number] => {
    if (s.startsWith('#')) return hexToRgb(s);
    const m = s.match(/\d+/g);
    return m && m.length >= 3 ? [Number(m[0]), Number(m[1]), Number(m[2])] : [15, 27, 43];
  };
  const c = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return `rgb(${Math.round(lerp(r1, r2, c))}, ${Math.round(lerp(g1, g2, c))}, ${Math.round(lerp(b1, b2, c))})`;
}

/**
 * skyProgress: 0 = Day, 0.5 = Sunset (Hoàng hôn), 1.0 = Deep Midnight Night (Tối dần)
 */
export function drawSmoothSkyLayer(
  ctx: CanvasRenderingContext2D,
  W: number,
  skyHeight: number,
  dayTop: string,
  dayBot: string,
  skyProgress: number,
  time: number
) {
  const p = Math.max(0, Math.min(1, skyProgress));
  const sunsetPhase = p <= 0.5 ? p * 2 : (1 - p) * 2; // peaks at 1.0 when p=0.5
  const nightPhase = Math.max(0, (p - 0.35) / 0.65);

  const duskTop = lerpHex(dayTop, '#582F6B', sunsetPhase * 0.85);
  const duskBot = lerpHex(dayBot, '#FB923C', sunsetPhase * 0.9);

  const finalTop = lerpColorStr(duskTop, '#0B1325', nightPhase);
  const finalBot = lerpColorStr(duskBot, '#1C2E4A', nightPhase);

  const sky = ctx.createLinearGradient(0, 0, 0, skyHeight);
  sky.addColorStop(0, finalTop);
  sky.addColorStop(1, finalBot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, skyHeight);

  // Sunset horizon glow + lowering Sun orb
  if (p < 0.88) {
    const sunAlpha = Math.max(0, 1 - Math.max(0, p - 0.48) * 2.5);
    if (sunAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = sunAlpha;
      const sunY = lerp(34, skyHeight - 16, Math.min(1, p * 1.4));
      const sunR = 14 + sunsetPhase * 5;
      ctx.fillStyle = lerpHex('#FEF3C7', '#FB7185', sunsetPhase);
      ctx.beginPath();
      ctx.arc(W * 0.82, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = sunAlpha * 0.28;
      ctx.beginPath();
      ctx.arc(W * 0.82, sunY, sunR + 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Stars, Crescent Moon & Milky Way fading in smoothly after sunset
  if (nightPhase > 0.05) {
    ctx.save();
    ctx.globalAlpha = nightPhase;
    const mw = ctx.createLinearGradient(0, skyHeight * 0.75, W, 0);
    mw.addColorStop(0, 'rgba(147, 197, 253, 0)');
    mw.addColorStop(0.5, 'rgba(196, 181, 253, 0.16)');
    mw.addColorStop(1, 'rgba(147, 197, 253, 0)');
    ctx.fillStyle = mw;
    ctx.fillRect(0, 0, W, skyHeight);

    // Crescent Moon
    ctx.fillStyle = '#FEF9C3';
    ctx.beginPath();
    ctx.arc(W * 0.82, 40, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = finalTop;
    ctx.beginPath();
    ctx.arc(W * 0.82 + 6, 37, 12.5, 0, Math.PI * 2);
    ctx.fill();

    // Twinkling stars
    for (let i = 0; i < 36; i++) {
      const sx = (i * 97 + 23) % W;
      const sy = (i * 53 + 11) % (skyHeight * 0.78);
      const tw = (0.35 + 0.65 * Math.abs(Math.sin(time * 2.4 + i))) * nightPhase;
      ctx.fillStyle = `rgba(255, 255, 255, ${tw.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 4 === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shooting star
    const cyc = time % 5.8;
    if (cyc < 0.9 && nightPhase > 0.4) {
      const sp = cyc / 0.9;
      const mx = 110 + sp * 165;
      const my = 18 + sp * 66;
      ctx.strokeStyle = `rgba(254, 240, 138, ${(Math.sin(sp * Math.PI) * 0.85 * nightPhase).toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx - 42, my - 17);
      ctx.lineTo(mx, my);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawGlowingForestBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  groundY: number,
  time: number,
  skyProgress: number
) {
  drawSmoothSkyLayer(ctx, W, groundY, '#1B3A4B', '#2C6E73', Math.max(0.42, skyProgress), time);

  // Misty teal forest silhouettes
  ctx.fillStyle = '#0F2A33';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(28 + i * 95, 24, 16, groundY - 24);
  }

  // Talking Ancient Tree (Cây cổ thụ biết nói) on right
  const tx = 418;
  ctx.fillStyle = '#3F271E';
  ctx.beginPath();
  ctx.moveTo(tx - 26, groundY);
  ctx.quadraticCurveTo(tx - 18, groundY - 60, tx - 22, groundY - 115);
  ctx.lineTo(tx + 22, groundY - 115);
  ctx.quadraticCurveTo(tx + 18, groundY - 60, tx + 26, groundY);
  ctx.closePath();
  ctx.fill();

  // Bioluminescent leafy canopy
  ctx.fillStyle = '#115E59';
  ctx.beginPath();
  ctx.arc(tx, groundY - 125, 52, 0, Math.PI * 2);
  ctx.arc(tx - 32, groundY - 108, 34, 0, Math.PI * 2);
  ctx.arc(tx + 34, groundY - 108, 32, 0, Math.PI * 2);
  ctx.fill();

  // Glowing tree eyes & animated talking mouth
  const eyePulse = 0.75 + 0.25 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(94, 234, 212, ${eyePulse.toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(tx - 9, groundY - 72, 4, 0, Math.PI * 2);
  ctx.arc(tx + 9, groundY - 72, 4, 0, Math.PI * 2);
  ctx.fill();
  const mouthOpen = 2 + Math.abs(Math.sin(time * 4.5)) * 4;
  ctx.fillStyle = '#134E4A';
  ctx.beginPath();
  ctx.ellipse(tx, groundY - 56, 7, mouthOpen, 0, 0, Math.PI * 2);
  ctx.fill();

  // Speech bubble from Talking Tree
  const quotes = ['Khu rừng chào bạn!', 'Hãy hái Nấm Phát Sáng!', 'Đom đóm sẽ dẫn lối!'];
  const qIdx = Math.floor(time / 4) % quotes.length;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.beginPath();
  ctx.roundRect(tx - 78, groundY - 116, 114, 22, 7);
  ctx.fill();
  ctx.fillStyle = '#5EEAD4';
  ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(quotes[qIdx], tx - 21, groundY - 101);

  // Giant Glowing Mushrooms
  const mushSpecs = [
    { x: 76, h: 68, r: 34, c: '#2DD4BF' },
    { x: 162, h: 46, r: 24, c: '#E879F9' },
    { x: 282, h: 56, r: 28, c: '#38BDF8' },
  ];
  for (const m of mushSpecs) {
    const glow = ctx.createRadialGradient(m.x, groundY - m.h, 6, m.x, groundY - m.h, m.r + 22);
    glow.addColorStop(0, `${m.c}55`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(m.x, groundY - m.h, m.r + 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.roundRect(m.x - 7, groundY - m.h, 14, m.h, 4);
    ctx.fill();

    ctx.fillStyle = m.c;
    ctx.beginPath();
    ctx.arc(m.x, groundY - m.h, m.r, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#FEF9C3';
    ctx.beginPath();
    ctx.arc(m.x - m.r * 0.38, groundY - m.h - m.r * 0.38, 4, 0, Math.PI * 2);
    ctx.arc(m.x + m.r * 0.3, groundY - m.h - m.r * 0.45, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dancing Fireflies
  for (let i = 0; i < 14; i++) {
    const fx = (i * 49 + Math.sin(time * 1.4 + i) * 28) % W;
    const fy = groundY - 22 - ((i * 31) % 120) + Math.cos(time * 1.8 + i) * 10;
    const alpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 3.5 + i));
    ctx.fillStyle = `rgba(190, 242, 100, ${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(fx, fy, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mossy bioluminescent ground
  ctx.fillStyle = '#134E4A';
  ctx.fillRect(0, groundY, W, 12);
  ctx.fillStyle = '#0F292E';
  ctx.fillRect(0, groundY + 12, W, H - groundY - 12);
}

export function drawIceMountainBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  groundY: number,
  time: number,
  skyProgress: number
) {
  drawSmoothSkyLayer(ctx, W, groundY, '#2B5882', '#CBEAFE', skyProgress, time);

  // Crystal Cave Arch (Hang pha lê) on left
  ctx.fillStyle = '#1E3A5F';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(0, 44);
  ctx.quadraticCurveTo(118, 22, 198, groundY);
  ctx.closePath();
  ctx.fill();

  const crystalColors = ['#7DD3FC', '#38BDF8', '#C4B5FD', '#E0F2FE'];
  for (let i = 0; i < 7; i++) {
    const cx = 24 + i * 24;
    const ch = 26 + (i % 3) * 16;
    const shine = 0.65 + 0.35 * Math.sin(time * 3 + i);
    ctx.fillStyle = crystalColors[i % crystalColors.length];
    ctx.globalAlpha = shine;
    ctx.beginPath();
    ctx.moveTo(cx, groundY - ch);
    ctx.lineTo(cx - 10, groundY);
    ctx.lineTo(cx + 10, groundY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Background Ice Mountains
  ctx.fillStyle = '#7DD3FC';
  ctx.beginPath();
  ctx.moveTo(210, groundY);
  ctx.lineTo(310, 68);
  ctx.lineTo(395, groundY);
  ctx.lineTo(470, 52);
  ctx.lineTo(540, groundY);
  ctx.closePath();
  ctx.fill();

  // Frozen Ice Lake across foreground ground
  const iceGrad = ctx.createLinearGradient(0, groundY, 0, H);
  iceGrad.addColorStop(0, '#E0F2FE');
  iceGrad.addColorStop(0.5, '#7DD3FC');
  iceGrad.addColorStop(1, '#38BDF8');
  ctx.fillStyle = iceGrad;
  ctx.fillRect(0, groundY, W, H - groundY);

  // Shimmering skate lines & crystal reflections on frozen lake
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const lx = 50 + i * 85 + Math.sin(time + i) * 6;
    ctx.beginPath();
    ctx.moveTo(lx, groundY + 16);
    ctx.lineTo(lx + 36, groundY + 16);
    ctx.stroke();
  }
}

export function drawOceanBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  groundY: number,
  time: number
) {
  const sea = ctx.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#0284C7');
  sea.addColorStop(0.55, '#0369A1');
  sea.addColorStop(1, '#0C4A6E');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, W, H);

  // Sunbeams piercing underwater
  for (let r = 0; r < 3; r++) {
    ctx.fillStyle = 'rgba(186, 230, 253, 0.09)';
    ctx.beginPath();
    ctx.moveTo(70 + r * 155, 0);
    ctx.lineTo(130 + r * 155, 0);
    ctx.lineTo(205 + r * 155, groundY);
    ctx.lineTo(110 + r * 155, groundY);
    ctx.closePath();
    ctx.fill();
  }

  // Underwater City (Thành phố dưới biển) domes & pillars
  const drawDome = (dx: number, r: number, col: string) => {
    ctx.fillStyle = 'rgba(125, 211, 252, 0.25)';
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(dx, groundY - 22, r, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.fillRect(dx - r, groundY - 22, r * 2, 22);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(dx - 8, groundY - 14, 16, 14);
  };
  drawDome(126, 42, '#0E7490');
  drawDome(396, 54, '#155E75');

  // Swimming Marine Creatures (Jellyfish + School of Fish)
  for (let j = 0; j < 2; j++) {
    const jx = 240 + j * 190 + Math.sin(time * 1.4 + j) * 20;
    const jy = 78 + Math.cos(time * 2 + j) * 14;
    ctx.fillStyle = 'rgba(244, 114, 182, 0.72)';
    ctx.beginPath();
    ctx.arc(jx, jy, 13, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 207, 232, 0.7)';
    ctx.lineWidth = 1.5;
    for (let t = -1; t <= 1; t++) {
      ctx.beginPath();
      ctx.moveTo(jx + t * 5, jy);
      ctx.lineTo(jx + t * 6 + Math.sin(time * 6 + t) * 3, jy + 16);
      ctx.stroke();
    }
  }

  for (let f = 0; f < 4; f++) {
    const fx = ((time * (42 + f * 7) + f * 120) % (W + 40)) - 20;
    const fy = 52 + f * 32 + Math.sin(time * 3 + f) * 5;
    ctx.fillStyle = f % 2 === 0 ? '#FBBF24' : '#34D399';
    ctx.beginPath();
    ctx.ellipse(fx, fy, 9, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fx - 8, fy);
    ctx.lineTo(fx - 14, fy - 4);
    ctx.lineTo(fx - 14, fy + 4);
    ctx.closePath();
    ctx.fill();
  }

  // Rising oxygen bubbles
  for (let b = 0; b < 10; b++) {
    const p = (time * 0.35 + b * 0.1) % 1;
    const bx = 36 + b * 52 + Math.sin(time * 2 + b) * 6;
    const by = groundY - p * (groundY - 12);
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(bx, by, 2.5 + (b % 3), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Sandy coral seabed
  ctx.fillStyle = '#E9C46A';
  ctx.fillRect(0, groundY, W, H - groundY);
}

export function drawCandyPlanetBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  groundY: number,
  time: number,
  skyProgress: number
) {
  drawSmoothSkyLayer(ctx, W, groundY, '#A855F7', '#FBCFE8', skyProgress, time);

  // Cake Mountains (Núi bánh ngọt)
  const cakes = [
    { x: 112, w: 120, h: 98, col: '#F472B6', icing: '#FFF1F2' },
    { x: 408, w: 144, h: 124, col: '#FB7185', icing: '#FEF9C3' },
  ];
  for (const c of cakes) {
    ctx.fillStyle = c.col;
    ctx.beginPath();
    ctx.roundRect(c.x - c.w / 2, groundY - c.h, c.w, c.h, [18, 18, 0, 0]);
    ctx.fill();
    ctx.fillStyle = c.icing;
    ctx.beginPath();
    ctx.roundRect(c.x - c.w / 2 - 4, groundY - c.h - 6, c.w + 8, 22, 10);
    ctx.fill();
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(c.x, groundY - c.h - 14, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lollipop trees
  for (const lx of [224, 298]) {
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(lx - 3, groundY - 58, 6, 58);
    ctx.fillStyle = lx === 224 ? '#38BDF8' : '#FACC15';
    ctx.beginPath();
    ctx.arc(lx, groundY - 68, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lx, groundY - 68, 9, 0, Math.PI * 1.5);
    ctx.stroke();
  }

  // Pink wafer ground + Flowing Chocolate River (Sông Sô-cô-la)
  ctx.fillStyle = '#F9A8D4';
  ctx.fillRect(0, groundY, W, 16);

  const choco = ctx.createLinearGradient(0, groundY + 16, 0, H);
  choco.addColorStop(0, '#78350F');
  choco.addColorStop(1, '#451A03');
  ctx.fillStyle = choco;
  ctx.fillRect(0, groundY + 16, W, H - groundY - 16);

  // Flowing chocolate ripples & marshmallows
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const rx = ((time * 42 + i * 145) % (W + 80)) - 40;
    const ry = groundY + 26 + (i % 2) * 14;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 28, ry);
    ctx.stroke();

    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.roundRect(rx + 42, ry - 4, 11, 8, 3);
    ctx.fill();
  }
}

export function drawKingdomBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  groundY: number,
  time: number,
  skyProgress: number,
  castleLevel: number,
  citizens: CitizenId[],
  festivalActive: boolean,
  festivalAccent: string
) {
  drawSmoothSkyLayer(ctx, W, groundY, '#4B8ED1', '#E7F5EC', skyProgress, time);

  // Rolling kingdom hills
  ctx.fillStyle = '#3B7A57';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.quadraticCurveTo(130, groundY - 46, 270, groundY);
  ctx.quadraticCurveTo(410, groundY - 52, W, groundY);
  ctx.closePath();
  ctx.fill();

  // Castle Tiers (0..3) at center-right
  const cx = 330;
  if (castleLevel === 0) {
    // Royal Blueprint Banner & Cornerstones
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(cx - 46, groundY - 14, 92, 14);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(cx - 2, groundY - 54, 4, 40);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(cx + 2, groundY - 54);
    ctx.lineTo(cx + 30, groundY - 46);
    ctx.lineTo(cx + 2, groundY - 38);
    ctx.closePath();
    ctx.fill();
  } else {
    // Tier 1+ Main Keep
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(cx - 48, groundY - 82, 96, 82);
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.moveTo(cx - 56, groundY - 82);
    ctx.lineTo(cx, groundY - 122);
    ctx.lineTo(cx + 56, groundY - 82);
    ctx.closePath();
    ctx.fill();

    // Gate Arch
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(cx, groundY - 18, 16, Math.PI, 0);
    ctx.lineTo(cx + 16, groundY);
    ctx.lineTo(cx - 16, groundY);
    ctx.closePath();
    ctx.fill();

    if (castleLevel >= 2) {
      // Twin Side Towers
      for (const sx of [cx - 64, cx + 44]) {
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(sx, groundY - 96, 20, 96);
        ctx.fillStyle = '#0284C7';
        ctx.beginPath();
        ctx.moveTo(sx - 4, groundY - 96);
        ctx.lineTo(sx + 10, groundY - 126);
        ctx.lineTo(sx + 24, groundY - 96);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (castleLevel >= 3) {
      // Grand Golden Central Spire & Banners
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.moveTo(cx - 22, groundY - 122);
      ctx.lineTo(cx, groundY - 166);
      ctx.lineTo(cx + 22, groundY - 122);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(cx, groundY - 170, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Royal Floor Courtyard
  ctx.fillStyle = '#4ADE80';
  ctx.fillRect(0, groundY, W, 10);
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(0, groundY + 10, W, H - groundY - 10);

  // King & Queen Capybara NPCs in front of Castle (Vua & Hoàng hậu Capybara)
  const drawRoyalCapy = (rx: number, isQueen: boolean) => {
    const bob = Math.sin(time * 2.5 + (isQueen ? 1.2 : 0)) * 1.5;
    ctx.save();
    ctx.translate(rx, groundY + bob);
    // Cape
    ctx.fillStyle = isQueen ? '#BE185D' : '#B91C1C';
    ctx.beginPath();
    ctx.moveTo(-14, -22);
    ctx.lineTo(-22, -2);
    ctx.lineTo(8, -2);
    ctx.closePath();
    ctx.fill();
    // Body & Head
    ctx.fillStyle = isQueen ? '#FDE68A' : '#B87D4B';
    ctx.beginPath();
    ctx.ellipse(0, -14, 15, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(6, -28, 18, 14, 6);
    ctx.fill();
    // Nose & Eye
    ctx.fillStyle = '#451A03';
    ctx.fillRect(20, -24, 4, 5);
    ctx.beginPath();
    ctx.arc(14, -22, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Royal Crown / Tiara
    ctx.fillStyle = isQueen ? '#F472B6' : '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(8, -28);
    ctx.lineTo(10, -37);
    ctx.lineTo(14, -31);
    ctx.lineTo(18, -37);
    ctx.lineTo(20, -28);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#FEF08A';
    ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isQueen ? 'Hoàng hậu' : 'Vua Capy', rx + 6, groundY - 40);
  };

  drawRoyalCapy(418, false);
  drawRoyalCapy(466, true);

  // Recruited Capybara Citizens strolling cheerfully
  citizens.forEach((cid, idx) => {
    const meta = KINGDOM_CITIZENS.find((c) => c.id === cid);
    if (!meta) return;
    const base = 64 + (idx % 4) * 58;
    const cxPos = base + Math.sin(time * 0.9 + idx * 1.7) * 22;
    const bounce = Math.abs(Math.sin(time * 4 + idx)) * 2.5;
    ctx.save();
    ctx.translate(cxPos, groundY - bounce);
    ctx.fillStyle = '#B87D4B';
    ctx.beginPath();
    ctx.ellipse(0, -11, 12, 8.5, 0, 0, Math.PI * 2);
    ctx.arc(8, -17, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = meta.shirtColor;
    ctx.fillRect(-7, -14, 14, 7);
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(10, -18, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Active Royal Festival Fireworks & Floating Sky Lanterns
  if (festivalActive) {
    for (let l = 0; l < 7; l++) {
      const lx = 44 + l * 74 + Math.sin(time * 1.5 + l) * 14;
      const ly = ((groundY - 40 - ((time * 24 + l * 38) % (groundY - 20))) + groundY) % groundY;
      ctx.fillStyle = l % 2 === 0 ? '#FBBF24' : festivalAccent;
      ctx.beginPath();
      ctx.roundRect(lx - 5, ly - 7, 10, 14, 4);
      ctx.fill();
    }
    // Starburst fireworks
    for (let fw = 0; fw < 2; fw++) {
      const fPhase = (time * 0.85 + fw * 0.5) % 1;
      const fx = 140 + fw * 240;
      const fy = 46 + fw * 18;
      for (let sp = 0; sp < 8; sp++) {
        const ang = (sp * Math.PI * 2) / 8;
        ctx.fillStyle = sp % 2 === 0 ? '#FDE047' : festivalAccent;
        ctx.globalAlpha = 1 - fPhase;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(ang) * fPhase * 34, fy + Math.sin(ang) * fPhase * 34, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
}

export interface SpaceMeteor {
  id: number;
  x: number;
  y: number;
  vx: number;
  r: number;
}

export function drawSpaceshipScene(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  time: number,
  shipX: number,
  shipY: number,
  shipTilt: number,
  meteors: SpaceMeteor[],
  alienX: number,
  alienY: number,
  alienGreetTimer: number,
  appearance: CapybaraAppearance,
  potionHue: number | null,
  balloonsActive: boolean
) {
  // Deep Space Cosmos
  const space = ctx.createLinearGradient(0, 0, 0, H);
  space.addColorStop(0, '#070B1E');
  space.addColorStop(0.6, '#151B3B');
  space.addColorStop(1, '#26143B');
  ctx.fillStyle = space;
  ctx.fillRect(0, 0, W, H);

  // Scrolling stars
  for (let i = 0; i < 48; i++) {
    const sx = (W - ((time * (24 + (i % 3) * 18) + i * 73) % (W + 20)));
    const sy = (i * 47 + 19) % H;
    ctx.fillStyle = i % 5 === 0 ? '#FDE047' : '#E0F2FE';
    ctx.beginPath();
    ctx.arc(sx, sy, i % 4 === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant Candy Planet (Hành tinh kẹo)
  const px = 452;
  const py = 62;
  ctx.fillStyle = '#F472B6';
  ctx.beginPath();
  ctx.arc(px, py, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(px, py, 48, 12, -0.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#FFF1F2';
  ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Hành tinh Kẹo', px, py + 48);

  // Collectible Meteor Stones (Đá thiên thạch)
  for (const m of meteors) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(time * 1.6 + m.id);
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, m.r + 10);
    glow.addColorStop(0, 'rgba(192, 132, 252, 0.5)');
    glow.addColorStop(1, 'rgba(192, 132, 252, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, m.r + 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6B21A8';
    ctx.beginPath();
    ctx.arc(0, 0, m.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D8B4FE';
    ctx.beginPath();
    ctx.arc(-3, -3, m.r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Alien Capybara in Emerald UFO (Capybara ngoài hành tinh)
  ctx.save();
  ctx.translate(alienX, alienY);
  // UFO beam & saucer
  ctx.fillStyle = '#2DD4BF';
  ctx.beginPath();
  ctx.ellipse(0, 8, 28, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(186, 230, 253, 0.42)';
  ctx.beginPath();
  ctx.arc(0, 3, 18, Math.PI, 0);
  ctx.fill();
  // Alien Capybara inside
  ctx.fillStyle = '#4ADE80';
  ctx.beginPath();
  ctx.arc(0, -4, 9, 0, Math.PI * 2);
  ctx.fill();
  // Bobbing glowing antennae
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, -12);
  ctx.lineTo(-7, -20);
  ctx.moveTo(4, -12);
  ctx.lineTo(7, -20);
  ctx.stroke();
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(-7, -20, 2.5, 0, Math.PI * 2);
  ctx.arc(7, -20, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(-3, -5, 1.5, 0, Math.PI * 2);
  ctx.arc(3, -5, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#5EEAD4';
  ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    alienGreetTimer > 0 ? 'Chào bạn Trái Đất! ♥' : 'Capy Ngoài Hành Tinh',
    alienX,
    alienY - 26
  );

  // Player Spaceship piloted by Capybara
  ctx.save();
  ctx.translate(shipX, shipY);
  ctx.rotate(shipTilt);

  // Rocket Flame
  const flameLen = 14 + Math.sin(time * 28) * 5;
  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  ctx.moveTo(-26, -6);
  ctx.lineTo(-26 - flameLen, 0);
  ctx.lineTo(-26, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.moveTo(-26, -3);
  ctx.lineTo(-26 - flameLen * 0.6, 0);
  ctx.lineTo(-26, 3);
  ctx.closePath();
  ctx.fill();

  // Optional Balloons tied to cockpit
  if (balloonsActive) {
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath();
    ctx.arc(-10, -28, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Spaceship Hull
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(-22, -10);
  ctx.lineTo(-30, -18);
  ctx.lineTo(-10, -11);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-22, 10);
  ctx.lineTo(-30, 18);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fill();

  // Glass Canopy + Pilot Capybara head
  ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.beginPath();
  ctx.arc(4, -6, 14, Math.PI, 0);
  ctx.fill();
  const pilotColor =
    typeof potionHue === 'number'
      ? `hsl(${potionHue}, 78%, 60%)`
      : appearance.fur === 'golden'
      ? '#FBBF24'
      : '#B87D4B';
  ctx.fillStyle = pilotColor;
  ctx.beginPath();
  ctx.arc(4, -7, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(7, -8, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawNightSecretsLayer(
  ctx: CanvasRenderingContext2D,
  W: number,
  groundY: number,
  time: number,
  skyProgress: number,
  capyX: number,
  chestClaimed: boolean
) {
  if (skyProgress < 0.65) return;
  const alpha = Math.min(1, (skyProgress - 0.65) / 0.25);
  ctx.save();
  ctx.globalAlpha = alpha;

  // 1. Friendly Ghost Village (Ngôi làng ma thân thiện) on left side
  const gx = 58;
  ctx.fillStyle = 'rgba(30, 41, 59, 0.72)';
  ctx.beginPath();
  ctx.roundRect(gx - 22, groundY - 34, 44, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#5EEAD4';
  ctx.beginPath();
  ctx.moveTo(gx - 28, groundY - 34);
  ctx.lineTo(gx, groundY - 56);
  ctx.lineTo(gx + 28, groundY - 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(gx - 7, groundY - 22, 14, 14);

  // Friendly waving Ghost Capybara villager
  const ghostBob = Math.sin(time * 3.4) * 5;
  ctx.fillStyle = 'rgba(204, 251, 241, 0.85)';
  ctx.beginPath();
  ctx.arc(gx + 36, groundY - 24 + ghostBob, 11, Math.PI, 0);
  ctx.lineTo(gx + 47, groundY - 8 + ghostBob);
  ctx.lineTo(gx + 25, groundY - 8 + ghostBob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(gx + 33, groundY - 24 + ghostBob, 1.5, 0, Math.PI * 2);
  ctx.arc(gx + 39, groundY - 24 + ghostBob, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#99F6E4';
  ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Làng Ma Thân Thiện', gx + 14, groundY - 62);

  // 2. Bioluminescent Night Creatures (Sinh vật phát sáng)
  const bx = 260 + Math.sin(time * 0.9) * 55;
  const by = groundY - 12 - Math.abs(Math.sin(time * 4)) * 8;
  ctx.fillStyle = '#67E8F9';
  ctx.beginPath();
  ctx.ellipse(bx, by, 9, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bx + 4, by - 9, 2.5, 6, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // 3. Guiding Firefly (Đom đóm dẫn đường) drifting between Capybara & Midnight Chest
  const guideTargetX = chestClaimed ? gx + 36 : 478;
  const guideX = lerp(capyX + 46, guideTargetX, 0.5 + Math.sin(time * 1.8) * 0.35);
  const guideY = groundY - 56 + Math.cos(time * 3.2) * 8;
  const gGlow = ctx.createRadialGradient(guideX, guideY, 2, guideX, guideY, 16);
  gGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
  gGlow.addColorStop(1, 'rgba(190, 242, 100, 0)');
  ctx.fillStyle = gGlow;
  ctx.beginPath();
  ctx.arc(guideX, guideY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FEF9C3';
  ctx.beginPath();
  ctx.arc(guideX, guideY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 4. Midnight-only Treasure Chest (Kho báu chỉ xuất hiện lúc nửa đêm)
  if (skyProgress >= 0.84) {
    const tx = 478;
    const ty = groundY - 24;
    if (!chestClaimed) {
      const cGlow = ctx.createRadialGradient(tx, ty + 8, 4, tx, ty + 8, 34);
      cGlow.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
      cGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = cGlow;
      ctx.beginPath();
      ctx.arc(tx, ty + 8, 34, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = chestClaimed ? '#64748B' : '#B45309';
    ctx.beginPath();
    ctx.roundRect(tx - 16, ty, 32, 22, 4);
    ctx.fill();
    ctx.fillStyle = chestClaimed ? '#94A3B8' : '#FBBF24';
    ctx.fillRect(tx - 16, ty + 6, 32, 4);
    ctx.fillRect(tx - 3, ty + 5, 6, 8);
    ctx.fillStyle = '#FEF08A';
    ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(chestClaimed ? 'Đã mở rương' : 'Kho báu Nửa đêm!', tx, ty - 7);
  }

  ctx.restore();
}

export function drawDimensionalPortal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  isExit: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  const pulse = 1 + Math.sin(time * 5) * 0.08;
  ctx.scale(pulse, pulse);

  const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 36);
  glow.addColorStop(0, isExit ? 'rgba(56, 189, 248, 0.8)' : 'rgba(192, 132, 252, 0.85)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isExit ? '#7DD3FC' : '#E879F9';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 26, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isExit ? '#0C4A6E' : '#3B0764';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 21, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rotating vortex ring
  ctx.rotate(time * 2.5);
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 16, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#F5D0FE';
  ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isExit ? 'Về Thế Giới Cũ' : 'Cổng Không Gian!', x, y - 34);
}

export function drawAlienDimensionBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  groundY: number,
  time: number,
  discoveredIds: string[]
) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1D0B38');
  grad.addColorStop(0.55, '#3B1161');
  grad.addColorStop(1, '#132B47');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Twin inverted moons & glowing aura rings
  ctx.fillStyle = '#F472B6';
  ctx.beginPath();
  ctx.arc(105, 54, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(435, 44, 14, 0, Math.PI * 2);
  ctx.fill();

  // Floating crystal spires
  for (let i = 0; i < 4; i++) {
    const fx = 95 + i * 120;
    const fy = 95 + Math.sin(time * 2 + i) * 10;
    ctx.fillStyle = 'rgba(103, 232, 249, 0.35)';
    ctx.beginPath();
    ctx.moveTo(fx, fy - 24);
    ctx.lineTo(fx - 14, fy + 8);
    ctx.lineTo(fx + 14, fy + 8);
    ctx.closePath();
    ctx.fill();
  }

  // Never-before-seen Exotic Creatures in the Dimension (Sinh vật chưa từng xuất hiện)
  const positions = [
    { x: 165, y: 166 },
    { x: 265, y: 178 },
    { x: 355, y: 158 },
    { x: 432, y: 180 },
    { x: 308, y: 98 },
  ];
  EXOTIC_CREATURES.forEach((cr, idx) => {
    const pos = positions[idx % positions.length];
    const floatY = pos.y + Math.sin(time * 2.6 + idx * 1.3) * 6;
    const discovered = discoveredIds.includes(cr.id);
    ctx.save();
    ctx.translate(pos.x, floatY);
    const aura = ctx.createRadialGradient(0, 0, 3, 0, 0, 22);
    aura.addColorStop(0, `${cr.color}66`);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cr.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
    ctx.arc(4, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = discovered ? '#A7F3D0' : '#FEF08A';
    ctx.font = '700 8.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(discovered ? `${cr.name} ✓` : `? ${cr.name}`, pos.x, floatY - 15);
  });

  // Glowing Prism Floor
  ctx.fillStyle = '#7E22CE';
  ctx.fillRect(0, groundY, W, 10);
  ctx.fillStyle = '#2E1065';
  ctx.fillRect(0, groundY + 10, W, H - groundY - 10);
}
