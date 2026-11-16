export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type PlayMode = 'endless' | 'boss_rush' | 'weekly_tournament' | 'multiplayer';

export type Difficulty = 'relaxed' | 'normal' | 'turbo';

export type FurColorId =
  | 'classic'
  | 'cream'
  | 'espresso'
  | 'mist'
  | 'honey'
  | 'golden'
  | 'ghost'
  | 'galaxy'
  | 'angel'
  | 'rainbow'
  | 'lava'
  | 'ice';
export type HeadAccessoryId =
  | 'none'
  | 'towel'
  | 'lotus'
  | 'crown'
  | 'sunglasses'
  | 'straw_hat'
  | 'chef_hat'
  | 'flower_clip'
  | 'wizard_hat'
  | 'bunny_ears';
export type NeckAccessoryId =
  | 'none'
  | 'scarf'
  | 'bell'
  | 'sakura'
  | 'bowtie'
  | 'gold_chain'
  | 'clover_tie'
  | 'pearl_necklace'
  | 'royal_medal';
export type OutfitId =
  | 'none'
  | 'overall'
  | 'yukata'
  | 'strawberry_hoodie'
  | 'ninja'
  | 'royal_cape'
  | 'astronaut';
export type MountId =
  | 'none'
  | 'giant_turtle'
  | 'wooden_duck'
  | 'koi_fish'
  | 'fluffy_cloud';

export interface CapybaraAppearance {
  name: string;
  fur: FurColorId;
  head: HeadAccessoryId;
  neck: NeckAccessoryId;
  outfit?: OutfitId;
  mount?: MountId;
}

export interface CustomizationItem<T extends string> {
  id: T;
  name: string;
  description: string;
  cost: number;
  swatchColor: string;
  secondaryColor?: string;
  rarity?: 'common' | 'ultra_rare';
  effectLabel?: string;
}

export type WeatherMode = 'auto' | 'clear' | 'leaves' | 'rain' | 'sakura' | 'snow' | 'fireflies';
export type ActiveWeather = 'clear' | 'leaves' | 'rain' | 'sakura' | 'snow' | 'fireflies';

export type PetId =
  | 'none'
  | 'duckling'
  | 'frog'
  | 'turtle'
  | 'shiba'
  | 'otter'
  | 'red_panda'
  | 'alpaca'
  | 'phoenix_chick';
export type PhotoPose = 'normal' | 'happy' | 'zen' | 'cool';

export interface PetDefinition {
  id: PetId;
  name: string;
  species: string;
  description: string;
  supportTitle: string;
  cost: number;
  goldenYuzuBonus: number;
  scoreBonusPct: number;
  feverBonusPct: number;
  autoCollectRadius: number;
  itemDurationBonusPct: number;
  startsWithShield?: boolean;
  accentColor: string;
  favoriteFoodLabel: string;
}

export type StageBiomeId =
  | 'emerald_stream'
  | 'sakura_valley'
  | 'sunset_marsh'
  | 'mist_canyon'
  | 'autumn_bamboo'
  | 'aurora_snow'
  | 'volcano_island'
  | 'golden_beach'
  | 'secret_forest'
  | 'amusement_park'
  | 'glowing_forest'
  | 'ice_mountain'
  | 'ocean'
  | 'candy_planet';

export interface StageConfig {
  id: string;
  stageNumber: number;
  biome: StageBiomeId;
  name: string;
  subtitle: string;
  seed: number;
  skyTop: string;
  skyBottom: string;
  mountainFar: string;
  mountainNear: string;
  grassColor: string;
  soilColor: string;
  riverTop: string;
  riverBottom: string;
  foliageColor: string;
  mountainAmpFar: number;
  mountainAmpNear: number;
  mountainFreqFar: number;
  mountainFreqNear: number;
  obstacleWeights: [number, number, number, number, number];
}

export type SkillId =
  | 'yuzu_shot'
  | 'onsen_wave'
  | 'lotus_shield'
  | 'yuzu_meteor'
  | 'bamboo_storm'
  | 'thunder_yuzu'
  | 'cherry_heal';

export interface SkillDefinition {
  id: SkillId;
  name: string;
  roleLabel: string;
  description: string;
  detailedEffect: string;
  tacticalTip: string;
  cost: number;
  cooldown: number;
  damage: number;
  hotkey: string;
  accentColor: string;
}

export interface SkillCooldowns {
  yuzu_shot: number;
  onsen_wave: number;
  lotus_shield: number;
  yuzu_meteor: number;
  bamboo_storm: number;
  thunder_yuzu: number;
  cherry_heal: number;
}

export type BossKind = 'croc_king' | 'onsen_crab' | 'bamboo_dragon';
export type BossAnimState = 'idle' | 'walking' | 'running';

export interface BossEntity {
  kind: BossKind;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  phase: number;
  attackTimer: number;
  dashTimer: number;
  hitFlash: number;
  level: number;
  animState: BossAnimState;
  runCycle: number;
  facing: -1 | 1;
}

export interface Projectile {
  id: number;
  owner: 'player' | 'boss';
  kind:
    | 'yuzu_orb'
    | 'wave'
    | 'meteor'
    | 'bamboo_blade'
    | 'thunder_bolt'
    | 'chili_bomb'
    | 'water_pulse';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  piercing: boolean;
  life: number;
}

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  subtitle: string;
  baseSpeed: number;
  maxSpeed: number;
  spawnIntervalMin: number;
  spawnIntervalMax: number;
  scoreMultiplier: number;
}

export type ObstacleKind = 'rock' | 'bamboo' | 'croc' | 'dragonfly' | 'chili';

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  x: number;
  y: number;
  width: number;
  height: number;
  phase: number;
  passed: boolean;
}

export type CollectibleKind = 'yuzu' | 'golden_yuzu' | 'shield' | 'magnet';

export interface Collectible {
  id: number;
  kind: CollectibleKind;
  x: number;
  y: number;
  radius: number;
  phase: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface HudSnapshot {
  score: number;
  highScore: number;
  yuzuRun: number;
  yuzuBank: number;
  combo: number;
  multiplier: number;
  hearts: number;
  maxHearts: number;
  hasShield: boolean;
  magnetTimer: number;
  magnetMaxDuration: number;
  feverMeter: number;
  feverActive: boolean;
  feverTimer: number;
  feverMaxDuration: number;
  distanceMeters: number;
  speedFactor: number;
  activeWeather: ActiveWeather;
  isNight: boolean;
  cycleRemainingSeconds: number;
  bossActive: boolean;
  bossName: string | null;
  bossHp: number;
  bossMaxHp: number;
  bossesDefeated: number;
  skillCooldowns: SkillCooldowns;
  stageName: string;
}

export interface RunSummary {
  score: number;
  highScore: number;
  isNewRecord: boolean;
  yuzuCollected: number;
  distanceMeters: number;
  maxCombo: number;
  obstaclesPassed: number;
  feverCount: number;
  bossesDefeated: number;
}

export type DailyQuestMetric =
  | 'yuzu'
  | 'distance'
  | 'obstacles'
  | 'fever'
  | 'combo'
  | 'runs';

export interface DailyQuest {
  id: string;
  title: string;
  metric: DailyQuestMetric;
  target: number;
  progress: number;
  rewardYuzu: number;
  claimed: boolean;
}

export interface DailyQuestState {
  dateKey: string;
  quests: DailyQuest[];
}

export interface GlobalLeaderboardEntry {
  uid: string;
  playerName: string;
  score: number;
  difficulty: Difficulty;
  distanceMeters: number;
  fur: FurColorId;
  head: HeadAccessoryId;
  neck: NeckAccessoryId;
}

export interface YuzuGift {
  id: string;
  senderUid: string;
  senderName: string;
  recipientUid: string;
  recipientName: string;
  message: string;
  yuzuAmount: number;
  dayBucket: number;
  claimed: boolean;
  createdAtMs?: number;
}

export type WeeklyTournamentBadgeId =
  | 'weekly_champion'
  | 'weekly_runner_up'
  | 'weekly_third'
  | 'weekly_top10'
  | 'weekly_participant';

export interface TournamentBadgeRecord {
  weekId: string;
  weekLabel: string;
  rank: number;
  badgeId: WeeklyTournamentBadgeId;
  badgeTitle: string;
  rewardYuzu: number;
  awardedAtMs: number;
}

export interface WeeklyTournamentEntry {
  uid: string;
  weekId: string;
  weekIndex: number;
  playerName: string;
  score: number;
  distanceMeters: number;
  bossesDefeated: number;
  fur: FurColorId;
  head: HeadAccessoryId;
  neck: NeckAccessoryId;
  runsCount: number;
}

export interface WeeklyTournamentClaim {
  id: string;
  uid: string;
  weekId: string;
  weekIndex: number;
  claimType: 'final_rank' | 'qualifier';
  rank: number;
  rewardYuzu: number;
  badgeId: WeeklyTournamentBadgeId;
  badgeTitle: string;
  claimedAtMs?: number;
}

export type MapTheme = 'bamboo' | 'sakura' | 'night_lantern' | 'snow';

export type MapTileType = 'platform' | 'spring' | 'onsen' | 'yuzu' | 'hazard';

export interface MapObject {
  id: string;
  type: MapTileType;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CustomMap {
  id: string;
  name: string;
  author: string;
  theme: MapTheme;
  objects: MapObject[];
}

export type RoomMode = 'free' | 'duel';

export type DuelPhase = 'waiting' | 'countdown' | 'active' | 'finished';

export interface DuelStanding {
  id: string;
  name: string;
  score: number;
  yuzuCount: number;
  appearance: CapybaraAppearance;
}

export interface DuelState {
  phase: DuelPhase;
  hostId: string;
  durationSec: number;
  countdownSec: number;
  remainingSec: number;
  readyPlayerIds: string[];
  winnerId: string | null;
  standings: DuelStanding[];
}

export interface RoomSummary {
  id: string;
  code: string;
  mode: RoomMode;
  name: string;
  hasPassword: boolean;
  isPreset: boolean;
  playerCount: number;
  maxPlayers: number;
  mapName: string;
  theme: MapTheme;
}

export interface RemotePlayerState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  isDucking: boolean;
  isGrounded: boolean;
  appearance: CapybaraAppearance;
  score: number;
  yuzuCount: number;
  emote: string | null;
  emoteUntil: number;
}

export type WorldAreaId =
  | 'home'
  | 'pool'
  | 'forest'
  | 'playground'
  | 'explore'
  | 'kingdom'
  | 'spaceship'
  | 'crafting'
  | 'shop'
  | 'wardrobe'
  | 'food'
  | 'pets'
  | 'achievements';

export type WorldLocationId =
  | 'home'
  | 'pool'
  | 'forest'
  | 'playground'
  | 'city'
  | 'beach'
  | 'volcano'
  | 'secret_forest'
  | 'campsite'
  | 'winter'
  | 'amusement_park'
  | 'glowing_forest'
  | 'ice_mountain'
  | 'ocean'
  | 'candy_planet'
  | 'kingdom'
  | 'spaceship'
  | 'alien_dimension';

export type CapybaraActivityId =
  | 'skateboard'
  | 'bubble_bath'
  | 'nap_snore'
  | 'dance'
  | 'eat_watermelon'
  | 'dive_swim'
  | 'balloon'
  | 'sleep_teddy'
  | 'selfie'
  | 'arcade_game';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'jade';

export type AchievementMetric =
  | 'total_distance'
  | 'best_distance'
  | 'bosses_defeated'
  | 'total_yuzu'
  | 'max_combo'
  | 'fever_count'
  | 'runs_completed'
  | 'pets_owned';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  metric: AchievementMetric;
  target: number;
  rewardYuzu: number;
  tier: AchievementTier;
  badgeLabel: string;
}

export interface AchievementStats {
  totalDistanceMeters: number;
  bestDistanceMeters: number;
  totalBossesDefeated: number;
  totalYuzuCollected: number;
  maxComboEver: number;
  totalFeverCount: number;
  totalRunsCompleted: number;
}

export type FoodId = 'carrot' | 'yuzu_sweet' | 'watermelon' | 'mochi' | 'bamboo_salad';

export type HomeItemId = 'tatami' | 'tea_table' | 'lantern' | 'plush_bed' | 'bonsai';

export interface CapybaraNeeds {
  hunger: number;
  energy: number;
  happiness: number;
  updatedAt: number;
}

export interface FoodItemDefinition {
  id: FoodId;
  name: string;
  description: string;
  cost: number;
  hungerGain: number;
  energyGain: number;
  happinessGain: number;
  accentColor: string;
}

export interface HomeItemDefinition {
  id: HomeItemId;
  name: string;
  description: string;
  cost: number;
  accentColor: string;
}

export type SideQuestId = 'find_fruit' | 'befriend_bird_duck' | 'catch_fish';

export interface SideQuestItem {
  id: SideQuestId;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardYuzu: number;
  rewardFood?: FoodId;
  claimed: boolean;
}

export type EnvironmentalActionId = 'swim_water' | 'chew_grass' | 'rest_shade';

export type IngredientId =
  | 'glow_mushroom'
  | 'ice_crystal'
  | 'sea_pearl'
  | 'candy_sugar'
  | 'meteor_stone';

export type CraftedItemId = 'fur_potion' | 'floating_balloons' | 'glowing_food';

export type CitizenId =
  | 'baker_capy'
  | 'knight_capy'
  | 'musician_capy'
  | 'mage_capy'
  | 'gardener_capy'
  | 'astronomer_capy';

export type FestivalId = 'yuzu_lantern' | 'royal_banquet' | 'starlight_carnival';

export interface KingdomState {
  castleLevel: number;
  citizens: CitizenId[];
  festivalsHeld: number;
  activeFestivalUntil: number;
  activeFestivalId: FestivalId | null;
}

export interface SavedProgress {
  highScores: Record<Difficulty, number>;
  yuzuBank: number;
  avatar: string;
  appearance: CapybaraAppearance;
  unlockedFur: FurColorId[];
  unlockedHead: HeadAccessoryId[];
  unlockedNeck: NeckAccessoryId[];
  unlockedOutfits: OutfitId[];
  unlockedMounts: MountId[];
  unlockedSkills: SkillId[];
  customMaps: CustomMap[];
  selectedDifficulty: Difficulty;
  weatherMode: WeatherMode;
  dailyQuests: DailyQuestState;
  muted: boolean;
  needs: CapybaraNeeds;
  foodInventory: Record<FoodId, number>;
  unlockedHomeItems: HomeItemId[];
  activeHomeItems: HomeItemId[];
  unlockedPets: PetId[];
  selectedPet: PetId;
  petBond: Record<Exclude<PetId, 'none'>, number>;
  achievementStats: AchievementStats;
  claimedAchievements: string[];
  forecastWeather: ActiveWeather;
  weatherCharms: number;
  weatherLockedByCharm: boolean;
  tournamentBadges: TournamentBadgeRecord[];
  sideQuests: SideQuestItem[];
  ingredients: Record<IngredientId, number>;
  craftedItems: Record<CraftedItemId, number>;
  potionHue: number | null;
  balloonsActive: boolean;
  glowingFoodUntil: number;
  kingdom: KingdomState;
  meteorStones: number;
  alienMetCount: number;
  midnightChestDayKey: string | null;
  discoveredCreatures: string[];
}
