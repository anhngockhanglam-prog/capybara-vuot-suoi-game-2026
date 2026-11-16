export type NameEffectKind =
  | 'none'
  | 'fire'
  | 'ice'
  | 'cosmic'
  | 'royal'
  | 'yuzu'
  | 'phantom'
  | 'candy'
  | 'ocean'
  | 'rainbow'
  | 'custom';

export interface NameEffectSpec {
  kind: NameEffectKind;
  title: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  glowRgba: string;
}

function normalizeVietnamese(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function hashNameHue(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 360;
}

export function resolveNameEffect(rawName: string): NameEffectSpec {
  const trimmed = rawName.trim();
  if (!trimmed) {
    return {
      kind: 'none',
      title: 'Chưa đặt tên',
      description: 'Đặt tên để mở khóa hào quang đặc biệt theo tên riêng!',
      primaryColor: '#FDE047',
      secondaryColor: '#34D399',
      glowRgba: 'rgba(253, 224, 71, 0)',
    };
  }

  const norm = normalizeVietnamese(trimmed);

  if (/\b(lua|hoa|rong|fire|flame|nang|sun|dragon|pyro|do)\b/.test(norm)) {
    return {
      kind: 'fire',
      title: 'Hào quang Hỏa Long',
      description: 'Tỏa tia lửa ấm rực rỡ và hào quang phượng hoàng quanh người.',
      primaryColor: '#FB923C',
      secondaryColor: '#FDE047',
      glowRgba: 'rgba(249, 115, 22, 0.34)',
    };
  }

  if (/\b(bang|tuyet|lanh|dong|ice|frost|snow|winter|pha le)\b/.test(norm)) {
    return {
      kind: 'ice',
      title: 'Hào quang Băng Giá',
      description: 'Bông tuyết pha lê xoay quanh và sương lạnh lấp lánh.',
      primaryColor: '#7DD3FC',
      secondaryColor: '#E0F2FE',
      glowRgba: 'rgba(56, 189, 248, 0.34)',
    };
  }

  if (/\b(sao|vu tru|galaxy|trang|dem|moon|star|cosmos|nova|thien ha)\b/.test(norm)) {
    return {
      kind: 'cosmic',
      title: 'Tinh Vân Vũ Trụ',
      description: 'Các vì sao vàng và tinh vân tím quay quanh Capybara.',
      primaryColor: '#C084FC',
      secondaryColor: '#FEF08A',
      glowRgba: 'rgba(168, 85, 247, 0.34)',
    };
  }

  if (/\b(vua|hoang|chua|king|queen|royal|boss|prince|princess|vip|dai de)\b/.test(norm)) {
    return {
      kind: 'royal',
      title: 'Uy Nghi Hoàng Gia',
      description: 'Ánh kim vương giả và vầng sáng vàng lấp lánh trên đỉnh đầu.',
      primaryColor: '#FBBF24',
      secondaryColor: '#FEF9C3',
      glowRgba: 'rgba(251, 191, 36, 0.36)',
    };
  }

  if (/\b(quyt|cam|yuzu|mochi|vang|gold|suoi)\b/.test(norm)) {
    return {
      kind: 'yuzu',
      title: 'Phúc Lộc Quýt Vàng',
      description: 'Lá xanh & tinh chất quýt tươi tỏa hương dịu quanh thân.',
      primaryColor: '#F59E0B',
      secondaryColor: '#4ADE80',
      glowRgba: 'rgba(245, 158, 11, 0.32)',
    };
  }

  if (/\b(ma|hon|bong|toi|ghost|phantom|shadow|spirit|linh)\b/.test(norm)) {
    return {
      kind: 'phantom',
      title: 'Linh Hồn Huyền Ảo',
      description: 'Đốm lửa ma trơi xanh ngọc bồng bềnh dịu mắt.',
      primaryColor: '#5EEAD4',
      secondaryColor: '#A7F3D0',
      glowRgba: 'rgba(45, 212, 191, 0.32)',
    };
  }

  if (/\b(keo|ngot|banh|socola|candy|sweet|cake|sugar|chocolate|dau)\b/.test(norm)) {
    return {
      kind: 'candy',
      title: 'Đường Kẹo Ngọt Ngào',
      description: 'Hoa giấy kẹo sắc màu và tim hồng bay lơ lửng.',
      primaryColor: '#F472B6',
      secondaryColor: '#FBCFE8',
      glowRgba: 'rgba(244, 114, 182, 0.32)',
    };
  }

  if (/\b(bien|thuy|nuoc|song|ca|ocean|sea|aqua|water|san ho)\b/.test(norm)) {
    return {
      kind: 'ocean',
      title: 'Sóng Biển Long Lanh',
      description: 'Bọt bong bóng đại dương óng ánh nổi quanh Capybara.',
      primaryColor: '#38BDF8',
      secondaryColor: '#99F6E4',
      glowRgba: 'rgba(14, 165, 233, 0.32)',
    };
  }

  if (/\b(cau vong|rainbow|prism|sac mau)\b/.test(norm)) {
    return {
      kind: 'rainbow',
      title: 'Lăng Kính Cầu Vồng',
      description: 'Vòng hào quang 7 sắc cầu vồng chuyển màu mượt mà.',
      primaryColor: '#F43F5E',
      secondaryColor: '#38BDF8',
      glowRgba: 'rgba(244, 114, 182, 0.3)',
    };
  }

  const hue = hashNameHue(norm);
  const hue2 = (hue + 52) % 360;
  return {
    kind: 'custom',
    title: `Hào quang riêng (${trimmed})`,
    description: `Mỗi tên riêng tạo sắc ánh sáng độc bản (${hue}°) & hạt sao bay quanh.`,
    primaryColor: `hsl(${hue}, 86%, 64%)`,
    secondaryColor: `hsl(${hue2}, 90%, 76%)`,
    glowRgba: `hsla(${hue}, 88%, 62%, 0.3)`,
  };
}
