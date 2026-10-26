import React from 'react';
import { NetworkInfo, ServerLocation } from '../types';
import { Globe, Server, MapPin, Wifi, ShieldCheck, ChevronDown } from 'lucide-react';

interface NetworkInfoCardProps {
  networkInfo: NetworkInfo | null;
  isLoading: boolean;
  selectedServer: ServerLocation;
  onOpenServerSelect: () => void;
  disabled?: boolean;
}

export const NetworkInfoCard: React.FC<NetworkInfoCardProps> = ({
  networkInfo,
  isLoading,
  selectedServer,
  onOpenServerSelect,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Client Network Identity Card */}
      <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Your Network
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Detected
              </span>
            </div>
            <div className="text-sm font-semibold text-white mt-0.5 truncate max-w-[220px] sm:max-w-[280px]">
              {isLoading ? (
                <span className="animate-pulse text-slate-500">Detecting ISP...</span>
              ) : (
                networkInfo?.isp || 'Broadband Connection'
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
              <span>{isLoading ? '...' : networkInfo?.ip || '127.0.0.1'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                {isLoading ? '...' : `${networkInfo?.city || 'Local Area'}, ${networkInfo?.country || ''}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Server Card with Selection Button */}
      <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mt-0.5">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Test Server
              </span>
              <span className="text-xs">{selectedServer.flag}</span>
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">
              {selectedServer.name}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
              <span>{selectedServer.city}, {selectedServer.country}</span>
              <span>•</span>
              <span className="text-cyan-400/90">{selectedServer.distanceKm} km</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenServerSelect}
          disabled={disabled}
          aria-label="Change speed test server"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
        >
          <span>Change</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
};
