import { User } from 'firebase/auth';
import { Award, Check, Clock, Crown, Gift, LogIn, Play, Trophy } from 'lucide-react';
import { generateWeeklyStageForIndex } from '../game/stages';
import {
  getRewardForWeeklyRank,
  getTimeUntilWeeklyReset,
  getWeekId,
  getWeekLabel,
  WEEKLY_QUALIFIER_REWARD_YUZU,
  WEEKLY_REWARD_TIERS,
} from '../game/tournament';
import {
  TournamentBadgeRecord,
  WeeklyTournamentClaim,
  WeeklyTournamentEntry,
} from '../game/types';

interface WeeklyTournamentPanelProps {
  weekIndex: number;
  entries: WeeklyTournamentEntry[];
  loading: boolean;
  errorMessage: string | null;
  user: User | null;
  personalEntry: WeeklyTournamentEntry | null;
  previousWeekIndex: number;
  previousEntries: WeeklyTournamentEntry[];
  userClaims: WeeklyTournamentClaim[];
  claimedBadges: TournamentBadgeRecord[];
  authBusy: boolean;
  submitting: boolean;
  claiming: boolean;
  onSignIn: () => void;
  onPlayWeeklyTournament: () => void;
  onClaimQualifierReward: () => void;
  onClaimPreviousWeekReward: (rank: number) => void;
}

export function WeeklyTournamentPanel({
  weekIndex,
  entries,
  loading,
  errorMessage,
  user,
  personalEntry,
  previousWeekIndex,
  previousEntries,
  userClaims,
  claimedBadges,
  authBusy,
  submitting,
  claiming,
  onSignIn,
  onPlayWeeklyTournament,
  onClaimQualifierReward,
  onClaimPreviousWeekReward,
}: WeeklyTournamentPanelProps) {
  const weekId = getWeekId(weekIndex);
  const weekLabel = getWeekLabel(weekIndex);
  const weeklyStage = generateWeeklyStageForIndex(weekIndex);
  const resetCountdown = getTimeUntilWeeklyReset();

  const qualifierClaimed = userClaims.some(
    (c) => c.weekId === weekId && c.claimType === 'qualifier'
  );

  const prevWeekId = getWeekId(previousWeekIndex);
  const prevRankIdx = user ? previousEntries.findIndex((e) => e.uid === user.uid) : -1;
  const prevRank = prevRankIdx >= 0 ? prevRankIdx + 1 : null;
  const prevTier = prevRank ? getRewardForWeeklyRank(prevRank) : null;
  const prevFinalClaimed = userClaims.some(
    (c) => c.weekId === prevWeekId && c.claimType === 'final_rank'
  );

  return (
    <section
      aria-labelledby="weekly-tournament-heading"
      className="mt-6 rounded-2xl border border-amber-400/25 bg-[#16231D] p-5 shadow-xl"
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" aria-hidden="true" />
            <h2
              id="weekly-tournament-heading"
              className="font-display text-lg font-bold text-white"
            >
              Thách đấu tuần · {weekLabel}
            </h2>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300">
              {weeklyStage.name}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-emerald-100/75">
            <span className="inline-flex items-center gap-1 text-sky-300">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset sau: {resetCountdown.formatted}</span>
            </span>
            <span className="text-white/25" aria-hidden="true">·</span>
            <span>Nhịp độ chuẩn (Bình thường) công bằng cho mọi Capybara.</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!user && (
            <button
              type="button"
              disabled={authBusy}
              onClick={onSignIn}
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-[#1D2E26] px-3.5 text-xs font-semibold text-white hover:bg-[#273E33] disabled:opacity-50"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{authBusy ? 'Đang đăng nhập...' : 'Đăng nhập Google'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onPlayWeeklyTournament}
            className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg bg-amber-500 px-4 text-xs font-bold text-[#1A1308] hover:bg-amber-400"
          >
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            <span>Thi đấu Giải Tuần ngay</span>
          </button>
        </div>
      </div>

      {/* Previous Week Final Rank Settlement Banner */}
      {user && prevRank && prevTier && !prevFinalClaimed && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/50 bg-[#233224] p-3.5">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 shrink-0 text-amber-400" aria-hidden="true" />
            <div>
              <div className="font-display text-sm font-bold text-amber-200">
                Tổng kết {getWeekLabel(previousWeekIndex)}: Bạn đạt Hạng #{prevRank}!
              </div>
              <div className="text-xs text-emerald-100/80">
                Nhận {prevTier.title} & +{prevTier.rewardYuzu} Quýt thưởng lớn.
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={claiming}
            onClick={() => onClaimPreviousWeekReward(prevRank)}
            className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-3.5 text-xs font-bold text-[#1A1308] hover:bg-amber-400 disabled:opacity-50"
          >
            <Gift className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Nhận thưởng Tuần trước (+{prevTier.rewardYuzu} Quýt)</span>
          </button>
        </div>
      )}

      {/* Personal Qualifier Progress Banner */}
      {user && personalEntry && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-[#13221B] p-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-white">
              Điểm cao nhất tuần này:{' '}
              <strong className="font-mono-num text-amber-300">
                {personalEntry.score.toLocaleString('vi-VN')}
              </strong>
            </span>
            <span className="text-emerald-200/75">
              Số lượt: <strong className="font-mono-num text-white">{personalEntry.runsCount}</strong>
            </span>
            {submitting && <span className="text-sky-300">Đang đồng bộ...</span>}
          </div>

          {qualifierClaimed ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Đã nhận quà tham gia (+{WEEKLY_QUALIFIER_REWARD_YUZU} Quýt)</span>
            </span>
          ) : (
            <button
              type="button"
              disabled={claiming}
              onClick={onClaimQualifierReward}
              className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md bg-emerald-500 px-3 text-xs font-bold text-[#072115] hover:bg-emerald-400 disabled:opacity-50"
            >
              <Gift className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Nhận thưởng ghi danh (+{WEEKLY_QUALIFIER_REWARD_YUZU} Quýt)</span>
            </button>
          )}
        </div>
      )}

      {/* Main Content: Leaderboard Table + Reward Tiers */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Weekly Leaderboard */}
        <div className="rounded-xl border border-white/10 bg-[#121D18] p-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white">
              Bảng xếp hạng Thách đấu tuần (Top 20)
            </h3>
            <span className="text-[11px] text-emerald-200/65">Cập nhật trực tiếp</span>
          </div>

          {errorMessage ? (
            <p className="mt-3 text-xs text-rose-300">{errorMessage}</p>
          ) : loading ? (
            <p className="mt-3 text-xs text-emerald-100/65">Đang tải bảng xếp hạng tuần...</p>
          ) : entries.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-white/15 p-4 text-center text-xs text-emerald-100/70">
              Chưa có ai ghi danh tuần này. Hãy là người đầu tiên lập kỷ lục!
            </div>
          ) : (
            <div className="mt-3 max-h-[290px] space-y-1.5 overflow-y-auto pr-1">
              {entries.map((entry, idx) => {
                const isMe = user?.uid === entry.uid;
                const rank = idx + 1;
                return (
                  <div
                    key={entry.uid}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
                      isMe
                        ? 'border-amber-400/50 bg-[#1F3026]'
                        : 'border-white/8 bg-[#16231D]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`font-mono-num w-6 text-center font-bold ${
                          rank === 1
                            ? 'text-amber-300'
                            : rank === 2
                            ? 'text-slate-200'
                            : rank === 3
                            ? 'text-orange-300'
                            : 'text-emerald-200/70'
                        }`}
                      >
                        #{rank}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">
                          {entry.playerName} {isMe && <span className="text-amber-300">(Bạn)</span>}
                        </div>
                        <div className="text-[11px] text-emerald-200/65">
                          {entry.distanceMeters}m · {entry.bossesDefeated} Boss
                        </div>
                      </div>
                    </div>
                    <div className="font-mono-num shrink-0 text-sm font-bold text-amber-300">
                      {entry.score.toLocaleString('vi-VN')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reward Tiers & Claimed Badges */}
        <div className="space-y-3 rounded-xl border border-white/10 bg-[#121D18] p-4 lg:col-span-5">
          <h3 className="font-display text-sm font-bold text-white">
            Phần thưởng & Huy hiệu độc quyền cuối tuần
          </h3>
          <div className="space-y-1.5">
            {WEEKLY_REWARD_TIERS.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-[#16231D] px-3 py-2 text-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tier.accentColor }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">
                      {tier.rankLabel} · {tier.title}
                    </div>
                  </div>
                </div>
                <span className="font-mono-num shrink-0 font-bold text-amber-300">
                  +{tier.rewardYuzu} Quýt
                </span>
              </div>
            ))}
          </div>

          {claimedBadges.length > 0 && (
            <div className="border-t border-white/10 pt-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
                <Award className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                <span>Huy hiệu tuần bạn đã sưu tầm ({claimedBadges.length})</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {claimedBadges.slice(0, 4).map((b) => (
                  <span
                    key={b.weekId}
                    className="rounded border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-200"
                  >
                    {b.badgeTitle} (#{b.rank})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
