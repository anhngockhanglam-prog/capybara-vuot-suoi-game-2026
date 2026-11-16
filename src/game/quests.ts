import { DailyQuest, DailyQuestState, RunSummary } from './types';

interface QuestTemplate {
  id: string;
  title: string;
  metric: DailyQuest['metric'];
  target: number;
  rewardYuzu: number;
}

const QUEST_POOL: QuestTemplate[] = [
  {
    id: 'yuzu_30',
    title: 'Thu thập 30 quả quýt trong ngày',
    metric: 'yuzu',
    target: 30,
    rewardYuzu: 20,
  },
  {
    id: 'yuzu_60',
    title: 'Thu thập 60 quả quýt trong ngày',
    metric: 'yuzu',
    target: 60,
    rewardYuzu: 35,
  },
  {
    id: 'dist_450',
    title: 'Chạy tổng cộng 450m dọc bờ suối',
    metric: 'distance',
    target: 450,
    rewardYuzu: 25,
  },
  {
    id: 'dist_900',
    title: 'Chinh phục tổng cộng 900m đường suối',
    metric: 'distance',
    target: 900,
    rewardYuzu: 40,
  },
  {
    id: 'obs_25',
    title: 'Vượt qua 25 chướng ngại vật',
    metric: 'obstacles',
    target: 25,
    rewardYuzu: 25,
  },
  {
    id: 'fever_2',
    title: 'Kích hoạt Suối Nước Nóng 2 lần',
    metric: 'fever',
    target: 2,
    rewardYuzu: 35,
  },
  {
    id: 'combo_12',
    title: 'Đạt chuỗi nhặt quýt liên tiếp 12 lần',
    metric: 'combo',
    target: 12,
    rewardYuzu: 30,
  },
  {
    id: 'runs_3',
    title: 'Hoàn thành 3 lượt chạy thư giãn',
    metric: 'runs',
    target: 3,
    rewardYuzu: 20,
  },
];

export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hashDateKey(dateKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function generateDailyQuests(dateKey: string = getTodayDateKey()): DailyQuestState {
  const seed = hashDateKey(dateKey);
  const poolCopy = [...QUEST_POOL];
  const chosen: DailyQuest[] = [];

  // Deterministically pick 3 quests with distinct metrics for today
  let cursor = seed;
  while (chosen.length < 3 && poolCopy.length > 0) {
    const idx = cursor % poolCopy.length;
    const candidate = poolCopy.splice(idx, 1)[0];
    if (!chosen.some((q) => q.metric === candidate.metric)) {
      chosen.push({
        id: `${dateKey}_${candidate.id}`,
        title: candidate.title,
        metric: candidate.metric,
        target: candidate.target,
        progress: 0,
        rewardYuzu: candidate.rewardYuzu,
        claimed: false,
      });
    }
    cursor = Math.floor(cursor / 7) + chosen.length * 13 + 5;
  }

  return {
    dateKey,
    quests: chosen,
  };
}

export function ensureCurrentDailyQuests(state?: DailyQuestState): DailyQuestState {
  const today = getTodayDateKey();
  if (!state || state.dateKey !== today || !Array.isArray(state.quests) || state.quests.length === 0) {
    return generateDailyQuests(today);
  }
  return state;
}

export function applyRunToQuests(state: DailyQuestState, summary: RunSummary): DailyQuestState {
  const current = ensureCurrentDailyQuests(state);
  const updatedQuests = current.quests.map((q) => {
    if (q.progress >= q.target) return q;
    let nextProgress = q.progress;
    switch (q.metric) {
      case 'yuzu':
        nextProgress += summary.yuzuCollected;
        break;
      case 'distance':
        nextProgress += summary.distanceMeters;
        break;
      case 'obstacles':
        nextProgress += summary.obstaclesPassed;
        break;
      case 'fever':
        nextProgress += summary.feverCount;
        break;
      case 'combo':
        nextProgress = Math.max(nextProgress, summary.maxCombo);
        break;
      case 'runs':
        nextProgress += 1;
        break;
    }
    return {
      ...q,
      progress: Math.min(q.target, nextProgress),
    };
  });

  return {
    ...current,
    quests: updatedQuests,
  };
}
