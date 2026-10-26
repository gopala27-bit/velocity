import React, { useState } from 'react';
import { TestResult, SpeedUnit } from '../types';
import { evaluateConnection } from '../utils/speedTestMath';
import {
  X,
  RotateCcw,
  Share2,
  Download,
  Copy,
  Check,
  Gamepad2,
  Tv,
  Video,
  Award,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ResultsSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResult | null;
  unit: SpeedUnit;
  onRetest: () => void;
}

export const ResultsSummaryModal: React.FC<ResultsSummaryModalProps> = ({
  isOpen,
  onClose,
  result,
  unit,
  onRetest,
}) => {
  const [copied, setCopied] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  if (!isOpen || !result) return null;

  const { metrics, server, networkInfo, timestamp } = result;
  const rating = evaluateConnection(metrics.ping, metrics.jitter, metrics.download, metrics.upload);

  const displayDownload =
    unit === 'MBps' ? (metrics.download / 8).toFixed(1) : metrics.download.toFixed(1);
  const displayUpload =
    unit === 'MBps' ? (metrics.upload / 8).toFixed(1) : metrics.upload.toFixed(1);
  const speedUnit = unit === 'MBps' ? 'MB/s' : 'Mbps';

  // Copy text summary to clipboard
  const handleCopySummary = async () => {
    const text = `⚡ VELOCITY SPEED TEST RESULTS
Download: ${displayDownload} ${speedUnit}
Upload: ${displayUpload} ${speedUnit}
Ping: ${metrics.ping.toFixed(1)} ms
Jitter: ${metrics.jitter.toFixed(1)} ms
Rating: Grade ${rating.grade} (${rating.label})
Server: ${server.name} (${server.city}, ${server.country})
ISP: ${networkInfo.isp}
Date: ${new Date(timestamp).toLocaleString()}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
    }
  };

  // Generate downloadable high-res branded PNG share image via HTML5 Canvas
  const handleDownloadImage = () => {
    setGeneratingImage(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGrad.addColorStop(0, '#020617'); // slate-950
    bgGrad.addColorStop(0.5, '#0b1329');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Subtle neon cyber grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 630);
      ctx.stroke();
    }
    for (let y = 0; y < 630; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }

    // Glowing corner accent
    const glowGrad = ctx.createRadialGradient(1000, 100, 10, 1000, 100, 300);
    glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
    glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(700, 0, 500, 400);

    // Header Logo
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('⚡ VELOCITY', 80, 85);

    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('HIGH-PRECISION NETWORK SPEED TEST', 80, 115);

    // Grade Badge
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.roundRect(960, 50, 160, 75, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
    ctx.stroke();

    ctx.font = 'bold 38px "JetBrains Mono", monospace';
    ctx.fillStyle = '#22d3ee';
    ctx.textAlign = 'center';
    ctx.fillText(`GRADE ${rating.grade}`, 1040, 102);
    ctx.textAlign = 'left';

    // Download Speed Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(80, 160, 490, 190, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.stroke();

    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('▼ DOWNLOAD SPEED', 110, 200);

    ctx.font = 'bold 72px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(displayDownload, 110, 280);

    ctx.font = '22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(speedUnit, 110 + ctx.measureText(displayDownload).width + 16, 280);

    // Upload Speed Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(630, 160, 490, 190, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.stroke();

    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#c084fc';
    ctx.fillText('▲ UPLOAD SPEED', 660, 200);

    ctx.font = 'bold 72px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(displayUpload, 660, 280);

    ctx.font = '22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(speedUnit, 660 + ctx.measureText(displayUpload).width + 16, 280);

    // Bottom telemetry cards: Ping & Jitter
    // Ping
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.roundRect(80, 380, 230, 100, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    ctx.stroke();

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('LATENCY (PING)', 105, 412);
    ctx.font = 'bold 32px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${metrics.ping.toFixed(1)} ms`, 105, 455);

    // Jitter
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.roundRect(340, 380, 230, 100, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    ctx.stroke();

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('JITTER (STABILITY)', 365, 412);
    ctx.font = 'bold 32px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${metrics.jitter.toFixed(1)} ms`, 365, 455);

    // ISP & Server
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.roundRect(600, 380, 520, 100, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
    ctx.stroke();

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`SERVER: ${server.name} (${server.city})`, 625, 415);
    ctx.fillText(`ISP: ${networkInfo.isp} • IP: ${networkInfo.ip}`, 625, 440);
    ctx.fillText(`DATE: ${new Date(timestamp).toLocaleDateString()} ${new Date(timestamp).toLocaleTimeString()}`, 625, 465);

    // Footer
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Verified with Velocity Speed Test Engine', 80, 560);

    // Download trigger
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `velocity-speedtest-${Date.now()}.png`;
      a.click();
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-2">
              <Sparkles className="w-3 h-3" />
              Test Completed
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Speed Test Results
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{new Date(timestamp).toLocaleString()}</span>
              <span>•</span>
              <span>{server.name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close summary modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {/* Download */}
          <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              ▼ Download
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl sm:text-5xl font-mono font-bold text-white">
                {displayDownload}
              </span>
              <span className="text-sm font-semibold text-cyan-300 font-mono">
                {speedUnit}
              </span>
            </div>
          </div>

          {/* Upload */}
          <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30">
            <span className="text-xs font-mono uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              ▲ Upload
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl sm:text-5xl font-mono font-bold text-white">
                {displayUpload}
              </span>
              <span className="text-sm font-semibold text-purple-300 font-mono">
                {speedUnit}
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Metrics: Ping, Jitter & Grade */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Ping</span>
            <div className="text-xl font-mono font-bold text-white mt-1">
              {metrics.ping.toFixed(1)} <span className="text-xs text-slate-400">ms</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Jitter</span>
            <div className="text-xl font-mono font-bold text-white mt-1">
              {metrics.jitter.toFixed(1)} <span className="text-xs text-slate-400">ms</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Grade</span>
            <div className="text-xl font-mono font-bold text-cyan-400 mt-1 flex items-center gap-1">
              <Award className="w-4 h-4 text-cyan-400" />
              {rating.grade}
            </div>
          </div>
        </div>

        {/* Connection Quality Breakdown */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Experience & Capability Analysis
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <Gamepad2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-slate-300">Gaming</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {rating.gamingQuality}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <Tv className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-slate-300">Streaming</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {rating.streamingQuality}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <Video className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-slate-300">Video Calls</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {rating.videoCallQuality}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Retest & Share */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              aria-label="Copy speed test summary"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={generatingImage}
              aria-label="Download speed test result card as PNG"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{generatingImage ? 'Generating...' : 'Download Card'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onRetest();
            }}
            aria-label="Run speed test again"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Test Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
