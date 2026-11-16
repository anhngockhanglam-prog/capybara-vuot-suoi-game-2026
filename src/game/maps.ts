import type { CustomMap, MapTheme } from './types.ts';

export const MAP_THEMES: { id: MapTheme; label: string; skyTop: string; skyBottom: string }[] = [
  { id: 'bamboo', label: 'Rừng Tre Suối Khoáng', skyTop: '#7AB8A8', skyBottom: '#E7F3E8' },
  { id: 'sakura', label: 'Vườn Hoa Anh Đào', skyTop: '#D48AA7', skyBottom: '#FDE7F0' },
  { id: 'night_lantern', label: 'Đêm Đom Đóm', skyTop: '#142030', skyBottom: '#27404E' },
  { id: 'snow', label: 'Suối Tuyết Trắng', skyTop: '#647E96', skyBottom: '#E2EDF5' },
];

export const PRESET_MAPS: CustomMap[] = [
  {
    id: 'preset_bamboo_spring',
    name: 'Bờ Suối Tre Cổ Điển',
    author: 'Hệ thống',
    theme: 'bamboo',
    objects: [
      { id: 'p1', type: 'platform', x: 160, y: 270, w: 140, h: 18 },
      { id: 'p2', type: 'platform', x: 400, y: 215, w: 160, h: 18 },
      { id: 'p3', type: 'platform', x: 660, y: 265, w: 150, h: 18 },
      { id: 's1', type: 'spring', x: 325, y: 338, w: 40, h: 18 },
      { id: 'o1', type: 'onsen', x: 440, y: 334, w: 92, h: 22 },
      { id: 'y1', type: 'yuzu', x: 215, y: 235, w: 26, h: 26 },
      { id: 'y2', type: 'yuzu', x: 465, y: 180, w: 26, h: 26 },
      { id: 'y3', type: 'yuzu', x: 720, y: 230, w: 26, h: 26 },
      { id: 'y4', type: 'yuzu', x: 110, y: 320, w: 26, h: 26 },
      { id: 'h1', type: 'hazard', x: 585, y: 326, w: 34, h: 30 },
    ],
  },
  {
    id: 'preset_sakura_valley',
    name: 'Thung Lũng Hoa Đào',
    author: 'Hệ thống',
    theme: 'sakura',
    objects: [
      { id: 'p1', type: 'platform', x: 120, y: 265, w: 130, h: 18 },
      { id: 'p2', type: 'platform', x: 310, y: 205, w: 130, h: 18 },
      { id: 'p3', type: 'platform', x: 520, y: 205, w: 130, h: 18 },
      { id: 'p4', type: 'platform', x: 710, y: 265, w: 130, h: 18 },
      { id: 's1', type: 'spring', x: 460, y: 338, w: 40, h: 18 },
      { id: 'o1', type: 'onsen', x: 200, y: 334, w: 96, h: 22 },
      { id: 'y1', type: 'yuzu', x: 170, y: 230, w: 26, h: 26 },
      { id: 'y2', type: 'yuzu', x: 360, y: 170, w: 26, h: 26 },
      { id: 'y3', type: 'yuzu', x: 570, y: 170, w: 26, h: 26 },
      { id: 'y4', type: 'yuzu', x: 760, y: 230, w: 26, h: 26 },
      { id: 'y5', type: 'yuzu', x: 467, y: 125, w: 26, h: 26 },
    ],
  },
  {
    id: 'preset_sunset_islands',
    name: 'Đảo Đá Đêm Đom Đóm',
    author: 'Hệ thống',
    theme: 'night_lantern',
    objects: [
      { id: 'p1', type: 'platform', x: 180, y: 280, w: 120, h: 18 },
      { id: 'p2', type: 'platform', x: 380, y: 230, w: 200, h: 18 },
      { id: 'p3', type: 'platform', x: 660, y: 280, w: 120, h: 18 },
      { id: 'p4', type: 'platform', x: 410, y: 145, w: 140, h: 18 },
      { id: 's1', type: 'spring', x: 250, y: 262, w: 38, h: 18 },
      { id: 's2', type: 'spring', x: 672, y: 262, w: 38, h: 18 },
      { id: 'o1', type: 'onsen', x: 434, y: 334, w: 96, h: 22 },
      { id: 'y1', type: 'yuzu', x: 468, y: 110, w: 26, h: 26 },
      { id: 'y2', type: 'yuzu', x: 468, y: 195, w: 26, h: 26 },
      { id: 'h1', type: 'hazard', x: 315, y: 326, w: 34, h: 30 },
      { id: 'h2', type: 'hazard', x: 615, y: 326, w: 34, h: 30 },
    ],
  },
];
