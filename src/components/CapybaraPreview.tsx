import { useEffect, useRef } from 'react';
import { drawCapybara, drawMount, drawPet, getMountSaddleOffset } from '../game/renderer';
import { ActiveWeather, CapybaraAppearance, PetId } from '../game/types';
import { createWeatherParticles, stepAndRenderWeather } from '../game/weather';

interface CapybaraPreviewProps {
  appearance: CapybaraAppearance;
  weather: ActiveWeather;
  petId?: PetId;
  showMount?: boolean;
  potionHue?: number | null;
  glowingFoodActive?: boolean;
  balloonsActive?: boolean;
}

export function CapybaraPreview({
  appearance,
  weather,
  petId = 'none',
  showMount = true,
  potionHue = null,
  glowingFoodActive = false,
  balloonsActive = false,
}: CapybaraPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appearanceRef = useRef(appearance);
  const weatherRef = useRef(weather);
  const petIdRef = useRef(petId);
  const showMountRef = useRef(showMount);
  const potionHueRef = useRef(potionHue);
  const glowingFoodRef = useRef(glowingFoodActive);
  const balloonsRef = useRef(balloonsActive);

  useEffect(() => {
    appearanceRef.current = appearance;
  }, [appearance]);

  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  useEffect(() => {
    petIdRef.current = petId;
  }, [petId]);

  useEffect(() => {
    showMountRef.current = showMount;
  }, [showMount]);

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 220;
    const height = 144;
    const groundY = 114;
    const weatherParticles = createWeatherParticles(width, height, 24);
    let animId = 0;
    let last = performance.now();
    let time = 0;
    let blinkTimer = 0;
    let nextBlinkIn = 2.0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;

      blinkTimer = Math.max(0, blinkTimer - dt);
      nextBlinkIn -= dt;
      if (nextBlinkIn <= 0) {
        blinkTimer = 0.14;
        nextBlinkIn = 2.3 + Math.random() * 2.5;
      }

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Cozy studio backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, groundY);
      bg.addColorStop(0, '#5E9C8E');
      bg.addColorStop(1, '#CFE7DB');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, groundY);

      ctx.fillStyle = '#3F7D4C';
      ctx.fillRect(0, groundY, width, 6);
      ctx.fillStyle = '#6E543E';
      ctx.fillRect(0, groundY + 6, width, height - groundY - 6);

      if (petIdRef.current !== 'none') {
        drawPet(
          ctx,
          {
            id: petIdRef.current,
            x: 42,
            y: groundY,
            facing: 1,
            hopPhase: time * 7.5,
            isMoving: true,
          },
          time
        );
      }

      const activeMount = showMountRef.current ? appearanceRef.current.mount ?? 'none' : 'none';
      const mountSaddleOffset = getMountSaddleOffset(activeMount);

      if (activeMount !== 'none') {
        drawMount(ctx, activeMount, 111, groundY, 1, time * 7.5, true, time);
      }

      drawCapybara(
        ctx,
        {
          x: 78,
          y: groundY - 50 - mountSaddleOffset,
          width: 66,
          height: 50,
          vy: 0,
          isGrounded: true,
          isDucking: false,
          scaleX: 1,
          scaleY: 1,
          invulnTimer: 0,
          hasShield: false,
          magnetTimer: 0,
          feverActive: false,
          yuzuStackCount: 2,
          appearance: appearanceRef.current,
          runCycle: activeMount !== 'none' ? 0 : time * 7.5,
          blinkTimer,
          isMoving: activeMount === 'none',
          potionHue: potionHueRef.current,
          glowingFoodActive: glowingFoodRef.current,
          balloonsActive: balloonsRef.current,
        },
        time
      );

      stepAndRenderWeather(
        ctx,
        weatherParticles,
        weatherRef.current,
        width,
        height,
        groundY,
        dt,
        time
      );

      ctx.restore();
      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-[144px] w-[220px] shrink-0 rounded-xl border border-white/12 bg-[#1B2B23]"
    />
  );
}
