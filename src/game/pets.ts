import { PetDefinition, PetId } from './types';

export const PET_OPTIONS: PetDefinition[] = [
  {
    id: 'none',
    name: 'Không mang thú cưng',
    species: 'Một mình tự tại',
    supportTitle: 'Không có hỗ trợ',
    description: 'Chạy bộ thư giãn cùng chú Capybara trên dòng suối xanh.',
    cost: 0,
    goldenYuzuBonus: 0,
    scoreBonusPct: 0,
    feverBonusPct: 0,
    autoCollectRadius: 0,
    itemDurationBonusPct: 0,
    accentColor: '#64748B',
    favoriteFoodLabel: 'Quýt tươi',
  },
  {
    id: 'duckling',
    name: 'Vịt Vàng Onsen',
    species: 'Vịt con lạch bạch',
    supportTitle: 'Tự động nhặt quýt gần (135px)',
    description:
      'Chú vịt vàng nhỏ chạy lon ton theo sau, chủ động lao đi tự động thu thập quýt ở gần Capybara và tăng 10% điểm nhặt quýt.',
    cost: 25,
    goldenYuzuBonus: 0.06,
    scoreBonusPct: 10,
    feverBonusPct: 0,
    autoCollectRadius: 135,
    itemDurationBonusPct: 0,
    accentColor: '#FACC15',
    favoriteFoodLabel: 'Hạt bắp & Quýt',
  },
  {
    id: 'frog',
    name: 'Ếch Cốm Rừng Tre',
    species: 'Ếch xanh đội lá',
    supportTitle: 'Tăng +50% thời gian hiệu ứng vật phẩm',
    description:
      'Chú ếch tinh nghịch nhảy theo từng bước chạy, kéo dài +50% thời lượng Nam châm, Suối nước nóng & Khiên, đồng thời tăng mạnh Quýt Vàng.',
    cost: 40,
    goldenYuzuBonus: 0.09,
    scoreBonusPct: 5,
    feverBonusPct: 0,
    autoCollectRadius: 0,
    itemDurationBonusPct: 50,
    accentColor: '#4ADE80',
    favoriteFoodLabel: 'Bánh cốm & Chuồn chuồn',
  },
  {
    id: 'turtle',
    name: 'Rùa Con Suối Mát',
    species: 'Rùa mai ngọc',
    supportTitle: 'Tặng Khiên Khăn đầu trận & +35% thời gian vật phẩm',
    description:
      'Bé rùa mai ngọc bảo vệ Capybara bằng Khiên Khăn ngay khi xuất phát, kéo dài +35% hiệu ứng vật phẩm và nạp nhanh thanh Chill +25%.',
    cost: 55,
    goldenYuzuBonus: 0.05,
    scoreBonusPct: 5,
    feverBonusPct: 25,
    autoCollectRadius: 0,
    itemDurationBonusPct: 35,
    startsWithShield: true,
    accentColor: '#2DD4BF',
    favoriteFoodLabel: 'Salad tre non',
  },
  {
    id: 'shiba',
    name: 'Cún Shiba Trà Sữa',
    species: 'Shiba Inu mini',
    supportTitle: 'Nhặt quýt gần (100px) & +25% thời gian vật phẩm',
    description:
      'Chú cún Shiba lanh lợi chạy sát bên Capybara, vừa hỗ trợ tự động gom quýt gần đó vừa kéo dài +25% thời gian vật phẩm và cộng 12% điểm quýt.',
    cost: 70,
    goldenYuzuBonus: 0.07,
    scoreBonusPct: 12,
    feverBonusPct: 10,
    autoCollectRadius: 100,
    itemDurationBonusPct: 25,
    accentColor: '#FB923C',
    favoriteFoodLabel: 'Bánh mochi & Quýt ngọt',
  },
  {
    id: 'otter',
    name: 'Rái Cá Sông Bạc',
    species: 'Rái cá ôm vỏ sò',
    supportTitle: 'Tự động nhặt quýt (120px) & +15% điểm quýt',
    description:
      'Chú rái cá tinh nhanh trượt sóng theo Capybara, tự nhặt quýt trong bán kính 120px và cộng thêm 15% điểm cho mỗi quả quýt.',
    cost: 80,
    goldenYuzuBonus: 0.08,
    scoreBonusPct: 15,
    feverBonusPct: 10,
    autoCollectRadius: 120,
    itemDurationBonusPct: 15,
    accentColor: '#94A3B8',
    favoriteFoodLabel: 'Cá suối & Dưa hấu',
  },
  {
    id: 'red_panda',
    name: 'Gấu Trúc Đỏ',
    species: 'Gấu mèo đỏ đuôi sọc',
    supportTitle: 'Tăng +40% thời gian vật phẩm & +20% nạp Chill',
    description:
      'Bé gấu trúc đỏ đuôi xù bám sát phía sau, kéo dài +40% thời lượng Nam châm & Khiên và giúp thanh Chill đầy nhanh hơn 20%.',
    cost: 90,
    goldenYuzuBonus: 0.09,
    scoreBonusPct: 8,
    feverBonusPct: 20,
    autoCollectRadius: 0,
    itemDurationBonusPct: 40,
    accentColor: '#EA580C',
    favoriteFoodLabel: 'Măng non & Quýt mật',
  },
  {
    id: 'alpaca',
    name: 'Alpaca Bông Kem',
    species: 'Lạc đà cừu mini',
    supportTitle: '+11% Quýt Vàng & +45% thời gian vật phẩm',
    description:
      'Chú Alpaca lông xù bước nhún nhảy vui nhộn, mang lại tỷ lệ rơi Quýt Vàng cao vượt trội (+11%) và kéo dài hiệu ứng vật phẩm +45%.',
    cost: 105,
    goldenYuzuBonus: 0.11,
    scoreBonusPct: 10,
    feverBonusPct: 15,
    autoCollectRadius: 0,
    itemDurationBonusPct: 45,
    accentColor: '#FDE68A',
    favoriteFoodLabel: 'Cà rốt & Cỏ non',
  },
  {
    id: 'phoenix_chick',
    name: 'Phượng Hoàng Quýt',
    species: 'Chim lửa mini huyền thoại',
    supportTitle: 'Tặng Khiên đầu trận · Hút 115px · +12% Quýt Vàng',
    description:
      'Linh thú Phượng Hoàng Quýt rực lửa bay lượn bên Capybara, tặng Khiên đầu trận, tự nhặt quýt 115px và cộng 12% Quýt Vàng.',
    cost: 145,
    goldenYuzuBonus: 0.12,
    scoreBonusPct: 15,
    feverBonusPct: 25,
    autoCollectRadius: 115,
    itemDurationBonusPct: 30,
    startsWithShield: true,
    accentColor: '#F43F5E',
    favoriteFoodLabel: 'Quýt phát sáng & Mochi',
  },
];

export function getPetDef(id: PetId): PetDefinition {
  return PET_OPTIONS.find((p) => p.id === id) ?? PET_OPTIONS[0];
}

export function getPetEffectiveGoldenBonus(petId: PetId, bond: number): number {
  const def = getPetDef(petId);
  if (def.id === 'none') return 0;
  // Extra +1% at bond >= 45, +2% at bond >= 70
  const bondBonus = bond >= 70 ? 0.02 : bond >= 45 ? 0.01 : 0;
  return def.goldenYuzuBonus + bondBonus;
}

export function getPetAutoCollectRadius(petId: PetId, bond: number): number {
  const def = getPetDef(petId);
  if (def.autoCollectRadius <= 0) return 0;
  const bondBonus = bond >= 70 ? 30 : bond >= 45 ? 15 : 0;
  return def.autoCollectRadius + bondBonus;
}

export function getPetItemDurationMultiplier(petId: PetId, bond: number): number {
  const def = getPetDef(petId);
  if (def.id === 'none') return 1;
  if (def.itemDurationBonusPct <= 0) return 1;
  const bondExtraPct = bond >= 70 ? 15 : bond >= 45 ? 8 : 0;
  return 1 + (def.itemDurationBonusPct + bondExtraPct) / 100;
}
