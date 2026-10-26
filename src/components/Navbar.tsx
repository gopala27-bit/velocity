import React from 'react';
import { SpeedUnit } from '../types';
import { Zap, Volume2, VolumeX, History, Server, Info } from 'lucide-react';

interface NavbarProps {
  unit: SpeedUnit;
  onToggleUnit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onOpenServerModal: () => void;
  selectedServerName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  unit,
  onToggleUnit,
  soundEnabled,
  onToggleSound,
  onOpenHistory,
  historyCount,
  onOpenServerModal,
  selectedServerName,
}) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Zap className="w-5 h-5 fill-current stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-lg text-white font-mono">
                VELOCITY
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              PRECISION INTERNET SPEED BENCHMARK
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Unit Toggle Button */}
          <button
            onClick={onToggleUnit}
            aria-label="Toggle speed units between Mbps and MB/s"
            className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
            title="Toggle measurement unit"
          >
            Unit: <span className="text-cyan-400 font-bold">{unit === 'mbps' ? 'Mbps' : 'MB/s'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Disable audio feedback' : 'Enable audio feedback'}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
            title={soundEnabled ? 'Audio cues enabled' : 'Audio cues muted'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Test History Button */}
          <button
            onClick={onOpenHistory}
            aria-label="Open test history log"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
