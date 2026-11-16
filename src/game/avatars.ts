export interface PresetAvatar {
  id: string;
  name: string;
  dataUrl: string;
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'classic_mochi',
    name: 'Mochi Cổ Điển',
    dataUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <defs>
          <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1E3A2F"/>
            <stop offset="100%" stop-color="#3F7D58"/>
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="18" fill="url(#bg1)"/>
        <ellipse cx="48" cy="56" rx="28" ry="23" fill="#B5835A"/>
        <ellipse cx="30" cy="36" rx="7" ry="8" fill="#8C5E3C"/>
        <ellipse cx="66" cy="36" rx="7" ry="8" fill="#8C5E3C"/>
        <ellipse cx="48" cy="60" rx="17" ry="12" fill="#8C5E3C"/>
        <circle cx="37" cy="49" r="3.2" fill="#1F1610"/>
        <circle cx="59" cy="49" r="3.2" fill="#1F1610"/>
        <circle cx="38" cy="48" r="1.1" fill="#FFF"/>
        <circle cx="60" cy="48" r="1.1" fill="#FFF"/>
        <ellipse cx="32" cy="56" rx="4.5" ry="2.4" fill="#FDA4AF" opacity="0.7"/>
        <ellipse cx="64" cy="56" rx="4.5" ry="2.4" fill="#FDA4AF" opacity="0.7"/>
        <ellipse cx="48" cy="57" rx="4.5" ry="3" fill="#2A1D15"/>
        <circle cx="48" cy="24" r="9.5" fill="#F59E0B"/>
        <ellipse cx="51" cy="14" rx="5" ry="2.4" fill="#16A34A"/>
      </svg>
    `),
  },
  {
    id: 'onsen_towel',
    name: 'Onsen Thư Giãn',
    dataUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <defs>
          <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0C4A6E"/>
            <stop offset="100%" stop-color="#38BDF8"/>
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="18" fill="url(#bg2)"/>
        <path d="M12 72 Q30 65 48 72 T84 72 L96 96 L0 96 Z" fill="#BAE6FD" opacity="0.5"/>
        <ellipse cx="48" cy="56" rx="27" ry="22" fill="#EAD7BB"/>
        <ellipse cx="31" cy="36" rx="6.5" ry="7.5" fill="#C4AD8E"/>
        <ellipse cx="65" cy="36" rx="6.5" ry="7.5" fill="#C4AD8E"/>
        <rect x="29" y="25" width="38" height="11" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
        <ellipse cx="48" cy="60" rx="16" ry="11" fill="#C4AD8E"/>
        <path d="M33 49 Q37 46 41 49" fill="none" stroke="#1F1610" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M55 49 Q59 46 63 49" fill="none" stroke="#1F1610" stroke-width="2.6" stroke-linecap="round"/>
        <ellipse cx="32" cy="56" rx="4.5" ry="2.4" fill="#FB7185" opacity="0.65"/>
        <ellipse cx="64" cy="56" rx="4.5" ry="2.4" fill="#FB7185" opacity="0.65"/>
        <ellipse cx="48" cy="57" rx="4" ry="2.6" fill="#2A1D15"/>
      </svg>
    `),
  },
  {
    id: 'royal_king',
    name: 'Vua Capybara',
    dataUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <defs>
          <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#451A03"/>
            <stop offset="100%" stop-color="#B45309"/>
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="18" fill="url(#bg3)"/>
        <ellipse cx="48" cy="58" rx="27" ry="22" fill="#FACC15"/>
        <ellipse cx="31" cy="39" rx="6.5" ry="7.5" fill="#CA8A04"/>
        <ellipse cx="65" cy="39" rx="6.5" ry="7.5" fill="#CA8A04"/>
        <polygon points="31,32 36,16 44,25 48,13 52,25 60,16 65,32" fill="#FDE047" stroke="#92400E" stroke-width="1.5"/>
        <circle cx="48" cy="24" r="3" fill="#EF4444"/>
        <ellipse cx="48" cy="61" rx="16" ry="11" fill="#CA8A04"/>
        <circle cx="38" cy="51" r="3" fill="#1F1610"/>
        <circle cx="58" cy="51" r="3" fill="#1F1610"/>
        <ellipse cx="48" cy="58" rx="4.2" ry="2.8" fill="#451A03"/>
      </svg>
    `),
  },
  {
    id: 'galaxy_capy',
    name: 'Capy Vũ Trụ',
    dataUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <defs>
          <linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0F172A"/>
            <stop offset="100%" stop-color="#581C87"/>
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="18" fill="url(#bg4)"/>
        <circle cx="18" cy="20" r="1.8" fill="#FDE047"/>
        <circle cx="78" cy="24" r="2.2" fill="#38BDF8"/>
        <circle cx="22" cy="72" r="1.5" fill="#F472B6"/>
        <ellipse cx="48" cy="55" rx="27" ry="22" fill="#4C1D95" stroke="#A78BFA" stroke-width="1.5"/>
        <ellipse cx="31" cy="36" rx="6.5" ry="7.5" fill="#2E1065"/>
        <ellipse cx="65" cy="36" rx="6.5" ry="7.5" fill="#2E1065"/>
        <circle cx="40" cy="40" r="1.6" fill="#FDE047"/>
        <circle cx="58" cy="43" r="1.4" fill="#38BDF8"/>
        <ellipse cx="48" cy="59" rx="16" ry="11" fill="#2E1065"/>
        <circle cx="38" cy="49" r="3" fill="#E0F2FE"/>
        <circle cx="58" cy="49" r="3" fill="#E0F2FE"/>
        <ellipse cx="48" cy="56" rx="4.2" ry="2.8" fill="#0F172A"/>
      </svg>
    `),
  },
  {
    id: 'sakura_chill',
    name: 'Capy Hoa Đào',
    dataUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <defs>
          <linearGradient id="bg5" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#831843"/>
            <stop offset="100%" stop-color="#F472B6"/>
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="18" fill="url(#bg5)"/>
        <ellipse cx="48" cy="56" rx="27" ry="22" fill="#D49A6A"/>
        <ellipse cx="31" cy="37" rx="6.5" ry="7.5" fill="#A6744E"/>
        <ellipse cx="65" cy="37" rx="6.5" ry="7.5" fill="#A6744E"/>
        <circle cx="62" cy="32" r="7" fill="#FBCFE8"/>
        <circle cx="62" cy="32" r="2.8" fill="#FACC15"/>
        <ellipse cx="48" cy="60" rx="16" ry="11" fill="#A6744E"/>
        <circle cx="38" cy="50" r="3" fill="#1F1610"/>
        <circle cx="58" cy="50" r="3" fill="#1F1610"/>
        <ellipse cx="32" cy="56" rx="4.5" ry="2.4" fill="#FB7185" opacity="0.75"/>
        <ellipse cx="64" cy="56" rx="4.5" ry="2.4" fill="#FB7185" opacity="0.75"/>
        <ellipse cx="48" cy="57" rx="4.2" ry="2.8" fill="#2A1D15"/>
      </svg>
    `),
  },
  {
    id: 'ice_explorer',
    name: 'Capy Băng Tuyết',
    dataUrl: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
        <defs>
          <linearGradient id="bg6" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0F766E"/>
            <stop offset="100%" stop-color="#7DD3FC"/>
          </linearGradient>
        </defs>
        <rect width="96" height="96" rx="18" fill="url(#bg6)"/>
        <ellipse cx="48" cy="57" rx="27" ry="22" fill="#BAE6FD"/>
        <ellipse cx="31" cy="38" rx="6.5" ry="7.5" fill="#0284C7"/>
        <ellipse cx="65" cy="38" rx="6.5" ry="7.5" fill="#0284C7"/>
        <rect x="26" y="70" width="44" height="10" rx="5" fill="#EF4444"/>
        <ellipse cx="48" cy="60" rx="16" ry="11" fill="#7DD3FC"/>
        <circle cx="38" cy="50" r="3" fill="#0F172A"/>
        <circle cx="58" cy="50" r="3" fill="#0F172A"/>
        <ellipse cx="48" cy="57" rx="4.2" ry="2.8" fill="#0369A1"/>
      </svg>
    `),
  },
];

export const DEFAULT_AVATAR_URL = PRESET_AVATARS[0].dataUrl;

export async function resizeUploadedAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP).');
  }
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Không thể đọc dữ liệu ảnh.'));
    };
    reader.onerror = () => reject(new Error('Đọc ảnh thất bại.'));
    reader.readAsDataURL(file);
  });

  return await new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Không thể xử lý ảnh trên trình duyệt.'));
        return;
      }
      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => reject(new Error('Ảnh không hợp lệ hoặc bị hỏng.'));
    img.src = rawUrl;
  });
}
