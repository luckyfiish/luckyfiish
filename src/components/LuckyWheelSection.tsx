import { useRef, useState } from 'react';
import { ArrowUpRight, Lock, RotateCw, Sparkles } from 'lucide-react';
import { CharacterProfile, SpinWheelResult } from '../types/character';
import { PortraitImage } from './PortraitImage';

export type WheelSegmentType =
  | 'clover-1'
  | 'clover-2'
  | 'clover-5'
  | 'character-pack'
  | 'image-pack'
  | 'rare-character-pack';

interface LuckyWheelSectionProps {
  rareCharacters: CharacterProfile[];
  unlockedIds: string[];
  clovers: number;
  onExecuteSpin: (segmentTypes: WheelSegmentType[]) => SpinWheelResult | null;
  onUnlockRare: (id: string) => void;
  onSelectCharacter: (character: CharacterProfile) => void;
}

const WHEEL_SEGMENTS: Array<{
  label: string;
  type: WheelSegmentType;
  color: string;
}> = [
  { label: '+1 🍀', type: 'clover-1', color: '#E0F2FE' },
  { label: 'Gói Nhân Vật', type: 'character-pack', color: '#BAE6FD' },
  { label: '+2 🍀', type: 'clover-2', color: '#CFEFFE' },
  { label: 'Gói Ảnh', type: 'image-pack', color: '#A7F3D0' },
  { label: '+1 🍀', type: 'clover-1', color: '#E0F2FE' },
  { label: '+5 🍀', type: 'clover-5', color: '#FEF9C3' },
  { label: 'Gói Nhân Vật', type: 'character-pack', color: '#93C5FD' },
  { label: 'Gói Nhân Vật Hiếm', type: 'rare-character-pack', color: '#FDE68A' },
];

// Trọng số ẩn theo cấu hình riêng (không hiển thị tỷ lệ ra giao diện)
function rollSecretWheelOutcome(): WheelSegmentType {
  const totalWeight = 30 + 25 + 15 + 5;
  const roll = Math.random() * totalWeight;

  if (roll < 30) {
    return 'clover-1';
  }
  if (roll < 30 + 25) {
    return Math.random() < 0.5 ? 'clover-2' : 'character-pack';
  }
  if (roll < 30 + 25 + 15) {
    return Math.random() < 0.5 ? 'clover-5' : 'image-pack';
  }
  return 'rare-character-pack';
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function OceanRoomDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none select-none">
      {/* Jellyfish (Sứa) */}
      <svg
        width="88"
        height="98"
        viewBox="0 0 84 96"
        fill="none"
        className="hidden lg:block absolute right-6 top-6 opacity-85 animate-ocean-float"
      >
        <path
          d="M14 40C14 21 26.5 10 42 10C57.5 10 70 21 70 40C62 44 52 42 42 42C32 42 22 44 14 40Z"
          fill="rgba(186, 230, 253, 0.78)"
          stroke="#38BDF8"
          strokeWidth="1.6"
        />
        <path
          d="M25 42C24 56 28 68 23 82M36 42C35 58 39 72 35 88M48 42C50 58 46 72 50 86M59 42C61 56 57 68 62 80"
          stroke="rgba(56, 189, 248, 0.75)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="33" cy="27" r="3" fill="#FEF08A" />
        <circle cx="50" cy="24" r="2" fill="#FFFFFF" />
      </svg>

      {/* Fish + Bubbles (Cá & Bong bóng) */}
      <svg
        width="102"
        height="58"
        viewBox="0 0 96 54"
        fill="none"
        className="hidden lg:block absolute left-6 bottom-6 opacity-90 animate-ocean-float"
      >
        <path
          d="M20 27C30 12 52 10 68 24L84 13L79 27L84 41L68 30C52 44 30 42 20 27Z"
          fill="rgba(167, 243, 208, 0.78)"
          stroke="#0284C7"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="34" cy="24" r="2.8" fill="#0A2A43" />
        <circle cx="10" cy="18" r="3.5" fill="rgba(255,255,255,0.85)" stroke="#38BDF8" />
        <circle cx="6" cy="10" r="2.2" fill="rgba(255,255,255,0.85)" stroke="#38BDF8" />
      </svg>
    </div>
  );
}

export function LuckyWheelSection({
  rareCharacters,
  unlockedIds,
  clovers,
  onExecuteSpin,
  onUnlockRare,
  onSelectCharacter,
}: LuckyWheelSectionProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<SpinWheelResult | null>(null);
  const rotationRef = useRef(0);

  const sliceCount = WHEEL_SEGMENTS.length;
  const sliceAngle = 360 / sliceCount;

  const handleSpin = () => {
    if (isSpinning || clovers < 5) return;

    const rolls: WheelSegmentType[] = [
      rollSecretWheelOutcome(),
      rollSecretWheelOutcome(),
      rollSecretWheelOutcome(),
    ];

    const primaryType = rolls[0];
    const matchingIndices = WHEEL_SEGMENTS.map((seg, i) =>
      seg.type === primaryType ? i : -1
    ).filter((i) => i !== -1);

    const chosenIndex =
      matchingIndices.length > 0
        ? matchingIndices[Math.floor(Math.random() * matchingIndices.length)]
        : 0;

    const result = onExecuteSpin(rolls);
    if (!result) return;

    const extraTurns = 5 * 360;
    const sliceCenter = chosenIndex * sliceAngle + sliceAngle / 2;
    const targetMod = (360 - sliceCenter + 360) % 360;
    const currentMod = ((rotationRef.current % 360) + 360) % 360;
    const delta = (targetMod - currentMod + 360) % 360;
    const nextRotation = rotationRef.current + extraTurns + delta;

    rotationRef.current = nextRotation;
    setIsSpinning(true);
    setRotation(nextRotation);

    window.setTimeout(() => {
      setIsSpinning(false);
      setLastResult(result);
    }, 4200);
  };

  return (
    <section className="max-w-[1200px] mx-auto px-6 py-10 space-y-10">
      <div className="relative glass-panel rounded-3xl p-6 sm:p-10 overflow-hidden">
        <OceanRoomDecor />

        <div className="relative z-10 mb-8 max-w-2xl">
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#0A2A43] text-balance">
            Vòng Quay Chủ Đề: Đại Dương
          </h1>
          <p className="text-sm sm:text-base text-[#285270] mt-3 leading-relaxed">
            <strong className="text-[#0A2A43]">5 🍀</strong> nhận được{' '}
            <span className="relative inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 rounded-full bg-gradient-to-r from-[#FEF08A] via-[#A7F3D0] to-[#BAE6FD] border border-white font-display text-base sm:text-lg font-extrabold text-[#0A2A43] animate-lucky-three align-middle">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>3</span>
            </span>{' '}
            vật phẩm ngẫu nhiên
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Wheel */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="relative w-full max-w-[390px] aspect-square flex items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-[#0284C7] drop-shadow-[0_4px_10px_rgba(2,132,199,0.35)]"
              />

              <div
                className="w-full h-full rounded-full p-2.5 bg-white/80 backdrop-blur-xl border-2 border-white shadow-[0_20px_50px_rgba(14,116,144,0.18)]"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning
                    ? 'transform 4.2s cubic-bezier(0.14, 0.85, 0.22, 1)'
                    : 'none',
                }}
              >
                <svg viewBox="0 0 400 400" className="w-full h-full rounded-full">
                  {WHEEL_SEGMENTS.map((seg, idx) => {
                    const startAngle = idx * sliceAngle;
                    const endAngle = startAngle + sliceAngle;
                    const midAngle = startAngle + sliceAngle / 2;
                    const textPos = polarToCartesian(200, 200, 124, midAngle);

                    return (
                      <g key={`${seg.label}-${idx}`}>
                        <path
                          d={describeSlice(200, 200, 196, startAngle, endAngle)}
                          fill={seg.color}
                          stroke="#FFFFFF"
                          strokeWidth="2.5"
                        />
                        <text
                          x={textPos.x}
                          y={textPos.y}
                          fill="#0A2A43"
                          fontSize={seg.label.length > 13 ? '9.5' : '11.5'}
                          fontWeight="800"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${midAngle - 90}, ${textPos.x}, ${textPos.y})`}
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}
                  <circle
                    cx="200"
                    cy="200"
                    r="36"
                    fill="#FFFFFF"
                    stroke="#0284C7"
                    strokeWidth="2.5"
                  />
                  <text
                    x="200"
                    y="200"
                    fill="#0284C7"
                    fontSize="13"
                    fontWeight="800"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    5 🍀
                  </text>
                </svg>
              </div>
            </div>

            <div className="mt-7 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning || clovers < 5}
                className="glass-btn-lucky inline-flex items-center gap-2.5 px-7 py-3 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
              >
                <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'Đang quay...' : 'Quay ngay (5 🍀)'}</span>
              </button>
              <span className="text-xs font-semibold text-[#285270] tabular-nums">
                Hiện có: {clovers} 🍀
              </span>
            </div>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-6 space-y-4">
            {lastResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0A2A43]">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  <span>{lastResult.segmentLabel}</span>
                </div>

                {lastResult.items.map((item) => {
                  if (item.character) {
                    const char = item.character;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl p-4 flex items-center gap-4 border backdrop-blur-md ${
                          item.isRare
                            ? 'bg-[#FEF9C3]/80 border-[#FDE047]'
                            : 'bg-white/80 border-white'
                        }`}
                      >
                        <div className="w-14 h-[74px] rounded-xl overflow-hidden bg-[#D6F1FE] border border-white shrink-0">
                          <PortraitImage
                            src={char.portraitUrl}
                            alt={char.name}
                            name={char.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#0284C7]">
                            {item.label}
                          </div>
                          <h3 className="font-display text-xl font-bold text-[#0A2A43] truncate">
                            {char.name}
                          </h3>
                          <p className="text-xs text-[#285270]">
                            {char.code} · {char.age} tuổi
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectCharacter(char)}
                          className="glass-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <span>Xem</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-4 flex items-center justify-between gap-4 border backdrop-blur-md ${
                        item.isRare
                          ? 'bg-[#FEF9C3]/80 border-[#FDE047]'
                          : 'bg-[#E0F2FE]/80 border-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#15803D]">
                          {item.label}
                        </div>
                        <div className="font-display text-xl font-bold text-[#0A2A43]">
                          {item.cloverGain
                            ? `+${item.cloverGain} 🍀 may mắn`
                            : 'Chưa có nhân vật phù hợp'}
                        </div>
                      </div>
                      <span className="text-xl" aria-hidden="true">
                        🍀
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl p-7 bg-white/70 border border-white space-y-3">
                <h2 className="font-display text-2xl font-bold text-[#0A2A43]">
                  Phần thưởng trên vòng quay
                </h2>
                <ul className="space-y-2 text-sm text-[#285270] leading-relaxed">
                  <li>
                    • <strong className="text-[#0A2A43]">Gói Nhân Vật</strong>: Mở khóa
                    link nhân vật thường.
                  </li>
                  <li>
                    • <strong className="text-[#0A2A43]">Gói Ảnh</strong>: Sưu tầm ảnh
                    nhân vật vào bộ sưu tập.
                  </li>
                  <li>
                    • <strong className="text-[#0A2A43]">Gói Nhân Vật Hiếm</strong>:
                    Cơ hội nhận ngay nhân vật hiếm đặc biệt
                  </li>
                  <li>
                    • <strong className="text-[#0A2A43]">+1 🍀 / +2 🍀 / +5 🍀</strong>:
                    Nhận thêm cỏ 4 lá may mắn.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rare Characters Section */}
      {rareCharacters.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0A2A43]">
              Nhân Vật Hiếm ({rareCharacters.length})
            </h2>
            <p className="text-xs text-[#285270] mt-1">
              Có thể mở khóa trực tiếp bằng <strong>25 🍀</strong> hoặc nhận qua{' '}
              <strong>Vòng Quay Đại Dương</strong>.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {rareCharacters.map((rare) => {
              const isUnlocked = unlockedIds.includes(rare.id);
              return (
                <div
                  key={rare.id}
                  onClick={() => onSelectCharacter(rare)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectCharacter(rare);
                    }
                  }}
                  className="text-left flex items-center gap-4 p-4 rounded-2xl bg-[#FEF9C3]/65 border border-[#FDE047] hover:bg-[#FEF9C3]/85 transition-colors cursor-pointer"
                >
                  <div className="w-20 aspect-[3/4] rounded-xl overflow-hidden border border-white shrink-0">
                    <PortraitImage
                      src={rare.portraitUrl}
                      alt={rare.name}
                      name={rare.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="text-xs font-bold text-[#B45309]">
                      {rare.code} · {rare.age} tuổi · {rare.gender}
                    </div>
                    <div className="font-display text-2xl font-bold text-[#0A2A43]">
                      {rare.name}
                    </div>
                    <p className="text-xs text-[#285270] line-clamp-2">
                      {rare.appearance}
                    </p>
                    {!isUnlocked ? (
                      <button
                        type="button"
                        disabled={clovers < 25}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnlockRare(rare.id);
                        }}
                        className="glass-btn-lucky inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        <Lock className="w-3 h-3 text-[#15803D]" />
                        <span>Mở khóa (25 🍀)</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#15803D]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Đã mở khóa · Sở hữu</span>
                      </span>
                    )}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#B45309] shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
