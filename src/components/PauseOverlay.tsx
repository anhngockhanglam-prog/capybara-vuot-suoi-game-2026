import { Camera, Home, Play, RotateCcw } from 'lucide-react';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenPhotoMode: () => void;
  onBackToMenu: () => void;
}

export function PauseOverlay({
  onResume,
  onRestart,
  onOpenPhotoMode,
  onBackToMenu,
}: PauseOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0D1712]/75 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-xl border border-white/12 bg-[#16231D] p-6 shadow-2xl">
        <h2 className="font-display text-2xl font-bold text-white">Đang tạm dừng</h2>
        <p className="mt-1.5 text-sm text-emerald-100/75">
          Chú Capybara đang nghỉ ngơi một chút bên bờ suối.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-amber-500 px-5 text-sm font-bold text-[#1A1308] transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            <span>Tiếp tục</span>
          </button>

          <button
            type="button"
            onClick={onOpenPhotoMode}
            className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            <span>Chế độ Photo Mode</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/12 bg-[#21332A] px-4 text-sm font-semibold text-emerald-50 transition-colors hover:bg-[#2B4236] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Chơi lại (Màn mới)</span>
          </button>

          <button
            type="button"
            onClick={onBackToMenu}
            className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-transparent px-4 text-sm font-medium text-emerald-200/85 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Màn hình chính</span>
          </button>
        </div>
      </div>
    </div>
  );
}
