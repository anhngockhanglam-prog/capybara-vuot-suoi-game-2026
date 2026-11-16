import {
  Camera,
  CloudRain,
  Flower2,
  Heart,
  Leaf,
  Magnet,
  Moon,
  Pause,
  Play,
  Shield,
  Snowflake,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getPetDef } from '../game/pets';
import { ActiveWeather, GameState, HudSnapshot, PetId, WeatherMode } from '../game/types';
import { getWeatherLabel } from '../game/weather';

interface GameHudProps {
  gameState: GameState;
  hud: HudSnapshot;
  capybaraName: string;
  avatarUrl?: string;
  petId: PetId;
  weatherMode: WeatherMode;
  muted: boolean;
  onCycleWeather: () => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onOpenPhotoMode: () => void;
}

function WeatherIcon({ weather }: { weather: ActiveWeather }) {
  switch (weather) {
    case 'rain':
      return <CloudRain className="h-4 w-4 text-sky-300" aria-hidden="true" />;
    case 'sakura':
      return <Flower2 className="h-4 w-4 text-pink-300" aria-hidden="true" />;
    case 'leaves':
      return <Leaf className="h-4 w-4 text-amber-400" aria-hidden="true" />;
    case 'snow':
      return <Snowflake className="h-4 w-4 text-slate-100" aria-hidden="true" />;
    case 'fireflies':
      return <Sparkles className="h-4 w-4 text-lime-300" aria-hidden="true" />;
    default:
      return <Sun className="h-4 w-4 text-amber-300" aria-hidden="true" />;
  }
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GameHud({
  gameState,
  hud,
  capybaraName,
  avatarUrl,
  petId,
  weatherMode,
  muted,
  onCycleWeather,
  onToggleMute,
  onTogglePause,
  onOpenPhotoMode,
}: GameHudProps) {
  const feverPercent = Math.min(100, Math.round(hud.feverMeter));
  const petDef = getPetDef(petId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#18261F] px-5 py-3">
      {/* Left: Score, High Score, Yuzu, Stage & Pet */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-5">
        <div>
          <span className="block text-xs text-emerald-200/70">Điểm số</span>
          <span className="font-mono-num text-2xl font-bold tracking-tight text-white">
            {hud.score.toLocaleString('vi-VN')}
          </span>
        </div>

        <div className="h-7 w-px bg-white/10" aria-hidden="true" />

        <div>
          <span className="block text-xs text-emerald-200/70">Kỷ lục</span>
          <span className="font-mono-num text-base font-semibold text-amber-300">
            {hud.highScore.toLocaleString('vi-VN')}
          </span>
        </div>

        <div className="h-7 w-px bg-white/10" aria-hidden="true" />

        <div className="flex flex-wrap items-center gap-2.5 text-sm text-emerald-100/90">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={capybaraName || 'Mochi'}
              className="h-8 w-8 shrink-0 rounded-lg border border-amber-400/40 object-cover bg-[#0F1814]"
            />
          )}
          <span className="font-semibold text-white">{capybaraName || 'Mochi'}</span>
          {petDef.id !== 'none' && (
            <>
              <span className="text-white/25" aria-hidden="true">·</span>
              <span
                className="text-xs font-medium text-amber-200/90"
                title={petDef.supportTitle}
              >
                {petDef.name}
                <span className="hidden 2xl:inline text-emerald-200/75">
                  {' '}({petDef.supportTitle})
                </span>
              </span>
            </>
          )}
          <span className="text-white/25" aria-hidden="true">·</span>
          <span className="font-mono-num font-semibold text-amber-400">
            Quýt: {hud.yuzuRun}
          </span>
          <span className="text-white/25" aria-hidden="true">·</span>
          <span className="font-mono-num text-emerald-200">
            x{hud.multiplier}
          </span>
          <span className="text-white/25 hidden md:inline" aria-hidden="true">·</span>
          <span className="font-mono-num text-emerald-200/80 hidden md:inline">
            {hud.distanceMeters}m
          </span>
          <span className="text-white/25 hidden xl:inline" aria-hidden="true">·</span>
          <span className="text-xs text-emerald-200/75 hidden xl:inline">
            {hud.stageName}
          </span>
        </div>
      </div>

      {/* Center/Right: Day/Night 5m Timer, Buffs, Weather, Fever, Hearts & Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 5-Minute Day/Night Indicator */}
        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-100/85">
          {hud.isNight ? (
            <Moon className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
          )}
          <span className="font-medium">{hud.isNight ? 'Ban đêm' : 'Ban ngày'}</span>
          <span className="font-mono-num text-emerald-200/70">
            ({formatClock(hud.cycleRemainingSeconds)})
          </span>
        </div>

        {(hud.hasShield || hud.magnetTimer > 0) && (
          <div className="flex items-center gap-3 text-xs font-medium">
            {hud.hasShield && (
              <span className="inline-flex items-center gap-1.5 text-sky-300">
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>Khiên</span>
              </span>
            )}
            {hud.magnetTimer > 0 && (
              <span className="inline-flex items-center gap-1.5 text-emerald-300 font-mono-num">
                <Magnet className="h-4 w-4" aria-hidden="true" />
                <span>{Math.ceil(hud.magnetTimer)}s</span>
              </span>
            )}
          </div>
        )}

        {/* Fever Meter */}
        <div className="w-24 sm:w-32">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className={hud.feverActive ? 'font-semibold text-amber-300' : 'text-emerald-200/80'}>
              {hud.feverActive ? 'Suối nước nóng' : 'Chill'}
            </span>
            <span className="font-mono-num text-emerald-100/90">
              {hud.feverActive ? `${Math.ceil(hud.feverTimer)}s` : `${feverPercent}%`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-sm bg-black/40">
            <div
              className={`h-full transition-transform duration-150 origin-left ${
                hud.feverActive ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{
                transform: `scaleX(${
                  hud.feverActive
                    ? Math.max(0, Math.min(1, hud.feverTimer / Math.max(1, hud.feverMaxDuration)))
                    : Math.max(0, Math.min(1, feverPercent / 100))
                })`,
              }}
            />
          </div>
        </div>

        {/* Hearts */}
        <div
          className="flex items-center gap-1"
          aria-label={`Sinh lực ${hud.hearts} trên ${hud.maxHearts}`}
        >
          {Array.from({ length: hud.maxHearts }).map((_, idx) => {
            const active = idx < hud.hearts;
            return (
              <Heart
                key={idx}
                className={`h-4 w-4 ${
                  active ? 'fill-rose-500 text-rose-500' : 'text-white/20'
                }`}
                aria-hidden="true"
              />
            );
          })}
          <span className="ml-1 font-mono-num text-xs font-medium text-emerald-100/80">
            {hud.hearts}/{hud.maxHearts}
          </span>
        </div>

        {/* Weather, Photo Mode, Mute & Pause */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCycleWeather}
            title="Đổi hiệu ứng thời tiết"
            className="inline-flex h-10 items-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-white/10 bg-[#21332A] px-3 text-xs font-medium text-emerald-100 transition-colors hover:bg-[#2B4236] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <WeatherIcon weather={hud.activeWeather} />
            <span className="hidden lg:inline">
              {weatherMode === 'auto'
                ? `Tự động (${getWeatherLabel(hud.activeWeather)})`
                : getWeatherLabel(weatherMode)}
            </span>
          </button>

          {gameState !== 'GAME_OVER' && (
            <button
              type="button"
              onClick={onOpenPhotoMode}
              title="Chế độ Photo Mode: Ẩn HUD và chụp ảnh Capybara"
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-amber-400/35 bg-[#21332A] px-3 text-xs font-semibold text-amber-200 transition-colors hover:bg-[#2B4236] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Chụp ảnh</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#21332A] text-emerald-100 transition-colors hover:bg-[#2B4236] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
            <button
              type="button"
              onClick={onTogglePause}
              className="inline-flex h-10 items-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-white/10 bg-[#21332A] px-3.5 text-sm font-medium text-emerald-50 transition-colors hover:bg-[#2B4236] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {gameState === 'PAUSED' ? (
                <>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  <span>Tiếp tục</span>
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" aria-hidden="true" />
                  <span>Tạm dừng</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
