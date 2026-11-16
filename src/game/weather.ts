import { ActiveWeather, WeatherMode } from './types';

export interface WeatherOption {
  id: WeatherMode;
  label: string;
  description: string;
}

export const WEATHER_OPTIONS: WeatherOption[] = [
  {
    id: 'auto',
    label: 'Tự động',
    description: 'Thời tiết luân chuyển tự nhiên theo quãng đường',
  },
  {
    id: 'clear',
    label: 'Nắng nhẹ',
    description: 'Trời quang đãng kèm bụi nắng lấp lánh',
  },
  {
    id: 'leaves',
    label: 'Lá vàng rơi',
    description: 'Lá thu phong vàng cam rơi xoay nhẹ theo gió suối',
  },
  {
    id: 'sakura',
    label: 'Hoa anh đào',
    description: 'Cánh hoa đào hồng bay nhẹ theo làn gió',
  },
  {
    id: 'rain',
    label: 'Mưa phùn',
    description: 'Mưa rơi lất phất và gợn nước trên đường suối',
  },
  {
    id: 'snow',
    label: 'Tuyết đầu mùa',
    description: 'Tinh thể tuyết trắng rơi êm dịu quanh bờ suối',
  },
  {
    id: 'fireflies',
    label: 'Đêm đom đóm',
    description: 'Màn đêm dịu mát với hàng chục đom đóm phát sáng ven suối',
  },
];

export const FORECAST_WEATHER_LIST: ActiveWeather[] = [
  'clear',
  'leaves',
  'sakura',
  'rain',
  'snow',
  'fireflies',
];

export const WEATHER_CHARM_COST = 25;

export function getWeatherForecastDetail(weather: ActiveWeather): string {
  switch (weather) {
    case 'clear':
      return 'Nắng ấm dịu nhẹ, tầm nhìn rõ nét suốt bờ suối.';
    case 'leaves':
      return 'Gió thu thổi lá phong vàng rơi xoay nhẹ nhàng.';
    case 'sakura':
      return 'Cánh hoa anh đào hồng bay ngập tràn không gian.';
    case 'rain':
      return 'Mưa phùn mát lành, xuất hiện vũng nước và cầu vồng sau mưa.';
    case 'snow':
      return 'Bông tuyết trắng rơi êm đềm phủ lên dòng suối.';
    case 'fireflies':
      return 'Màn đêm huyền ảo với đàn đom đóm phát sáng rực rỡ.';
  }
}

export function rollForecastWeather(exclude?: ActiveWeather): ActiveWeather {
  const pool = exclude ? FORECAST_WEATHER_LIST.filter((w) => w !== exclude) : FORECAST_WEATHER_LIST;
  return pool[Math.floor(Math.random() * pool.length)] ?? 'clear';
}

export function getWeatherLabel(weather: ActiveWeather | WeatherMode): string {
  switch (weather) {
    case 'auto':
      return 'Tự động';
    case 'clear':
      return 'Nắng nhẹ';
    case 'leaves':
      return 'Lá vàng rơi';
    case 'rain':
      return 'Mưa phùn';
    case 'sakura':
      return 'Hoa anh đào';
    case 'snow':
      return 'Tuyết đầu mùa';
    case 'fireflies':
      return 'Đêm đom đóm';
  }
}

export function resolveActiveWeather(
  mode: WeatherMode,
  distance: number,
  startingWeather: ActiveWeather = 'clear'
): ActiveWeather {
  if (mode !== 'auto') return mode;
  // Cycle smoothly every ~9500 distance units (~340m) starting from Forecasted weather
  const order: ActiveWeather[] = ['clear', 'leaves', 'sakura', 'rain', 'snow', 'fireflies'];
  const startIdx = Math.max(0, order.indexOf(startingWeather));
  const step = Math.floor(distance / 9500);
  return order[(startIdx + step) % order.length] ?? startingWeather;
}

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  alpha: number;
}

export function createWeatherParticles(width: number, height: number, count: number = 68): WeatherParticle[] {
  const list: WeatherParticle[] = [];
  for (let i = 0; i < count; i++) {
    list.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: -30 - Math.random() * 40,
      vy: 70 + Math.random() * 140,
      size: 2.2 + Math.random() * 4.4,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 3.2,
      alpha: 0.4 + Math.random() * 0.5,
    });
  }
  return list;
}

function drawSnowflakeCrystal(ctx: CanvasRenderingContext2D, radius: number, alpha: number) {
  ctx.strokeStyle = `rgba(248, 250, 252, ${alpha})`;
  ctx.lineWidth = 1.15;
  ctx.lineCap = 'round';
  for (let arm = 0; arm < 3; arm++) {
    const a = (arm * Math.PI) / 3;
    const dx = Math.cos(a) * radius;
    const dy = Math.sin(a) * radius;
    ctx.beginPath();
    ctx.moveTo(-dx, -dy);
    ctx.lineTo(dx, dy);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

export function stepAndRenderWeather(
  ctx: CanvasRenderingContext2D,
  particles: WeatherParticle[],
  weather: ActiveWeather,
  width: number,
  height: number,
  groundY: number,
  dt: number,
  time: number
): void {
  // Subtle atmospheric tint
  if (weather === 'rain') {
    ctx.fillStyle = 'rgba(15, 34, 48, 0.18)';
    ctx.fillRect(0, 0, width, height);
  } else if (weather === 'snow') {
    ctx.fillStyle = 'rgba(226, 232, 240, 0.1)';
    ctx.fillRect(0, 0, width, height);
  } else if (weather === 'sakura') {
    ctx.fillStyle = 'rgba(251, 207, 232, 0.06)';
    ctx.fillRect(0, 0, width, height);
  } else if (weather === 'leaves') {
    ctx.fillStyle = 'rgba(217, 119, 6, 0.06)';
    ctx.fillRect(0, 0, width, height);
  }

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    if (weather === 'rain') {
      p.x += (-190 - p.size * 16) * dt;
      p.y += (530 + p.size * 48) * dt;
      if (p.y > groundY + 12) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha * 0.65})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(p.x, groundY + 6 + (i % 8), 5.5, 2, 0, 0, Math.PI * 2);
        ctx.stroke();

        p.y = -10 - Math.random() * 40;
        p.x = Math.random() * (width + 180);
      }
      if (p.x < -30) {
        p.x = width + Math.random() * 60;
      }

      ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha * 0.75})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 6.5, p.y + 17);
      ctx.stroke();
    } else if (weather === 'leaves') {
      if (i > 44) continue;
      const gust = Math.sin(time * 1.9 + i * 0.7) * 48;
      p.x += (-78 + gust) * dt;
      p.y += (56 + p.size * 9) * dt;
      p.rotation += p.spin * dt;

      if (p.y > height + 14) {
        p.y = -14;
        p.x = Math.random() * (width + 140);
      }
      if (p.x < -24) {
        p.x = width + 24;
      }

      const leafPalette = ['#F59E0B', '#EA580C', '#D97706', '#E11D48', '#84CC16'];
      const leafColor = leafPalette[i % leafPalette.length];
      const flutterScaleY = 0.45 + 0.55 * Math.abs(Math.cos(p.rotation * 1.4));

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(1, flutterScaleY);
      ctx.globalAlpha = Math.min(0.92, p.alpha + 0.15);
      ctx.fillStyle = leafColor;
      ctx.beginPath();
      ctx.moveTo(-p.size * 1.6, 0);
      ctx.quadraticCurveTo(0, -p.size * 1.15, p.size * 1.6, 0);
      ctx.quadraticCurveTo(0, p.size * 1.15, -p.size * 1.6, 0);
      ctx.fill();
      // Leaf center vein
      ctx.strokeStyle = 'rgba(255, 251, 235, 0.45)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-p.size * 1.4, 0);
      ctx.lineTo(p.size * 1.2, 0);
      ctx.stroke();
      ctx.restore();
    } else if (weather === 'sakura') {
      if (i > 40) continue;
      const sway = Math.sin(time * 2.1 + i) * 35;
      p.x += (-65 + sway) * dt;
      p.y += (58 + p.size * 7) * dt;
      p.rotation += p.spin * dt;

      if (p.y > height + 10) {
        p.y = -12;
        p.x = Math.random() * (width + 120);
      }
      if (p.x < -20) {
        p.x = width + 20;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = i % 2 === 0 ? `rgba(249, 168, 212, ${p.alpha})` : `rgba(251, 207, 232, ${p.alpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (weather === 'snow') {
      const drift = Math.sin(time * 1.65 + i * 0.85) * 34;
      p.x += (-32 + drift) * dt;
      p.y += (44 + p.size * 9.5) * dt;
      p.rotation += p.spin * 0.55 * dt;

      if (p.y > height + 12) {
        p.y = -12;
        p.x = Math.random() * (width + 90);
      }
      if (p.x < -18) {
        p.x = width + 18;
      }

      if (i % 3 === 0 && p.size >= 4) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        drawSnowflakeCrystal(ctx, p.size * 1.15, p.alpha * 0.92);
        ctx.restore();
      } else {
        // Soft luminous snow orb
        ctx.fillStyle = `rgba(224, 242, 254, ${p.alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.92})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.62, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (weather === 'fireflies') {
      // Gentle drifting twilight fireflies (complemented by scene night glow fireflies)
      if (i > 34) continue;
      p.x += (-20 + Math.sin(time * 1.3 + i * 1.1) * 26) * dt;
      p.y += Math.cos(time * 1.6 + i * 0.9) * 18 * dt;
      if (p.x < -12) p.x = width + 12;
      if (p.x > width + 12) p.x = -12;
      if (p.y < 24) p.y = groundY - 24;
      if (p.y > groundY + 14) p.y = 30;

      const pulse = 0.35 + 0.65 * Math.abs(Math.sin(time * 3.2 + i * 1.7));
      const glowRadius = (6 + p.size * 1.4) * (0.85 + pulse * 0.35);
      const grad = ctx.createRadialGradient(p.x, p.y, 0.5, p.x, p.y, glowRadius);
      grad.addColorStop(0, `rgba(254, 249, 195, ${0.95 * pulse})`);
      grad.addColorStop(0.4, `rgba(190, 242, 100, ${0.55 * pulse})`);
      grad.addColorStop(1, 'rgba(190, 242, 100, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Clear weather: gentle golden sunlit dust motes
      if (i > 22) continue;
      p.x += (-18 + Math.sin(time + i) * 14) * dt;
      p.y += Math.cos(time * 0.9 + i) * 10 * dt;
      if (p.x < -10) p.x = width + 10;
      if (p.y < 10) p.y = groundY - 20;
      if (p.y > groundY) p.y = 20;

      ctx.fillStyle = `rgba(254, 240, 138, ${p.alpha * 0.45})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
