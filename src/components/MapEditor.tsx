import { Eraser, Save, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MAP_THEMES } from '../game/maps';
import { renderMultiplayerScene } from '../game/renderer';
import { CapybaraAppearance, CustomMap, MapObject, MapTheme, MapTileType } from '../game/types';
import { createWeatherParticles } from '../game/weather';

interface MapEditorProps {
  authorName: string;
  appearance: CapybaraAppearance;
  existingMaps: CustomMap[];
  onSaveMap: (map: CustomMap) => void;
  onDeleteMap: (mapId: string) => void;
  onClose: () => void;
}

type BrushTool = MapTileType | 'erase';

const LOGICAL_W = 960;
const LOGICAL_H = 440;
const GROUND_Y = 356;

const BRUSH_OPTIONS: { id: BrushTool; label: string; color: string }[] = [
  { id: 'platform', label: 'Bệ nhảy', color: '#4ADE80' },
  { id: 'spring', label: 'Lò xo bật', color: '#F59E0B' },
  { id: 'onsen', label: 'Suối nước nóng', color: '#38BDF8' },
  { id: 'yuzu', label: 'Quả quýt', color: '#FB923C' },
  { id: 'hazard', label: 'Bẫy ớt cay', color: '#EF4444' },
  { id: 'erase', label: 'Xóa vật thể', color: '#94A3B8' },
];

export function MapEditor({
  authorName,
  appearance,
  existingMaps,
  onSaveMap,
  onDeleteMap,
  onClose,
}: MapEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mapName, setMapName] = useState('Bản đồ Suối Tre Mới');
  const [theme, setTheme] = useState<MapTheme>('bamboo');
  const [brush, setBrush] = useState<BrushTool>('platform');
  const [objects, setObjects] = useState<MapObject[]>([
    { id: 'init_p1', type: 'platform', x: 240, y: 260, w: 140, h: 18 },
    { id: 'init_y1', type: 'yuzu', x: 297, y: 225, w: 26, h: 26 },
  ]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const weatherParticles = createWeatherParticles(LOGICAL_W, LOGICAL_H, 28);
    let animId = 0;
    let last = performance.now();
    let time = 0;

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== LOGICAL_W * dpr || canvas.height !== LOGICAL_H * dpr) {
        canvas.width = LOGICAL_W * dpr;
        canvas.height = LOGICAL_H * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const previewMap: CustomMap = {
        id: 'preview',
        name: mapName,
        author: authorName,
        theme,
        objects,
      };

      renderMultiplayerScene(ctx, {
        width: LOGICAL_W,
        height: LOGICAL_H,
        groundY: GROUND_Y,
        time,
        dt,
        map: previewMap,
        claimedYuzuIds: new Set(),
        localPlayer: {
          x: 90,
          y: GROUND_Y - 50,
          width: 66,
          height: 50,
          vy: 0,
          facing: 1,
          isGrounded: true,
          isDucking: false,
          scaleX: 1,
          scaleY: 1,
          invulnTimer: 0,
          hasShield: false,
          magnetTimer: 0,
          feverActive: false,
          yuzuStackCount: 1,
          appearance,
          runCycle: 0,
          blinkTimer: 0,
        },
        remotePlayers: [],
        projectiles: [],
        weatherParticles,
        activeWeather: theme === 'sakura' ? 'sakura' : theme === 'snow' ? 'snow' : 'clear',
      });

      // Subtle editor placement grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let gx = 40; gx < LOGICAL_W; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, GROUND_Y);
        ctx.stroke();
      }
      for (let gy = 40; gy < GROUND_Y; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(LOGICAL_W, gy);
        ctx.stroke();
      }

      ctx.restore();
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [appearance, authorName, mapName, objects, theme]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * LOGICAL_W;
    const y = ((e.clientY - rect.top) / rect.height) * LOGICAL_H;

    if (brush === 'erase') {
      setObjects((prev) =>
        prev.filter(
          (o) => !(x >= o.x - 8 && x <= o.x + o.w + 8 && y >= o.y - 8 && y <= o.y + o.h + 8)
        )
      );
      return;
    }

    const snappedX = Math.round(x / 20) * 20;
    const snappedY = Math.round(y / 20) * 20;
    const id = `obj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;

    let newObj: MapObject;
    if (brush === 'platform') {
      newObj = {
        id,
        type: 'platform',
        x: Math.max(0, Math.min(LOGICAL_W - 130, snappedX - 65)),
        y: Math.max(70, Math.min(GROUND_Y - 35, snappedY)),
        w: 130,
        h: 18,
      };
    } else if (brush === 'spring') {
      newObj = {
        id,
        type: 'spring',
        x: Math.max(0, Math.min(LOGICAL_W - 40, snappedX - 20)),
        y: Math.min(GROUND_Y - 18, Math.max(80, snappedY)),
        w: 40,
        h: 18,
      };
    } else if (brush === 'onsen') {
      newObj = {
        id,
        type: 'onsen',
        x: Math.max(0, Math.min(LOGICAL_W - 92, snappedX - 46)),
        y: GROUND_Y - 22,
        w: 92,
        h: 22,
      };
    } else if (brush === 'yuzu') {
      newObj = {
        id,
        type: 'yuzu',
        x: Math.max(10, Math.min(LOGICAL_W - 36, snappedX - 13)),
        y: Math.max(50, Math.min(GROUND_Y - 32, snappedY - 13)),
        w: 26,
        h: 26,
      };
    } else {
      newObj = {
        id,
        type: 'hazard',
        x: Math.max(10, Math.min(LOGICAL_W - 44, snappedX - 17)),
        y: GROUND_Y - 30,
        w: 34,
        h: 30,
      };
    }

    setObjects((prev) => [...prev.slice(-79), newObj]);
  };

  const handleSave = () => {
    const map: CustomMap = {
      id: `custom_${Date.now().toString(36)}`,
      name: mapName.trim() || 'Bản đồ tùy chỉnh',
      author: authorName || 'Mochi',
      theme,
      objects,
    };
    onSaveMap(map);
    setSavedNotice(`Đã lưu bản đồ "${map.name}". Bạn có thể chọn bản đồ này khi tạo máy chủ!`);
    setTimeout(() => setSavedNotice(null), 4000);
  };

  return (
    <div className="rounded-2xl border border-white/12 bg-[#16231D] p-5 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h2 className="font-display text-lg font-bold text-white">Trình tạo Map nhiều người chơi</h2>
          <p className="text-xs text-emerald-100/75">
            Chọn loại vật thể rồi nhấp lên bản đồ bên dưới để đặt bệ nhảy, lò xo, suối nước nóng hoặc quýt.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center rounded-lg border border-white/12 bg-[#21332A] px-4 text-xs font-semibold text-emerald-100 hover:bg-[#2B4236]"
        >
          Đóng trình tạo Map
        </button>
      </div>

      {/* Controls row */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="map-name-input" className="block text-xs font-medium text-emerald-200/80">
            Tên bản đồ
          </label>
          <input
            id="map-name-input"
            type="text"
            maxLength={28}
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-[#0F1814] px-3 text-sm text-white focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-emerald-200/80">Bối cảnh bản đồ</div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {MAP_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`h-10 rounded-lg border px-2 text-xs font-semibold transition-colors ${
                  theme === t.id
                    ? 'border-amber-400/60 bg-[#263C31] text-amber-300'
                    : 'border-white/10 bg-[#0F1814] text-emerald-100/75 hover:text-white'
                }`}
              >
                {t.label.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Brush Bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {BRUSH_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setBrush(opt.id)}
            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors ${
              brush === opt.id
                ? 'border-amber-400/70 bg-[#263C31] text-amber-200'
                : 'border-white/10 bg-[#14201A] text-emerald-100/80 hover:bg-[#1C2C24]'
            }`}
          >
            {opt.id === 'erase' ? (
              <Eraser className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
            ) : (
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: opt.color }}
                aria-hidden="true"
              />
            )}
            <span>{opt.label}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => setObjects([])}
          className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-[#21332A] px-3 text-xs font-semibold text-rose-200 hover:bg-[#2B4236]"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Xóa hết</span>
        </button>
      </div>

      {/* Canvas Editor Surface */}
      <div className="mt-3 overflow-hidden rounded-xl border border-white/12">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="block h-auto w-full cursor-crosshair bg-[#1B2B23]"
          style={{ aspectRatio: `${LOGICAL_W} / ${LOGICAL_H}` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-emerald-200/75">
          {savedNotice ? (
            <span className="font-semibold text-emerald-300">{savedNotice}</span>
          ) : (
            <span>Số vật thể đã đặt: {objects.length}/80</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-5 text-xs font-bold text-[#1A1308] hover:bg-amber-400"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>Lưu bản đồ này</span>
        </button>
      </div>

      {/* Saved Custom Maps List */}
      {existingMaps.length > 0 && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="text-xs font-semibold text-emerald-200/80">
            Bản đồ đã tạo ({existingMaps.length})
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {existingMaps.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#14201A] px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">{m.name}</div>
                  <div className="text-emerald-200/65">{m.objects.length} vật thể</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMapName(m.name);
                      setTheme(m.theme);
                      setObjects(m.objects);
                    }}
                    className="rounded px-2 py-1 text-emerald-200 hover:bg-white/10"
                  >
                    Mở
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteMap(m.id)}
                    className="rounded px-2 py-1 text-rose-300 hover:bg-rose-500/15"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
