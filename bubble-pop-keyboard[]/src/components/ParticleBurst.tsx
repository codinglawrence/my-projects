import { useMemo, useCallback, useRef } from "react";
import type { Particle, ParticleBurstConfig } from "../types";

interface ParticleBurstProps {
  config: ParticleBurstConfig;
  containerRect: DOMRect;
  onComplete: (keyId: string) => void;
}

type SparkleShape = "sparkle" | "dot" | "bubble";

function generateParticles(config: ParticleBurstConfig): Particle[] {
  const particles: Particle[] = [];
  const baseHue = hueFromColor(config.color);
  const total = config.count;

  for (let i = 0; i < total; i++) {
    const angle = (Math.PI * 2 * i) / total + (Math.random() - 0.5) * 0.4;
    const distance = 25 + Math.random() * 45;
    const isBubble = i < 4;
    const isSparkle = i >= total - 5;
    const shape: SparkleShape = isBubble ? "bubble" : isSparkle ? "sparkle" : "dot";

    const hueShift = (Math.random() - 0.5) * 40;
    const sat = 70 + Math.random() * 30;
    const light = 70 + Math.random() * 25;
    const color = `hsl(${baseHue + hueShift}, ${sat}%, ${light}%)`;

    particles.push({
      id: i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance * (0.7 + Math.random() * 0.6),
      size: isSparkle ? 2 + Math.random() * 2.5 : isBubble ? 1.5 + Math.random() * 3 : 1 + Math.random() * 2,
      color,
      duration: 500 + Math.random() * 400,
      shape: shape === "bubble" ? "circle" : "square",
      sparkleType: shape,
    });
  }
  return particles;
}

function hueFromColor(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return h * 60;
}

export default function ParticleBurst({ config, containerRect, onComplete }: ParticleBurstProps): React.ReactElement {
  const particles = useMemo(() => generateParticles(config), [config]);
  const completedRef = useRef(0);
  const totalCount = particles.length;

  const handleAnimationEnd = useCallback((_pid: number): void => {
    completedRef.current++;
    if (completedRef.current >= totalCount) { onComplete(config.keyId); }
  }, [totalCount, onComplete, config.keyId]);

  const relX = config.x - containerRect.left;
  const relY = config.y - containerRect.top;

  if (particles.length === 0) { onComplete(config.keyId); return <></>; }

  return (
    <>
      {particles.map((p) => {
        const sparkleType = (p as Particle & { sparkleType?: SparkleShape }).sparkleType;

        if (sparkleType === "sparkle") {
          return (
            <div
              key={`${config.keyId}-s-${p.id}`}
              style={{
                position: "absolute",
                left: `${relX}px`, top: `${relY}px`,
                width: `${p.size * 3}px`, height: `${p.size * 3}px`,
                transform: "translate(-50%, -50%)",
                ["--sx" as string]: `${p.dx}px`,
                ["--sy" as string]: `${p.dy}px`,
                animation: `sparkleFly ${p.duration}ms ease-out forwards`,
                pointerEvents: "none", zIndex: 10,
              }}
              onAnimationEnd={() => handleAnimationEnd(p.id)}
            >
              <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 3px ${p.color}) drop-shadow(0 0 1px white)` }}>
                <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" fill={p.color} opacity="0.9" />
              </svg>
            </div>
          );
        }

        if (sparkleType === "bubble") {
          return (
            <div
              key={`${config.keyId}-b-${p.id}`}
              style={{
                position: "absolute",
                left: `${relX - p.size / 2}px`, top: `${relY - p.size / 2}px`,
                width: `${p.size}px`, height: `${p.size}px`,
                borderRadius: "50%",
                background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.8) 0%, ${p.color}44 50%, ${p.color}22 80%, transparent 100%)`,
                boxShadow: `0 0 4px ${p.color}66, 0 0 8px ${p.color}22`,
                ["--bx" as string]: `${p.dx}px`,
                ["--by" as string]: `${p.dy * 0.6}px`,
                animation: `particleBubbleFloat ${p.duration}ms ease-out forwards`,
                pointerEvents: "none", zIndex: 10,
              }}
              onAnimationEnd={() => handleAnimationEnd(p.id)}
            />
          );
        }

        return (
          <div
            key={`${config.keyId}-d-${p.id}`}
            style={{
              position: "absolute",
              left: `${relX - p.size / 2}px`, top: `${relY - p.size / 2}px`,
              width: `${p.size}px`, height: `${p.size}px`,
              borderRadius: "50%",
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}99, 0 0 ${p.size * 6}px ${p.color}44`,
              ["--dx" as string]: `${p.dx}px`,
              ["--dy" as string]: `${p.dy}px`,
              animation: `stardustFly ${p.duration}ms ease-out both`,
              pointerEvents: "none", zIndex: 10,
            }}
            onAnimationEnd={() => handleAnimationEnd(p.id)}
          />
        );
      })}
    </>
  );
}
