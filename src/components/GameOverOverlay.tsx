import { User } from 'firebase/auth';
import { Award, CheckCircle2, Home, LogIn, RotateCcw } from 'lucide-react';
import { PlayMode, RunSummary } from '../game/types';

interface GameOverOverlayProps {
  summary: RunSummary;
  playMode?: Exclude<PlayMode, 'multiplayer'>;
  user: User | null;
  cloudStatus: 'idle' | 'saving' | 'saved' | 'kept_best' | 'error';
  cloudBestScore: number | null;
  authBusy: boolean;
  onSignInAndSave: () => void;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function GameOverOverlay({
  summary,
  playMode = 'endless',
  user,
  cloudStatus,
  cloudBestScore,
  authBusy,
  onSignInAndSave,
  onPlayAgain,
  onBackToMenu,
}: GameOverOverlayProps) {
  const isWeekly = playMode === 'weekly_tournament';
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0D1712]/78 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-xl border border-white/12 bg-[#16231D] p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-white">
            {isWeekly ? 'Kết thúc Thách đấu tuần' : 'Kết thúc lượt chạy'}
          </h2>
          {summary.isNewRecord && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Award className="h-4 w-4" aria-hidden="true" />
              <span>Kỷ lục mới</span>
            </span>
          )}
        </div>

        {/* Clean tabular score summary */}
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-white/10 py-4">
          <div>
            <div className="text-xs text-emerald-200/70">Tổng điểm</div>
            <div className="font-mono-num mt-0.5 text-2xl font-bold text-white">
              {summary.score.toLocaleString('vi-VN')}
            </div>
          </div>

          <div>
            <div className="text-xs text-emerald-200/70">
              {isWeekly ? 'Thành tích giải tuần' : 'Kỷ lục cá nhân'}
            </div>
            <div className="font-mono-num mt-0.5 text-2xl font-bold text-amber-300">
              {summary.highScore.toLocaleString('vi-VN')}
            </div>
          </div>

          <div>
            <div className="text-xs text-emerald-200/70">Quýt thu thập</div>
            <div className="font-mono-num mt-0.5 text-base font-semibold text-amber-400">
              +{summary.yuzuCollected} quả
            </div>
          </div>

          <div>
            <div className="text-xs text-emerald-200/70">Quãng đường · Chuỗi tối đa</div>
            <div className="font-mono-num mt-0.5 text-base font-semibold text-emerald-100">
              {summary.distanceMeters}m · x{Math.min(5, 1 + Math.floor(summary.maxCombo / 5))}
            </div>
          </div>
        </div>

        {/* Global / Weekly Leaderboard Sync Status */}
        <div className="mt-4 text-xs">
          {user ? (
            <div className="flex items-center gap-2 text-emerald-200/90">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span>
                {cloudStatus === 'saving'
                  ? isWeekly
                    ? 'Đang ghi nhận điểm lên BXH Thách đấu tuần...'
                    : 'Đang lưu điểm lên bảng xếp hạng toàn cầu...'
                  : cloudStatus === 'saved'
                  ? isWeekly
                    ? 'Đã cập nhật thành tích mới trên BXH Thách đấu tuần!'
                    : 'Đã cập nhật kỷ lục mới lên bảng xếp hạng toàn cầu.'
                  : cloudStatus === 'error'
                  ? 'Không thể đồng bộ lên Firebase lúc này.'
                  : isWeekly
                  ? `Điểm tốt nhất tuần này của bạn đã được lưu (${(cloudBestScore ?? summary.score).toLocaleString('vi-VN')} điểm).`
                  : `Kỷ lục toàn cầu của bạn: ${(cloudBestScore ?? summary.score).toLocaleString('vi-VN')} điểm.`}
              </span>
            </div>
          ) : (
            <button
              type="button"
              disabled={authBusy}
              onClick={onSignInAndSave}
              className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-amber-400/35 bg-amber-500/15 px-4 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/25 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>
                {authBusy
                  ? 'Đang đăng nhập...'
                  : isWeekly
                  ? 'Đăng nhập Google để ghi danh Thách đấu tuần'
                  : 'Đăng nhập Google để lưu điểm lên BXH toàn cầu'}
              </span>
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-amber-500 px-5 text-sm font-bold text-[#1A1308] transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Chơi lại (Màn mới)</span>
          </button>

          <button
            type="button"
            onClick={onBackToMenu}
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/12 bg-[#21332A] px-4 text-sm font-semibold text-emerald-100 transition-colors hover:bg-[#2B4236] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Màn hình chính</span>
          </button>
        </div>
      </div>
    </div>
  );
}
