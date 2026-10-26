export type TestPhase = 'idle' | 'connecting' | 'ping' | 'download' | 'upload' | 'completed' | 'error';

export type SpeedUnit = 'mbps' | 'MBps';

export interface ServerLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  distanceKm: number;
  simulatedExtraLatencyMs: number;
  sponsor: string;
}

export interface NetworkInfo {
  ip: string;
  isp: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
}

export interface TestMetrics {
  ping: number; // in ms
  jitter: number; // in ms
  download: number; // in Mbps
  upload: number; // in Mbps
  downloadBytes: number;
  uploadBytes: number;
}

export interface TestResult {
  id: string;
  timestamp: number;
  server: ServerLocation;
  metrics: TestMetrics;
  networkInfo: NetworkInfo;
  grade: string;
  gradeLabel: string;
}

export interface ChartDataPoint {
  timeSec: number;
  mbps: number;
  phase: 'download' | 'upload';
}
