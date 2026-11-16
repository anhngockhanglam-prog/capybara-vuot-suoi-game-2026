import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  BatteryCharging,
  Camera,
  Carrot,
  Check,
  CloudRain,
  Compass,
  Crown,
  Download,
  Fish,
  Flame,
  FlaskConical,
  Gamepad2,
  Hand,
  Heart,
  Home,
  Info,
  Lock,
  MapPin,
  Moon,
  Orbit,
  PawPrint,
  Rainbow,
  Rocket,
  RotateCcw,
  Shirt,
  ShoppingBag,
  Shuffle,
  Smile,
  Snowflake,
  Sparkles,
  Sun,
  Sunset,
  Swords,
  TrainFront,
  Trees,
  Trophy,
  Upload,
  Utensils,
  Waves,
} from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  ACHIEVEMENTS,
  countClaimableAchievements,
  getAchievementValue,
  isAchievementUnlocked,
} from '../game/achievements';
import { PRESET_AVATARS, resizeUploadedAvatar } from '../game/avatars';
import { resolveNameEffect } from '../game/nameEffects';
import {
  getPetAutoCollectRadius,
  getPetDef,
  getPetEffectiveGoldenBonus,
  getPetItemDurationMultiplier,
  PET_OPTIONS,
} from '../game/pets';
import { BOSS_SKILLS } from '../game/skills';
import {
  FUR_OPTIONS,
  HEAD_ACCESSORIES,
  MOUNT_OPTIONS,
  NECK_ACCESSORIES,
  OUTFIT_OPTIONS,
} from '../game/skins';
import { soundEngine } from '../game/sound';
import {
  AchievementStats,
  AchievementTier,
  ActiveWeather,
  CapybaraActivityId,
  CapybaraAppearance,
  CapybaraNeeds,
  CitizenId,
  CraftedItemId,
  CustomizationItem,
  EnvironmentalActionId,
  FestivalId,
  FoodId,
  FurColorId,
  HeadAccessoryId,
  HomeItemId,
  IngredientId,
  KingdomState,
  MountId,
  NeckAccessoryId,
  OutfitId,
  PetId,
  SideQuestId,
  SideQuestItem,
  SkillId,
  TournamentBadgeRecord,
  WorldAreaId,
} from '../game/types';
import { WEATHER_CHARM_COST } from '../game/weather';
import {
  CAPYBARA_ACTIVITIES,
  CASTLE_TIERS,
  CRAFTING_RECIPES,
  ENVIRONMENTAL_INTERACTIONS,
  EXOTIC_CREATURES,
  EXPLORE_LOCATIONS,
  ExploreDestinationId,
  FOOD_ITEMS,
  HOME_ITEMS,
  hasWellFedBuff,
  INGREDIENTS_META,
  KINGDOM_CITIZENS,
  KINGDOM_FESTIVALS,
  WORLD_AREAS,
} from '../game/world';
import { CapybaraPreview } from './CapybaraPreview';
import { ScenePulseEvent, WorldSceneCanvas } from './WorldSceneCanvas';

type ShopTab = 'skills' | 'food' | 'outfit' | 'home_decor' | 'pets';
type WardrobeTab = 'fur' | 'outfit' | 'mount' | 'head' | 'neck';

interface CapybaraWorldHubProps {
  yuzuBank: number;
  avatar: string;
  appearance: CapybaraAppearance;
  needs: CapybaraNeeds;
  foodInventory: Record<FoodId, number>;
  unlockedFur: FurColorId[];
  unlockedHead: HeadAccessoryId[];
  unlockedNeck: NeckAccessoryId[];
  unlockedOutfits: OutfitId[];
  unlockedMounts: MountId[];
  unlockedSkills: SkillId[];
  unlockedHomeItems: HomeItemId[];
  activeHomeItems: HomeItemId[];
  unlockedPets: PetId[];
  selectedPet: PetId;
  petBond: Record<Exclude<PetId, 'none'>, number>;
  achievementStats: AchievementStats;
  claimedAchievements: string[];
  activeWeather: ActiveWeather;
  sideQuests: SideQuestItem[];
  weatherCharms: number;
  tournamentBadges: TournamentBadgeRecord[];
  ingredients: Record<IngredientId, number>;
  craftedItems: Record<CraftedItemId, number>;
  potionHue: number | null;
  balloonsActive: boolean;
  glowingFoodActive: boolean;
  kingdom: KingdomState;
  meteorStones: number;
  alienMetCount: number;
  midnightChestClaimed: boolean;
  discoveredCreatures: string[];
  onChangeName: (name: string) => void;
  onChangeAvatar: (avatarUrl: string) => void;
  onSelectOrUnlockFur: (id: FurColorId) => void;
  onSelectOrUnlockHead: (id: HeadAccessoryId) => void;
  onSelectOrUnlockNeck: (id: NeckAccessoryId) => void;
  onSelectOrUnlockOutfit: (id: OutfitId) => void;
  onSelectOrUnlockMount: (id: MountId) => void;
  onRandomizeOutfit: () => void;
  onUnlockSkill: (id: SkillId) => void;
  onBuyFood: (id: FoodId) => void;
  onFeedCapybara: (id: FoodId) => void;
  onUnlockOrToggleHomeItem: (id: HomeItemId) => void;
  onSelectOrUnlockPet: (id: PetId) => void;
  onCarePet: (id: Exclude<PetId, 'none'>, action: 'pet' | 'treat') => { message: string; ok: boolean };
  onClaimAchievement: (id: string) => void;
  onOpenPhotoMode: () => void;
  onBuyWeatherCharm: () => void;
  onSideQuestProgress: (questId: SideQuestId, detail: string) => void;
  onClaimSideQuest: (questId: SideQuestId) => void;
  onResetSideQuests: () => void;
  onFishingCatch: (rewardYuzu: number, fishName: string) => void;
  onEnvInteraction: (envId: EnvironmentalActionId) => { message: string; ok: boolean };
  onCollectIngredient: (id: IngredientId, amount: number, sourceLabel: string) => void;
  onBuyIngredient: (id: IngredientId) => { message: string; ok: boolean };
  onCraftItem: (id: CraftedItemId) => { message: string; ok: boolean };
  onUseCraftedItem: (id: CraftedItemId) => { message: string; ok: boolean };
  onClearPotionHue: () => void;
  onUpgradeCastle: () => { message: string; ok: boolean };
  onRecruitCitizen: (id: CitizenId) => { message: string; ok: boolean };
  onHostFestival: (id: FestivalId) => { message: string; ok: boolean };
  onGreetRoyals: () => { message: string; ok: boolean };
  onCollectMeteorStone: () => void;
  onMeetAlien: () => void;
  onClaimMidnightChest: () => void;
  onDiscoverCreature: (creatureId: string, name: string, rewardYuzu: number) => void;
  onWorldActivity: (
    kind:
      | 'rest'
      | 'swim'
      | 'toss_yuzu'
      | 'forage'
      | 'meditate'
      | 'bounce'
      | 'pet'
      | 'playground_hit'
      | 'capy_activity',
    payload?: { golden?: boolean; activityId?: CapybaraActivityId }
  ) => { message: string; ok: boolean };
}

const AREA_ICONS: Record<WorldAreaId, typeof Home> = {
  home: Home,
  pool: Waves,
  forest: Trees,
  playground: Gamepad2,
  explore: MapPin,
  kingdom: Crown,
  spaceship: Rocket,
  crafting: FlaskConical,
  shop: ShoppingBag,
  wardrobe: Shirt,
  food: Carrot,
  pets: PawPrint,
  achievements: Trophy,
};

const TIER_STYLES: Record<
  AchievementTier,
  { label: string; frameClass: string; textClass: string }
> = {
  bronze: {
    label: 'Huy hiệu Đồng',
    frameClass: 'border-amber-700/60 bg-amber-900/35 text-amber-300',
    textClass: 'text-amber-300/90',
  },
  silver: {
    label: 'Huy hiệu Bạc',
    frameClass: 'border-slate-400/50 bg-slate-700/35 text-slate-200',
    textClass: 'text-slate-200',
  },
  gold: {
    label: 'Huy hiệu Vàng',
    frameClass: 'border-amber-400/60 bg-amber-500/20 text-amber-300',
    textClass: 'text-amber-300',
  },
  jade: {
    label: 'Huy hiệu Ngọc',
    frameClass: 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300',
    textClass: 'text-emerald-300',
  },
};

function getAchievementIcon(id: string) {
  if (id.startsWith('boss_')) return Swords;
  if (id.startsWith('dist_') || id.startsWith('best_')) return Compass;
  if (id.startsWith('combo_')) return Crown;
  if (id.startsWith('fever_')) return Flame;
  if (id.startsWith('pet_')) return PawPrint;
  return Award;
}

export function CapybaraWorldHub({
  yuzuBank,
  avatar,
  appearance,
  needs,
  foodInventory,
  unlockedFur,
  unlockedHead,
  unlockedNeck,
  unlockedOutfits,
  unlockedMounts,
  unlockedSkills,
  unlockedHomeItems,
  activeHomeItems,
  unlockedPets,
  selectedPet,
  petBond,
  achievementStats,
  claimedAchievements,
  activeWeather,
  sideQuests,
  weatherCharms,
  tournamentBadges,
  ingredients,
  craftedItems,
  potionHue,
  balloonsActive,
  glowingFoodActive,
  kingdom,
  meteorStones,
  alienMetCount,
  midnightChestClaimed,
  discoveredCreatures,
  onChangeName,
  onChangeAvatar,
  onSelectOrUnlockFur,
  onSelectOrUnlockHead,
  onSelectOrUnlockNeck,
  onSelectOrUnlockOutfit,
  onSelectOrUnlockMount,
  onRandomizeOutfit,
  onUnlockSkill,
  onBuyFood,
  onFeedCapybara,
  onUnlockOrToggleHomeItem,
  onSelectOrUnlockPet,
  onCarePet,
  onClaimAchievement,
  onOpenPhotoMode,
  onBuyWeatherCharm,
  onSideQuestProgress,
  onClaimSideQuest,
  onResetSideQuests,
  onFishingCatch,
  onEnvInteraction,
  onCollectIngredient,
  onBuyIngredient,
  onCraftItem,
  onUseCraftedItem,
  onClearPotionHue,
  onUpgradeCastle,
  onRecruitCitizen,
  onHostFestival,
  onGreetRoyals,
  onCollectMeteorStone,
  onMeetAlien,
  onClaimMidnightChest,
  onDiscoverCreature,
  onWorldActivity,
}: CapybaraWorldHubProps) {
  const [area, setArea] = useState<WorldAreaId>('home');
  const [exploreLocation, setExploreLocation] = useState<ExploreDestinationId>('glowing_forest');
  const [sceneWeather, setSceneWeather] = useState<ActiveWeather>(activeWeather);
  const [skyPhase, setSkyPhase] = useState<'day' | 'sunset' | 'night'>('day');
  const [rainbowActive, setRainbowActive] = useState<boolean>(false);
  const [trainEnabled, setTrainEnabled] = useState<boolean>(true);
  const [manualMoveDir, setManualMoveDir] = useState<-1 | 0 | 1>(0);
  const [manualSpaceDir, setManualSpaceDir] = useState<{ dx: -1 | 0 | 1; dy: -1 | 0 | 1 }>({
    dx: 0,
    dy: 0,
  });
  const [inAlienDimension, setInAlienDimension] = useState<boolean>(false);
  const [lastSelfieUrl, setLastSelfieUrl] = useState<string | null>(null);
  const [shopTab, setShopTab] = useState<ShopTab>('skills');
  const [wardrobeTab, setWardrobeTab] = useState<WardrobeTab>('fur');
  const [hoveredSkillId, setHoveredSkillId] = useState<SkillId | null>(null);
  const [pinnedSkillId, setPinnedSkillId] = useState<SkillId | null>(null);
  const [pulseSeq, setPulseSeq] = useState(0);
  const [pulseEvent, setPulseEvent] = useState<ScenePulseEvent | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [playgroundTimeLeft, setPlaygroundTimeLeft] = useState(0);
  const [playgroundScore, setPlaygroundScore] = useState(0);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarBusy(true);
    try {
      const resized = await resizeUploadedAvatar(file);
      onChangeAvatar(resized);
      soundEngine.playUnlock();
      setStatusMessage('Đã cập nhật hình đại diện mới!');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Không thể tải ảnh lên.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const wellFed = hasWellFedBuff(needs);
  const nameEffect = resolveNameEffect(appearance.name);
  const activeMeta = WORLD_AREAS.find((w) => w.id === area) ?? WORLD_AREAS[0];
  const claimableCount = countClaimableAchievements(
    achievementStats,
    unlockedPets,
    claimedAchievements
  );

  const triggerPulse = (
    kind: ScenePulseEvent['kind'],
    label?: string,
    activityId?: CapybaraActivityId,
    envActionId?: EnvironmentalActionId
  ) => {
    setPulseSeq((prev) => {
      const next = prev + 1;
      setPulseEvent({ seq: next, kind, label, activityId, envActionId });
      return next;
    });
  };

  const handleEnvActionClick = (envId: EnvironmentalActionId) => {
    if (envId === 'swim_water') {
      if (area !== 'pool' && !(area === 'explore' && exploreLocation === 'beach')) {
        setArea('pool');
      }
    } else if (envId === 'chew_grass') {
      if (
        area !== 'forest' &&
        area !== 'playground' &&
        !(area === 'explore' && (exploreLocation === 'secret_forest' || exploreLocation === 'campsite'))
      ) {
        setArea('forest');
      }
    } else if (envId === 'rest_shade') {
      if (
        area !== 'forest' &&
        area !== 'playground' &&
        !(
          area === 'explore' &&
          (exploreLocation === 'secret_forest' ||
            exploreLocation === 'beach' ||
            exploreLocation === 'campsite')
        )
      ) {
        setArea('forest');
      }
    }
    const res = onEnvInteraction(envId);
    setStatusMessage(res.message);
    if (res.ok) {
      triggerPulse('env_action', res.message, undefined, envId);
    }
  };

  useEffect(() => {
    if (playgroundTimeLeft <= 0) return;
    const timer = window.setInterval(() => {
      setPlaygroundTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playgroundTimeLeft]);

  const handleAction = (
    action: 'rest' | 'swim' | 'toss_yuzu' | 'forage' | 'meditate' | 'bounce',
    pulseKind: ScenePulseEvent['kind']
  ) => {
    const res = onWorldActivity(action);
    setStatusMessage(res.message);
    if (res.ok) {
      triggerPulse(pulseKind, res.message);
    }
  };

  const handleCapyActivity = (
    activityId: CapybaraActivityId,
    switchLocation?: boolean
  ) => {
    const meta = CAPYBARA_ACTIVITIES.find((a) => a.id === activityId);
    if (!meta) return;
    if (switchLocation) {
      const loc = meta.recommendedLocation;
      if (
        loc === 'home' ||
        loc === 'pool' ||
        loc === 'forest' ||
        loc === 'playground' ||
        loc === 'kingdom' ||
        loc === 'spaceship'
      ) {
        setArea(loc);
      } else if (loc !== 'alien_dimension') {
        setArea('explore');
        setExploreLocation(loc);
      }
    }
    const res = onWorldActivity('capy_activity', { activityId });
    setStatusMessage(res.message);
    if (res.ok) {
      triggerPulse('activity', meta.shortLabel, activityId);
    }
  };

  const handleFeed = (foodId: FoodId) => {
    const item = FOOD_ITEMS.find((f) => f.id === foodId);
    if (!item || (foodInventory[foodId] ?? 0) <= 0) return;
    onFeedCapybara(foodId);
    const msg = `Đã cho ăn ${item.name} (+${item.hungerGain}% No)`;
    setStatusMessage(msg);
    triggerPulse('feed', `+${item.hungerGain}% No!`);
  };

  const startPlaygroundGame = () => {
    setPlaygroundScore(0);
    setPlaygroundTimeLeft(15);
    setStatusMessage('Bấm nhanh vào các trái quýt đang nảy trên sân chơi trong 15 giây!');
    triggerPulse('minigame_start');
  };

  const renderStatBar = (
    label: string,
    value: number,
    barColor: string,
    IconComponent: typeof Utensils
  ) => (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-emerald-100/85">
          <IconComponent className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
          <span>{label}</span>
        </span>
        <span className="font-mono-num font-bold text-white">{value}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-[#0D1612]">
        <div
          className="h-full transition-all duration-200"
          style={{ width: `${value}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );

  const renderOutfitCards = <T extends string>(
    items: CustomizationItem<T>[],
    unlocked: T[],
    selected: T,
    onAction: (id: T) => void,
    ownedOnly: boolean
  ) => {
    const list = ownedOnly ? items.filter((item) => unlocked.includes(item.id)) : items;
    return (
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {list.map((item) => {
          const isUnlocked = unlocked.includes(item.id);
          const isSelected = selected === item.id;
          const canAfford = yuzuBank >= item.cost;
          const isUltraRare = item.rarity === 'ultra_rare';

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-xl border p-3.5 transition-colors ${
                isSelected
                  ? 'border-amber-400/70 bg-[#1D2E26]'
                  : isUltraRare
                  ? 'border-amber-300/40 bg-gradient-to-br from-[#1C2A27] to-[#171F2E]'
                  : 'border-white/10 bg-[#14201A]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-4 w-4 shrink-0 rounded-sm border border-white/25"
                      style={{ backgroundColor: item.swatchColor }}
                      aria-hidden="true"
                    />
                    <span className="truncate font-display text-sm font-bold text-white">
                      {item.name}
                    </span>
                    {isUltraRare && (
                      <span className="shrink-0 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-300 border border-amber-400/40">
                        Cực hiếm
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono-num text-xs text-emerald-200/75">
                    {isUnlocked ? 'Đã mở' : `${item.cost} quýt`}
                  </span>
                </div>
                {item.effectLabel && (
                  <div className="mt-1 text-[11px] font-semibold text-cyan-300">
                    Hiệu ứng: {item.effectLabel}
                  </div>
                )}
                <p className="mt-1.5 text-xs leading-relaxed text-emerald-100/70">
                  {item.description}
                </p>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  disabled={!isUnlocked && !canAfford}
                  onClick={() => onAction(item.id)}
                  className={`inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    isSelected
                      ? 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                      : isUnlocked
                      ? 'bg-[#23372E] text-white hover:bg-[#2E473C]'
                      : canAfford
                      ? 'bg-amber-500 text-[#1A1308] hover:bg-amber-400'
                      : 'cursor-not-allowed bg-white/5 text-white/35'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Đang mặc</span>
                    </>
                  ) : isUnlocked ? (
                    <span>Mặc ngay</span>
                  ) : canAfford ? (
                    <span>Mua ({item.cost} quýt)</span>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Cần {item.cost} quýt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const quickFoods = FOOD_ITEMS.filter((f) => (foodInventory[f.id] ?? 0) > 0);

  return (
    <section
      aria-labelledby="world-hub-heading"
      className="flex flex-col rounded-2xl border border-white/10 bg-[#16231D] p-5"
    >
      {/* Top World Header + Care Status Bars */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3.5">
          <img
            src={avatar}
            alt={appearance.name || 'Mochi'}
            className="h-12 w-12 shrink-0 rounded-xl border border-amber-400/45 bg-[#0F1814] object-cover"
          />
          <div>
            <h2 id="world-hub-heading" className="font-display text-lg font-bold text-white">
              Thế giới Capybara · {appearance.name || 'Mochi'}
            </h2>
            <p className="mt-0.5 text-xs text-emerald-100/70">
              {wellFed
                ? 'Trạng thái Sung Sức: Bắt đầu lượt chạy mới với 4 Tim tối đa (+1 Tim).'
                : 'Chăm sóc Độ no ≥ 70% và Niềm vui ≥ 60% để nhận +1 Tim khi bắt đầu lượt chạy.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-emerald-100/90">
          <div>
            <span>Kho quýt: </span>
            <span className="font-mono-num font-bold text-amber-400">{yuzuBank} quả</span>
          </div>
        </div>
      </div>

      {/* Capybara Needs Bar */}
      <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#14201A] p-3.5 sm:grid-cols-3">
        {renderStatBar('Độ no', needs.hunger, '#F97316', Utensils)}
        {renderStatBar('Năng lượng', needs.energy, '#38BDF8', BatteryCharging)}
        {renderStatBar('Niềm vui', needs.happiness, '#10B981', Smile)}
      </div>

      {/* 13 Location Tabs */}
      <nav
        aria-label="Khu vực thế giới Capybara"
        className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl bg-[#0F1814] p-1.5 sm:grid-cols-5 lg:grid-cols-7"
      >
        {WORLD_AREAS.map((item) => {
          const Icon = AREA_ICONS[item.id];
          const active = area === item.id;
          const label =
            item.id === 'achievements' && claimableCount > 0
              ? `${item.label} (${claimableCount})`
              : item.label;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setArea(item.id);
                setStatusMessage(null);
              }}
              className={`inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                active
                  ? 'bg-[#263C31] text-amber-300 shadow-sm'
                  : item.id === 'achievements' && claimableCount > 0
                  ? 'text-amber-300 hover:bg-[#182620]'
                  : 'text-emerald-100/75 hover:bg-[#182620] hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active Area Subtitle + Action Feedback */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-emerald-200/80">
          <strong className="text-white">{activeMeta.label}:</strong> {activeMeta.subtitle}
        </span>
        {statusMessage && (
          <span className="font-medium text-amber-300">{statusMessage}</span>
        )}
      </div>

      {/* Interactive Areas: Home, Pool, Forest, Playground, Explore World, Kingdom, Spaceship */}
      {(area === 'home' ||
        area === 'pool' ||
        area === 'forest' ||
        area === 'playground' ||
        area === 'explore' ||
        area === 'kingdom' ||
        area === 'spaceship') && (
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <WorldSceneCanvas
              area={
                area === 'explore'
                  ? exploreLocation
                  : area === 'kingdom'
                  ? 'kingdom'
                  : area === 'spaceship'
                  ? 'spaceship'
                  : area
              }
              appearance={appearance}
              petId={selectedPet}
              weather={sceneWeather}
              starryNight={skyPhase === 'night'}
              skyPhase={skyPhase}
              rainbowActive={rainbowActive}
              trainEnabled={trainEnabled}
              activeHomeItems={activeHomeItems}
              pulseEvent={pulseEvent}
              playgroundGameActive={area === 'playground' && playgroundTimeLeft > 0}
              manualMoveDir={manualMoveDir}
              manualSpaceDir={manualSpaceDir}
              potionHue={potionHue}
              glowingFoodActive={glowingFoodActive}
              balloonsActive={balloonsActive}
              kingdom={kingdom}
              midnightChestClaimed={midnightChestClaimed}
              discoveredCreatures={discoveredCreatures}
              onScenePet={() => {
                const res = onWorldActivity('pet');
                setStatusMessage(res.message);
              }}
              onSelfieReady={(url) => setLastSelfieUrl(url)}
              onPlaygroundTargetHit={(isGolden) => {
                setPlaygroundScore((s) => s + (isGolden ? 3 : 1));
                const res = onWorldActivity('playground_hit', { golden: isGolden });
                setStatusMessage(res.message);
              }}
              onSideQuestProgress={(questId, detail) => {
                setStatusMessage(detail);
                onSideQuestProgress(questId, detail);
              }}
              onFishingCatch={(rewardYuzu, fishName) => {
                setStatusMessage(`Câu được ${fishName}! (+${rewardYuzu} Quýt)`);
                onFishingCatch(rewardYuzu, fishName);
              }}
              onCollectIngredient={(id, amount, sourceLabel) => {
                onCollectIngredient(id, amount, sourceLabel);
                setStatusMessage(`Thu thập +${amount} ${sourceLabel}!`);
              }}
              onCollectMeteorStone={() => {
                onCollectMeteorStone();
                setStatusMessage('Thu thập +1 Đá Thiên Thạch & +2 Quýt!');
              }}
              onMeetAlien={() => {
                onMeetAlien();
                setStatusMessage('Đã trò chuyện với Capybara Ngoài Hành Tinh! (+5 Quýt, +1 Đường Kẹo)');
              }}
              onClaimMidnightChest={() => {
                onClaimMidnightChest();
                setStatusMessage('Đã mở Kho báu Nửa đêm! (+20 Quýt & Nguyên liệu hiếm)');
              }}
              onDiscoverCreature={(creatureId, name, rewardYuzu) => {
                const isNew = !discoveredCreatures.includes(creatureId);
                onDiscoverCreature(creatureId, name, rewardYuzu);
                setStatusMessage(
                  isNew
                    ? `Phát hiện sinh vật Dị Giới mới: ${name}! (+${rewardYuzu} Quýt)`
                    : `${name} vẫy chào bạn đầy thân thiện!`
                );
              }}
              onPortalStateChange={(inDim) => {
                setInAlienDimension(inDim);
                setStatusMessage(
                  inDim
                    ? 'Đã xuyên qua Cổng Không Gian tới Dị Giới! Chạm vào sinh vật lạ để khám phá.'
                    : 'Đã trở về thế giới Capybara an toàn!'
                );
              }}
              onGreetRoyals={() => {
                const res = onGreetRoyals();
                setStatusMessage(res.message);
              }}
            />

            {/* Controls Bar: Spaceship 4-way flight OR Capybara Movement D-Pad & Actions */}
            {area === 'spaceship' ? (
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-400/25 bg-[#101824] p-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[11px] font-semibold text-indigo-200/85">
                    Lái phi thuyền:
                  </span>
                  <button
                    type="button"
                    onPointerDown={() => setManualSpaceDir({ dx: -1, dy: 0 })}
                    onPointerUp={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    onPointerLeave={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    onPointerCancel={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/15 bg-[#1B273A] px-2.5 text-xs font-bold text-white hover:bg-[#24354F] select-none"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Trái</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setManualSpaceDir({ dx: 1, dy: 0 })}
                    onPointerUp={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    onPointerLeave={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    onPointerCancel={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/15 bg-[#1B273A] px-2.5 text-xs font-bold text-white hover:bg-[#24354F] select-none"
                  >
                    <span>Phải</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setManualSpaceDir({ dx: 0, dy: -1 })}
                    onPointerUp={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    onPointerLeave={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    onPointerCancel={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/15 bg-[#1B273A] px-2.5 text-xs font-bold text-white hover:bg-[#24354F] select-none"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Lên</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setManualSpaceDir({ dx: 0, dy: 1 })}
                    onPointerUp={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    onPointerLeave={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    onPointerCancel={() => setManualSpaceDir({ dx: 0, dy: 0 })}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/15 bg-[#1B273A] px-2.5 text-xs font-bold text-white hover:bg-[#24354F] select-none"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Xuống</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setArea('explore');
                    setExploreLocation('candy_planet');
                    setStatusMessage('Phi thuyền đã hạ cánh xuống Hành tinh Kẹo ngọt ngào!');
                  }}
                  className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-pink-500 px-3 text-xs font-bold text-white hover:bg-pink-400"
                >
                  <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Đáp xuống Hành tinh Kẹo</span>
                </button>
              </div>
            ) : (
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#101A15] p-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[11px] font-semibold text-emerald-200/80">
                    Điều khiển:
                  </span>
                  <button
                    type="button"
                    aria-label="Di chuyển sang trái"
                    onPointerDown={() => setManualMoveDir(-1)}
                    onPointerUp={() => setManualMoveDir(0)}
                    onPointerLeave={() => setManualMoveDir(0)}
                    onPointerCancel={() => setManualMoveDir(0)}
                    className={`inline-flex h-9 items-center gap-1 rounded-lg border px-2.5 text-xs font-bold transition-colors select-none ${
                      manualMoveDir === -1
                        ? 'border-amber-400 bg-amber-500 text-[#1A1308]'
                        : 'border-white/15 bg-[#1B2C24] text-white hover:bg-[#24392F]'
                    }`}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Trái</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Di chuyển sang phải"
                    onPointerDown={() => setManualMoveDir(1)}
                    onPointerUp={() => setManualMoveDir(0)}
                    onPointerLeave={() => setManualMoveDir(0)}
                    onPointerCancel={() => setManualMoveDir(0)}
                    className={`inline-flex h-9 items-center gap-1 rounded-lg border px-2.5 text-xs font-bold transition-colors select-none ${
                      manualMoveDir === 1
                        ? 'border-amber-400 bg-amber-500 text-[#1A1308]'
                        : 'border-white/15 bg-[#1B2C24] text-white hover:bg-[#24392F]'
                    }`}
                  >
                    <span>Phải</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerPulse('jump')}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/15 bg-[#1B2C24] px-2.5 text-xs font-bold text-emerald-100 hover:bg-[#24392F]"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Nhảy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerPulse('interact')}
                    className="inline-flex h-9 items-center gap-1 rounded-lg bg-amber-500 px-3 text-xs font-bold text-[#1A1308] hover:bg-amber-400"
                  >
                    <Hand className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Tương tác</span>
                  </button>
                  {(area === 'pool' ||
                    (area === 'explore' &&
                      (exploreLocation === 'beach' || exploreLocation === 'ocean'))) && (
                    <button
                      type="button"
                      onClick={() => triggerPulse('fish_cast')}
                      className="inline-flex h-9 items-center gap-1 rounded-lg bg-sky-500 px-3 text-xs font-bold text-[#071F2C] hover:bg-sky-400"
                    >
                      <Fish className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Câu cá</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => triggerPulse(inAlienDimension ? 'exit_portal' : 'open_portal')}
                    className={`inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 text-xs font-bold transition-colors ${
                      inAlienDimension
                        ? 'border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-200 hover:bg-fuchsia-500/35'
                        : 'border-violet-400/45 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25'
                    }`}
                  >
                    <Orbit className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{inAlienDimension ? 'Rời Dị Giới' : 'Cổng Không Gian'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (quickFoods.length > 0) {
                      handleFeed(quickFoods[0].id);
                    } else {
                      setArea('food');
                      setStatusMessage('Kho thức ăn trống — hãy mua thêm món ăn cho Capybara!');
                    }
                  }}
                  className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 text-xs font-bold text-rose-200 hover:bg-rose-500/25"
                >
                  <Utensils className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {quickFoods.length > 0
                      ? `Cho ăn (${quickFoods[0].name})`
                      : 'Cho ăn (Mở kho)'}
                  </span>
                </button>
              </div>
            )}

            {/* Scene Atmosphere (Day -> Sunset -> Night) & Railway Controls */}
            {area !== 'spaceship' && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const wasRaining = sceneWeather === 'rain';
                    setSceneWeather('clear');
                    if (wasRaining) {
                      setRainbowActive(true);
                      setStatusMessage('Tạnh mưa rồi! Cầu vồng bảy sắc đã xuất hiện!');
                    }
                  }}
                  className={`inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold transition-colors ${
                    sceneWeather === 'clear'
                      ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                      : 'border-white/10 bg-[#0F1814] text-emerald-100/75 hover:text-white'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Nắng nhẹ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSceneWeather('rain');
                    setRainbowActive(false);
                  }}
                  className={`inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold transition-colors ${
                    sceneWeather === 'rain'
                      ? 'border-sky-400/50 bg-sky-500/20 text-sky-200'
                      : 'border-white/10 bg-[#0F1814] text-emerald-100/75 hover:text-white'
                  }`}
                >
                  <CloudRain className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Mưa & vũng nước</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSceneWeather('snow')}
                  className={`inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold transition-colors ${
                    sceneWeather === 'snow'
                      ? 'border-cyan-300/50 bg-cyan-500/20 text-cyan-100'
                      : 'border-white/10 bg-[#0F1814] text-emerald-100/75 hover:text-white'
                  }`}
                >
                  <Snowflake className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Mùa đông tuyết</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRainbowActive((v) => !v)}
                  className={`inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold transition-colors ${
                    rainbowActive
                      ? 'border-pink-400/50 bg-pink-500/20 text-pink-200'
                      : 'border-white/10 bg-[#0F1814] text-emerald-100/75 hover:text-white'
                  }`}
                >
                  <Rainbow className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Cầu vồng</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSkyPhase('day');
                    setStatusMessage('Bầu trời chuyển sang Ban ngày rực rỡ.');
                  }}
                  className={`inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold transition-colors ${
                    skyPhase === 'day'
                      ? 'border-amber-300/60 bg-amber-400/20 text-amber-200'
                      : 'border-white/10 bg-[#0F1814] text-emerald-100/75 hover:text-white'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Ban ngày</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSkyPhase('sunset');
                    setStatusMessage('Mặt trời lặn dần xuống Hoàng hôn cam ấm áp...');
                  }}
                  className={`inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold transition-colors ${
                    skyPhase === 'sunset'
                      ? 'border-orange-400/60 bg-orange-500/25 text-orange-200'
                      : 'border-white/10 bg-[#0F1814] text-emerald-100/75 hover:text-white'
                  }`}
                >
                  <Sunset className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Hoàng hôn</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSkyPhase('night');
                    setStatusMessage(
                      'Màn đêm buông xuống: Đom đóm dẫn đường, Làng ma thân thiện & Kho báu Nửa đêm đã xuất hiện!'
                    );
                  }}
                  className={`inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold transition-colors ${
                    skyPhase === 'night'
                      ? 'border-indigo-400/60 bg-indigo-500/25 text-indigo-200'
                      : 'border-white/10 bg-[#0F1814] text-emerald-100/75 hover:text-white'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Đêm sao & Nửa đêm</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTrainEnabled((v) => {
                      const next = !v;
                      if (next) soundEngine.playTrainWhistle();
                      return next;
                    });
                  }}
                  className={`inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-semibold transition-colors ${
                    trainEnabled
                      ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                      : 'border-white/10 bg-[#0F1814] text-emerald-100/75 hover:text-white'
                  }`}
                >
                  <TrainFront className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tàu chạy bản đồ</span>
                </button>
              </div>
            )}

            {lastSelfieUrl && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-amber-400/35 bg-[#121D18] px-3 py-2 text-xs">
                <span className="text-amber-200">Ảnh Selfie vừa chụp đã sẵn sàng!</span>
                <a
                  href={lastSelfieUrl}
                  download={`capybara-selfie-${Date.now()}.png`}
                  className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md bg-amber-500 px-3 text-xs font-bold text-[#1A1308] hover:bg-amber-400"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Lưu ảnh Selfie</span>
                </a>
              </div>
            )}

            <p className="mt-2 text-[11px] text-emerald-200/70">
              {area === 'spaceship'
                ? 'Mẹo: Dùng phím WASD / mũi tên, nút điều khiển hoặc chạm trực tiếp vào không gian để bay tới Đá Thiên Thạch và Capybara Ngoài Hành Tinh.'
                : 'Mẹo: Dùng nút Trái/Phải hoặc phím A/D để di chuyển. Bấm Tương tác gần trái cây, Vịt/Chim, nguyên liệu phát sáng, Cổng Không Gian hoặc Kho báu Nửa đêm!'}
            </p>

            {/* Detailed Environmental Interactions Card */}
            <div className="mt-3 rounded-xl border border-white/10 bg-[#101A15] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-xs font-bold text-white">
                  Tương tác với môi trường xung quanh
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ENVIRONMENTAL_INTERACTIONS.map((env) => (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => handleEnvActionClick(env.id)}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/15 bg-[#192821] px-2.5 text-[11px] font-semibold text-white hover:border-amber-400/60"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: env.accentColor }}
                        aria-hidden="true"
                      />
                      <span>{env.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {ENVIRONMENTAL_INTERACTIONS.map((env) => (
                  <div
                    key={env.id}
                    className="rounded-lg border border-white/8 bg-[#14201A] p-2.5"
                  >
                    <div className="text-[11px] font-bold text-amber-300">{env.title}</div>
                    <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/75">
                      {env.detailedAction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-[#14201A] p-4 lg:col-span-5">
            {area === 'home' && (
              <div className="space-y-2.5">
                <div className="font-display text-sm font-bold text-white">Hoạt động tại Nhà riêng</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleCapyActivity('nap_snore')}
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-amber-500 px-3 text-xs font-bold text-[#1A1308] hover:bg-amber-400"
                  >
                    Ngủ & ngáy (+35% NL)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCapyActivity('sleep_teddy')}
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
                  >
                    Ôm gấu bông ngủ (+42% NL)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCapyActivity('arcade_game')}
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 sm:col-span-2"
                  >
                    Chơi máy điện tử (+25% Vui & +2 Quýt)
                  </button>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-200/85">
                    <span>Bài trí nội thất đã mở</span>
                    <button
                      type="button"
                      onClick={() => {
                        setArea('shop');
                        setShopTab('home_decor');
                      }}
                      className="text-amber-300 hover:underline"
                    >
                      Mua thêm ở Cửa hàng
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {HOME_ITEMS.filter((item) => unlockedHomeItems.includes(item.id)).map((item) => {
                      const active = activeHomeItems.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onUnlockOrToggleHomeItem(item.id)}
                          className={`h-9 whitespace-nowrap rounded-md border px-2.5 text-xs font-medium transition-colors ${
                            active
                              ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                              : 'border-white/15 bg-[#0F1814] text-emerald-100/70 hover:text-white'
                          }`}
                        >
                          {active ? `Đang đặt: ${item.name}` : `Đặt ${item.name}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {area === 'pool' && (
              <div className="space-y-2.5">
                <div className="font-display text-sm font-bold text-white">Thư giãn tại Hồ bơi</div>
                <button
                  type="button"
                  onClick={() => handleCapyActivity('bubble_bath')}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-cyan-400 px-4 text-xs font-bold text-[#08202C] hover:bg-cyan-300"
                >
                  <span>Tắm bồn bong bóng xà phòng (+24% Vui, +18% NL)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCapyActivity('dive_swim')}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-sky-500 px-4 text-xs font-bold text-[#08202C] hover:bg-sky-400"
                >
                  <span>Bơi và lặn dưới nước (+22% Vui & +2 Quýt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('toss_yuzu', 'toss_yuzu')}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
                >
                  <span>Thả quýt xuống hồ (+Vui vẻ & có cơ hội nhặt quýt)</span>
                </button>
              </div>
            )}

            {area === 'forest' && (
              <div className="space-y-2.5">
                <div className="font-display text-sm font-bold text-white">Khám phá Khu rừng</div>
                <button
                  type="button"
                  disabled={needs.energy < 15}
                  onClick={() => handleAction('forage', 'forage')}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-500 px-4 text-xs font-bold text-[#082216] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span>Đi hái quýt & tìm thức ăn (-15% Năng lượng)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('meditate', 'meditate')}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/15 bg-[#1D2E26] px-4 text-xs font-semibold text-white hover:bg-[#273E33]"
                >
                  <span>Thiền dưới tán tre (+18% Năng lượng, +12% Vui)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCapyActivity('eat_watermelon')}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-rose-400/40 bg-rose-500/15 px-4 text-xs font-bold text-rose-200 hover:bg-rose-500/25"
                >
                  <span>Ăn dưa hấu mát lạnh (+28% No, +18% Vui)</span>
                </button>
              </div>
            )}

            {area === 'playground' && (
              <div className="space-y-2.5">
                <div className="font-display text-sm font-bold text-white">Hoạt động Khu vui chơi</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCapyActivity('dance')}
                    className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg bg-purple-500 px-2.5 text-xs font-bold text-white hover:bg-purple-400"
                  >
                    Nhảy theo nhạc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCapyActivity('balloon')}
                    className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg bg-pink-500 px-2.5 text-xs font-bold text-white hover:bg-pink-400"
                  >
                    Chơi bóng bay
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCapyActivity('selfie')}
                    className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
                  >
                    Chụp selfie
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('bounce', 'bounce')}
                    className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg border border-white/15 bg-[#1D2E26] px-2.5 text-xs font-semibold text-white hover:bg-[#273E33]"
                  >
                    Nhảy bạt nhún
                  </button>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#0F1814] p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-300">Mini-game: Bắt Quýt Nảy</span>
                    <span className="font-mono-num text-emerald-200">
                      {playgroundTimeLeft > 0
                        ? `Còn ${playgroundTimeLeft}s · +${playgroundScore} quýt`
                        : '15 giây'}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={playgroundTimeLeft > 0}
                    onClick={startPlaygroundGame}
                    className="mt-2 inline-flex h-9 w-full items-center justify-center whitespace-nowrap rounded-md bg-amber-500 px-3 text-xs font-bold text-[#1A1308] hover:bg-amber-400 disabled:opacity-50"
                  >
                    {playgroundTimeLeft > 0 ? 'Đang chơi — Bấm quýt trên sân!' : 'Chơi bắt quýt ngay'}
                  </button>
                </div>
              </div>
            )}

            {area === 'explore' && (
              <div className="space-y-3">
                <div>
                  <div className="font-display text-sm font-bold text-white">
                    Điểm đến Bản đồ Thế giới (11 vùng kỳ thú)
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {EXPLORE_LOCATIONS.map((loc) => {
                      const active = exploreLocation === loc.id;
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => {
                            setExploreLocation(loc.id);
                            setStatusMessage(`${loc.label}: ${loc.subtitle}`);
                            if (loc.id === 'winter' || loc.id === 'ice_mountain') {
                              setSceneWeather('snow');
                            }
                          }}
                          className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                            active
                              ? 'border-amber-400/60 bg-[#23372E] text-amber-300'
                              : 'border-white/10 bg-[#0F1814] text-emerald-100/80 hover:text-white'
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={{ backgroundColor: loc.accentColor }}
                            aria-hidden="true"
                          />
                          <span className="truncate">{loc.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exotic Dimension Tracker */}
                <div className="rounded-lg border border-fuchsia-400/30 bg-[#1B1326] p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-fuchsia-200">
                      Sinh vật Dị Giới ({discoveredCreatures.length}/{EXOTIC_CREATURES.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerPulse(inAlienDimension ? 'exit_portal' : 'open_portal')}
                      className="rounded bg-fuchsia-500/25 px-2 py-0.5 text-[11px] font-bold text-fuchsia-200 hover:bg-fuchsia-500/40"
                    >
                      {inAlienDimension ? 'Về thế giới' : 'Mở cổng'}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-fuchsia-100/75">
                    Cổng Không Gian ngẫu nhiên dẫn tới Dị Giới để gặp các sinh vật chưa từng xuất hiện.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-2.5">
                  <div className="font-display text-xs font-bold text-emerald-200">
                    10 Hoạt động Capybara tại chỗ
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {CAPYBARA_ACTIVITIES.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => handleCapyActivity(act.id)}
                        title={act.description}
                        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-white/12 bg-[#0F1814] px-2 text-[11px] font-medium text-white transition-colors hover:border-amber-400/50 hover:text-amber-200"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-sm"
                          style={{ backgroundColor: act.accentColor }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{act.shortLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {area === 'kingdom' && (
              <div className="space-y-3">
                {/* Castle Upgrade */}
                {(() => {
                  const currTier = CASTLE_TIERS[kingdom.castleLevel] ?? CASTLE_TIERS[0];
                  const nextTier = CASTLE_TIERS[kingdom.castleLevel + 1];
                  const festivalActive = kingdom.activeFestivalUntil > Date.now();
                  return (
                    <>
                      <div className="rounded-lg border border-amber-400/35 bg-[#1B241E] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-bold text-amber-300">
                            {currTier.name} (Cấp {kingdom.castleLevel}/3)
                          </span>
                          <Crown className="h-4 w-4 text-amber-300" aria-hidden="true" />
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/75">
                          {currTier.description}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {nextTier ? (
                            <button
                              type="button"
                              disabled={
                                yuzuBank < nextTier.costYuzu ||
                                meteorStones < nextTier.costMeteor
                              }
                              onClick={() => {
                                const res = onUpgradeCastle();
                                setStatusMessage(res.message);
                              }}
                              className="inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-amber-500 px-3 text-xs font-bold text-[#1A1308] hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/35"
                            >
                              Xây {nextTier.name} ({nextTier.costYuzu} quýt
                              {nextTier.costMeteor > 0 ? ` + ${nextTier.costMeteor} Thiên thạch` : ''})
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-300">
                              Lâu đài đã đạt cấp tối đa!
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const res = onGreetRoyals();
                              setStatusMessage(res.message);
                              if (res.ok) triggerPulse('greet_royals');
                            }}
                            className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg border border-amber-400/45 bg-amber-500/15 px-3 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
                          >
                            Thỉnh an Vua & Hoàng hậu
                          </button>
                        </div>
                      </div>

                      {/* Citizens Recruitment */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>Tuyển Cư dân ({kingdom.citizens.length}/{KINGDOM_CITIZENS.length})</span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {KINGDOM_CITIZENS.map((cit) => {
                            const hired = kingdom.citizens.includes(cit.id);
                            return (
                              <button
                                key={cit.id}
                                type="button"
                                disabled={hired || yuzuBank < cit.costYuzu}
                                onClick={() => {
                                  const res = onRecruitCitizen(cit.id);
                                  setStatusMessage(res.message);
                                }}
                                className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] transition-colors ${
                                  hired
                                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                                    : yuzuBank >= cit.costYuzu
                                    ? 'border-white/15 bg-[#0F1814] text-white hover:border-amber-400/50'
                                    : 'cursor-not-allowed border-white/10 bg-white/5 text-white/40'
                                }`}
                              >
                                <span className="min-w-0 truncate">
                                  <strong className="block truncate">{cit.name}</strong>
                                  <span className="text-[10px] opacity-75">{cit.role}</span>
                                </span>
                                <span className="shrink-0 font-mono-num font-bold text-amber-300">
                                  {hired ? 'Đã ở' : `${cit.costYuzu}q`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Festivals */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>Tổ chức Lễ hội (Đã tổ chức: {kingdom.festivalsHeld})</span>
                          {festivalActive && (
                            <span className="text-[11px] font-bold text-pink-300">
                              Đang diễn ra!
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 space-y-1.5">
                          {KINGDOM_FESTIVALS.map((fest) => (
                            <div
                              key={fest.id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0F1814] px-2.5 py-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-white">{fest.name}</div>
                                <div className="truncate text-[10px] text-emerald-100/70">
                                  {fest.description}
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={yuzuBank < fest.costYuzu}
                                onClick={() => {
                                  const res = onHostFestival(fest.id);
                                  setStatusMessage(res.message);
                                }}
                                className="h-8 shrink-0 whitespace-nowrap rounded-md bg-pink-500 px-2.5 text-[11px] font-bold text-white hover:bg-pink-400 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/35"
                              >
                                Mở ({fest.costYuzu}q)
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {area === 'spaceship' && (
              <div className="space-y-3">
                <div className="font-display text-sm font-bold text-white">
                  Nhật ký Phi thuyền Vũ trụ
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-purple-400/35 bg-[#19162B] p-2.5">
                    <div className="text-[11px] text-purple-200/80">Đá Thiên Thạch</div>
                    <div className="mt-0.5 font-mono-num text-lg font-bold text-purple-300">
                      {meteorStones} viên
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-400/35 bg-[#12241F] p-2.5">
                    <div className="text-[11px] text-emerald-200/80">Gặp Capy Ngoài Hành Tinh</div>
                    <div className="mt-0.5 font-mono-num text-lg font-bold text-emerald-300">
                      {alienMetCount} lần
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-emerald-100/75">
                  Phi hành gia Capybara có thể bay qua những viên Đá Thiên Thạch phát sáng tím để thu thập (dùng nâng cấp Lâu đài & Chế tạo Bong Bóng Bay), hoặc áp sát Capybara Ngoài Hành Tinh màu xanh ngọc để nhận quà Đường Kẹo!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setArea('explore');
                    setExploreLocation('candy_planet');
                    setStatusMessage('Chào mừng đến Hành tinh Kẹo với Sông Sô-cô-la & Núi Bánh Ngọt!');
                  }}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-pink-500 px-3 text-xs font-bold text-white hover:bg-pink-400"
                >
                  <Rocket className="h-4 w-4" aria-hidden="true" />
                  <span>Khám phá Hành tinh Kẹo ngay</span>
                </button>
              </div>
            )}

            {/* Side Quests (3 Mini Quests) */}
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xs font-bold text-amber-300">
                  3 Nhiệm vụ phụ khám phá
                </span>
                {sideQuests.every((q) => q.claimed) && (
                  <button
                    type="button"
                    onClick={onResetSideQuests}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    <span>Nhận loạt mới</span>
                  </button>
                )}
              </div>
              <div className="mt-2 space-y-2">
                {sideQuests.map((sq) => {
                  const pct = Math.min(100, Math.round((sq.progress / sq.target) * 100));
                  const done = sq.progress >= sq.target;
                  return (
                    <div
                      key={sq.id}
                      className={`rounded-lg border p-2.5 ${
                        sq.claimed
                          ? 'border-emerald-400/25 bg-[#112019]'
                          : done
                          ? 'border-amber-400/50 bg-[#1B2B22]'
                          : 'border-white/10 bg-[#0F1814]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-white">{sq.title}</span>
                        <span className="font-mono-num font-bold text-amber-300">
                          {sq.progress}/{sq.target}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-emerald-100/70">
                        {sq.description}
                      </p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-sm bg-[#09110D]">
                        <div
                          className={`h-full transition-all duration-200 ${
                            sq.claimed ? 'bg-emerald-400' : done ? 'bg-amber-400' : 'bg-sky-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-emerald-200/80">
                          Thưởng: <strong className="text-amber-300">+{sq.rewardYuzu} Quýt</strong>
                          {sq.rewardFood ? ' + Món ăn' : ''}
                        </span>
                        {sq.claimed ? (
                          <span className="font-semibold text-emerald-300">Đã nhận</span>
                        ) : done ? (
                          <button
                            type="button"
                            onClick={() => onClaimSideQuest(sq.id)}
                            className="h-7 rounded-md bg-amber-500 px-2.5 text-[11px] font-bold text-[#1A1308] hover:bg-amber-400"
                          >
                            Nhận thưởng
                          </button>
                        ) : (
                          <span className="text-emerald-200/55">Đang thực hiện</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Feed Snack Bar available inside interactive zones */}
            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-200/85">
                <span>Cho ăn nhanh</span>
                <button
                  type="button"
                  onClick={() => setArea('food')}
                  className="text-amber-300 hover:underline"
                >
                  Mở kho thức ăn
                </button>
              </div>
              {quickFoods.length === 0 ? (
                <p className="mt-1.5 text-xs text-emerald-100/60">
                  Kho thức ăn đang trống. Ghé Cửa hàng hoặc Khu rừng để kiếm thêm.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {quickFoods.slice(0, 3).map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => handleFeed(food.id)}
                      className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-white/15 bg-[#0F1814] px-2.5 text-xs font-medium text-white hover:border-amber-400/50"
                    >
                      <span>{food.name}</span>
                      <span className="font-mono-num text-amber-300">x{foodInventory[food.id]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Crafting & Alchemy Area */}
      {area === 'crafting' && (
        <div className="mt-4 space-y-4">
          {/* Active Crafted Effects Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-400/35 bg-[#171829] p-3.5 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-sm font-bold text-violet-200">
                Hiệu ứng Chế tạo đang bật:
              </span>
              <span className="text-emerald-100/85">
                Màu thuốc:{' '}
                <strong className="text-amber-300">
                  {potionHue != null ? `Sắc ${potionHue}°` : 'Mặc định'}
                </strong>
              </span>
              <span className="text-emerald-100/85">
                Bóng bay:{' '}
                <strong className={balloonsActive ? 'text-pink-300' : 'text-white/50'}>
                  {balloonsActive ? 'Đang bay theo' : 'Tắt'}
                </strong>
              </span>
              <span className="text-emerald-100/85">
                Thức ăn phát sáng:{' '}
                <strong className={glowingFoodActive ? 'text-teal-300' : 'text-white/50'}>
                  {glowingFoodActive ? 'Đang tỏa sáng' : 'Chưa ăn'}
                </strong>
              </span>
            </div>
            {potionHue != null && (
              <button
                type="button"
                onClick={() => {
                  onClearPotionHue();
                  setStatusMessage('Đã rửa sạch màu thuốc đổi màu lông về gốc.');
                }}
                className="h-8 whitespace-nowrap rounded-md border border-white/15 bg-[#23263E] px-3 text-xs font-semibold text-white hover:bg-[#313657]"
              >
                Rửa màu lông gốc
              </button>
            )}
          </div>

          {/* Ingredients Stash & Quick Buy */}
          <div>
            <h3 className="mb-2 font-display text-sm font-bold text-white">
              Kho Nguyên Liệu Tự Nhiên (5 loại)
            </h3>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {INGREDIENTS_META.map((ing) => {
                const count = ingredients[ing.id] ?? 0;
                const canBuy = yuzuBank >= ing.costYuzu;
                return (
                  <div
                    key={ing.id}
                    className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#14201A] p-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/25"
                            style={{ backgroundColor: ing.accentColor }}
                            aria-hidden="true"
                          />
                          <span className="font-display text-sm font-bold text-white">
                            {ing.name}
                          </span>
                        </span>
                        <span className="font-mono-num text-xs font-bold text-amber-300">
                          Có: {count}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/70">
                        {ing.sourceHint}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!canBuy}
                      onClick={() => {
                        const res = onBuyIngredient(ing.id);
                        setStatusMessage(res.message);
                      }}
                      className="mt-2.5 inline-flex h-8 w-full items-center justify-center whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 text-xs font-bold text-amber-200 hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Mua nhanh +1 ({ing.costYuzu} quýt)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3 Alchemy Recipes */}
          <div>
            <h3 className="mb-2 font-display text-sm font-bold text-white">
              Công thức Kết hợp Nguyên liệu
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CRAFTING_RECIPES.map((recipe) => {
                const owned = craftedItems[recipe.id] ?? 0;
                const reqEntries = Object.entries(recipe.ingredients) as [IngredientId, number][];
                const canCraft = reqEntries.every(
                  ([ingId, reqAmt]) => (ingredients[ingId] ?? 0) >= reqAmt
                );
                return (
                  <div
                    key={recipe.id}
                    className="flex flex-col justify-between rounded-xl border border-white/12 bg-[#14201A] p-3.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 shrink-0 rounded-sm border border-white/25"
                            style={{ backgroundColor: recipe.accentColor }}
                            aria-hidden="true"
                          />
                          <span className="font-display text-sm font-bold text-white">
                            {recipe.name}
                          </span>
                        </span>
                        <span className="font-mono-num text-xs font-bold text-emerald-300">
                          Kho: {owned}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-emerald-100/75">
                        {recipe.effectSummary}
                      </p>
                      <div className="mt-2.5 space-y-1 border-t border-white/10 pt-2 text-[11px]">
                        {reqEntries.map(([ingId, reqAmt]) => {
                          const meta = INGREDIENTS_META.find((m) => m.id === ingId);
                          const have = ingredients[ingId] ?? 0;
                          const enough = have >= reqAmt;
                          return (
                            <div key={ingId} className="flex items-center justify-between">
                              <span className="text-emerald-100/80">{meta?.name ?? ingId}</span>
                              <span
                                className={`font-mono-num font-bold ${
                                  enough ? 'text-emerald-300' : 'text-rose-300'
                                }`}
                              >
                                {have}/{reqAmt}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={!canCraft}
                        onClick={() => {
                          const res = onCraftItem(recipe.id);
                          setStatusMessage(res.message);
                        }}
                        className="inline-flex h-9 w-full items-center justify-center whitespace-nowrap rounded-lg bg-amber-500 px-3 text-xs font-bold text-[#1A1308] hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/35"
                      >
                        Chế tạo ngay
                      </button>
                      <button
                        type="button"
                        disabled={owned <= 0 && !(recipe.id === 'floating_balloons' && balloonsActive)}
                        onClick={() => {
                          const res = onUseCraftedItem(recipe.id);
                          setStatusMessage(res.message);
                        }}
                        className="inline-flex h-9 w-full items-center justify-center whitespace-nowrap rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {recipe.id === 'floating_balloons'
                          ? balloonsActive
                            ? 'Tháo chùm bóng bay'
                            : 'Đeo bóng bay'
                          : recipe.id === 'fur_potion'
                          ? 'Uống đổi màu lông'
                          : 'Ăn phát sáng ngay'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Wardrobe Area */}
      {area === 'wardrobe' && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <CapybaraPreview
              appearance={appearance}
              weather={activeWeather}
              petId={selectedPet}
              showMount
              potionHue={potionHue}
              glowingFoodActive={glowingFoodActive}
              balloonsActive={balloonsActive}
            />
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[180px] flex-1">
                  <label
                    htmlFor="capybara-name-input"
                    className="block text-xs font-medium text-emerald-200/80"
                  >
                    Tên chú Capybara
                  </label>
                  <input
                    id="capybara-name-input"
                    type="text"
                    maxLength={16}
                    value={appearance.name}
                    onChange={(e) => onChangeName(e.target.value)}
                    placeholder="Nhập tên (vd: Mochi, Rồng Lửa, Băng Tuyết...)"
                    className="mt-1.5 h-10 w-full rounded-lg border border-white/15 bg-[#0F1814] px-3 text-sm font-medium text-white placeholder:text-white/35 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={onRandomizeOutfit}
                  className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-[#21332A] px-3.5 text-xs font-semibold text-white hover:bg-[#2C4438]"
                >
                  <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Phối ngẫu nhiên</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenPhotoMode}
                  className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-3.5 text-xs font-bold text-[#1A1308] hover:bg-amber-400"
                >
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Chụp ảnh ngay</span>
                </button>
              </div>

              {/* Name-Based Effect Preview Card */}
              <div className="flex items-center justify-between gap-3 rounded-lg border border-white/12 bg-[#0F1814] px-3 py-2 text-xs">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/25"
                    style={{ backgroundColor: nameEffect.primaryColor }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-bold text-amber-300">
                      Hiệu ứng Tên: {nameEffect.title}
                    </div>
                    <div className="truncate text-[11px] text-emerald-100/75">
                      {nameEffect.description} (Thử: Lửa, Băng, Sao, Vua, Ma, Kẹo, Biển, Cầu vồng)
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-[#0F1814] p-1 sm:grid-cols-5">
                {(
                  [
                    { id: 'fur', label: 'Màu lông' },
                    { id: 'outfit', label: 'Trang phục' },
                    { id: 'mount', label: 'Thú cưỡi' },
                    { id: 'head', label: 'Phụ kiện đầu' },
                    { id: 'neck', label: 'Phụ kiện cổ' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setWardrobeTab(t.id)}
                    className={`h-9 whitespace-nowrap rounded-md px-2 text-xs font-semibold transition-colors ${
                      wardrobeTab === t.id
                        ? 'bg-[#263C31] text-amber-300'
                        : 'text-emerald-100/70 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Player Avatar Selector & Uploader */}
          <div className="rounded-xl border border-white/10 bg-[#14201A] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={avatar}
                  alt="Hình đại diện hiện tại"
                  className="h-14 w-14 shrink-0 rounded-xl border-2 border-amber-400/60 bg-[#0F1814] object-cover"
                />
                <div>
                  <div className="font-display text-sm font-bold text-white">
                    Hình đại diện Capybara
                  </div>
                  <p className="mt-0.5 text-xs text-emerald-100/75">
                    Chọn ảnh minh họa có sẵn hoặc tải ảnh cá nhân của bạn lên (tự động nén gọn).
                  </p>
                </div>
              </div>

              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-500 px-3.5 text-xs font-bold text-[#082216] hover:bg-emerald-400 disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{avatarBusy ? 'Đang xử lý...' : 'Tải ảnh lên'}</span>
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatar === preset.dataUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onChangeAvatar(preset.dataUrl);
                      soundEngine.playYuzu(2);
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors ${
                      isSelected
                        ? 'border-amber-400 bg-[#20342A]'
                        : 'border-white/10 bg-[#0F1814] hover:border-white/25'
                    }`}
                  >
                    <img
                      src={preset.dataUrl}
                      alt={preset.name}
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                    <span className="w-full truncate text-[11px] font-medium text-emerald-100/90">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {wardrobeTab === 'mount' && (
            <div className="rounded-xl border border-emerald-400/30 bg-[#13251E] px-4 py-2.5 text-xs text-emerald-100/85">
              Chọn <strong>Rùa Khổng Lồ</strong>, <strong>Vịt Gỗ</strong>, <strong>Cá Chép Koi</strong> hoặc{' '}
              <strong>Mây Bồng Bềnh</strong> để Capybara cưỡi di chuyển ngay trong khu vực <strong>Nhà riêng</strong>!
            </div>
          )}

          {wardrobeTab === 'fur' &&
            renderOutfitCards(FUR_OPTIONS, unlockedFur, appearance.fur, onSelectOrUnlockFur, false)}
          {wardrobeTab === 'outfit' &&
            renderOutfitCards(
              OUTFIT_OPTIONS,
              unlockedOutfits,
              appearance.outfit ?? 'none',
              onSelectOrUnlockOutfit,
              false
            )}
          {wardrobeTab === 'mount' &&
            renderOutfitCards(
              MOUNT_OPTIONS,
              unlockedMounts,
              appearance.mount ?? 'none',
              onSelectOrUnlockMount,
              false
            )}
          {wardrobeTab === 'head' &&
            renderOutfitCards(
              HEAD_ACCESSORIES,
              unlockedHead,
              appearance.head,
              onSelectOrUnlockHead,
              false
            )}
          {wardrobeTab === 'neck' &&
            renderOutfitCards(
              NECK_ACCESSORIES,
              unlockedNeck,
              appearance.neck,
              onSelectOrUnlockNeck,
              false
            )}

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#14201A] px-4 py-3 text-xs text-emerald-100/80">
            <span>Muốn xem thêm kỹ năng Boss và đồ trang trí?</span>
            <button
              type="button"
              onClick={() => {
                setArea('shop');
                setShopTab('outfit');
              }}
              className="font-bold text-amber-300 hover:underline"
            >
              Mở Cửa hàng Trang phục
            </button>
          </div>
        </div>
      )}

      {/* Food System Area */}
      {area === 'food' && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#14201A] p-4 sm:flex-row sm:items-center">
            <CapybaraPreview
              appearance={appearance}
              weather={activeWeather}
              petId={selectedPet}
              potionHue={potionHue}
              glowingFoodActive={glowingFoodActive}
              balloonsActive={balloonsActive}
            />
            <div className="flex-1 space-y-2">
              <div className="font-display text-base font-bold text-white">
                Hệ thống Thức ăn & Dinh dưỡng
              </div>
              <p className="text-xs leading-relaxed text-emerald-100/75">
                Cho Capybara ăn từ kho đồ ăn để hồi Độ no, Năng lượng và Niềm vui. Khi Độ no đạt từ
                70% và Niềm vui từ 60% trở lên, Capybara sẽ có thêm 1 Tim tối đa khi bắt đầu chạy.
              </p>
              <button
                type="button"
                onClick={() => {
                  setArea('shop');
                  setShopTab('food');
                }}
                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-3.5 text-xs font-bold text-[#1A1308] hover:bg-amber-400"
              >
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Mua thêm thức ăn</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FOOD_ITEMS.map((food) => {
              const count = foodInventory[food.id] ?? 0;
              return (
                <div
                  key={food.id}
                  className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#14201A] p-3.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/20"
                          style={{ backgroundColor: food.accentColor }}
                          aria-hidden="true"
                        />
                        <span className="font-display text-sm font-bold text-white">
                          {food.name}
                        </span>
                      </span>
                      <span className="font-mono-num text-xs font-bold text-amber-300">
                        Còn: {count} phần
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-emerald-100/75">
                      {food.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-emerald-200/80">
                      <span>+{food.hungerGain}% No</span>
                      <span>·</span>
                      <span>+{food.energyGain}% Năng lượng</span>
                      <span>·</span>
                      <span>+{food.happinessGain}% Vui</span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={count <= 0}
                      onClick={() => handleFeed(food.id)}
                      className="inline-flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-emerald-500 px-3 text-xs font-bold text-[#082216] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/35"
                    >
                      {count > 0 ? 'Cho Capybara ăn' : 'Hết món'}
                    </button>
                    <button
                      type="button"
                      disabled={yuzuBank < food.cost}
                      onClick={() => onBuyFood(food.id)}
                      className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 text-xs font-bold text-amber-200 hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Mua ({food.cost} quýt)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Small Pet Companions Area */}
      {area === 'pets' && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#14201A] p-4 sm:flex-row sm:items-center">
            <CapybaraPreview
              appearance={appearance}
              weather={activeWeather}
              petId={selectedPet}
            />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-display text-base font-bold text-white">
                  Thú cưng đồng hành ·{' '}
                  <span className="text-amber-300">{getPetDef(selectedPet).name}</span>
                </div>
                {selectedPet !== 'none' && (
                  <span className="font-mono-num text-xs font-semibold text-emerald-300">
                    +{Math.round(getPetEffectiveGoldenBonus(selectedPet, petBond[selectedPet]) * 100)}% Quýt Vàng
                    {getPetAutoCollectRadius(selectedPet, petBond[selectedPet]) > 0
                      ? ` · Hút ${getPetAutoCollectRadius(selectedPet, petBond[selectedPet])}px`
                      : ''}
                    {getPetItemDurationMultiplier(selectedPet, petBond[selectedPet]) > 1
                      ? ` · +${Math.round((getPetItemDurationMultiplier(selectedPet, petBond[selectedPet]) - 1) * 100)}% Thời gian vật phẩm`
                      : ''}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-emerald-100/75">
                {selectedPet !== 'none'
                  ? `Hiệu ứng hỗ trợ: ${getPetDef(selectedPet).supportTitle}. Độ Thân thiết từ 45% và 70% còn tăng thêm tầm tự nhặt quýt, thời gian vật phẩm và tỉ lệ rơi Quýt Vàng.`
                  : 'Nhận nuôi và chăm sóc thú cưng nhỏ chạy theo Capybara. Mỗi thú cưng có năng lực hỗ trợ riêng như tự động nhặt quýt gần đó hoặc kéo dài thời gian vật phẩm.'}
              </p>

              {selectedPet !== 'none' && (
                <div className="mt-2 flex flex-wrap items-center gap-2 pt-1">
                  <div className="min-w-[140px] flex-1">
                    <div className="flex items-center justify-between text-[11px] text-emerald-100/85">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-rose-400" aria-hidden="true" />
                        <span>Độ thân thiết</span>
                      </span>
                      <span className="font-mono-num font-bold text-white">
                        {petBond[selectedPet]}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-[#0D1612]">
                      <div
                        className="h-full bg-rose-400 transition-all duration-200"
                        style={{ width: `${petBond[selectedPet]}%` }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const res = onCarePet(selectedPet, 'pet');
                      setStatusMessage(res.message);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-[#21332A] px-3 text-xs font-semibold text-white hover:bg-[#2B4337]"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                    <span>Vuốt ve (+8%)</span>
                  </button>
                  <button
                    type="button"
                    disabled={yuzuBank < 3}
                    onClick={() => {
                      const res = onCarePet(selectedPet, 'treat');
                      setStatusMessage(res.message);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-3 text-xs font-bold text-[#1A1308] hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span>Cho ăn vặt (3 quýt, +18%)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PET_OPTIONS.map((pet) => {
              const isUnlocked = unlockedPets.includes(pet.id);
              const isSelected = selectedPet === pet.id;
              const canAfford = yuzuBank >= pet.cost;
              const bond = pet.id !== 'none' ? petBond[pet.id] : 0;

              return (
                <div
                  key={pet.id}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 transition-colors ${
                    isSelected
                      ? 'border-amber-400/60 bg-[#1D2E26]'
                      : 'border-white/10 bg-[#14201A]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 shrink-0 rounded-sm border border-white/20"
                          style={{ backgroundColor: pet.accentColor }}
                          aria-hidden="true"
                        />
                        <span className="font-display text-sm font-bold text-white">
                          {pet.name}
                        </span>
                      </span>
                      <span className="font-mono-num text-xs text-emerald-200/80">
                        {isUnlocked ? 'Đã nhận nuôi' : `${pet.cost} quýt`}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-amber-300/90">
                      {pet.species} · {pet.supportTitle}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-emerald-100/75">
                      {pet.description}
                    </p>
                    {pet.id !== 'none' && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-2 text-[11px] text-emerald-200/85">
                        {pet.autoCollectRadius > 0 && (
                          <span>
                            Tự nhặt quýt:{' '}
                            <strong className="font-mono-num text-amber-300">
                              {getPetAutoCollectRadius(pet.id, bond)}px
                            </strong>
                          </span>
                        )}
                        {pet.itemDurationBonusPct > 0 && (
                          <span>
                            Thời gian vật phẩm:{' '}
                            <strong className="font-mono-num text-emerald-300">
                              +{Math.round((getPetItemDurationMultiplier(pet.id, bond) - 1) * 100)}%
                            </strong>
                          </span>
                        )}
                        {pet.startsWithShield && (
                          <span>
                            Khởi đầu:{' '}
                            <strong className="text-sky-300">Khiên Khăn</strong>
                          </span>
                        )}
                        <span>
                          Quýt Vàng:{' '}
                          <strong className="font-mono-num text-amber-300">
                            +{Math.round(pet.goldenYuzuBonus * 100)}%
                          </strong>
                        </span>
                        {pet.scoreBonusPct > 0 && (
                          <span>
                            Điểm quýt:{' '}
                            <strong className="font-mono-num text-white">+{pet.scoreBonusPct}%</strong>
                          </span>
                        )}
                        {pet.feverBonusPct > 0 && (
                          <span>
                            Nạp Chill:{' '}
                            <strong className="font-mono-num text-sky-300">+{pet.feverBonusPct}%</strong>
                          </span>
                        )}
                        {isUnlocked && (
                          <span>
                            Thân thiết:{' '}
                            <strong className="font-mono-num text-rose-300">{bond}%</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={!isUnlocked && !canAfford}
                      onClick={() => onSelectOrUnlockPet(pet.id)}
                      className={`inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors ${
                        isSelected
                          ? 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                          : isUnlocked
                          ? 'bg-[#23372E] text-white hover:bg-[#2E473C]'
                          : canAfford
                          ? 'bg-amber-500 text-[#1A1308] hover:bg-amber-400'
                          : 'cursor-not-allowed bg-white/5 text-white/35'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Đang đi theo</span>
                        </>
                      ) : isUnlocked ? (
                        <span>Mang theo ngay</span>
                      ) : canAfford ? (
                        <span>Nhận nuôi ({pet.cost} quýt)</span>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Cần {pet.cost} quýt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shop Area */}
      {area === 'shop' && (
        <div className="mt-4 space-y-4">
          {/* Special Forecast Item: Bùa Thời Tiết */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-400/35 bg-[#122026] p-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-300" aria-hidden="true" />
                <span className="font-display text-sm font-bold text-white">
                  Bùa Thời Tiết (Dùng cho Hệ thống Dự báo)
                </span>
                <span className="font-mono-num rounded bg-sky-500/20 px-2 py-0.5 text-[11px] font-bold text-sky-200">
                  Đang có: {weatherCharms} bùa
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-100/75">
                Dùng ngay tại màn hình menu để thay đổi thời tiết dự báo cho lần chạy kế tiếp theo ý muốn.
              </p>
            </div>
            <button
              type="button"
              disabled={yuzuBank < WEATHER_CHARM_COST}
              onClick={onBuyWeatherCharm}
              className={`inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-xs font-bold transition-colors ${
                yuzuBank >= WEATHER_CHARM_COST
                  ? 'bg-sky-400 text-[#071F2C] hover:bg-sky-300'
                  : 'cursor-not-allowed bg-white/5 text-white/35'
              }`}
            >
              <span>Mua Bùa ({WEATHER_CHARM_COST} quýt)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-[#0F1814] p-1 sm:grid-cols-5">
            {(
              [
                { id: 'skills', label: 'Kỹ năng Boss' },
                { id: 'pets', label: 'Thú cưng nhỏ' },
                { id: 'food', label: 'Thức ăn' },
                { id: 'outfit', label: 'Trang phục & Lông' },
                { id: 'home_decor', label: 'Nội thất Nhà' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setShopTab(t.id)}
                className={`h-9 whitespace-nowrap rounded-md px-2 text-xs font-semibold transition-colors ${
                  shopTab === t.id
                    ? 'bg-[#263C31] text-amber-300'
                    : 'text-emerald-100/70 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Boss Skills Shop with Detailed Descriptions & Tooltips */}
          {shopTab === 'skills' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BOSS_SKILLS.map((skill) => {
                const isUnlocked = unlockedSkills.includes(skill.id);
                const canAfford = yuzuBank >= skill.cost;
                const isTooltipOpen = hoveredSkillId === skill.id || pinnedSkillId === skill.id;

                return (
                  <div
                    key={skill.id}
                    className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-colors ${
                      isUnlocked
                        ? 'border-emerald-400/35 bg-[#192921]'
                        : 'border-white/10 bg-[#14201A]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 shrink-0 rounded-sm border border-white/20"
                              style={{ backgroundColor: skill.accentColor }}
                              aria-hidden="true"
                            />
                            <span className="font-display text-sm font-bold text-white">
                              [{skill.hotkey}] {skill.name}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] font-semibold text-amber-300/85">
                            {skill.roleLabel}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="font-mono-num text-xs text-emerald-200/80">
                            {isUnlocked ? 'Sẵn sàng' : `${skill.cost} quýt`}
                          </span>

                          <div
                            className="relative"
                            onMouseEnter={() => setHoveredSkillId(skill.id)}
                            onMouseLeave={() =>
                              setHoveredSkillId((curr) => (curr === skill.id ? null : curr))
                            }
                          >
                            <button
                              type="button"
                              aria-label={`Xem chi tiết kỹ năng ${skill.name}`}
                              aria-expanded={isTooltipOpen}
                              title={`${skill.name}: ${skill.detailedEffect} (${skill.tacticalTip})`}
                              onClick={() =>
                                setPinnedSkillId((curr) => (curr === skill.id ? null : skill.id))
                              }
                              onFocus={() => setHoveredSkillId(skill.id)}
                              onBlur={() =>
                                setHoveredSkillId((curr) => (curr === skill.id ? null : curr))
                              }
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                                isTooltipOpen
                                  ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                                  : 'border-white/15 bg-[#0F1814] text-emerald-200/75 hover:border-amber-400/40 hover:text-white'
                              }`}
                            >
                              <Info className="h-4 w-4" aria-hidden="true" />
                            </button>

                            {isTooltipOpen && (
                              <div
                                role="tooltip"
                                className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-amber-400/40 bg-[#0D1612] p-3 text-left shadow-2xl"
                              >
                                <div className="font-display text-xs font-bold text-amber-300">
                                  Chi tiết kỹ năng [{skill.hotkey}]
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-emerald-50/90">
                                  {skill.detailedEffect}
                                </p>
                                <div className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-relaxed text-emerald-200/80">
                                  <span className="font-semibold text-white">Mẹo chiến thuật: </span>
                                  {skill.tacticalTip}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-emerald-100/85">
                        {skill.detailedEffect}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-2 text-[11px] text-emerald-200/80">
                        <span>
                          Sát thương:{' '}
                          <strong className="font-mono-num text-white">
                            {skill.damage > 0 ? `${skill.damage} HP` : 'Chặn đòn + Hồi 1 tim'}
                          </strong>
                        </span>
                        <span>
                          Hồi chiêu:{' '}
                          <strong className="font-mono-num text-white">{skill.cooldown}s</strong>
                        </span>
                        <span>
                          Phím:{' '}
                          <strong className="font-mono-num text-amber-300">{skill.hotkey}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      {isUnlocked ? (
                        <div className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 text-xs font-bold text-emerald-300">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Đã trang bị khi đấu Boss</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUnlockSkill(skill.id)}
                          className={`inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                            canAfford
                              ? 'bg-amber-500 text-[#1A1308] hover:bg-amber-400'
                              : 'cursor-not-allowed bg-white/5 text-white/35'
                          }`}
                        >
                          {canAfford ? (
                            <span>Mua kỹ năng ({skill.cost} quýt)</span>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Cần {skill.cost} quýt</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Food Shop */}
          {shopTab === 'food' && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {FOOD_ITEMS.map((food) => {
                const count = foodInventory[food.id] ?? 0;
                const canAfford = yuzuBank >= food.cost;
                return (
                  <div
                    key={food.id}
                    className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#14201A] p-3.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/20"
                            style={{ backgroundColor: food.accentColor }}
                            aria-hidden="true"
                          />
                          <span className="font-display text-sm font-bold text-white">
                            {food.name}
                          </span>
                        </span>
                        <span className="font-mono-num text-xs text-emerald-200/80">
                          Đang có: {count}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-emerald-100/75">
                        {food.description}
                      </p>
                      <div className="mt-2 text-[11px] text-emerald-200/80">
                        +{food.hungerGain}% No · +{food.energyGain}% Năng lượng · +{food.happinessGain}% Vui
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyFood(food.id)}
                        className={`inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors ${
                          canAfford
                            ? 'bg-amber-500 text-[#1A1308] hover:bg-amber-400'
                            : 'cursor-not-allowed bg-white/5 text-white/35'
                        }`}
                      >
                        {canAfford ? `Mua vào kho (${food.cost} quýt)` : `Cần ${food.cost} quýt`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Outfit, Mounts & Fur Shop */}
          {shopTab === 'outfit' && (
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-xs font-bold text-emerald-200">Thú cưỡi (Nhà riêng)</h3>
                {renderOutfitCards(
                  MOUNT_OPTIONS,
                  unlockedMounts,
                  appearance.mount ?? 'none',
                  onSelectOrUnlockMount,
                  false
                )}
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold text-emerald-200">Trang phục</h3>
                {renderOutfitCards(
                  OUTFIT_OPTIONS,
                  unlockedOutfits,
                  appearance.outfit ?? 'none',
                  onSelectOrUnlockOutfit,
                  false
                )}
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold text-emerald-200">Màu lông</h3>
                {renderOutfitCards(FUR_OPTIONS, unlockedFur, appearance.fur, onSelectOrUnlockFur, false)}
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold text-emerald-200">Phụ kiện đầu</h3>
                {renderOutfitCards(
                  HEAD_ACCESSORIES,
                  unlockedHead,
                  appearance.head,
                  onSelectOrUnlockHead,
                  false
                )}
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold text-emerald-200">Phụ kiện cổ</h3>
                {renderOutfitCards(
                  NECK_ACCESSORIES,
                  unlockedNeck,
                  appearance.neck,
                  onSelectOrUnlockNeck,
                  false
                )}
              </div>
            </div>
          )}

          {/* Home Furniture Shop */}
          {shopTab === 'home_decor' && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {HOME_ITEMS.map((item) => {
                const isUnlocked = unlockedHomeItems.includes(item.id);
                const isPlaced = activeHomeItems.includes(item.id);
                const canAfford = yuzuBank >= item.cost;

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 ${
                      isUnlocked
                        ? 'border-emerald-400/35 bg-[#192921]'
                        : 'border-white/10 bg-[#14201A]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 shrink-0 rounded-sm border border-white/20"
                            style={{ backgroundColor: item.accentColor }}
                            aria-hidden="true"
                          />
                          <span className="font-display text-sm font-bold text-white">
                            {item.name}
                          </span>
                        </span>
                        <span className="font-mono-num text-xs text-emerald-200/80">
                          {isUnlocked ? 'Đã sở hữu' : `${item.cost} quýt`}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-emerald-100/75">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        disabled={!isUnlocked && !canAfford}
                        onClick={() => onUnlockOrToggleHomeItem(item.id)}
                        className={`inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors ${
                          isPlaced
                            ? 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                            : isUnlocked
                            ? 'bg-[#23372E] text-white hover:bg-[#2E473C]'
                            : canAfford
                            ? 'bg-amber-500 text-[#1A1308] hover:bg-amber-400'
                            : 'cursor-not-allowed bg-white/5 text-white/35'
                        }`}
                      >
                        {isPlaced
                          ? 'Đang đặt trong Nhà'
                          : isUnlocked
                          ? 'Đặt vào Nhà riêng'
                          : canAfford
                          ? `Mua nội thất (${item.cost} quýt)`
                          : `Cần ${item.cost} quýt`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Small Pets Shop Sub-tab */}
          {shopTab === 'pets' && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {PET_OPTIONS.filter((p) => p.id !== 'none').map((pet) => {
                const isUnlocked = unlockedPets.includes(pet.id);
                const isSelected = selectedPet === pet.id;
                const canAfford = yuzuBank >= pet.cost;
                return (
                  <div
                    key={pet.id}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 ${
                      isSelected
                        ? 'border-amber-400/50 bg-[#1D2E26]'
                        : isUnlocked
                        ? 'border-emerald-400/35 bg-[#192921]'
                        : 'border-white/10 bg-[#14201A]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 shrink-0 rounded-sm border border-white/20"
                            style={{ backgroundColor: pet.accentColor }}
                            aria-hidden="true"
                          />
                          <span className="font-display text-sm font-bold text-white">
                            {pet.name}
                          </span>
                        </span>
                        <span className="font-mono-num text-xs text-emerald-200/80">
                          {isUnlocked ? 'Đã nhận nuôi' : `${pet.cost} quýt`}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-emerald-100/75">
                        {pet.description}
                      </p>
                      <div className="mt-2 text-[11px] font-semibold text-amber-300">
                        {pet.supportTitle} · +{Math.round(pet.goldenYuzuBonus * 100)}% Quýt Vàng
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        disabled={!isUnlocked && !canAfford}
                        onClick={() => onSelectOrUnlockPet(pet.id)}
                        className={`inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors ${
                          isSelected
                            ? 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                            : isUnlocked
                            ? 'bg-[#23372E] text-white hover:bg-[#2E473C]'
                            : canAfford
                            ? 'bg-amber-500 text-[#1A1308] hover:bg-amber-400'
                            : 'cursor-not-allowed bg-white/5 text-white/35'
                        }`}
                      >
                        {isSelected
                          ? 'Đang đi theo'
                          : isUnlocked
                          ? 'Mang theo ngay'
                          : canAfford
                          ? `Nhận nuôi (${pet.cost} quýt)`
                          : `Cần ${pet.cost} quýt`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Achievements Area */}
      {area === 'achievements' && (
        <div className="mt-4 space-y-4">
          {/* Lifetime Milestone Summary Strip */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-[#14201A] p-4 sm:grid-cols-4">
            <div>
              <div className="text-[11px] text-emerald-200/70">Huy hiệu đã nhận</div>
              <div className="mt-0.5 font-mono-num text-lg font-bold text-white">
                {claimedAchievements.length} / {ACHIEVEMENTS.length}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-emerald-200/70">Quãng đường tích lũy</div>
              <div className="mt-0.5 font-mono-num text-lg font-bold text-amber-300">
                {achievementStats.totalDistanceMeters.toLocaleString('vi-VN')}m
              </div>
            </div>
            <div>
              <div className="text-[11px] text-emerald-200/70">Tổng Boss đã hạ</div>
              <div className="mt-0.5 font-mono-num text-lg font-bold text-rose-300">
                {achievementStats.totalBossesDefeated}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-emerald-200/70">Combo cao nhất</div>
              <div className="mt-0.5 font-mono-num text-lg font-bold text-emerald-300">
                x{achievementStats.maxComboEver}
              </div>
            </div>
          </div>

          {tournamentBadges.length > 0 && (
            <div className="rounded-xl border border-amber-400/35 bg-[#182721] p-4">
              <div className="flex items-center gap-2 font-display text-sm font-bold text-amber-300">
                <Crown className="h-4 w-4" aria-hidden="true" />
                <span>Huy hiệu Thách đấu tuần độc quyền ({tournamentBadges.length})</span>
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {tournamentBadges.map((b) => (
                  <div
                    key={b.weekId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#101B16] px-3 py-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{b.badgeTitle}</div>
                      <div className="text-[11px] text-emerald-200/75">
                        {b.weekLabel} · Hạng #{b.rank}
                      </div>
                    </div>
                    <span className="font-mono-num font-bold text-amber-300">
                      +{b.rewardYuzu} Quýt
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ACHIEVEMENTS.map((ach) => {
              const current = getAchievementValue(ach, achievementStats, unlockedPets);
              const unlocked = isAchievementUnlocked(ach, achievementStats, unlockedPets);
              const claimed = claimedAchievements.includes(ach.id);
              const pct = Math.min(100, Math.round((current / ach.target) * 100));
              const tierStyle = TIER_STYLES[ach.tier];
              const BadgeIcon = getAchievementIcon(ach.id);

              return (
                <div
                  key={ach.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                    claimed
                      ? 'border-emerald-400/35 bg-[#192921]'
                      : unlocked
                      ? 'border-amber-400/60 bg-[#1F2F25]'
                      : 'border-white/10 bg-[#14201A]'
                  }`}
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                          unlocked
                            ? tierStyle.frameClass
                            : 'border-white/10 bg-[#0F1814] text-white/30'
                        }`}
                      >
                        <BadgeIcon className="h-5 w-5" aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-display text-sm font-bold text-white">
                            {ach.title}
                          </h3>
                          <span className="font-mono-num text-xs font-bold text-amber-300">
                            +{ach.rewardYuzu} Quýt
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-emerald-200/75">
                          <span className={unlocked ? tierStyle.textClass : 'text-emerald-200/60'}>
                            {ach.badgeLabel}
                          </span>
                          <span className="mx-1.5 text-white/25" aria-hidden="true">
                            ·
                          </span>
                          <span>{tierStyle.label}</span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs leading-relaxed text-emerald-100/75">
                      {ach.description}
                    </p>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-200/75">Tiến độ</span>
                        <span className="font-mono-num font-semibold text-white">
                          {Math.min(current, ach.target).toLocaleString('vi-VN')} /{' '}
                          {ach.target.toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-[#0D1612]">
                        <div
                          className={`h-full transition-all duration-300 ${
                            claimed
                              ? 'bg-emerald-400'
                              : unlocked
                              ? 'bg-amber-400'
                              : 'bg-sky-400/80'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5">
                    {claimed ? (
                      <div className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 text-xs font-bold text-emerald-300">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Đã nhận huy hiệu (+{ach.rewardYuzu} Quýt)</span>
                      </div>
                    ) : unlocked ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClaimAchievement(ach.id);
                          setStatusMessage(
                            `Đã nhận ${ach.badgeLabel} và +${ach.rewardYuzu} Quýt thưởng!`
                          );
                        }}
                        className="inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-3 text-xs font-bold text-[#1A1308] transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                      >
                        <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Nhận huy hiệu (+{ach.rewardYuzu} Quýt)</span>
                      </button>
                    ) : (
                      <div className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-white/45">
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Chưa mở khóa ({pct}%)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
