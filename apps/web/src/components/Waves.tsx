"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

function generateWavePath(
  yOffset: number,
  amplitude: number,
  frequency: number,
  width: number,
  phase: number,
): string {
  const points: string[] = [];
  const steps = 100;

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const y =
      yOffset +
      Math.sin((x / width) * Math.PI * 2 * frequency + phase) * amplitude;
    points.push(`${x},${y}`);
  }

  return `M${points[0]} ${points
    .slice(1)
    .map((p) => `L${p}`)
    .join(" ")}`;
}

interface WaveConfig {
  yOffset: number;
  amplitude: number;
  frequency: number;
  strokeColor: string;
  strokeWidth: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function Waves() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const waves: WaveConfig[] = useMemo(
    () => [
      {
        yOffset: 100,
        amplitude: 30,
        frequency: 1.5,
        strokeColor: "hsl(0, 0%, 65%)",
        strokeWidth: 1.5,
        duration: 8,
        delay: 0,
        opacity: 0.3,
      },
      {
        yOffset: 200,
        amplitude: 25,
        frequency: 2,
        strokeColor: "hsl(0, 0%, 55%)",
        strokeWidth: 1.2,
        duration: 10,
        delay: 0.5,
        opacity: 0.25,
      },
      {
        yOffset: 320,
        amplitude: 35,
        frequency: 1.2,
        strokeColor: "hsl(0, 0%, 70%)",
        strokeWidth: 1.8,
        duration: 7,
        delay: 1,
        opacity: 0.35,
      },
      {
        yOffset: 440,
        amplitude: 20,
        frequency: 2.5,
        strokeColor: "hsl(0, 0%, 50%)",
        strokeWidth: 1,
        duration: 12,
        delay: 1.5,
        opacity: 0.2,
      },
      {
        yOffset: 560,
        amplitude: 40,
        frequency: 1,
        strokeColor: "hsl(0, 0%, 45%)",
        strokeWidth: 2,
        duration: 9,
        delay: 0.8,
        opacity: 0.3,
      },
      {
        yOffset: 680,
        amplitude: 22,
        frequency: 1.8,
        strokeColor: "hsl(0, 0%, 65%)",
        strokeWidth: 1.3,
        duration: 11,
        delay: 2,
        opacity: 0.2,
      },
      {
        yOffset: 800,
        amplitude: 28,
        frequency: 1.6,
        strokeColor: "hsl(0, 0%, 55%)",
        strokeWidth: 1.5,
        duration: 8.5,
        delay: 0.3,
        opacity: 0.28,
      },
      {
        yOffset: 920,
        amplitude: 18,
        frequency: 2.2,
        strokeColor: "hsl(0, 0%, 40%)",
        strokeWidth: 1.1,
        duration: 13,
        delay: 1.2,
        opacity: 0.18,
      },
    ],
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* The SVG is rotated -30deg so wave lines flow diagonally upward left→right */}
      {mounted && (
        <svg
          className="absolute"
          style={{
            width: "200%",
            height: "200%",
            top: "-50%",
            left: "-50%",
            transform: "rotate(-30deg)",
          }}
          viewBox="0 0 2000 1200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {waves.map((wave, i) => (
            <WaveLine key={i} wave={wave} />
          ))}
        </svg>
      )}

      {/* Gradient overlays for depth (grayscale) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, hsl(0 0% 60% / 0.06), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 70% 30%, hsl(0 0% 50% / 0.04), transparent 60%)",
        }}
      />
    </div>
  );
}

function WaveLine({ wave }: { wave: WaveConfig }) {
  const path1 = generateWavePath(
    wave.yOffset,
    wave.amplitude,
    wave.frequency,
    2000,
    0,
  );
  const path2 = generateWavePath(
    wave.yOffset,
    wave.amplitude,
    wave.frequency,
    2000,
    Math.PI * 2,
  );

  return (
    <motion.path
      d={path1}
      fill="none"
      stroke={wave.strokeColor}
      strokeWidth={wave.strokeWidth}
      strokeLinecap="round"
      opacity={wave.opacity}
      animate={{
        d: [path1, path2, path1],
        translateX: [0, -200, 0],
        translateY: [0, -60, 0],
      }}
      transition={{
        duration: wave.duration,
        delay: wave.delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
