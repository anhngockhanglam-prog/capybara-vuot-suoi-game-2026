import { SkillDefinition, SkillId } from './types';

export const BOSS_SKILLS: SkillDefinition[] = [
  {
    id: 'yuzu_shot',
    name: 'Bắn Quýt Năng Lượng',
    roleLabel: 'Đòn cơ bản · Miễn phí',
    description: 'Phóng trái quýt xoay tròn tấn công Boss từ xa.',
    detailedEffect:
      'Bắn 1 trái quýt năng lượng bay ngang với tốc độ cao về phía Boss, gây 14 sát thương khi trúng đích. Thời gian hồi cực ngắn (0.35 giây), có thể vừa chạy vừa bắn liên tục.',
    tacticalTip:
      'Giữ nhịp bấm phím J liên tục trong lúc né đòn bằng A/D và nhảy W/L để rỉa máu Boss ổn định.',
    cost: 0,
    cooldown: 0.35,
    damage: 14,
    hotkey: 'J',
    accentColor: '#F97316',
  },
  {
    id: 'onsen_wave',
    name: 'Sóng Thần Suối Khoáng',
    roleLabel: 'Xuyên đạn · Đẩy lùi',
    description: 'Đẩy làn sóng nước nóng xuyên phá đạn Boss và gây sát thương mạnh.',
    detailedEffect:
      'Phóng ra một cột sóng suối khoáng lớn lướt dọc mặt đất, phá hủy mọi đạn ớt và đạn nước trên đường đi đồng thời xuyên trúng Boss gây 42 sát thương. Hồi chiêu 5.0 giây.',
    tacticalTip:
      'Kích hoạt phím K ngay khi Boss bắn loạt đạn dày đặc để vừa dọn sạch đạn vừa phản công.',
    cost: 30,
    cooldown: 5.0,
    damage: 42,
    hotkey: 'K',
    accentColor: '#38BDF8',
  },
  {
    id: 'lotus_shield',
    name: 'Lá Sen Hộ Thể',
    roleLabel: 'Phòng thủ · Hồi phục',
    description: 'Tạo lớp khiên bảo vệ chặn 1 đòn Boss và hồi nhẹ nhịp thở.',
    detailedEffect:
      'Bao bọc Capybara bằng khiên lá sen giúp chặn hoàn toàn 1 lần va chạm hoặc đạn Boss kế tiếp. Nếu chưa đầy tim, chiêu thức còn hồi ngay +1 tim sinh lực. Hồi chiêu 8.5 giây.',
    tacticalTip:
      'Dùng phím I trước khi Boss lao tới hoặc khi chỉ còn 1–2 tim để bảo toàn mạng sống.',
    cost: 45,
    cooldown: 8.5,
    damage: 0,
    hotkey: 'I',
    accentColor: '#10B981',
  },
  {
    id: 'yuzu_meteor',
    name: 'Mưa Quýt Vàng',
    roleLabel: 'Tuyệt kỹ · Dồn sát thương',
    description: 'Triệu hồi 5 trái quýt vàng khổng lồ giáng xuống đầu Boss.',
    detailedEffect:
      'Gọi 5 thiên thạch quýt vàng rơi từ trên cao xuống vị trí Boss theo diện rộng, gây tổng cộng 85 sát thương bùng nổ (từng quả gây sát thương khi chạm mục tiêu). Hồi chiêu 11.0 giây.',
    tacticalTip:
      'Bấm phím U ngay khi Boss vừa dừng pha lao nhanh để cả 5 trái quýt rơi trúng trọn vẹn.',
    cost: 75,
    cooldown: 11.0,
    damage: 85,
    hotkey: 'U',
    accentColor: '#FBBF24',
  },
  {
    id: 'bamboo_storm',
    name: 'Bão Lá Trúc',
    roleLabel: 'Liên hoàn · Xuyên mục tiêu',
    description: 'Phóng 3 phi tiêu lá trúc xanh bay hình quạt chém xuyên Boss.',
    detailedEffect:
      'Bắn cùng lúc 3 phi tiêu lá trúc tỏa theo hình quạt với tốc độ cực cao, xuyên phá Boss gây tổng 48 sát thương (16 HP mỗi lá). Hồi chiêu 4.5 giây.',
    tacticalTip:
      'Bấm phím O ở cự ly trung bình để cả 3 phi tiêu lá trúc cùng găm trúng Boss một lúc.',
    cost: 60,
    cooldown: 4.5,
    damage: 48,
    hotkey: 'O',
    accentColor: '#22C55E',
  },
  {
    id: 'thunder_yuzu',
    name: 'Sét Quýt Thiên Lôi',
    roleLabel: 'Chuẩn xác · Bùng nổ',
    description: 'Giáng tia sét vàng rực thẳng xuống vị trí Boss đang đứng.',
    detailedEffect:
      'Khóa mục tiêu ngay trên đầu Boss và phóng tia sét quýt thiên lôi đánh thẳng xuống gây 72 sát thương tức thì, không lo bắn hụt. Hồi chiêu 7.5 giây.',
    tacticalTip:
      'Kích hoạt phím Y khi Boss chạy nhanh hoặc bay lượn ở xa để đánh trúng 100%.',
    cost: 95,
    cooldown: 7.5,
    damage: 72,
    hotkey: 'Y',
    accentColor: '#A855F7',
  },
  {
    id: 'cherry_heal',
    name: 'Hoa Anh Đào Tái Tạo',
    roleLabel: 'Thanh tẩy · Hồi 1 Tim',
    description: 'Xóa sạch toàn bộ đạn Boss trên màn hình và hồi ngay +1 Tim.',
    detailedEffect:
      'Tạo cơn lốc cánh hoa anh đào quét sạch mọi đạn ớt, sóng nước của Boss đang bay, đồng thời hồi phục +1 tim sinh lực và 1.5s bất tử. Hồi chiêu 10.0 giây.',
    tacticalTip:
      'Giữ phím B cho tình huống nguy cấp bị kẹt giữa mưa đạn để lật ngược thế cờ.',
    cost: 110,
    cooldown: 10.0,
    damage: 0,
    hotkey: 'B',
    accentColor: '#F472B6',
  },
];

export function getSkillDef(id: SkillId): SkillDefinition {
  return BOSS_SKILLS.find((s) => s.id === id) ?? BOSS_SKILLS[0];
}
