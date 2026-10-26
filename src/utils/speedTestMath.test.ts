import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLatencyStats,
  calculateSpeedMbps,
  smoothValue,
  evaluateConnection,
  formatSpeed,
  formatBytes,
} from './speedTestMath';

test('calculateLatencyStats accurately computes min, avg, max, and RFC 3550 jitter', () => {
  const empty = calculateLatencyStats([]);
  assert.equal(empty.ping, 0);
  assert.equal(empty.jitter, 0);

  // Ping samples: 20ms, 24ms, 21ms, 25ms, 20ms
  // Consecutive absolute differences: |24-20|=4, |21-24|=3, |25-21|=4, |20-25|=5
  // Sum of diffs = 16, count = 4 -> jitter = 4ms
  const samples = [20, 24, 21, 25, 20];
  const stats = calculateLatencyStats(samples);

  assert.equal(stats.minPing, 20);
  assert.equal(stats.maxPing, 25);
  assert.equal(stats.avgPing, 22);
  assert.equal(stats.jitter, 4);
});

test('calculateSpeedMbps converts transferred bytes and duration into megabits per second', () => {
  // 12.5 Megabytes = 12,500,000 bytes = 100,000,000 bits = 100 Megabits in 1 second (1000ms)
  const bytes = 12_500_000;
  const durationMs = 1000;
  const mbps = calculateSpeedMbps(bytes, durationMs);
  assert.equal(mbps, 100);

  // Zero duration or zero bytes safeguard
  assert.equal(calculateSpeedMbps(0, 1000), 0);
  assert.equal(calculateSpeedMbps(1000, 0), 0);
});

test('smoothValue applies exponential smoothing correctly', () => {
  const current = 10;
  const target = 20;
  // with alpha 0.5: 10 + 0.5 * (20 - 10) = 15
  assert.equal(smoothValue(current, target, 0.5), 15);
});

test('evaluateConnection grades fast low-latency fiber appropriately', () => {
  const excellent = evaluateConnection(12, 1.5, 350, 120);
  assert.equal(excellent.grade, 'A+');
  assert.match(excellent.gamingQuality, /Esports/i);
  assert.match(excellent.streamingQuality, /4K/i);

  const poor = evaluateConnection(180, 45, 3.2, 0.8);
  assert.equal(poor.grade, 'F');
});

test('formatSpeed and formatBytes format display units accurately', () => {
  assert.equal(formatSpeed(45.67), '45.67 Mbps');
  assert.equal(formatSpeed(1250), '1.25 Gbps');

  assert.equal(formatBytes(1048576), '1 MB');
  assert.equal(formatBytes(0), '0 B');
});
