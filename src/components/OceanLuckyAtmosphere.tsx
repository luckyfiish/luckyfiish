import { useEffect, useState, type CSSProperties } from 'react';

interface Particle {
  id: number;
  kind: 'bubble' | 'clover' | 'bling';
  leftPct: number;
  topPct: number;
  size: number;
  speed: number;
  driftX: number;
  duration: number;
  delay: number;
  rotation: number;
}

const PARTICLES: Particle[] = [
  { id: 1, kind: 'bubble', leftPct: 4, topPct: 14, size: 36, speed: 0.24, driftX: 16, duration: 9, delay: 0, rotation: 0 },
  { id: 2, kind: 'clover', leftPct: 10, topPct: 58, size: 28, speed: 0.34, driftX: -14, duration: 10.5, delay: -2, rotation: 15 },
  { id: 3, kind: 'bling', leftPct: 16, topPct: 24, size: 24, speed: 0.26, driftX: 10, duration: 3.1, delay: -0.5, rotation: 0 },
  { id: 4, kind: 'bubble', leftPct: 23, topPct: 42, size: 20, speed: 0.2, driftX: 12, duration: 8, delay: -4, rotation: 0 },
  { id: 5, kind: 'clover', leftPct: 86, topPct: 18, size: 28, speed: 0.3, driftX: 18, duration: 11.5, delay: -1, rotation: -18 },
  { id: 6, kind: 'bling', leftPct: 92, topPct: 30, size: 26, speed: 0.32, driftX: -12, duration: 3.4, delay: -1.4, rotation: 12 },
  { id: 7, kind: 'bubble', leftPct: 91, topPct: 56, size: 42, speed: 0.26, driftX: -16, duration: 10, delay: -3, rotation: 0 },
  { id: 8, kind: 'clover', leftPct: 76, topPct: 76, size: 24, speed: 0.36, driftX: 13, duration: 9, delay: -5, rotation: 28 },
  { id: 9, kind: 'bling', leftPct: 45, topPct: 12, size: 22, speed: 0.22, driftX: 10, duration: 2.9, delay: -2.1, rotation: 8 },
  { id: 10, kind: 'bubble', leftPct: 64, topPct: 34, size: 28, speed: 0.28, driftX: 14, duration: 11, delay: -6, rotation: 0 },
  { id: 11, kind: 'bling', leftPct: 70, topPct: 64, size: 22, speed: 0.33, driftX: -14, duration: 3.7, delay: -0.9, rotation: -10 },
  { id: 12, kind: 'clover', leftPct: 27, topPct: 84, size: 26, speed: 0.32, driftX: -15, duration: 9.5, delay: -3.5, rotation: -12 },
  { id: 13, kind: 'bling', leftPct: 8, topPct: 86, size: 24, speed: 0.25, driftX: 11, duration: 3.2, delay: -1.8, rotation: 5 },
  { id: 14, kind: 'bubble', leftPct: 38, topPct: 68, size: 18, speed: 0.22, driftX: 9, duration: 7.5, delay: -1.5, rotation: 0 },
  { id: 15, kind: 'clover', leftPct: 93, topPct: 85, size: 22, speed: 0.29, driftX: -12, duration: 10.5, delay: -4.5, rotation: 22 },
  { id: 16, kind: 'bling', leftPct: 55, topPct: 82, size: 22, speed: 0.24, driftX: 9, duration: 3.3, delay: -2.7, rotation: 15 },
  { id: 17, kind: 'bubble', leftPct: 52, topPct: 48, size: 24, speed: 0.27, driftX: -11, duration: 9.5, delay: -3.2, rotation: 0 },
  { id: 18, kind: 'bling', leftPct: 33, topPct: 20, size: 18, speed: 0.3, driftX: 12, duration: 2.8, delay: -1.1, rotation: 24 },
];

function FourLeafClover({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-[0_4px_10px_rgba(16,185,129,0.28)]"
    >
      <path
        d="M16 15C16 10.5 12.2 6.5 9.2 8.2C6.4 9.8 8.4 14.4 13.8 15.6C8.4 16.8 6.4 21.4 9.2 23C12.2 24.7 16 20.7 16 16.2C16 20.7 19.8 24.7 22.8 23C25.6 21.4 23.6 16.8 18.2 15.6C23.6 14.4 25.6 9.8 22.8 8.2C19.8 6.5 16 10.5 16 15Z"
        fill="rgba(52, 211, 153, 0.42)"
        stroke="rgba(16, 185, 129, 0.72)"
        strokeWidth="1.25"
      />
      <path
        d="M16 16.5C16.2 21 17.5 25.5 19.8 28.5"
        stroke="rgba(16, 185, 129, 0.72)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PaleGoldBling({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-[0_0_10px_rgba(253,224,71,0.85)]"
    >
      <path
        d="M16 2L18.9 13.1L30 16L18.9 18.9L16 30L13.1 18.9L2 16L13.1 13.1L16 2Z"
        fill="rgba(254, 240, 138, 0.9)"
        stroke="rgba(250, 204, 21, 0.8)"
        strokeWidth="1"
      />
      <circle cx="16" cy="16" r="2.4" fill="#FFFBEB" />
    </svg>
  );
}

interface BurstItem {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  kind: 'bling' | 'bubble' | 'clover';
}

interface OceanLuckyAtmosphereProps {
  externalScrollY?: number;
  scoped?: boolean;
  burstTrigger?: { x: number; y: number; tick: number } | null;
}

export function OceanLuckyAtmosphere({
  externalScrollY,
  scoped = false,
  burstTrigger = null,
}: OceanLuckyAtmosphereProps) {
  const [windowScrollY, setWindowScrollY] = useState(0);
  const [scrollTilt, setScrollTilt] = useState(0);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const [cursorGlow, setCursorGlow] = useState<{ x: number; y: number } | null>(null);
  const [bursts, setBursts] = useState<BurstItem[]>([]);

  useEffect(() => {
    if (typeof externalScrollY === 'number') return;
    let lastY = window.scrollY;
    let rafId = 0;
    let settleTimer = 0;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      lastY = currentY;

      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        setWindowScrollY(currentY);
        setScrollTilt(Math.max(-28, Math.min(28, delta * 0.75)));
      });

      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => setScrollTilt(0), 200);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimer);
    };
  }, [externalScrollY]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 26;
      const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 20;
      setPointerOffset({ x: nx, y: ny });
      setCursorGlow({ x: e.clientX, y: e.clientY });
    };
    const onWindowClick = (e: MouseEvent) => {
      if (scoped) return;
      const base = Date.now() + Math.floor(Math.random() * 1000);
      const items: BurstItem[] = [
        { id: base + 1, x: e.clientX, y: e.clientY, dx: -24, dy: -26, kind: 'bling' },
        { id: base + 2, x: e.clientX, y: e.clientY, dx: 24, dy: -22, kind: 'clover' },
        { id: base + 3, x: e.clientX, y: e.clientY, dx: 0, dy: -36, kind: 'bubble' },
        { id: base + 4, x: e.clientX, y: e.clientY, dx: -12, dy: 14, kind: 'bubble' },
        { id: base + 5, x: e.clientX, y: e.clientY, dx: 18, dy: 12, kind: 'bling' },
      ];
      setBursts((prev) => [...prev, ...items].slice(-18));
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id < base || b.id > base + 5));
      }, 950);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('click', onWindowClick, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('click', onWindowClick);
    };
  }, [scoped]);

  useEffect(() => {
    if (!burstTrigger) return;
    const base = Date.now() + Math.floor(Math.random() * 1000);
    const newBursts: BurstItem[] = [
      { id: base + 1, x: burstTrigger.x, y: burstTrigger.y, dx: -22, dy: -20, kind: 'bling' },
      { id: base + 2, x: burstTrigger.x, y: burstTrigger.y, dx: 22, dy: -24, kind: 'clover' },
      { id: base + 3, x: burstTrigger.x, y: burstTrigger.y, dx: 0, dy: -34, kind: 'bubble' },
      { id: base + 4, x: burstTrigger.x, y: burstTrigger.y, dx: 14, dy: 10, kind: 'bling' },
    ];
    setBursts((prev) => [...prev, ...newBursts].slice(-16));
    const timer = window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id > base + 4 || b.id < base));
    }, 950);
    return () => window.clearTimeout(timer);
  }, [burstTrigger]);

  const activeScroll = typeof externalScrollY === 'number' ? externalScrollY : windowScrollY;

  return (
    <div
      aria-hidden="true"
      className={`${
        scoped ? 'absolute inset-0 z-20' : 'fixed inset-0 z-0'
      } overflow-hidden pointer-events-none select-none`}
    >
      {/* Subtle sunlit cursor halo */}
      {!scoped && cursorGlow && (
        <div
          style={{
            left: cursorGlow.x,
            top: cursorGlow.y,
          }}
          className="fixed -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(254,240,138,0.22)_0%,rgba(125,211,252,0.14)_45%,transparent_70%)] transition-transform duration-150"
        />
      )}

      {PARTICLES.map((p) => {
        const yOffset = -((activeScroll * p.speed) % 150);
        const xOffset =
          Math.sin(activeScroll * 0.009 + p.id) * p.driftX +
          pointerOffset.x * (p.speed * 1.9);
        const yPointer = pointerOffset.y * (p.speed * 1.8);
        const rot =
          p.rotation +
          activeScroll * 0.055 * (p.id % 2 === 0 ? 1 : -1) +
          scrollTilt * 0.45;

        return (
          <div
            key={p.id}
            style={{
              left: `${p.leftPct}%`,
              top: `${p.topPct}%`,
              transform: `translate3d(${xOffset.toFixed(1)}px, ${(
                yOffset +
                yPointer +
                scrollTilt * p.speed * 1.6
              ).toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg)`,
              transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute"
          >
            {p.kind === 'bling' ? (
              <div
                className="animate-bling"
                style={
                  {
                    '--bling-duration': `${p.duration}s`,
                    '--bling-delay': `${p.delay}s`,
                  } as CSSProperties
                }
              >
                <PaleGoldBling size={p.size} />
              </div>
            ) : (
              <div
                className="animate-ocean-float"
                style={
                  {
                    '--float-duration': `${p.duration}s`,
                    '--float-delay': `${p.delay}s`,
                  } as CSSProperties
                }
              >
                {p.kind === 'bubble' ? (
                  <div
                    style={{ width: p.size, height: p.size }}
                    className="rounded-full bg-white/45 border border-white/85 backdrop-blur-[2px] shadow-[inset_-4px_-4px_10px_rgba(56,189,248,0.24),inset_3px_3px_8px_rgba(255,255,255,0.92),0_4px_16px_rgba(14,116,144,0.1)]"
                  />
                ) : (
                  <FourLeafClover size={p.size} />
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Interactive click bursts across page & modal */}
      {bursts.map((b) => (
        <div
          key={b.id}
          style={{
            left: b.x + b.dx,
            top: b.y + b.dy,
          }}
          className="fixed -translate-x-1/2 -translate-y-1/2 animate-burst"
        >
          {b.kind === 'bling' && <PaleGoldBling size={24} />}
          {b.kind === 'clover' && <FourLeafClover size={22} />}
          {b.kind === 'bubble' && (
            <div className="w-5 h-5 rounded-full bg-white/65 border border-white shadow-sm" />
          )}
        </div>
      ))}
    </div>
  );
}
