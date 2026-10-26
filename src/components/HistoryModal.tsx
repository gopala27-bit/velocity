import React, { useState } from 'react';
import { TestResult, SpeedUnit } from '../types';
import {
  X,
  History,
  Trash2,
  FileDown,
  ArrowDown,
  ArrowUp,
  Activity,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: TestResult[];
  unit: SpeedUnit;
  onClearHistory: () => void;
  onDeleteResult: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  unit,
  onClearHistory,
  onDeleteResult,
}) => {
  const [filter, setFilter] = useState<'all' | 'highest'>('all');

  if (!isOpen) return null;

  const sortedHistory = [...history].sort((a, b) => {
    if (filter === 'highest') {
      return b.metrics.download - a.metrics.download;
    }
    return b.timestamp - a.timestamp;
  });

  const speedUnit = unit === 'MBps' ? 'MB/s' : 'Mbps';
  const formatVal = (mbps: number) => {
    const val = unit === 'MBps' ? mbps / 8 : mbps;
    return val >= 100 ? val.toFixed(1) : val.toFixed(2);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = ['Timestamp', 'Date', 'Server', 'ISP', 'IP', 'Ping (ms)', 'Jitter (ms)', 'Download (Mbps)', 'Upload (Mbps)', 'Grade'];
    const rows = history.map((item) => [
      item.timestamp,
      `"${new Date(item.timestamp).toISOString()}"`,
      `"${item.server.name}"`,
      `"${item.networkInfo.isp}"`,
      `"${item.networkInfo.ip}"`,
      item.metrics.ping.toFixed(1),
      item.metrics.jitter.toFixed(1),
      item.metrics.download.toFixed(2),
      item.metrics.upload.toFixed(2),
      item.grade,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `velocity_speedtest_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Test History Log</h2>
              <p className="text-xs text-slate-400 font-mono">
                {history.length} {history.length === 1 ? 'record' : 'records'} saved locally
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close history modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: filter & actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 my-4 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs font-mono">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Latest First
            </button>
            <button
              onClick={() => setFilter('highest')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filter === 'highest'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Highest Speed
            </button>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleExportCSV}
                  aria-label="Export history to CSV"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={onClearHistory}
                  aria-label="Clear all test history"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {sortedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-base font-semibold text-slate-400">No speed test records yet</p>
              <p className="text-xs text-slate-500 font-mono mt-1 max-w-sm">
                Run your first speed test by clicking the central "GO" button to log and analyze performance trends.
              </p>
            </div>
          ) : (
            sortedHistory.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {item.server.name}
                    </span>
                    <span className="text-xs">{item.server.flag}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Grade {item.grade}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className="truncate max-w-[150px]">{item.networkInfo.isp}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto">
                  {/* Download */}
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-cyan-400 uppercase flex items-center justify-end gap-1">
                      <ArrowDown className="w-3 h-3" /> Down
                    </div>
                    <div className="text-base font-mono font-bold text-white">
                      {formatVal(item.metrics.download)} <span className="text-[10px] text-slate-400">{speedUnit}</span>
                    </div>
                  </div>

                  {/* Upload */}
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-purple-400 uppercase flex items-center justify-end gap-1">
                      <ArrowUp className="w-3 h-3" /> Up
                    </div>
                    <div className="text-base font-mono font-bold text-white">
                      {formatVal(item.metrics.upload)} <span className="text-[10px] text-slate-400">{speedUnit}</span>
                    </div>
                  </div>

                  {/* Ping */}
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-amber-400 uppercase flex items-center justify-end gap-1">
                      <Activity className="w-3 h-3" /> Ping
                    </div>
                    <div className="text-base font-mono font-bold text-white">
                      {item.metrics.ping.toFixed(0)} <span className="text-[10px] text-slate-400">ms</span>
                    </div>
                  </div>

                  {/* Delete Item */}
                  <button
                    onClick={() => onDeleteResult(item.id)}
                    aria-label={`Delete record from ${new Date(item.timestamp).toLocaleDateString()}`}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
