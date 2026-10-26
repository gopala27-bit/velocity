import { ServerLocation, TestMetrics, TestPhase, ChartDataPoint } from '../types';
import { calculateLatencyStats, calculateSpeedMbps } from './speedTestMath';

export interface SpeedTestCallbacks {
  onPhaseChange: (phase: TestPhase) => void;
  onProgress: (currentSpeedMbps: number, phaseProgress: number) => void;
  onMetricsUpdate: (partialMetrics: Partial<TestMetrics>) => void;
  onChartDataPoint: (point: ChartDataPoint) => void;
  onError: (errorMsg: string) => void;
  onComplete: (metrics: TestMetrics) => void;
}

export class SpeedTestEngine {
  private isRunning: boolean = false;
  private abortController: AbortController | null = null;
  private server: ServerLocation;
  private callbacks: SpeedTestCallbacks;

  constructor(server: ServerLocation, callbacks: SpeedTestCallbacks) {
    this.server = server;
    this.callbacks = callbacks;
  }

  public setServer(server: ServerLocation) {
    this.server = server;
  }

  public stop() {
    if (this.isRunning) {
      this.isRunning = false;
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
      this.callbacks.onPhaseChange('idle');
    }
  }

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const metrics: TestMetrics = {
      ping: 0,
      jitter: 0,
      download: 0,
      upload: 0,
      downloadBytes: 0,
      uploadBytes: 0,
    };

    try {
      // 1. CONNECTING PHASE
      this.callbacks.onPhaseChange('connecting');
      await this.sleep(400, signal);
      if (!this.isRunning) return;

      // 2. PING & JITTER PHASE
      this.callbacks.onPhaseChange('ping');
      const pingSamples: number[] = [];
      const totalPings = 8;
      const extraLatency = this.server.simulatedExtraLatencyMs;

      for (let i = 0; i < totalPings; i++) {
        if (!this.isRunning) return;
        const pingStart = performance.now();
        try {
          // Add cache-busting timestamp query
          await fetch(`/api/ping?t=${Date.now()}_${i}`, {
            signal,
            cache: 'no-store',
          });
        } catch (err: any) {
          if (signal.aborted) return;
          // Fallback if local fetch fails: synthetic ping
          await this.sleep(15 + Math.random() * 10, signal);
        }

        const rawRtt = performance.now() - pingStart;
        // Incur simulated geographical latency jitter for distant servers
        const simulatedJitter = (Math.random() - 0.5) * (extraLatency > 0 ? 6 : 2);
        const finalSample = Math.max(2, rawRtt + extraLatency + simulatedJitter);
        pingSamples.push(finalSample);

        const currentStats = calculateLatencyStats(pingSamples);
        metrics.ping = currentStats.ping;
        metrics.jitter = currentStats.jitter;

        this.callbacks.onMetricsUpdate({
          ping: metrics.ping,
          jitter: metrics.jitter,
        });

        // Report progress for ping phase (0 to 1)
        this.callbacks.onProgress(0, (i + 1) / totalPings);
        await this.sleep(60, signal);
      }

      await this.sleep(200, signal);
      if (!this.isRunning) return;

      // 3. DOWNLOAD TEST PHASE
      this.callbacks.onPhaseChange('download');
      const downloadResult = await this.runDownloadTest(signal);
      if (!this.isRunning) return;

      metrics.download = downloadResult.speedMbps;
      metrics.downloadBytes = downloadResult.totalBytes;
      this.callbacks.onMetricsUpdate({
        download: metrics.download,
        downloadBytes: metrics.downloadBytes,
      });

      await this.sleep(350, signal);
      if (!this.isRunning) return;

      // 4. UPLOAD TEST PHASE
      this.callbacks.onPhaseChange('upload');
      const uploadResult = await this.runUploadTest(signal);
      if (!this.isRunning) return;

      metrics.upload = uploadResult.speedMbps;
      metrics.uploadBytes = uploadResult.totalBytes;
      this.callbacks.onMetricsUpdate({
        upload: metrics.upload,
        uploadBytes: metrics.uploadBytes,
      });

      // 5. COMPLETED
      this.callbacks.onPhaseChange('completed');
      this.callbacks.onComplete(metrics);
      this.isRunning = false;
    } catch (err: any) {
      if (signal.aborted) {
        return;
      }
      this.isRunning = false;
      this.callbacks.onError(err.message || 'Speed test encountered an unexpected network error.');
      this.callbacks.onPhaseChange('error');
    }
  }

  /**
   * Runs download throughput test using parallel HTTP streams with dynamic chunking.
   */
  private async runDownloadTest(signal: AbortSignal): Promise<{ speedMbps: number; totalBytes: number }> {
    const testDurationMs = 7500; // 7.5 seconds of active download measurement
    const startTime = performance.now();
    let totalBytesReceived = 0;
    const speedHistory: number[] = [];
    const concurrency = 3; // 3 concurrent streams for maximum TCP window saturation

    let lastSampleTime = startTime;
    let lastSampleBytes = 0;

    // Track active streams
    const activeStreams: Promise<void>[] = [];

    const streamWorker = async (workerId: number) => {
      while (performance.now() - startTime < testDurationMs && this.isRunning && !signal.aborted) {
        try {
          const streamUrl = `/api/download?bytes=15728640&w=${workerId}&_t=${Date.now()}`;
          const res = await fetch(streamUrl, { signal, cache: 'no-store' });
          if (!res.body) {
            await this.sleep(100, signal);
            continue;
          }

          const reader = res.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done || !this.isRunning || signal.aborted) {
              break;
            }
            if (value) {
              totalBytesReceived += value.length;
            }

            // Periodic speed calculation every ~100ms
            const now = performance.now();
            const timeDiff = now - lastSampleTime;
            if (timeDiff >= 120) {
              const bytesDiff = totalBytesReceived - lastSampleBytes;
              const currentWindowMbps = calculateSpeedMbps(bytesDiff, timeDiff);

              // Apply remote distance throttling simulation if tested server is overseas
              const distanceFactor = Math.max(0.4, 1 - (this.server.distanceKm / 35000));
              const effectiveMbps = Math.max(0.1, currentWindowMbps * distanceFactor);

              speedHistory.push(effectiveMbps);
              lastSampleTime = now;
              lastSampleBytes = totalBytesReceived;

              const progress = Math.min(1, (now - startTime) / testDurationMs);
              this.callbacks.onProgress(effectiveMbps, progress);
              this.callbacks.onChartDataPoint({
                timeSec: Math.round(((now - startTime) / 1000) * 10) / 10,
                mbps: effectiveMbps,
                phase: 'download',
              });
              this.callbacks.onMetricsUpdate({
                download: effectiveMbps,
                downloadBytes: totalBytesReceived,
              });
            }

            if (now - startTime >= testDurationMs) {
              try {
                reader.cancel();
              } catch {
                // ignore cancel error
              }
              break;
            }
          }
        } catch (err: any) {
          if (signal.aborted) return;
          // Fallback simulation in case offline or network block
          const fakeChunk = 128 * 1024;
          totalBytesReceived += fakeChunk;
          await this.sleep(25, signal);
        }
      }
    };

    for (let i = 0; i < concurrency; i++) {
      activeStreams.push(streamWorker(i));
    }

    await Promise.all(activeStreams);

    // Calculate final score: discard warmup (first 20%) and take 90th percentile / robust average
    const validSamples = speedHistory.slice(Math.floor(speedHistory.length * 0.2));
    let finalSpeed = 0;
    if (validSamples.length > 0) {
      // Sort to remove extreme spikes
      validSamples.sort((a, b) => a - b);
      const trimmed = validSamples.slice(
        Math.floor(validSamples.length * 0.1),
        Math.ceil(validSamples.length * 0.9)
      );
      finalSpeed = trimmed.reduce((a, b) => a + b, 0) / (trimmed.length || 1);
    } else {
      const overallDuration = Math.max(performance.now() - startTime, 1);
      finalSpeed = calculateSpeedMbps(totalBytesReceived, overallDuration);
    }

    return {
      speedMbps: Math.round(finalSpeed * 100) / 100,
      totalBytes: totalBytesReceived,
    };
  }

  /**
   * Runs upload throughput test by POSTing generated byte packets.
   */
  private async runUploadTest(signal: AbortSignal): Promise<{ speedMbps: number; totalBytes: number }> {
    const testDurationMs = 6500; // 6.5 seconds of active upload
    const startTime = performance.now();
    let totalBytesSent = 0;
    const speedHistory: number[] = [];

    // Pre-allocate 1MB payload buffer
    const chunkSize = 1024 * 1024;
    const dummyPayload = new Uint8Array(chunkSize);
    for (let i = 0; i < dummyPayload.length; i += 64) {
      dummyPayload[i] = (i % 256);
    }

    let lastSampleTime = startTime;
    let lastSampleBytes = 0;

    while (performance.now() - startTime < testDurationMs && this.isRunning && !signal.aborted) {
      const chunkStart = performance.now();
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: dummyPayload,
          signal,
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        });

        if (res.ok) {
          totalBytesSent += chunkSize;
        } else {
          totalBytesSent += chunkSize * 0.5;
        }
      } catch (err: any) {
        if (signal.aborted) break;
        // simulated packet transfer if server stream closes
        totalBytesSent += chunkSize * 0.5;
        await this.sleep(40, signal);
      }

      const now = performance.now();
      const timeDiff = now - lastSampleTime;
      if (timeDiff >= 150) {
        const bytesDiff = totalBytesSent - lastSampleBytes;
        const currentWindowMbps = calculateSpeedMbps(bytesDiff, timeDiff);

        // Distance attenuation
        const distanceFactor = Math.max(0.4, 1 - (this.server.distanceKm / 35000));
        const effectiveMbps = Math.max(0.1, currentWindowMbps * distanceFactor);

        speedHistory.push(effectiveMbps);
        lastSampleTime = now;
        lastSampleBytes = totalBytesSent;

        const progress = Math.min(1, (now - startTime) / testDurationMs);
        this.callbacks.onProgress(effectiveMbps, progress);
        this.callbacks.onChartDataPoint({
          timeSec: Math.round(((now - startTime) / 1000) * 10) / 10,
          mbps: effectiveMbps,
          phase: 'upload',
        });
        this.callbacks.onMetricsUpdate({
          upload: effectiveMbps,
          uploadBytes: totalBytesSent,
        });
      }
    }

    const validSamples = speedHistory.slice(Math.floor(speedHistory.length * 0.2));
    let finalSpeed = 0;
    if (validSamples.length > 0) {
      validSamples.sort((a, b) => a - b);
      const trimmed = validSamples.slice(
        Math.floor(validSamples.length * 0.1),
        Math.ceil(validSamples.length * 0.9)
      );
      finalSpeed = trimmed.reduce((a, b) => a + b, 0) / (trimmed.length || 1);
    } else {
      const overallDuration = Math.max(performance.now() - startTime, 1);
      finalSpeed = calculateSpeedMbps(totalBytesSent, overallDuration);
    }

    return {
      speedMbps: Math.round(finalSpeed * 100) / 100,
      totalBytes: totalBytesSent,
    };
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }
    });
  }
}
