import React, { useEffect, useRef } from 'react';
import { ChartDataPoint, SpeedUnit } from '../types';

interface LiveSpeedChartProps {
  dataPoints: ChartDataPoint[];
  currentSpeed: number;
  unit: SpeedUnit;
  activePhase: 'download' | 'upload' | 'other';
}

export const LiveSpeedChart: React.FC<LiveSpeedChartProps> = ({
  dataPoints,
  currentSpeed,
  unit,
  activePhase,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Padding
    const padX = 36;
    const padY = 24;
    const graphWidth = width - padX * 2;
    const graphHeight = height - padY * 2;

    // Determine max scale
    const maxVal = Math.max(
      ...dataPoints.map((d) => (unit === 'MBps' ? d.mbps / 8 : d.mbps)),
      unit === 'MBps' ? currentSpeed / 8 : currentSpeed,
      25
    );
    const scaleCeil = Math.ceil(maxVal * 1.25);

    // Draw horizontal grid lines
    const gridLines = 4;
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)'; // slate-700
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let i = 0; i <= gridLines; i++) {
      const y = padY + (graphHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(width - padX, y);
      ctx.stroke();

      // Axis label
      const val = Math.round(scaleCeil - (scaleCeil / gridLines) * i);
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${val}`, padX - 8, y + 3);
    }
    ctx.setLineDash([]);

    if (dataPoints.length === 0) {
      // Empty placeholder state
      ctx.fillStyle = '#475569';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Real-time throughput waveform will render here during test', width / 2, height / 2);
      return;
    }

    // Separate by phase or plot continuous points
    const points = dataPoints.map((dp, idx) => {
      const val = unit === 'MBps' ? dp.mbps / 8 : dp.mbps;
      const x = padX + (idx / Math.max(dataPoints.length - 1, 1)) * graphWidth;
      const y = padY + graphHeight - (val / scaleCeil) * graphHeight;
      return { x, y, phase: dp.phase, val };
    });

    // Create gradient fill
    const isUpload = activePhase === 'upload';
    const gradient = ctx.createLinearGradient(0, padY, 0, height - padY);
    if (isUpload) {
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.35)'); // purple
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0.0)');
    } else {
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)'); // cyan
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
    }

    // Draw filled area
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padY);
    ctx.lineTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cx, (prev.y + curr.y) / 2);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.lineTo(last.x, height - padY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw main stroke line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cx, (prev.y + curr.y) / 2);
    }
    ctx.lineTo(last.x, last.y);
    ctx.strokeStyle = isUpload ? '#c084fc' : '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = isUpload ? 'rgba(192, 132, 252, 0.8)' : 'rgba(34, 211, 238, 0.8)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing dot at current tip
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = isUpload ? '#d946ef' : '#06b6d4';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [dataPoints, currentSpeed, unit, activePhase]);

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400">
            Live Speed Graph
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400/80 inline-block" />
            Download
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-400/80 inline-block" />
            Upload
          </span>
        </div>
      </div>
      <div className="relative w-full h-36">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
