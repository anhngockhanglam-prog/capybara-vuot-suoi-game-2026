import {
  CapybaraActivityId,
  CapybaraNeeds,
  CitizenId,
  CraftedItemId,
  EnvironmentalActionId,
  FestivalId,
  FoodId,
  FoodItemDefinition,
  HomeItemDefinition,
  IngredientId,
  KingdomState,
  SideQuestItem,
  WorldAreaId,
  WorldLocationId,
} from './types';

export interface WorldAreaMeta {
  id: WorldAreaId;
  label: string;
  subtitle: string;
}

export type ExploreDestinationId = Exclude<
  WorldLocationId,
  'home' | 'pool' | 'forest' | 'playground' | 'kingdom' | 'spaceship' | 'alien_dimension'
>;

export interface ExploreLocationMeta {
  id: ExploreDestinationId;
  label: string;
  subtitle: string;
  accentColor: string;
}

export interface CapybaraActivityMeta {
  id: CapybaraActivityId;
  label: string;
  shortLabel: string;
  description: string;
  recommendedLocation: WorldLocationId;
  energyDelta: number;
  happinessDelta: number;
  hungerDelta: number;
  yuzuReward?: number;
  accentColor: string;
}

export const WORLD_AREAS: WorldAreaMeta[] = [
  {
    id: 'home',
    label: 'Nhà riêng',
    subtitle: 'Nghỉ ngơi, ôm gấu bông, chơi máy điện tử và bài trí nội thất gỗ ấm áp.',
  },
  {
    id: 'pool',
    label: 'Hồ bơi & Câu cá',
    subtitle: 'Tắm bồn bong bóng, bơi lặn dưới nước mát và ngồi bến gỗ câu cá bờ suối.',
  },
  {
    id: 'forest',
    label: 'Khu rừng',
    subtitle: 'Dạo bước dưới tán tre, nhai cỏ non, tìm chỗ râm nghỉ ngơi và hái trái cây.',
  },
  {
    id: 'playground',
    label: 'Khu vui chơi',
    subtitle: 'Nhảy theo nhạc, chơi bóng bay, chụp selfie và mini-game bắt quýt nhận thưởng.',
  },
  {
    id: 'explore',
    label: 'Du lịch',
    subtitle: 'Khám phá 11 vùng đất kỳ thú: Rừng phát sáng, Núi băng, Đại dương, Hành tinh kẹo & hơn thế nữa!',
  },
  {
    id: 'kingdom',
    label: 'Vương quốc',
    subtitle: 'Xây lâu đài, tuyển cư dân Capybara, tổ chức lễ hội rực rỡ cùng Vua và Hoàng hậu Capybara.',
  },
  {
    id: 'spaceship',
    label: 'Phi thuyền',
    subtitle: 'Lái phi thuyền khám phá Hành tinh kẹo, gặp Capybara ngoài hành tinh và thu thập đá thiên thạch.',
  },
  {
    id: 'crafting',
    label: 'Chế tạo',
    subtitle: 'Kết hợp nguyên liệu tạo Thuốc đổi màu lông, Bong bóng bay và Thức ăn phát sáng.',
  },
  {
    id: 'shop',
    label: 'Cửa hàng',
    subtitle: 'Mua skin cực hiếm, kỹ năng Boss, Bùa Thời Tiết, thức ăn, thú cưng và nội thất.',
  },
  {
    id: 'wardrobe',
    label: 'Tủ quần áo',
    subtitle: 'Thay đổi màu lông, hiệu ứng tên riêng, Capy cực hiếm và phụ kiện đã sở hữu.',
  },
  {
    id: 'food',
    label: 'Thức ăn',
    subtitle: 'Cho Capybara ăn no để kích hoạt +1 Tim khi vào trận.',
  },
  {
    id: 'pets',
    label: 'Thú cưng',
    subtitle: 'Nhận nuôi, chăm sóc thú cưng đi theo và tăng tỉ lệ rơi Quýt Vàng.',
  },
  {
    id: 'achievements',
    label: 'Thành tựu',
    subtitle: 'Chinh phục các cột mốc vượt suối, diệt Boss và sưu tầm huy hiệu Thách đấu tuần.',
  },
];

export const EXPLORE_LOCATIONS: ExploreLocationMeta[] = [
  {
    id: 'glowing_forest',
    label: 'Rừng phát sáng',
    subtitle: 'Nấm khổng lồ phát quang, đom đóm dẫn đường và cây cổ thụ biết nói.',
    accentColor: '#2DD4BF',
  },
  {
    id: 'ice_mountain',
    label: 'Núi băng',
    subtitle: 'Hang pha lê lấp lánh cầu vồng băng giá và hồ nước đóng băng trong suốt.',
    accentColor: '#38BDF8',
  },
  {
    id: 'ocean',
    label: 'Đại dương',
    subtitle: 'Thành phố dưới biển sâu rực ánh ngọc và các sinh vật biển hiền hòa.',
    accentColor: '#0EA5E9',
  },
  {
    id: 'candy_planet',
    label: 'Hành tinh kẹo',
    subtitle: 'Dòng sông sô-cô-la chảy mượt quanh những ngọn núi bánh ngọt kem dâu.',
    accentColor: '#F472B6',
  },
  {
    id: 'beach',
    label: 'Đảo biển',
    subtitle: 'Cát vàng nắng ấm, rặng dừa xanh, sóng biển vỗ, khu vực câu cá và chú cua nhỏ.',
    accentColor: '#FBBF24',
  },
  {
    id: 'secret_forest',
    label: 'Rừng bí ẩn',
    subtitle: 'Khu rừng cổ thụ huyền ảo với nấm phát sáng, trái cây hiếm và đom đóm xanh lam.',
    accentColor: '#34D399',
  },
  {
    id: 'winter',
    label: 'Vùng tuyết',
    subtitle: 'Rừng thông phủ tuyết trắng, người tuyết dễ thương và bông tuyết rơi êm dịu.',
    accentColor: '#BAE6FD',
  },
  {
    id: 'city',
    label: 'Thành phố',
    subtitle: 'Phố đèn đường hiện đại lý tưởng để trượt ván quanh thành phố.',
    accentColor: '#38BDF8',
  },
  {
    id: 'volcano',
    label: 'Đảo núi lửa',
    subtitle: 'Đỉnh núi lửa bốc khói, hồ dung nham rực sáng và tàn lửa bay lên.',
    accentColor: '#FB7185',
  },
  {
    id: 'campsite',
    label: 'Khu cắm trại',
    subtitle: 'Lều vải ấm cúng bên đống lửa trại bập bùng dưới bầu trời sao.',
    accentColor: '#F97316',
  },
  {
    id: 'amusement_park',
    label: 'Công viên giải trí',
    subtitle: 'Vòng đu quay rực rỡ, cờ lễ hội và quầy bóng bay đầy màu sắc.',
    accentColor: '#F472B6',
  },
];

export const CAPYBARA_ACTIVITIES: CapybaraActivityMeta[] = [
  {
    id: 'skateboard',
    label: 'Trượt ván quanh thành phố',
    shortLabel: 'Trượt ván',
    description: 'Capybara lướt ván điệu nghệ qua phố phường và bật nhảy tạo tia lửa.',
    recommendedLocation: 'city',
    energyDelta: -4,
    happinessDelta: 22,
    hungerDelta: -3,
    yuzuReward: 1,
    accentColor: '#38BDF8',
  },
  {
    id: 'bubble_bath',
    label: 'Tắm bồn bong bóng xà phòng',
    shortLabel: 'Tắm bong bóng',
    description: 'Ngâm mình trong bồn ấm đầy bọt xà phòng óng ánh bay lơ lửng.',
    recommendedLocation: 'pool',
    energyDelta: 18,
    happinessDelta: 24,
    hungerDelta: -2,
    accentColor: '#67E8F9',
  },
  {
    id: 'nap_snore',
    label: 'Ngủ và ngáy',
    shortLabel: 'Ngủ & ngáy',
    description: 'Đánh một giấc thật say với tiếng ngáy khò khò cực chill.',
    recommendedLocation: 'home',
    energyDelta: 35,
    happinessDelta: 10,
    hungerDelta: -3,
    accentColor: '#93C5FD',
  },
  {
    id: 'dance',
    label: 'Nhảy theo nhạc',
    shortLabel: 'Nhảy theo nhạc',
    description: 'Lắc lư nhịp nhàng dưới ánh đèn sân khấu cùng nốt nhạc rộn ràng.',
    recommendedLocation: 'playground',
    energyDelta: -5,
    happinessDelta: 26,
    hungerDelta: -4,
    yuzuReward: 1,
    accentColor: '#C084FC',
  },
  {
    id: 'eat_watermelon',
    label: 'Ăn dưa hấu (hoạt ảnh nhai)',
    shortLabel: 'Ăn dưa hấu',
    description: 'Cầm miếng dưa hấu đỏ mọng nhai ngon lành và giải nhiệt tức thì.',
    recommendedLocation: 'beach',
    energyDelta: 14,
    happinessDelta: 18,
    hungerDelta: 28,
    accentColor: '#FB7185',
  },
  {
    id: 'dive_swim',
    label: 'Bơi và lặn dưới nước',
    shortLabel: 'Bơi & lặn',
    description: 'Lặn sâu xuống làn nước trong vắt ngắm cá nhỏ và sủi bọt khí.',
    recommendedLocation: 'pool',
    energyDelta: -3,
    happinessDelta: 22,
    hungerDelta: -4,
    yuzuReward: 2,
    accentColor: '#0EA5E9',
  },
  {
    id: 'balloon',
    label: 'Chơi với bóng bay',
    shortLabel: 'Chơi bóng bay',
    description: 'Tâng những quả bóng bay rực rỡ lên không trung đầy hào hứng.',
    recommendedLocation: 'amusement_park',
    energyDelta: -3,
    happinessDelta: 24,
    hungerDelta: -2,
    accentColor: '#F472B6',
  },
  {
    id: 'sleep_teddy',
    label: 'Ôm gấu bông khi ngủ',
    shortLabel: 'Ôm gấu bông',
    description: 'Ôm chặt chú gấu bông mềm mại ngủ ngon lành ấm áp.',
    recommendedLocation: 'home',
    energyDelta: 42,
    happinessDelta: 18,
    hungerDelta: -2,
    accentColor: '#FBBF24',
  },
  {
    id: 'selfie',
    label: 'Chụp ảnh selfie',
    shortLabel: 'Chụp selfie',
    description: 'Tạo dáng dễ thương trước ống kính với ánh đèn flash lấp lánh.',
    recommendedLocation: 'campsite',
    energyDelta: 0,
    happinessDelta: 20,
    hungerDelta: 0,
    yuzuReward: 1,
    accentColor: '#FDE047',
  },
  {
    id: 'arcade_game',
    label: 'Chơi máy điện tử',
    shortLabel: 'Chơi điện tử',
    description: 'Trổ tài phá đảo máy thùng cổ điển và rinh thêm quýt thưởng.',
    recommendedLocation: 'home',
    energyDelta: -4,
    happinessDelta: 25,
    hungerDelta: -3,
    yuzuReward: 2,
    accentColor: '#4ADE80',
  },
];

export const FOOD_ITEMS: FoodItemDefinition[] = [
  {
    id: 'carrot',
    name: 'Cà rốt tươi',
    description: 'Giòn ngọt thanh mát, giúp Capybara no bụng nhanh chóng.',
    cost: 5,
    hungerGain: 25,
    energyGain: 10,
    happinessGain: 6,
    accentColor: '#F97316',
  },
  {
    id: 'yuzu_sweet',
    name: 'Quýt Yuzu ngọt',
    description: 'Món khoái khẩu giúp tinh thần Capybara phấn chấn tức thì.',
    cost: 8,
    hungerGain: 18,
    energyGain: 12,
    happinessGain: 22,
    accentColor: '#FBBF24',
  },
  {
    id: 'watermelon',
    name: 'Dưa hấu mát lạnh',
    description: 'Giải nhiệt sau khi bơi lội và hồi phục nhiều năng lượng.',
    cost: 12,
    hungerGain: 32,
    energyGain: 18,
    happinessGain: 16,
    accentColor: '#FB7185',
  },
  {
    id: 'bamboo_salad',
    name: 'Salad tre non',
    description: 'Bữa ăn giàu dinh dưỡng giúp giữ độ no rất lâu.',
    cost: 15,
    hungerGain: 42,
    energyGain: 22,
    happinessGain: 12,
    accentColor: '#34D399',
  },
  {
    id: 'mochi',
    name: 'Bánh Mochi đậu đỏ',
    description: 'Tráng miệng thượng hạng hồi mạnh cả năng lượng lẫn niềm vui.',
    cost: 18,
    hungerGain: 28,
    energyGain: 32,
    happinessGain: 28,
    accentColor: '#F472B6',
  },
];

export const HOME_ITEMS: HomeItemDefinition[] = [
  {
    id: 'tatami',
    name: 'Chiếu Tatami ấm',
    description: 'Thảm cói truyền thống trải giữa phòng cho Capybara nằm thư giãn.',
    cost: 0,
    accentColor: '#A3B18A',
  },
  {
    id: 'tea_table',
    name: 'Bàn trà Yuzu',
    description: 'Bàn gỗ thấp bày ấm trà nóng và đĩa quýt thơm lừng.',
    cost: 22,
    accentColor: '#D97706',
  },
  {
    id: 'lantern',
    name: 'Đèn lồng giấy',
    description: 'Ánh sáng vàng dịu nhẹ giúp căn nhà luôn ấm cúng vào ban đêm.',
    cost: 30,
    accentColor: '#FCD34D',
  },
  {
    id: 'plush_bed',
    name: 'Giường đệm êm',
    description: 'Nệm bông dày giúp giấc ngủ trưa hồi thêm +10 Năng lượng.',
    cost: 42,
    accentColor: '#38BDF8',
  },
  {
    id: 'bonsai',
    name: 'Chậu Bonsai mini',
    description: 'Cây xanh phong thủy mang hơi thở khu rừng vào trong nhà.',
    cost: 35,
    accentColor: '#10B981',
  },
];

export function clampStat(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

export function hasWellFedBuff(needs: CapybaraNeeds): boolean {
  return needs.hunger >= 70 && needs.happiness >= 60;
}

export function createDefaultFoodInventory(): Record<FoodId, number> {
  return {
    carrot: 2,
    yuzu_sweet: 2,
    watermelon: 0,
    mochi: 0,
    bamboo_salad: 0,
  };
}

export interface EnvironmentalInteractionMeta {
  id: EnvironmentalActionId;
  title: string;
  shortLabel: string;
  summary: string;
  detailedAction: string;
  recommendedArea: WorldLocationId;
  energyDelta: number;
  happinessDelta: number;
  hungerDelta: number;
  accentColor: string;
}

export const ENVIRONMENTAL_INTERACTIONS: EnvironmentalInteractionMeta[] = [
  {
    id: 'swim_water',
    title: 'Bơi trong nước',
    shortLabel: 'Bơi trong nước',
    summary: 'Đầm mình xuống dòng nước mát với gợn sóng lan tỏa.',
    detailedAction:
      'Capybara bước xuống mặt nước trong xanh ở Hồ bơi hoặc Đảo biển, ngập nửa thân êm ái, đạp bốn chân nhịp nhàng tạo những vòng sóng tròn lăn tăn, bọt khí nổi lên và tia nước bắn tung tóe mát lạnh.',
    recommendedArea: 'pool',
    energyDelta: -2,
    happinessDelta: 20,
    hungerDelta: -3,
    accentColor: '#38BDF8',
  },
  {
    id: 'chew_grass',
    title: 'Nhai cỏ xanh',
    shortLabel: 'Nhai cỏ xanh',
    summary: 'Cúi đầu gặm cụm cỏ non tươi ngon giữa vườn tre.',
    detailedAction:
      'Capybara tiến tới khóm cỏ xanh non mơn mởn trong Khu rừng hoặc Rừng bí ẩn, cúi mũi ngửi nhẹ rồi nhai chóp chép từng cọng cỏ giòn ngọt khiến hai tai rung rung và má phồng dễ thương, hồi phục nhẹ Độ no.',
    recommendedArea: 'forest',
    energyDelta: 6,
    happinessDelta: 12,
    hungerDelta: 18,
    accentColor: '#4ADE80',
  },
  {
    id: 'rest_shade',
    title: 'Tìm chỗ râm nghỉ ngơi',
    shortLabel: 'Tìm chỗ râm',
    summary: 'Nằm cuộn tròn dưới bóng cây cổ thụ hoặc dù mát tránh nắng.',
    detailedAction:
      'Khi nắng lên cao, Capybara tìm đến vùng bóng râm dịu mát dưới tán cây tre, rừng bí ẩn hoặc dù bãi biển, khép hờ đôi mắt, gối đầu lên hai chân trước và đánh một giấc ngắn khò khò đầy thư thái.',
    recommendedArea: 'forest',
    energyDelta: 26,
    happinessDelta: 14,
    hungerDelta: -1,
    accentColor: '#A78BFA',
  },
];

export function createDefaultSideQuests(): SideQuestItem[] {
  return [
    {
      id: 'find_fruit',
      title: 'Tìm Trái Cây Quý',
      description:
        'Điều khiển Capybara đến gần 3 trái Dưa hấu & Quýt rừng mọc trong khu vực ngoài trời rồi nhấn Tương tác (hoặc chạm trực tiếp) để thu hoạch.',
      target: 3,
      progress: 0,
      rewardYuzu: 25,
      rewardFood: 'watermelon',
      claimed: false,
    },
    {
      id: 'befriend_bird_duck',
      title: 'Kết Bạn Vịt Suối & Chim Sơn Ca',
      description:
        'Tiếp cận chú Vịt Suối hoặc Chim Sơn Ca đang dạo chơi trong bản đồ và bấm Tương tác để trò chuyện, làm quen 2 lần.',
      target: 2,
      progress: 0,
      rewardYuzu: 30,
      claimed: false,
    },
    {
      id: 'catch_fish',
      title: 'Câu Cá Bờ Suối',
      description:
        'Ghé Hồ bơi & Câu cá (hoặc Đảo biển), thả cần câu ở bến gỗ và kéo lên 2 chú cá hoặc kho báu suối.',
      target: 2,
      progress: 0,
      rewardYuzu: 35,
      rewardFood: 'bamboo_salad',
      claimed: false,
    },
  ];
}

export interface IngredientMeta {
  id: IngredientId;
  name: string;
  sourceHint: string;
  accentColor: string;
  costYuzu: number;
}

export const INGREDIENTS_META: IngredientMeta[] = [
  {
    id: 'glow_mushroom',
    name: 'Nấm Phát Sáng',
    sourceHint: 'Thu thập tại Rừng phát sáng hoặc hái nấm trong rừng',
    accentColor: '#2DD4BF',
    costYuzu: 6,
  },
  {
    id: 'ice_crystal',
    name: 'Pha Lê Băng',
    sourceHint: 'Khai thác trong Hang pha lê ở Núi băng',
    accentColor: '#38BDF8',
    costYuzu: 7,
  },
  {
    id: 'sea_pearl',
    name: 'Ngọc Trai Biển',
    sourceHint: 'Tìm tại Thành phố dưới biển Đại dương',
    accentColor: '#FDE047',
    costYuzu: 8,
  },
  {
    id: 'candy_sugar',
    name: 'Đường Kẹo Ngọt',
    sourceHint: 'Thu hoạch bên Sông Sô-cô-la Hành tinh kẹo',
    accentColor: '#F472B6',
    costYuzu: 7,
  },
  {
    id: 'meteor_stone',
    name: 'Đá Thiên Thạch',
    sourceHint: 'Bay Phi thuyền thu thập hoặc mở Kho báu Nửa đêm',
    accentColor: '#A855F7',
    costYuzu: 12,
  },
];

export interface CraftingRecipeMeta {
  id: CraftedItemId;
  name: string;
  description: string;
  effectSummary: string;
  accentColor: string;
  ingredients: Partial<Record<IngredientId, number>>;
}

export const CRAFTING_RECIPES: CraftingRecipeMeta[] = [
  {
    id: 'fur_potion',
    name: 'Thuốc Đổi Màu Lông',
    description: 'Pha chế từ Nấm phát sáng, Pha lê băng và Đường kẹo ngọt.',
    effectSummary: 'Uống vào để nhuộm màu lông phép thuật lấp lánh tùy sắc độ!',
    accentColor: '#C084FC',
    ingredients: { glow_mushroom: 1, ice_crystal: 1, candy_sugar: 1 },
  },
  {
    id: 'floating_balloons',
    name: 'Bong Bóng Bay',
    description: 'Kết hợp Ngọc trai biển, Đường kẹo ngọt và Đá thiên thạch.',
    effectSummary: 'Buộc chùm bóng bay bảy sắc lơ lửng theo Capybara khi khám phá & chạy.',
    accentColor: '#F472B6',
    ingredients: { sea_pearl: 1, candy_sugar: 1, meteor_stone: 1 },
  },
  {
    id: 'glowing_food',
    name: 'Thức Ăn Phát Sáng',
    description: 'Nấu từ Nấm phát sáng, Ngọc trai biển và Pha lê băng.',
    effectSummary: 'Hồi +35% No, +25% NL, +30% Vui và phát sáng sinh học rực rỡ 3 phút!',
    accentColor: '#2DD4BF',
    ingredients: { glow_mushroom: 2, sea_pearl: 1, ice_crystal: 1 },
  },
];

export interface CastleTierMeta {
  level: number;
  name: string;
  description: string;
  costYuzu: number;
  costMeteor: number;
}

export const CASTLE_TIERS: CastleTierMeta[] = [
  {
    level: 0,
    name: 'Bãi Đất Hoàng Gia',
    description: 'Vua & Hoàng hậu Capybara đang chuẩn bị đặt viên gạch đầu tiên.',
    costYuzu: 0,
    costMeteor: 0,
  },
  {
    level: 1,
    name: 'Tháp Canh Quýt Vàng',
    description: 'Tòa tháp đá trắng mái ngói xanh cùng cờ hiệu Vương quốc Capybara.',
    costYuzu: 30,
    costMeteor: 0,
  },
  {
    level: 2,
    name: 'Pháo Đài Hoàng Gia',
    description: 'Hai tháp canh đôi, cổng vòm đá quý và sân vườn rực đèn hoa.',
    costYuzu: 60,
    costMeteor: 1,
  },
  {
    level: 3,
    name: 'Đại Lâu Đài Pha Lê',
    description: 'Cung điện nguy nga 3 ngọn tháp dát vàng rực rỡ khắp bản đồ.',
    costYuzu: 100,
    costMeteor: 2,
  },
];

export interface KingdomCitizenMeta {
  id: CitizenId;
  name: string;
  role: string;
  costYuzu: number;
  shirtColor: string;
  quote: string;
}

export const KINGDOM_CITIZENS: KingdomCitizenMeta[] = [
  {
    id: 'baker_capy',
    name: 'Bếp Trưởng Bánh Quýt',
    role: 'Thợ làm bánh Hoàng gia',
    costYuzu: 18,
    shirtColor: '#F59E0B',
    quote: 'Bánh quýt nóng hổi vừa ra lò!',
  },
  {
    id: 'knight_capy',
    name: 'Hiệp Sĩ Sen Xanh',
    role: 'Vệ binh Lâu đài',
    costYuzu: 22,
    shirtColor: '#38BDF8',
    quote: 'Bảo vệ Vua & Hoàng hậu hết mình!',
  },
  {
    id: 'musician_capy',
    name: 'Nghệ Sĩ Đàn Tranh',
    role: 'Nhạc công Cung đình',
    costYuzu: 20,
    shirtColor: '#F472B6',
    quote: 'Nghe một khúc nhạc thư giãn nhé ♪',
  },
  {
    id: 'mage_capy',
    name: 'Pháp Sư Đom Đóm',
    role: 'Nhà giả kim Vương quốc',
    costYuzu: 26,
    shirtColor: '#A855F7',
    quote: 'Ánh sáng phép thuật ban phước!',
  },
  {
    id: 'gardener_capy',
    name: 'Người Làm Vườn Tre',
    role: 'Chăm vườn Hoa & Quýt',
    costYuzu: 16,
    shirtColor: '#34D399',
    quote: 'Vườn quýt hôm nay sai trĩu quả!',
  },
  {
    id: 'astronomer_capy',
    name: 'Nhà Thiên Văn Sao',
    role: 'Quan sát Phi thuyền',
    costYuzu: 28,
    shirtColor: '#6366F1',
    quote: 'Đêm nay có mưa sao băng đó!',
  },
];

export interface KingdomFestivalMeta {
  id: FestivalId;
  name: string;
  description: string;
  costYuzu: number;
  rewardYuzu: number;
  accentColor: string;
}

export const KINGDOM_FESTIVALS: KingdomFestivalMeta[] = [
  {
    id: 'yuzu_lantern',
    name: 'Lễ Hội Hoa Đăng Quýt',
    description: 'Thả trăm chiếc đèn lồng bay lên bầu trời Vương quốc.',
    costYuzu: 15,
    rewardYuzu: 24,
    accentColor: '#FBBF24',
  },
  {
    id: 'royal_banquet',
    name: 'Đại Tiệc Cung Đình',
    description: 'Vua & Hoàng hậu khao tiệc cư dân cùng pháo hoa rực rỡ.',
    costYuzu: 25,
    rewardYuzu: 38,
    accentColor: '#F43F5E',
  },
  {
    id: 'starlight_carnival',
    name: 'Lễ Hội Ánh Sao Vũ Trụ',
    description: 'Đốt pháo hoa bảy sắc và tặng nguyên liệu ngẫu nhiên!',
    costYuzu: 30,
    rewardYuzu: 45,
    accentColor: '#A855F7',
  },
];

export interface ExoticCreatureMeta {
  id: string;
  name: string;
  rarity: string;
  description: string;
  color: string;
  rewardYuzu: number;
}

export const EXOTIC_CREATURES: ExoticCreatureMeta[] = [
  {
    id: 'crystal_jelly',
    name: 'Sứa Pha Lê Bay',
    rarity: 'Kỳ bí',
    description: 'Sinh vật trong suốt trôi nổi giữa Dị Giới và ngân vang tiếng chuông thủy tinh.',
    color: '#67E8F9',
    rewardYuzu: 12,
  },
  {
    id: 'nebula_fox',
    name: 'Cáo Tinh Vân Hai Đuôi',
    rarity: 'Huyền thoại',
    description: 'Bộ lông dệt từ bụi sao tím hồng chưa từng xuất hiện ở thế giới thường.',
    color: '#E879F9',
    rewardYuzu: 15,
  },
  {
    id: 'prism_turtle',
    name: 'Rùa Lăng Kính Cổ',
    rarity: 'Hiếm',
    description: 'Chiếc mai phản chiếu cầu vồng bảy sắc giúp dẫn đường qua cổng không gian.',
    color: '#34D399',
    rewardYuzu: 12,
  },
  {
    id: 'lantern_snail',
    name: 'Ốc Sên Đèn Lồng',
    rarity: 'Đặc biệt',
    description: 'Mang chiếc vỏ phát sáng như ngọn hải đăng giữa tinh vân đảo ngược.',
    color: '#FDE047',
    rewardYuzu: 10,
  },
  {
    id: 'cloud_whale',
    name: 'Cá Voi Mây Bạc',
    rarity: 'Cực hiếm',
    description: 'Bơi lội thong dong trên bầu trời Dị Giới và rắc bụi sao may mắn.',
    color: '#93C5FD',
    rewardYuzu: 18,
  },
];

export function createDefaultIngredients(): Record<IngredientId, number> {
  return {
    glow_mushroom: 1,
    ice_crystal: 1,
    sea_pearl: 0,
    candy_sugar: 1,
    meteor_stone: 0,
  };
}

export function createDefaultCraftedItems(): Record<CraftedItemId, number> {
  return {
    fur_potion: 0,
    floating_balloons: 0,
    glowing_food: 0,
  };
}

export function createDefaultKingdom(): KingdomState {
  return {
    castleLevel: 0,
    citizens: ['baker_capy'],
    festivalsHeld: 0,
    activeFestivalUntil: 0,
    activeFestivalId: null,
  };
}


