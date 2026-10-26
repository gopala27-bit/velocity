/**
 * Velocity - High-Precision Modern Internet Speed Test
 * Full-stack benchmark application measuring Latency, RFC 3550 Jitter,
 * Multi-stream Download, and Upload Throughput.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TestPhase,
  SpeedUnit,
  ServerLocation,
  NetworkInfo,
  TestMetrics,
  TestResult,
  ChartDataPoint,
} from './types';
import { GLOBAL_SERVERS } from './utils/servers';
import { SpeedTestEngine } from './utils/speedEngine';
import { evaluateConnection, smoothValue } from './utils/speedTestMath';
import { soundEffects } from './utils/audio';

// Components
import { Navbar } from './components/Navbar';
import { SpeedGauge } from './components/SpeedGauge';
import { MetricsCards } from './components/MetricsCards';
import { LiveSpeedChart } from './components/LiveSpeedChart';
import { NetworkInfoCard } from './components/NetworkInfoCard';
import { ServerSelectorModal } from './components/ServerSelectorModal';
import { ResultsSummaryModal } from './components/ResultsSummaryModal';
import { HistoryModal } from './components/HistoryModal';
import { AlertCircle, HelpCircle, Shield, Cpu, RefreshCw } from 'lucide-react';

const STORAGE_KEY_HISTORY = 'velocity_speedtest_history_v1';
const STORAGE_KEY_UNIT = 'velocity_speedtest_unit';

export default function App() {
  // Test State
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [currentSpeedMbps, setCurrentSpeedMbps] = useState<number>(0);
  const [phaseProgress, setPhaseProgress] = useState<number>(0);
  const [metrics, setMetrics] = useState<TestMetrics>({
    ping: 0,
    jitter: 0,
    download: 0,
    upload: 0,
    downloadBytes: 0,
    uploadBytes: 0,
  });

  const [chartPoints, setChartPoints] = useState<ChartDataPoint[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Configuration & Server Selection
  const [selectedServer, setSelectedServer] = useState<ServerLocation>(GLOBAL_SERVERS[0]);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isNetworkLoading, setIsNetworkLoading] = useState<boolean>(true);

  // Settings
  const [unit, setUnit] = useState<SpeedUnit>(() => {
    return (localStorage.getItem(STORAGE_KEY_UNIT) as SpeedUnit) || 'mbps';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundEffects.isEnabled());

  // Modals
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);

  // Test History from localStorage
  const [history, setHistory] = useState<TestResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reference to active engine instance
  const engineRef = useRef<SpeedTestEngine | null>(null);
  const smoothedSpeedRef = useRef<number>(0);

  // Persist history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // quota or private mode
    }
  }, [history]);

  // Persist unit preference
  const handleToggleUnit = () => {
    setUnit((prev) => {
      const next = prev === 'mbps' ? 'MBps' : 'mbps';
      localStorage.setItem(STORAGE_KEY_UNIT, next);
      return next;
    });
  };

  // Toggle sound
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    soundEffects.setEnabled(nextVal);
    setSoundEnabled(nextVal);
  };

  // Fetch Client IP & Network Info from backend API
  const fetchNetworkInfo = useCallback(async () => {
    setIsNetworkLoading(true);
    try {
      const res = await fetch('/api/ip-info');
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data);
      } else {
        throw new Error('Fallback to local');
      }
    } catch {
      setNetworkInfo({
        ip: '192.168.1.102',
        isp: 'Local Broadband Gateway',
        city: 'Local Area',
        region: '',
        country: 'Global Mesh',
        countryCode: 'US',
      });
    } finally {
      setIsNetworkLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetworkInfo();
  }, [fetchNetworkInfo]);

  // Start Speed Test
  const handleStartTest = useCallback(() => {
    if (phase !== 'idle' && phase !== 'completed' && phase !== 'error') return;

    soundEffects.playStart();
    setErrorMessage(null);
    setCurrentSpeedMbps(0);
    smoothedSpeedRef.current = 0;
    setPhaseProgress(0);
    setChartPoints([]);
    setMetrics({
      ping: 0,
      jitter: 0,
      download: 0,
      upload: 0,
      downloadBytes: 0,
      uploadBytes: 0,
    });

    const engine = new SpeedTestEngine(selectedServer, {
      onPhaseChange: (newPhase) => {
        setPhase(newPhase);
        if (newPhase === 'ping' || newPhase === 'download' || newPhase === 'upload') {
          soundEffects.playPhaseChange();
        }
      },
      onProgress: (currentSpeed, progress) => {
        // Smooth speed indicator using Exponential Moving Average
        smoothedSpeedRef.current = smoothValue(smoothedSpeedRef.current, currentSpeed, 0.25);
        setCurrentSpeedMbps(smoothedSpeedRef.current);
        setPhaseProgress(progress);
      },
      onMetricsUpdate: (partialMetrics) => {
        setMetrics((prev) => ({ ...prev, ...partialMetrics }));
        if (partialMetrics.ping && partialMetrics.ping > 0) {
          soundEffects.playPing();
        }
      },
      onChartDataPoint: (point) => {
        setChartPoints((prev) => [...prev.slice(-60), point]);
      },
      onError: (msg) => {
        setErrorMessage(msg);
      },
      onComplete: (finalMetrics) => {
        soundEffects.playComplete();
        const rating = evaluateConnection(
          finalMetrics.ping,
          finalMetrics.jitter,
          finalMetrics.download,
          finalMetrics.upload
        );

        const newResult: TestResult = {
          id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          server: selectedServer,
          metrics: finalMetrics,
          networkInfo: networkInfo || {
            ip: '127.0.0.1',
            isp: 'Broadband',
            city: 'Local',
            region: '',
            country: 'Global',
            countryCode: 'US',
          },
          grade: rating.grade,
          gradeLabel: rating.label,
        };

        setLastResult(newResult);
        setHistory((prev) => [newResult, ...prev]);
        setIsResultModalOpen(true);
      },
    });

    engineRef.current = engine;
    engine.start();
  }, [phase, selectedServer, networkInfo]);

  // Stop / Cancel Test
  const handleStopTest = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
    setPhase('idle');
  };

  // Keyboard shortcut: Spacebar to trigger test when idle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.code === 'Space' || e.code === 'Enter') &&
        phase === 'idle' &&
        !isServerModalOpen &&
        !isHistoryModalOpen &&
        !isResultModalOpen
      ) {
        // Only trigger if not typing in an input
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          handleStartTest();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isServerModalOpen, isHistoryModalOpen, isResultModalOpen, handleStartTest]);

  // History management
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your test history?')) {
      setHistory([]);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grid-pattern selection:bg-cyan-500/20">
      {/* Top Navbar */}
      <Navbar
        unit={unit}
        onToggleUnit={handleToggleUnit}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        historyCount={history.length}
        onOpenServerModal={() => setIsServerModalOpen(true)}
        selectedServerName={selectedServer.name}
      />

      {/* Main Speed Test Dashboard Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center justify-start space-y-6">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="w-full flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm font-mono animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-400 hover:text-white px-2 py-1 rounded bg-rose-500/20"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Central Speed Gauge / Prominent GO Button */}
        <section aria-label="Speedometer and test control" className="w-full flex justify-center">
          <SpeedGauge
            phase={phase}
            speedMbps={currentSpeedMbps}
            progress={phaseProgress}
            unit={unit}
            onStart={handleStartTest}
            onStop={handleStopTest}
          />
        </section>

        {/* Metrics Telemetry Cards (Ping, Jitter, Download, Upload) */}
        <section aria-label="Real-time test telemetry" className="w-full">
          <MetricsCards metrics={metrics} phase={phase} unit={unit} />
        </section>

        {/* Live Real-time Throughput Graph (Shows during or after test) */}
        {(phase === 'download' || phase === 'upload' || chartPoints.length > 0) && (
          <section aria-label="Live speed graph" className="w-full animate-in fade-in duration-300">
            <LiveSpeedChart
              dataPoints={chartPoints}
              currentSpeed={currentSpeedMbps}
              unit={unit}
              activePhase={phase === 'upload' ? 'upload' : 'download'}
            />
          </section>
        )}

        {/* IP & Target Server Information Cards */}
        <section aria-label="Network and server details" className="w-full">
          <NetworkInfoCard
            networkInfo={networkInfo}
            isLoading={isNetworkLoading}
            selectedServer={selectedServer}
            onOpenServerSelect={() => setIsServerModalOpen(true)}
            disabled={phase !== 'idle' && phase !== 'completed' && phase !== 'error'}
          />
        </section>

        {/* Quick Keyboard Helper & Info Footer */}
        <div className="w-full flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">
                Space
              </kbd>{' '}
              to start
            </span>
            <span>•</span>
            <span className="text-slate-400">RFC 3550 Standard Jitter</span>
          </div>

          <div className="flex items-center gap-3 mt-1 sm:mt-0">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-cyan-500/80" />
              Secure Non-Cached Streams
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-500/80" />
              Multi-Threaded Engine
            </span>
          </div>
        </div>
      </main>

      {/* Global Server Selector Modal */}
      <ServerSelectorModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        selectedServer={selectedServer}
        onSelectServer={(srv) => {
          setSelectedServer(srv);
          if (engineRef.current) {
            engineRef.current.setServer(srv);
          }
        }}
      />

      {/* Results Summary & Share Modal */}
      <ResultsSummaryModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        result={lastResult}
        unit={unit}
        onRetest={handleStartTest}
      />

      {/* History Log Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        unit={unit}
        onClearHistory={handleClearHistory}
        onDeleteResult={handleDeleteHistoryItem}
      />
    </div>
  );
}
