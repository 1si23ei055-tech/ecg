/** Realistic-ish synthetic ECG samples for demos (not clinical processing). */
export function generateEcgSamples(
  timestampSec: number,
  samplingRate: number,
  count: number,
  options: {
    heartRateBpm?: number;
    noise?: number;
    rhythmShift?: boolean;
  } = {},
): number[] {
  const heartRateBpm = options.heartRateBpm ?? 72 + Math.random() * 18;
  const noise = options.noise ?? 0.015 + Math.random() * 0.02;
  const rhythmShift = options.rhythmShift ?? false;
  const period = 60 / heartRateBpm;
  const samples: number[] = [];

  for (let i = 0; i < count; i++) {
    const t = timestampSec + i / samplingRate;
    const phase = ((t % period) / period) * 2 * Math.PI;
    const rate = rhythmShift ? 1.35 : 1;
    const qrs =
      Math.exp(-Math.pow((phase - Math.PI) * rate, 2) * 18) * 0.85 +
      Math.exp(-Math.pow((phase - 0.4 * Math.PI) * rate, 2) * 40) * 0.15;
    const baseline = Math.sin(t * 0.3) * 0.04;
    const value = qrs + baseline + (Math.random() - 0.5) * noise;
    samples.push(Number(value.toFixed(4)));
  }
  return samples;
}

export function pickSignalQuality(): string {
  const r = Math.random();
  if (r > 0.85) return "FAIR";
  if (r > 0.95) return "POOR";
  return "GOOD";
}
