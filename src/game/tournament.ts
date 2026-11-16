import { TournamentBadgeRecord, WeeklyTournamentBadgeId } from './types';

export const WEEK_MS = 7 * 86400000;
export const MONDAY_OFFSET_MS = 3 * 86400000; // Aligns weekly reset cleanly to Monday 00:00 UTC

export const WEEKLY_QUALIFIER_REWARD_YUZU = 60;

export interface WeeklyRewardTier {
  id: WeeklyTournamentBadgeId;
  title: string;
  rankLabel: string;
  minRank: number;
  maxRank: number;
  rewardYuzu: number;
  accentColor: string;
  description: string;
}

export const WEEKLY_REWARD_TIERS: WeeklyRewardTier[] = [
  {
    id: 'weekly_champion',
    title: 'Huy hiệu Quán Quân Tuần',
    rankLabel: 'Hạng #1',
    minRank: 1,
    maxRank: 1,
    rewardYuzu: 500,
    accentColor: '#FBBF24',
    description: 'Độc tôn ngôi đầu bảng Thách đấu tuần.',
  },
  {
    id: 'weekly_runner_up',
    title: 'Huy hiệu Á Quân Tuần',
    rankLabel: 'Hạng #2',
    minRank: 2,
    maxRank: 2,
    rewardYuzu: 300,
    accentColor: '#E2E8F0',
    description: 'Về nhì đầy thuyết phục trong giải đấu tuần.',
  },
  {
    id: 'weekly_third',
    title: 'Huy hiệu Quý Quân Tuần',
    rankLabel: 'Hạng #3',
    minRank: 3,
    maxRank: 3,
    rewardYuzu: 200,
    accentColor: '#FB923C',
    description: 'Xuất sắc góp mặt trong Top 3 bảng xếp hạng tuần.',
  },
  {
    id: 'weekly_top10',
    title: 'Huy hiệu Tinh Anh Tuần',
    rankLabel: 'Top 4 – 10',
    minRank: 4,
    maxRank: 10,
    rewardYuzu: 120,
    accentColor: '#34D399',
    description: 'Lọt vào Top 10 cao thủ Thách đấu tuần.',
  },
  {
    id: 'weekly_participant',
    title: 'Huy hiệu Chiến Binh Tuần',
    rankLabel: 'Hạng 11+',
    minRank: 11,
    maxRank: 999999,
    rewardYuzu: 50,
    accentColor: '#38BDF8',
    description: 'Hoàn thành thi đấu và ghi danh trên bảng xếp hạng tuần.',
  },
];

export function getCurrentWeekIndex(nowMs: number = Date.now()): number {
  return Math.floor((nowMs + MONDAY_OFFSET_MS) / WEEK_MS);
}

export function getWeekId(weekIndex: number): string {
  return `week_${weekIndex}`;
}

export function getWeekDateRange(weekIndex: number): { startDate: Date; endDate: Date } {
  const startMs = weekIndex * WEEK_MS - MONDAY_OFFSET_MS;
  const endMs = startMs + WEEK_MS - 86400000;
  return {
    startDate: new Date(startMs),
    endDate: new Date(endMs),
  };
}

function formatUtcDayMonth(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

export function getWeekLabel(weekIndex: number): string {
  const { startDate, endDate } = getWeekDateRange(weekIndex);
  const seasonNum = Math.max(1, weekIndex - 2960);
  return `Mùa Tuần #${seasonNum} (${formatUtcDayMonth(startDate)} – ${formatUtcDayMonth(endDate)})`;
}

export function getTimeUntilWeeklyReset(nowMs: number = Date.now()): {
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
} {
  const currentIdx = getCurrentWeekIndex(nowMs);
  const nextWeekStartMs = (currentIdx + 1) * WEEK_MS - MONDAY_OFFSET_MS;
  const remaining = Math.max(0, nextWeekStartMs - nowMs);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const formatted =
    days > 0 ? `${days} ngày ${hours} giờ ${minutes} phút` : `${hours} giờ ${minutes} phút`;
  return { days, hours, minutes, formatted };
}

export function getRewardForWeeklyRank(rank: number): WeeklyRewardTier {
  const safeRank = Math.max(1, Math.floor(rank));
  return (
    WEEKLY_REWARD_TIERS.find((t) => safeRank >= t.minRank && safeRank <= t.maxRank) ??
    WEEKLY_REWARD_TIERS[WEEKLY_REWARD_TIERS.length - 1]
  );
}

export function createTournamentBadgeRecord(params: {
  weekIndex: number;
  rank: number;
  rewardYuzu: number;
  tier: WeeklyRewardTier;
}): TournamentBadgeRecord {
  const { weekIndex, rank, rewardYuzu, tier } = params;
  return {
    weekId: getWeekId(weekIndex),
    weekLabel: getWeekLabel(weekIndex),
    rank,
    badgeId: tier.id,
    badgeTitle: tier.title,
    rewardYuzu,
    awardedAtMs: Date.now(),
  };
}
