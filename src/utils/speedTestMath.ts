/**
 * Pure calculation algorithms for network speed, latency, jitter, and connection rating.
 */

export interface PingMetrics {
  ping: number; // minimum or median RTT in ms
  jitter: number; // jitter variation in ms
  avgPing: number;
  minPing: number;
  maxPing: number;
  samples: number[];
}

export interface SpeedMeasurement {
  bytes: number;
  durationMs: number;
  mbps: number;
}

export interface ConnectionRating {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  streamingQuality: string;
  gamingQuality: string;
  videoCallQuality: string;
  summary: string;
}

/**
 * Calculates RFC 3550 standard network jitter and stats from a series of RTT latency samples (in ms).
 * Jitter = average deviation between consecutive ping samples.
 */
export function calculateLatencyStats(samples: number[]): PingMetrics {
  if (!samples || samples.length === 0) {
    return { ping: 0, jitter: 0, avgPing: 0, minPing: 0, maxPing: 0, samples: [] };
  }

  // Filter out any invalid numbers
  const valid = samples.filter((s) => typeof s === 'number' && !isNaN(s) && s >= 0);
  if (valid.length === 0) {
    return { ping: 0, jitter: 0, avgPing: 0, minPing: 0, maxPing: 0, samples: [] };
  }

  const sorted = [...valid].sort((a, b) => a - b);
  // Median or minimum is often used for raw baseline latency; median protects against single outliers
  const medianPing =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const minPing = sorted[0];
  const maxPing = sorted[sorted.length - 1];
  const avgPing = valid.reduce((sum, v) => sum + v, 0) / valid.length;

  // RFC 3550 jitter calculation based on successive difference
  let jitter = 0;
  if (valid.length > 1) {
    let diffSum = 0;
    for (let i = 1; i < valid.length; i++) {
      diffSum += Math.abs(valid[i] - valid[i - 1]);
    }
    jitter = diffSum / (valid.length - 1);
  }

  return {
    ping: Math.round(minPing * 10) / 10,
    jitter: Math.round(jitter * 10) / 10,
    avgPing: Math.round(avgPing * 10) / 10,
    minPing: Math.round(minPing * 10) / 10,
    maxPing: Math.round(maxPing * 10) / 10,
    samples: valid,
  };
}

/**
 * Calculates throughput in Megabits per second (Mbps).
 * 1 byte = 8 bits.
 * Mbps = (bytes * 8) / (durationInSeconds * 1,000,000)
 */
export function calculateSpeedMbps(bytes: number, durationMs: number): number {
  if (durationMs <= 0 || bytes <= 0) return 0;
  const durationSec = durationMs / 1000;
  const bits = bytes * 8;
  const mbps = bits / (durationSec * 1_000_000);
  return Math.round(mbps * 100) / 100;
}

/**
 * Exponential Moving Average (EMA) smoothing for stable dial/gauge animation
 * alpha between 0 and 1 (typically 0.15 - 0.3 for responsive yet smooth needle)
 */
export function smoothValue(current: number, target: number, alpha: number = 0.2): number {
  return current + alpha * (target - current);
}

/**
 * Calculates percentile from a list of speeds
 */
export function calculatePercentile(values: number[], percentile: number = 90): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    Math.floor((percentile / 100) * sorted.length),
    sorted.length - 1
  );
  return sorted[index];
}

/**
 * Connection quality evaluator based on modern telecommunications benchmarks:
 * - Ping & Jitter for latency-sensitive applications (VoIP, competitive gaming)
 * - Download throughput for 4K/8K UHD streaming and fast file downloads
 * - Upload throughput for live broadcasting and video conferencing
 */
export function evaluateConnection(
  ping: number,
  jitter: number,
  downloadMbps: number,
  uploadMbps: number
): ConnectionRating {
  if (downloadMbps === 0 && uploadMbps === 0) {
    return {
      grade: 'F',
      label: 'No Connection',
      streamingQuality: 'None',
      gamingQuality: 'Unplayable',
      videoCallQuality: 'Disconnected',
      summary: 'Network test failed or has not started yet.',
    };
  }

  let score = 100;

  // Latency scoring (0-30 pts penalty)
  if (ping > 150) score -= 30;
  else if (ping > 80) score -= 20;
  else if (ping > 45) score -= 10;
  else if (ping > 25) score -= 5;

  // Jitter penalty (0-20 pts)
  if (jitter > 30) score -= 20;
  else if (jitter > 15) score -= 10;
  else if (jitter > 5) score -= 5;

  // Download bandwidth (0-25 pts penalty)
  if (downloadMbps < 5) score -= 25;
  else if (downloadMbps < 25) score -= 15;
  else if (downloadMbps < 50) score -= 5;

  // Upload bandwidth (0-25 pts penalty)
  if (uploadMbps < 2) score -= 25;
  else if (uploadMbps < 10) score -= 12;
  else if (uploadMbps < 20) score -= 5;

  let grade: ConnectionRating['grade'] = 'A+';
  let label = 'Exceptional Fiber Quality';
  if (score >= 90) {
    grade = 'A+';
    label = 'Ultra-High Speed Gigabit';
  } else if (score >= 80) {
    grade = 'A';
    label = 'High Speed Broadband';
  } else if (score >= 68) {
    grade = 'B';
    label = 'Standard Broadband';
  } else if (score >= 50) {
    grade = 'C';
    label = 'Moderate Speed';
  } else if (score >= 35) {
    grade = 'D';
    label = 'Sub-par / High Latency';
  } else {
    grade = 'F';
    label = 'Poor Connection';
  }

  // Capability descriptors
  const streamingQuality =
    downloadMbps >= 100
      ? 'Flawless 4K/8K HDR Multiple Streams'
      : downloadMbps >= 25
      ? 'Smooth 4K UHD Streaming'
      : downloadMbps >= 10
      ? 'Good 1080p Full HD'
      : '720p / SD Only';

  const gamingQuality =
    ping < 20 && jitter < 4
      ? 'Competitive Esports Ready (Ultra-low Latency)'
      : ping < 45 && jitter < 10
      ? 'Great Online Multiplayer'
      : ping < 80
      ? 'Playable / Casual Gaming'
      : 'Noticeable Lag / High Ping';

  const videoCallQuality =
    uploadMbps >= 20 && jitter < 10
      ? 'Crystal Clear HD Multi-party Video'
      : uploadMbps >= 5 && jitter < 20
      ? 'Stable HD Video Calls'
      : uploadMbps >= 1.5
      ? 'Standard Definition Audio/Video'
      : 'Audio Only / Choppy';

  return {
    grade,
    label,
    streamingQuality,
    gamingQuality,
    videoCallQuality,
    summary: `Ping: ${ping}ms | Download: ${downloadMbps} Mbps | Upload: ${uploadMbps} Mbps`,
  };
}

/**
 * Formats a speed number nicely
 */
export function formatSpeed(mbps: number): string {
  if (mbps >= 1000) {
    return (mbps / 1000).toFixed(2) + ' Gbps';
  }
  if (mbps >= 100) {
    return mbps.toFixed(1) + ' Mbps';
  }
  return mbps.toFixed(2) + ' Mbps';
}

/**
 * Formats data size in MB/GB
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
