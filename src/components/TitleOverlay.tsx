import { CloudSun, Play, Sparkles, Swords, Trophy, Users } from 'lucide-react';
import { DIFFICULTY_LIST } from '../game/skins';
import { ActiveWeather, Difficulty, WeatherMode } from '../game/types';
import {
  getWeatherForecastDetail,
  getWeatherLabel,
  WEATHER_CHARM_COST,
  WEATHER_OPTIONS,
} from '../game/weather';

interface TitleOverlayProps {
  difficulty: Difficulty;
  weatherMode: WeatherMode;
  highScore: number;
  forecastWeather: ActiveWeather;
  weatherCharms: number;
  weatherLockedByCharm: boolean;
  yuzuBank: number;
  weeklyResetText: string;
  weeklyScore: number | null;
  onSelectDifficulty: (d: Difficulty) => void;
  onSelectWeather: (w: WeatherMode) => void;
  onCastWeatherCharm: () => void;
  onBuyWeatherCharm: () => void;
  onStartEndless: () => void;
  onStartBossRush: () => void;
  onStartWeeklyTournament: () => void;
  onOpenMultiplayer: () => void;
}

export function TitleOverlay({
  difficulty,
  weatherMode,
  highScore,
  forecastWeather,
  weatherCharms,
  weatherLockedByCharm,
  yuzuBank,
  weeklyResetText,
  weeklyScore,
  onSelectDifficulty,
  onSelectWeather,
  onCastWeatherCharm,
  onBuyWeatherCharm,
  onStartEndless,
  onStartBossRush,
  onStartWeeklyTournament,
  onOpenMultiplayer,
}: TitleOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-[#0D1712]/76 p-3 backdrop-blur-[2px] sm:p-4">
      <div className="my-auto w-full max-w-2xl rounded-xl border border-white/12 bg-[#16231D]/96 p-4 shadow-2xl sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-amber-300/90">
          <span>
            Trò chơi arcade 2D · Kỷ lục hiện tại:{' '}
            <span className="font-mono-num">{highScore.toLocaleString('vi-VN')}</span>
          </span>
          <span className="font-mono-num text-emerald-200/85">
            Reset giải tuần sau: {weeklyResetText}
          </span>
        </div>

        <h1 className="mt-0.5 font-display text-balance text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Capybara Vượt Suối
        </h1>

        <p className="mt-1 text-xs leading-relaxed text-emerald-100/80 sm:text-sm">
          Vượt chướng ngại vật, đấu Boss bằng kỹ năng, tranh tài Thách đấu tuần hoặc khám phá Thế giới Capybara bên dưới.
        </p>

        {/* Weather Forecast System + Bùa Thời Tiết */}
        <div className="mt-3 rounded-lg border border-sky-400/30 bg-[#101C20] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <CloudSun className="h-4 w-4 text-sky-300" aria-hidden="true" />
              <span className="font-semibold text-sky-200">Dự báo lượt chạy tới:</span>
              <span className="rounded bg-sky-500/20 px-2 py-0.5 font-bold text-white">
                {getWeatherLabel(forecastWeather)}
              </span>
              {weatherLockedByCharm && (
                <span className="text-[11px] font-semibold text-amber-300">(Đã dùng Bùa)</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono-num text-[11px] text-emerald-200/80">
                Bùa: <strong className="text-sky-300">{weatherCharms}</strong>
              </span>
              <button
                type="button"
                disabled={weatherCharms <= 0}
                onClick={onCastWeatherCharm}
                className="inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-md bg-sky-400 px-2.5 text-[11px] font-bold text-[#071F2C] transition-colors hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>Dùng Bùa (-1)</span>
              </button>
              <button
                type="button"
                disabled={yuzuBank < WEATHER_CHARM_COST}
                onClick={onBuyWeatherCharm}
                className="inline-flex h-7 items-center whitespace-nowrap rounded-md border border-amber-400/40 bg-amber-500/15 px-2.5 text-[11px] font-bold text-amber-200 transition-colors hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>Mua Bùa ({WEATHER_CHARM_COST} quýt)</span>
              </button>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-sky-100/75">
            {getWeatherForecastDetail(forecastWeather)}
          </p>
        </div>

        {/* Difficulty Segmented Control */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-medium text-emerald-200/80">Chọn nhịp độ</div>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#0F1814] p-1">
              {DIFFICULTY_LIST.map((item) => {
                const active = item.id === difficulty;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectDifficulty(item.id)}
                    className={`min-h-[36px] whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      active
                        ? 'bg-[#263C31] text-amber-300 shadow-sm'
                        : 'text-emerald-100/70 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather Segmented Control */}
          <div>
            <div className="mb-1 text-xs font-medium text-emerald-200/80">Chế độ thời tiết</div>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-[#0F1814] p-1">
              {WEATHER_OPTIONS.map((w) => {
                const active = w.id === weatherMode;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onSelectWeather(w.id)}
                    className={`min-h-[30px] whitespace-nowrap rounded-md px-1.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                      active
                        ? 'bg-[#263C31] text-amber-300 shadow-sm'
                        : 'text-emerald-100/70 hover:text-white'
                    }`}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mode Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onStartEndless}
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-amber-500 px-4 text-sm font-bold text-[#1A1308] transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            <span>Chạy Vượt Suối</span>
          </button>

          <button
            type="button"
            onClick={onStartWeeklyTournament}
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-amber-300/45 bg-amber-500/20 px-4 text-sm font-bold text-amber-200 transition-colors hover:bg-amber-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Trophy className="h-4 w-4" aria-hidden="true" />
            <span>
              Thách đấu tuần
              {weeklyScore !== null ? ` (${weeklyScore.toLocaleString('vi-VN')})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={onStartBossRush}
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-rose-400/35 bg-rose-500/20 px-3.5 text-sm font-bold text-rose-200 transition-colors hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Swords className="h-4 w-4" aria-hidden="true" />
            <span>Đấu Boss Ngay</span>
          </button>

          <button
            type="button"
            onClick={onOpenMultiplayer}
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3.5 text-sm font-bold text-emerald-200 transition-colors hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>Nhiều Người Chơi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
