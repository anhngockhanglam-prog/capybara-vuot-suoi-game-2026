import { DEFAULT_AVATAR_URL } from './avatars';
import { createDefaultAchievementStats } from './achievements';
import { ensureCurrentDailyQuests, generateDailyQuests } from './quests';
import {
  ActiveWeather,
  CitizenId,
  CraftedItemId,
  FoodId,
  HomeItemId,
  IngredientId,
  KingdomState,
  MountId,
  OutfitId,
  PetId,
  SavedProgress,
  SideQuestItem,
} from './types';
import { FORECAST_WEATHER_LIST, rollForecastWeather } from './weather';
import {
  clampStat,
  createDefaultCraftedItems,
  createDefaultFoodInventory,
  createDefaultIngredients,
  createDefaultKingdom,
  createDefaultSideQuests,
} from './world';

const STORAGE_KEY = 'capybara_vuot_suoi_progress_v2';
const LEGACY_KEY = 'capybara_vuot_suoi_progress_v1';

function createDefaultProgress(): SavedProgress {
  return {
    highScores: {
      relaxed: 0,
      normal: 0,
      turbo: 0,
    },
    yuzuBank: 0,
    avatar: DEFAULT_AVATAR_URL,
    appearance: {
      name: 'Mochi',
      fur: 'classic',
      head: 'none',
      neck: 'none',
      outfit: 'none',
      mount: 'none',
    },
    unlockedFur: ['classic'],
    unlockedHead: ['none'],
    unlockedNeck: ['none'],
    unlockedOutfits: ['none'],
    unlockedMounts: ['none'],
    unlockedSkills: ['yuzu_shot'],
    customMaps: [],
    selectedDifficulty: 'normal',
    weatherMode: 'auto',
    dailyQuests: generateDailyQuests(),
    muted: false,
    needs: {
      hunger: 80,
      energy: 85,
      happiness: 80,
      updatedAt: Date.now(),
    },
    foodInventory: createDefaultFoodInventory(),
    unlockedHomeItems: ['tatami'],
    activeHomeItems: ['tatami'],
    unlockedPets: ['none'],
    selectedPet: 'none',
    petBond: {
      duckling: 30,
      frog: 30,
      turtle: 30,
      shiba: 30,
      otter: 30,
      red_panda: 30,
      alpaca: 30,
      phoenix_chick: 30,
    },
    achievementStats: createDefaultAchievementStats(),
    claimedAchievements: [],
    forecastWeather: rollForecastWeather(),
    weatherCharms: 2,
    weatherLockedByCharm: false,
    tournamentBadges: [],
    sideQuests: createDefaultSideQuests(),
    ingredients: createDefaultIngredients(),
    craftedItems: createDefaultCraftedItems(),
    potionHue: null,
    balloonsActive: false,
    glowingFoodUntil: 0,
    kingdom: createDefaultKingdom(),
    meteorStones: 0,
    alienMetCount: 0,
    midnightChestDayKey: null,
    discoveredCreatures: [],
  };
}

function normalizeIngredients(raw?: Partial<Record<IngredientId, number>>): Record<IngredientId, number> {
  const base = createDefaultIngredients();
  if (!raw || typeof raw !== 'object') return base;
  return {
    glow_mushroom:
      typeof raw.glow_mushroom === 'number' ? Math.max(0, Math.floor(raw.glow_mushroom)) : base.glow_mushroom,
    ice_crystal:
      typeof raw.ice_crystal === 'number' ? Math.max(0, Math.floor(raw.ice_crystal)) : base.ice_crystal,
    sea_pearl:
      typeof raw.sea_pearl === 'number' ? Math.max(0, Math.floor(raw.sea_pearl)) : base.sea_pearl,
    candy_sugar:
      typeof raw.candy_sugar === 'number' ? Math.max(0, Math.floor(raw.candy_sugar)) : base.candy_sugar,
    meteor_stone:
      typeof raw.meteor_stone === 'number' ? Math.max(0, Math.floor(raw.meteor_stone)) : base.meteor_stone,
  };
}

function normalizeCraftedItems(raw?: Partial<Record<CraftedItemId, number>>): Record<CraftedItemId, number> {
  const base = createDefaultCraftedItems();
  if (!raw || typeof raw !== 'object') return base;
  return {
    fur_potion:
      typeof raw.fur_potion === 'number' ? Math.max(0, Math.floor(raw.fur_potion)) : base.fur_potion,
    floating_balloons:
      typeof raw.floating_balloons === 'number'
        ? Math.max(0, Math.floor(raw.floating_balloons))
        : base.floating_balloons,
    glowing_food:
      typeof raw.glowing_food === 'number' ? Math.max(0, Math.floor(raw.glowing_food)) : base.glowing_food,
  };
}

function normalizeKingdom(raw?: Partial<KingdomState>): KingdomState {
  const base = createDefaultKingdom();
  if (!raw || typeof raw !== 'object') return base;
  return {
    castleLevel:
      typeof raw.castleLevel === 'number'
        ? Math.max(0, Math.min(3, Math.floor(raw.castleLevel)))
        : base.castleLevel,
    citizens: Array.isArray(raw.citizens)
      ? (Array.from(new Set(raw.citizens)) as CitizenId[])
      : base.citizens,
    festivalsHeld:
      typeof raw.festivalsHeld === 'number' ? Math.max(0, Math.floor(raw.festivalsHeld)) : 0,
    activeFestivalUntil:
      typeof raw.activeFestivalUntil === 'number' ? raw.activeFestivalUntil : 0,
    activeFestivalId: raw.activeFestivalId ?? null,
  };
}

function normalizeSideQuests(raw?: SideQuestItem[]): SideQuestItem[] {
  const defaults = createDefaultSideQuests();
  if (!Array.isArray(raw) || raw.length === 0) return defaults;
  return defaults.map((def) => {
    const found = raw.find((q) => q && q.id === def.id);
    if (!found) return def;
    return {
      ...def,
      progress:
        typeof found.progress === 'number'
          ? Math.max(0, Math.min(def.target, Math.floor(found.progress)))
          : 0,
      claimed: Boolean(found.claimed),
    };
  });
}

function normalizeFoodInventory(raw?: Partial<Record<FoodId, number>>): Record<FoodId, number> {
  const base = createDefaultFoodInventory();
  if (!raw || typeof raw !== 'object') return base;
  return {
    carrot: typeof raw.carrot === 'number' ? Math.max(0, Math.floor(raw.carrot)) : base.carrot,
    yuzu_sweet:
      typeof raw.yuzu_sweet === 'number'
        ? Math.max(0, Math.floor(raw.yuzu_sweet))
        : base.yuzu_sweet,
    watermelon:
      typeof raw.watermelon === 'number' ? Math.max(0, Math.floor(raw.watermelon)) : 0,
    mochi: typeof raw.mochi === 'number' ? Math.max(0, Math.floor(raw.mochi)) : 0,
    bamboo_salad:
      typeof raw.bamboo_salad === 'number' ? Math.max(0, Math.floor(raw.bamboo_salad)) : 0,
  };
}

export function loadProgress(): SavedProgress {
  if (typeof window === 'undefined') return createDefaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedProgress>;
      const defaults = createDefaultProgress();
      const unlockedPets: PetId[] =
        Array.isArray(parsed.unlockedPets) && parsed.unlockedPets.length > 0
          ? (Array.from(new Set(['none', ...parsed.unlockedPets])) as PetId[])
          : defaults.unlockedPets;
      const selectedPet: PetId =
        parsed.selectedPet && unlockedPets.includes(parsed.selectedPet)
          ? parsed.selectedPet
          : 'none';
      return {
        highScores: {
          relaxed: parsed.highScores?.relaxed ?? 0,
          normal: parsed.highScores?.normal ?? 0,
          turbo: parsed.highScores?.turbo ?? 0,
        },
        yuzuBank: typeof parsed.yuzuBank === 'number' ? parsed.yuzuBank : 0,
        avatar:
          typeof parsed.avatar === 'string' && parsed.avatar.length > 0
            ? parsed.avatar
            : defaults.avatar,
        appearance: {
          name: parsed.appearance?.name?.trim() || 'Mochi',
          fur: parsed.appearance?.fur ?? 'classic',
          head: parsed.appearance?.head ?? 'none',
          neck: parsed.appearance?.neck ?? 'none',
          outfit: parsed.appearance?.outfit ?? 'none',
          mount: parsed.appearance?.mount ?? 'none',
        },
        unlockedFur:
          Array.isArray(parsed.unlockedFur) && parsed.unlockedFur.length > 0
            ? parsed.unlockedFur
            : defaults.unlockedFur,
        unlockedHead:
          Array.isArray(parsed.unlockedHead) && parsed.unlockedHead.length > 0
            ? parsed.unlockedHead
            : defaults.unlockedHead,
        unlockedNeck:
          Array.isArray(parsed.unlockedNeck) && parsed.unlockedNeck.length > 0
            ? parsed.unlockedNeck
            : defaults.unlockedNeck,
        unlockedOutfits:
          Array.isArray(parsed.unlockedOutfits) && parsed.unlockedOutfits.length > 0
            ? (Array.from(new Set(['none', ...parsed.unlockedOutfits])) as OutfitId[])
            : defaults.unlockedOutfits,
        unlockedMounts:
          Array.isArray(parsed.unlockedMounts) && parsed.unlockedMounts.length > 0
            ? (Array.from(new Set(['none', ...parsed.unlockedMounts])) as MountId[])
            : defaults.unlockedMounts,
        unlockedSkills:
          Array.isArray(parsed.unlockedSkills) && parsed.unlockedSkills.length > 0
            ? parsed.unlockedSkills
            : defaults.unlockedSkills,
        customMaps: Array.isArray(parsed.customMaps) ? parsed.customMaps : [],
        selectedDifficulty: parsed.selectedDifficulty ?? 'normal',
        weatherMode: parsed.weatherMode ?? 'auto',
        dailyQuests: ensureCurrentDailyQuests(parsed.dailyQuests),
        muted: Boolean(parsed.muted),
        needs: {
          hunger: clampStat(parsed.needs?.hunger ?? defaults.needs.hunger),
          energy: clampStat(parsed.needs?.energy ?? defaults.needs.energy),
          happiness: clampStat(parsed.needs?.happiness ?? defaults.needs.happiness),
          updatedAt:
            typeof parsed.needs?.updatedAt === 'number'
              ? parsed.needs.updatedAt
              : Date.now(),
        },
        foodInventory: normalizeFoodInventory(parsed.foodInventory),
        unlockedHomeItems:
          Array.isArray(parsed.unlockedHomeItems) && parsed.unlockedHomeItems.length > 0
            ? (Array.from(new Set(['tatami', ...parsed.unlockedHomeItems])) as HomeItemId[])
            : defaults.unlockedHomeItems,
        activeHomeItems:
          Array.isArray(parsed.activeHomeItems) && parsed.activeHomeItems.length > 0
            ? parsed.activeHomeItems
            : defaults.activeHomeItems,
        unlockedPets,
        selectedPet,
        petBond: {
          duckling: clampStat(parsed.petBond?.duckling ?? defaults.petBond.duckling),
          frog: clampStat(parsed.petBond?.frog ?? defaults.petBond.frog),
          turtle: clampStat(parsed.petBond?.turtle ?? defaults.petBond.turtle),
          shiba: clampStat(parsed.petBond?.shiba ?? defaults.petBond.shiba),
          otter: clampStat(parsed.petBond?.otter ?? defaults.petBond.otter),
          red_panda: clampStat(parsed.petBond?.red_panda ?? defaults.petBond.red_panda),
          alpaca: clampStat(parsed.petBond?.alpaca ?? defaults.petBond.alpaca),
          phoenix_chick: clampStat(parsed.petBond?.phoenix_chick ?? defaults.petBond.phoenix_chick),
        },
        achievementStats: {
          totalDistanceMeters: Math.max(
            0,
            Math.floor(parsed.achievementStats?.totalDistanceMeters ?? 0)
          ),
          bestDistanceMeters: Math.max(
            0,
            Math.floor(parsed.achievementStats?.bestDistanceMeters ?? 0)
          ),
          totalBossesDefeated: Math.max(
            0,
            Math.floor(parsed.achievementStats?.totalBossesDefeated ?? 0)
          ),
          totalYuzuCollected: Math.max(
            0,
            Math.floor(parsed.achievementStats?.totalYuzuCollected ?? 0)
          ),
          maxComboEver: Math.max(
            0,
            Math.floor(parsed.achievementStats?.maxComboEver ?? 0)
          ),
          totalFeverCount: Math.max(
            0,
            Math.floor(parsed.achievementStats?.totalFeverCount ?? 0)
          ),
          totalRunsCompleted: Math.max(
            0,
            Math.floor(parsed.achievementStats?.totalRunsCompleted ?? 0)
          ),
        },
        claimedAchievements: Array.isArray(parsed.claimedAchievements)
          ? Array.from(new Set(parsed.claimedAchievements))
          : [],
        forecastWeather:
          parsed.forecastWeather &&
          FORECAST_WEATHER_LIST.includes(parsed.forecastWeather as ActiveWeather)
            ? (parsed.forecastWeather as ActiveWeather)
            : defaults.forecastWeather,
        weatherCharms:
          typeof parsed.weatherCharms === 'number'
            ? Math.max(0, Math.floor(parsed.weatherCharms))
            : defaults.weatherCharms,
        weatherLockedByCharm: Boolean(parsed.weatherLockedByCharm),
        tournamentBadges: Array.isArray(parsed.tournamentBadges) ? parsed.tournamentBadges : [],
        sideQuests: normalizeSideQuests(parsed.sideQuests),
        ingredients: normalizeIngredients(parsed.ingredients),
        craftedItems: normalizeCraftedItems(parsed.craftedItems),
        potionHue: typeof parsed.potionHue === 'number' ? parsed.potionHue : null,
        balloonsActive: Boolean(parsed.balloonsActive),
        glowingFoodUntil:
          typeof parsed.glowingFoodUntil === 'number' ? parsed.glowingFoodUntil : 0,
        kingdom: normalizeKingdom(parsed.kingdom),
        meteorStones:
          typeof parsed.meteorStones === 'number' ? Math.max(0, Math.floor(parsed.meteorStones)) : 0,
        alienMetCount:
          typeof parsed.alienMetCount === 'number' ? Math.max(0, Math.floor(parsed.alienMetCount)) : 0,
        midnightChestDayKey:
          typeof parsed.midnightChestDayKey === 'string' ? parsed.midnightChestDayKey : null,
        discoveredCreatures: Array.isArray(parsed.discoveredCreatures)
          ? Array.from(new Set(parsed.discoveredCreatures))
          : [],
      };
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as {
        highScores?: Record<string, number>;
        yuzuBank?: number;
        unlockedSkins?: string[];
        selectedSkin?: string;
        selectedDifficulty?: SavedProgress['selectedDifficulty'];
        muted?: boolean;
      };
      const defaults = createDefaultProgress();
      const headMap: Record<string, SavedProgress['appearance']['head']> = {
        classic: 'none',
        towel: 'towel',
        lotus: 'lotus',
        crown: 'crown',
      };
      const unlockedHead = Array.isArray(legacy.unlockedSkins)
        ? Array.from(
            new Set([
              'none' as const,
              ...legacy.unlockedSkins.map((s) => headMap[s] ?? 'none'),
            ])
          )
        : defaults.unlockedHead;

      return {
        ...defaults,
        highScores: {
          relaxed: legacy.highScores?.relaxed ?? 0,
          normal: legacy.highScores?.normal ?? 0,
          turbo: legacy.highScores?.turbo ?? 0,
        },
        yuzuBank: typeof legacy.yuzuBank === 'number' ? legacy.yuzuBank : 0,
        appearance: {
          ...defaults.appearance,
          head: headMap[legacy.selectedSkin ?? 'classic'] ?? 'none',
        },
        unlockedHead,
        selectedDifficulty: legacy.selectedDifficulty ?? 'normal',
        muted: Boolean(legacy.muted),
      };
    }

    return createDefaultProgress();
  } catch {
    return createDefaultProgress();
  }
}

export function saveProgress(progress: SavedProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}
