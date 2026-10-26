import React, { useMemo } from 'react';
import { TestPhase, SpeedUnit } from '../types';
import { smoothValue } from '../utils/speedTestMath';

interface SpeedGaugeProps {
  phase: TestPhase;
  speedMbps: number; // current live speed in Mbps
  progress: number; // 0 to 1 for the current phase
  unit: SpeedUnit;
  onStart: () => void;
  onStop: () => void;
}

export const SpeedGauge: React.FC<SpeedGaugeProps> = ({
  phase,
  speedMbps,
  progress,
  unit,
  onStart,
  onStop,
}) => {
  const isIdle = phase === 'idle';
  const isTesting = phase !== 'idle' && phase !== 'completed' && phase !== 'error';

  // Display value converted for selected unit (1 MB/s = 8 Mbps)
  const displayValue = useMemo(() => {
    const rawVal = unit === 'MBps' ? speedMbps / 8 : speedMbps;
    if (rawVal >= 1000) return (rawVal / 1000).toFixed(2);
    if (rawVal >= 100) return rawVal.toFixed(1);
    if (rawVal >= 10) return rawVal.toFixed(1);
    return rawVal.toFixed(2);
  }, [speedMbps, unit]);

  const unitLabel = unit === 'MBps' ? 'MB/s' : 'Mbps';

  // Gauge scale configuration: non-linear scale representing 0 to 1000+ Mbps
  // Scale thresholds: 0, 1, 5, 10, 25, 50, 100, 250, 500, 1000
  const ticks = [
    { val: 0, label: '0' },
    { val: 1, label: '1' },
    { val: 5, label: '5' },
    { val: 10, label: '10' },
    { val: 25, label: '25' },
    { val: 50, label: '50' },
    { val: 100, label: '100' },
    { val: 250, label: '250' },
    { val: 500, label: '500' },
    { val: 1000, label: '1G' },
  ];

  // Map speed to 0..1 ratio using log scale for realistic speedometer action
  const speedToRatio = (val: number): number => {
    if (val <= 0) return 0;
    if (val >= 1000) return 1;
    // Hybrid scale: 0-10 linear (25%), 10-100 log (35%), 100-1000 log (40%)
    if (val <= 10) {
      return (val / 10) * 0.25;
    } else if (val <= 100) {
      return 0.25 + (Math.log10(val / 10)) * 0.35;
    } else {
      return 0.60 + (Math.log10(val / 100)) * 0.40;
    }
  };

  const ratio = Math.min(Math.max(speedToRatio(speedMbps), 0), 1);

  // SVG Geometry
  const size = 380;
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2 - 12;
  const center = size / 2;

  // Arc angles: start at 135 deg (bottom-left) to 405 deg (bottom-right) -> 270 degree sweep
  const startAngle = 135;
  const sweepAngle = 270;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (sweepAngle / 360) * circumference;
  const strokeDashoffset = arcLength - ratio * arcLength;

  // Compute needle angle
  const needleAngle = startAngle + ratio * sweepAngle;

  // Helper for polar to cartesian
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const backgroundArcD = describeArc(center, center, radius, startAngle, startAngle + sweepAngle);

  // Theme color for phase
  const getPhaseColor = () => {
    switch (phase) {
      case 'download':
        return {
          stroke: 'url(#downloadGradient)',
          glow: 'rgba(6, 182, 212, 0.4)',
          text: 'text-cyan-400',
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        };
      case 'upload':
        return {
          stroke: 'url(#uploadGradient)',
          glow: 'rgba(168, 85, 247, 0.4)',
          text: 'text-purple-400',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        };
      case 'ping':
        return {
          stroke: 'url(#pingGradient)',
          glow: 'rgba(234, 179, 8, 0.4)',
          text: 'text-amber-400',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
      default:
        return {
          stroke: 'url(#defaultGradient)',
          glow: 'rgba(59, 130, 246, 0.3)',
          text: 'text-blue-400',
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        };
    }
  };

  const phaseColor = getPhaseColor();

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2">
      {/* Outer Glow Halo */}
      <div
        className="absolute w-[360px] h-[360px] rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-30"
        style={{
          background: isTesting
            ? phase === 'download'
              ? 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)'
              : phase === 'upload'
              ? 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(234,179,8,0.4) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-[340px] sm:w-[380px] h-[340px] sm:h-[380px]">
        {/* SVG Dial */}
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full transform transition-transform"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="downloadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <linearGradient id="uploadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            <linearGradient id="pingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>

            <linearGradient id="defaultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            {/* Filter for glowing neon stroke */}
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Outer Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius + 18}
            className="fill-none stroke-slate-800/40"
            strokeWidth="1"
            strokeDasharray="3 4"
          />

          {/* Background Track Arc */}
          <path
            d={backgroundArcD}
            className="fill-none stroke-slate-800/70"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Inner Accent Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius - 20}
            className="fill-none stroke-slate-800/50"
            strokeWidth="1"
          />

          {/* Scale Ticks and Labels */}
          {ticks.map((tick) => {
            const tickRatio = speedToRatio(tick.val);
            const tickAngle = startAngle + tickRatio * sweepAngle;
            const innerPoint = polarToCartesian(center, center, radius - 10, tickAngle);
            const outerPoint = polarToCartesian(center, center, radius + 10, tickAngle);
            const textPoint = polarToCartesian(center, center, radius - 28, tickAngle);

            const isActive = isTesting && ratio >= tickRatio;

            return (
              <g key={tick.val}>
                <line
                  x1={innerPoint.x}
                  y1={innerPoint.y}
                  x2={outerPoint.x}
                  y2={outerPoint.y}
                  className={`transition-colors duration-300 ${
                    isActive ? 'stroke-cyan-400 stroke-2' : 'stroke-slate-700 stroke-1'
                  }`}
                />
                <text
                  x={textPoint.x}
                  y={textPoint.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`text-[10px] font-mono select-none transition-colors duration-300 ${
                    isActive ? 'fill-cyan-300 font-semibold' : 'fill-slate-500'
                  }`}
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Live Progress Arc with Neon Glow */}
          {isTesting && (
            <path
              d={backgroundArcD}
              fill="none"
              stroke={phaseColor.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              filter="url(#gaugeGlow)"
              className="transition-[stroke-dashoffset] duration-150 ease-out"
            />
          )}

          {/* Needle Indicator */}
          {isTesting && (
            <g
              transform={`rotate(${needleAngle} ${center} ${center})`}
              className="transition-transform duration-100 ease-out"
            >
              <line
                x1={center}
                y1={center}
                x2={center + radius - 4}
                y2={center}
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="opacity-90"
              />
              <circle
                cx={center + radius - 6}
                cy={center}
                r="3.5"
                fill="#38bdf8"
                filter="url(#gaugeGlow)"
              />
            </g>
          )}
        </svg>

        {/* Central Display: Switches between big "GO" button and live digital speedometer */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isIdle ? (
            /* Prominent GO Button */
            <div className="relative group">
              {/* Outer pulsing ring */}
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-30 group-hover:opacity-75 blur-md animate-pulse transition duration-500" />
              <button
                onClick={onStart}
                aria-label="Start Speed Test"
                className="relative w-44 h-44 rounded-full bg-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 flex flex-col items-center justify-center cursor-pointer shadow-[0_0_35px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/40"
              >
                <span className="text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-cyan-400 group-hover:scale-105 transition-transform">
                  GO
                </span>
                <span className="text-xs uppercase tracking-wider text-cyan-400/80 mt-1 font-mono">
                  Start Test
                </span>
              </button>
            </div>
          ) : (
            /* Live Speedometer & Status Readout */
            <div className="flex flex-col items-center justify-center text-center p-4">
              {/* Phase status badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wide uppercase border mb-2 transition-all ${phaseColor.badge}`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                </span>
                {phase === 'connecting' && 'Connecting...'}
                {phase === 'ping' && 'Testing Ping'}
                {phase === 'download' && 'Testing Download'}
                {phase === 'upload' && 'Testing Upload'}
                {phase === 'completed' && 'Test Complete'}
                {phase === 'error' && 'Test Error'}
              </div>

              {/* Digital Speed Value */}
              <div className="flex items-baseline justify-center">
                <span className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {phase === 'ping' || phase === 'connecting' ? '--' : displayValue}
                </span>
              </div>

              {/* Unit Label */}
              <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase mt-1">
                {unitLabel}
              </span>

              {/* Action buttons */}
              {isTesting && (
                <button
                  onClick={onStop}
                  aria-label="Cancel speed test"
                  className="mt-3 px-3 py-1 rounded-md text-xs font-mono text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
                >
                  Cancel Test
                </button>
              )}

              {phase === 'completed' && (
                <button
                  onClick={onStart}
                  aria-label="Run speed test again from gauge"
                  className="mt-3 px-4 py-1.5 rounded-full text-xs font-mono font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] transition cursor-pointer"
                >
                  Test Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Phase step indicator track */}
      <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900/60 rounded-full border border-slate-800/80 backdrop-blur-sm text-xs font-mono">
        <PhaseStep
          label="Ping"
          isActive={phase === 'ping'}
          isDone={['download', 'upload', 'completed'].includes(phase)}
        />
        <div className="w-4 h-[1px] bg-slate-700" />
        <PhaseStep
          label="Download"
          isActive={phase === 'download'}
          isDone={['upload', 'completed'].includes(phase)}
        />
        <div className="w-4 h-[1px] bg-slate-700" />
        <PhaseStep
          label="Upload"
          isActive={phase === 'upload'}
          isDone={phase === 'completed'}
        />
      </div>
    </div>
  );
};

interface PhaseStepProps {
  label: string;
  isActive: boolean;
  isDone: boolean;
}

const PhaseStep: React.FC<PhaseStepProps> = ({ label, isActive, isDone }) => {
  return (
    <div
      className={`flex items-center gap-1.5 transition-colors ${
        isActive
          ? 'text-cyan-400 font-semibold'
          : isDone
          ? 'text-emerald-400'
          : 'text-slate-500'
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full transition-all ${
          isActive
            ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] scale-125 animate-pulse'
            : isDone
            ? 'bg-emerald-400'
            : 'bg-slate-700'
        }`}
      />
      <span>{label}</span>
    </div>
  );
};
