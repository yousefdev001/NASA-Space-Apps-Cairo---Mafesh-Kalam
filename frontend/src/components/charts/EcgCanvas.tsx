import React, { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface EcgCanvasProps {
  bpm?: number;
  height?: number;
  className?: string;
  isNominal?: boolean;
}

export const EcgCanvas: React.FC<EcgCanvasProps> = ({
  bpm = 62,
  height = 140,
  className,
  isNominal = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    // Standard P-Q-R-S-T wave function
    const getEcgPoint = (x: number, width: number, bpmVal: number) => {
      // Period based on heart rate
      const period = (60 / bpmVal) * 120; // pixels per cardiac cycle
      const cyclePos = (x % period) / period; // 0 to 1

      // Baseline mid-height
      const mid = height / 2;

      // P wave
      if (cyclePos > 0.15 && cyclePos < 0.25) {
        return mid - Math.sin((cyclePos - 0.15) * Math.PI * 10) * (height * 0.1);
      }
      // Q dip
      if (cyclePos >= 0.32 && cyclePos < 0.35) {
        return mid + 6;
      }
      // R spike
      if (cyclePos >= 0.35 && cyclePos < 0.40) {
        return mid - (height * 0.42);
      }
      // S dip
      if (cyclePos >= 0.40 && cyclePos < 0.44) {
        return mid + (height * 0.15);
      }
      // T wave
      if (cyclePos > 0.55 && cyclePos < 0.72) {
        return mid - Math.sin((cyclePos - 0.55) * Math.PI * 5.88) * (height * 0.16);
      }

      // Small baseline micro-noise (realistic telemetry)
      return mid + (Math.sin(x * 0.1) * 0.6);
    };

    const draw = () => {
      const width = canvas.width;
      const h = canvas.height;

      // Clear background
      ctx.fillStyle = '#050B14';
      ctx.fillRect(0, 0, width, h);

      // Draw ECG Medical Grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(30, 58, 95, 0.25)';
      const gridSize = 20;

      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Lead line
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isNominal ? '#00E5FF' : '#EF4444';
      ctx.shadowColor = isNominal ? '#00E5FF' : '#EF4444';
      ctx.shadowBlur = 8;

      const speed = (bpm / 60) * 2.2;
      offset += speed;

      for (let x = 0; x < width; x++) {
        const y = getEcgPoint(x + offset, width, bpm);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Scan-line cursor
      const cursorX = (offset * 1.5) % width;
      ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.fillRect(cursorX, 0, 2, h);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [bpm, height, isNominal]);

  return (
    <div className={clsx('relative w-full rounded-xl border border-[#1E3A5F] overflow-hidden bg-[#050B14]', className)}>
      <div className="absolute top-2.5 left-4 z-10 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-[11px] font-mono tracking-wider uppercase text-cyan-300 font-semibold">
          Lead II ECG Array · 500 Hz Real-Time
        </span>
      </div>
      <div className="absolute top-2.5 right-4 z-10 font-mono text-xs text-slate-400">
        <span className="text-cyan-400 font-bold">{bpm}</span> BPM · Regular Sinus
      </div>
      <canvas ref={canvasRef} className="block w-full" style={{ height }} />
    </div>
  );
};
