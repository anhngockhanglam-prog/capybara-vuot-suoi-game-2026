import { CheckCircle2, Gift } from 'lucide-react';
import { DailyQuestState } from '../game/types';

interface DailyQuestsPanelProps {
  questState: DailyQuestState;
  onClaimQuest: (questId: string) => void;
}

export function DailyQuestsPanel({ questState, onClaimQuest }: DailyQuestsPanelProps) {
  const completedCount = questState.quests.filter((q) => q.claimed).length;

  return (
    <section
      aria-labelledby="quests-heading"
      className="flex flex-col rounded-2xl border border-white/10 bg-[#16231D] p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h2 id="quests-heading" className="font-display text-lg font-bold text-white">
            Nhiệm vụ hằng ngày
          </h2>
          <p className="text-xs text-emerald-100/70">
            Làm mới mỗi ngày · Hoàn thành để nhận thêm quýt mở khóa phụ kiện.
          </p>
        </div>

        <div className="font-mono-num text-xs text-emerald-200/80">
          {questState.dateKey} · Đã nhận {completedCount}/{questState.quests.length}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-3">
        {questState.quests.map((quest) => {
          const isComplete = quest.progress >= quest.target;
          const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100));

          return (
            <div
              key={quest.id}
              className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#14201A] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{quest.title}</h3>
                  <div className="mt-1 font-mono-num text-xs text-emerald-200/75">
                    Tiến độ: {quest.progress} / {quest.target} ({pct}%)
                  </div>
                </div>

                <div className="shrink-0 font-mono-num text-xs font-bold text-amber-400">
                  +{quest.rewardYuzu} quýt
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-sm bg-black/40">
                <div
                  className={`h-full origin-left transition-transform duration-200 ${
                    quest.claimed
                      ? 'bg-emerald-500'
                      : isComplete
                      ? 'bg-amber-400'
                      : 'bg-emerald-400/80'
                  }`}
                  style={{ transform: `scaleX(${pct / 100})` }}
                />
              </div>

              <div className="mt-3 flex justify-end">
                {quest.claimed ? (
                  <span className="inline-flex h-9 items-center gap-1.5 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Đã nhận thưởng</span>
                  </span>
                ) : isComplete ? (
                  <button
                    type="button"
                    onClick={() => onClaimQuest(quest.id)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-4 text-xs font-bold text-[#1A1308] transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    <Gift className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Nhận +{quest.rewardYuzu} quýt</span>
                  </button>
                ) : (
                  <span className="inline-flex h-9 items-center text-xs font-medium text-emerald-200/60">
                    Đang thực hiện
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
