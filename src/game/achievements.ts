import { AchievementDefinition, AchievementStats, PetId, RunSummary } from './types';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'dist_100m',
    title: 'Bước chân đầu tiên',
    description: 'Chạy tích lũy tổng cộng 100m dọc theo dòng suối.',
    metric: 'total_distance',
    target: 100,
    rewardYuzu: 20,
    tier: 'bronze',
    badgeLabel: 'Huy hiệu Khởi Hành',
  },
  {
    id: 'dist_1000m',
    title: 'Đi được 1000m',
    description: 'Chinh phục tổng quãng đường 1.000m qua các màn vượt suối.',
    metric: 'total_distance',
    target: 1000,
    rewardYuzu: 80,
    tier: 'gold',
    badgeLabel: 'Huy hiệu Lữ Hành 1000m',
  },
  {
    id: 'best_500m',
    title: 'Bền bỉ một lượt',
    description: 'Đạt quãng đường 500m trong một lượt chạy duy nhất.',
    metric: 'best_distance',
    target: 500,
    rewardYuzu: 60,
    tier: 'silver',
    badgeLabel: 'Huy hiệu Kình Ngư',
  },
  {
    id: 'boss_1',
    title: 'Thợ săn Boss tập sự',
    description: 'Đánh bại con Boss đầu tiên trong chế độ Endless hoặc Đấu Boss.',
    metric: 'bosses_defeated',
    target: 1,
    rewardYuzu: 35,
    tier: 'bronze',
    badgeLabel: 'Huy hiệu Khai Chiến',
  },
  {
    id: 'boss_5',
    title: 'Hộ vệ suối nguồn',
    description: 'Đánh bại tổng cộng 5 Boss trên đường suối.',
    metric: 'bosses_defeated',
    target: 5,
    rewardYuzu: 70,
    tier: 'silver',
    badgeLabel: 'Huy hiệu Hộ Vệ',
  },
  {
    id: 'boss_10',
    title: 'Đánh bại 10 Boss',
    description: 'Hạ gục tổng cộng 10 Boss hùng mạnh bằng kỹ năng chiến đấu.',
    metric: 'bosses_defeated',
    target: 10,
    rewardYuzu: 140,
    tier: 'jade',
    badgeLabel: 'Huy hiệu Diệt Boss Huyền Thoại',
  },
  {
    id: 'yuzu_250',
    title: 'Kho quýt đầu tay',
    description: 'Thu thập tổng cộng 250 trái quýt qua các lượt chạy.',
    metric: 'total_yuzu',
    target: 250,
    rewardYuzu: 45,
    tier: 'silver',
    badgeLabel: 'Huy hiệu Thu Hoạch',
  },
  {
    id: 'combo_20',
    title: 'Chuỗi bất bại x20',
    description: 'Đạt chuỗi combo 20 trái quýt liên tiếp không va chạm.',
    metric: 'max_combo',
    target: 20,
    rewardYuzu: 50,
    tier: 'gold',
    badgeLabel: 'Huy hiệu Nhịp Điệu',
  },
  {
    id: 'fever_5',
    title: 'Nghiện Suối Nước Nóng',
    description: 'Kích hoạt trạng thái Suối nước nóng Bất tử tổng cộng 5 lần.',
    metric: 'fever_count',
    target: 5,
    rewardYuzu: 55,
    tier: 'gold',
    badgeLabel: 'Huy hiệu Hơi Ấm',
  },
  {
    id: 'pet_friend',
    title: 'Người bạn đồng hành',
    description: 'Nhận nuôi ít nhất 1 thú cưng nhỏ đi theo Capybara.',
    metric: 'pets_owned',
    target: 1,
    rewardYuzu: 30,
    tier: 'bronze',
    badgeLabel: 'Huy hiệu Đồng Hành',
  },
];

export function createDefaultAchievementStats(): AchievementStats {
  return {
    totalDistanceMeters: 0,
    bestDistanceMeters: 0,
    totalBossesDefeated: 0,
    totalYuzuCollected: 0,
    maxComboEver: 0,
    totalFeverCount: 0,
    totalRunsCompleted: 0,
  };
}

export function applyRunToAchievementStats(
  stats: AchievementStats,
  summary: RunSummary
): AchievementStats {
  return {
    totalDistanceMeters: stats.totalDistanceMeters + Math.max(0, summary.distanceMeters),
    bestDistanceMeters: Math.max(stats.bestDistanceMeters, summary.distanceMeters),
    totalBossesDefeated: stats.totalBossesDefeated + Math.max(0, summary.bossesDefeated),
    totalYuzuCollected: stats.totalYuzuCollected + Math.max(0, summary.yuzuCollected),
    maxComboEver: Math.max(stats.maxComboEver, summary.maxCombo),
    totalFeverCount: stats.totalFeverCount + Math.max(0, summary.feverCount),
    totalRunsCompleted: stats.totalRunsCompleted + 1,
  };
}

export function getAchievementValue(
  def: AchievementDefinition,
  stats: AchievementStats,
  unlockedPets: PetId[]
): number {
  switch (def.metric) {
    case 'total_distance':
      return stats.totalDistanceMeters;
    case 'best_distance':
      return stats.bestDistanceMeters;
    case 'bosses_defeated':
      return stats.totalBossesDefeated;
    case 'total_yuzu':
      return stats.totalYuzuCollected;
    case 'max_combo':
      return stats.maxComboEver;
    case 'fever_count':
      return stats.totalFeverCount;
    case 'runs_completed':
      return stats.totalRunsCompleted;
    case 'pets_owned':
      return unlockedPets.filter((p) => p !== 'none').length;
  }
}

export function isAchievementUnlocked(
  def: AchievementDefinition,
  stats: AchievementStats,
  unlockedPets: PetId[]
): boolean {
  return getAchievementValue(def, stats, unlockedPets) >= def.target;
}

export function countClaimableAchievements(
  stats: AchievementStats,
  unlockedPets: PetId[],
  claimedIds: string[]
): number {
  return ACHIEVEMENTS.filter(
    (def) => isAchievementUnlocked(def, stats, unlockedPets) && !claimedIds.includes(def.id)
  ).length;
}
