import React from 'react';
import { TestMetrics, TestPhase, SpeedUnit } from '../types';
import { ArrowDown, ArrowUp, Activity, Waves } from 'lucide-react';

interface MetricsCardsProps {
  metrics: TestMetrics;
  phase: TestPhase;
  unit: SpeedUnit;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics, phase, unit }) => {
  const isDownloadActive = phase === 'download';
  const isUploadActive = phase === 'upload';
  const isPingActive = phase === 'ping';

  const formatSpeedVal = (mbps: number) => {
    if (mbps === 0) return '--';
    const val = unit === 'MBps' ? mbps / 8 : mbps;
    if (val >= 100) return val.toFixed(1);
    return val.toFixed(2);
  };

  const speedUnitLabel = unit === 'MBps' ? 'MB/s' : 'Mbps';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full">
      {/* Ping Card */}
      <div
        className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 ${
          isPingActive
            ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            Ping
          </span>
          <span className="text-[11px] font-mono text-slate-500">RTT</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
            {metrics.ping > 0 ? metrics.ping.toFixed(1) : '--'}
          </span>
          <span className="text-xs font-mono text-slate-400">ms</span>
        </div>
      </div>

      {/* Jitter Card */}
      <div
        className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 ${
          isPingActive
            ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-amber-400" />
            Jitter
          </span>
          <span className="text-[11px] font-mono text-slate-500">Var</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
            {metrics.jitter > 0 ? metrics.jitter.toFixed(1) : '--'}
          </span>
          <span className="text-xs font-mono text-slate-400">ms</span>
        </div>
      </div>

      {/* Download Card */}
      <div
        className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 ${
          isDownloadActive
            ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/30'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2 gap-1">
          <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
            Download
          </span>
          <span className="text-[10px] font-mono text-cyan-400/80 truncate text-right">
            {metrics.downloadBytes > 0 ? `${(metrics.downloadBytes / (1024 * 1024)).toFixed(1)} MB` : ''}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
            {formatSpeedVal(metrics.download)}
          </span>
          <span className="text-xs font-mono text-slate-400">{speedUnitLabel}</span>
        </div>
      </div>

      {/* Upload Card */}
      <div
        className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 ${
          isUploadActive
            ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/30'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2 gap-1">
          <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <ArrowUp className="w-3.5 h-3.5 text-purple-400" />
            Upload
          </span>
          <span className="text-[10px] font-mono text-purple-400/80 truncate text-right">
            {metrics.uploadBytes > 0 ? `${(metrics.uploadBytes / (1024 * 1024)).toFixed(1)} MB` : ''}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
            {formatSpeedVal(metrics.upload)}
          </span>
          <span className="text-xs font-mono text-slate-400">{speedUnitLabel}</span>
        </div>
      </div>
    </div>
  );
};
