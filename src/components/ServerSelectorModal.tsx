import React from 'react';
import { ServerLocation } from '../types';
import { GLOBAL_SERVERS } from '../utils/servers';
import { X, Check, Globe, MapPin, Zap } from 'lucide-react';

interface ServerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServer: ServerLocation;
  onSelectServer: (server: ServerLocation) => void;
}

export const ServerSelectorModal: React.FC<ServerSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedServer,
  onSelectServer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Select Test Server</h2>
              <p className="text-xs text-slate-400 font-mono">
                Compare latency variations across worldwide edge locations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close server selector"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server List */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {GLOBAL_SERVERS.map((server) => {
            const isSelected = server.id === selectedServer.id;
            return (
              <button
                key={server.id}
                onClick={() => {
                  onSelectServer(server);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{server.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {server.name}
                      </span>
                      {server.simulatedExtraLatencyMs === 0 && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Lowest Latency
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {server.city}, {server.country}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">{server.sponsor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1 justify-end">
                      <Zap className="w-3 h-3" />
                      {server.distanceKm} km
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {server.simulatedExtraLatencyMs > 0 ? `+${server.simulatedExtraLatencyMs}ms offset` : 'Direct link'}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                      isSelected
                        ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
