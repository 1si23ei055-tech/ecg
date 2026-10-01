import { z } from "zod";
import { normalizeDeviceId } from "@/lib/ecg/device-id";
import { generateEcgSamples } from "@/lib/ecg/synthetic";

export const ecgIngestBodySchema = z.object({
  deviceId: z.string().min(1),
  sequenceNumber: z.number().int().nonnegative(),
  timestamp: z.number().int().positive(),
  samplingRate: z.number().int().positive(),
  samples: z.array(z.number()).min(1),
  eventFlag: z.number().int().min(0).max(1).optional(),
  changePointScore: z.number().min(0).max(1).optional(),
  signalQuality: z.string().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  preEventSamples: z.array(z.number()).optional(),
  postEventSamples: z.array(z.number()).optional(),
  changePointIndex: z.number().int().nonnegative().optional(),
});

export type EcgIngestBody = z.infer<typeof ecgIngestBodySchema>;

/** Parse comma-separated ESP32 line: ECG001, 10234, 1726570937, 250, ECG_DATA, 1, 0.82, GOOD, 78 */
export function parseEcgLine(line: string): EcgIngestBody | null {
  const parts = line.split(",").map((p) => p.trim());
  if (parts.length < 9) return null;

  const samplesPart = parts[4];
  let samples: number[];
  if (samplesPart === "ECG_DATA" || samplesPart === "SYNTH") {
    samples = synthesizeSamples(Number(parts[2]), Number(parts[3]));
  } else {
    samples = samplesPart.split(/\s+/).map(Number).filter((n) => !Number.isNaN(n));
    if (samples.length === 0) {
      samples = synthesizeSamples(Number(parts[2]), Number(parts[3]));
    }
  }

  return {
    deviceId: normalizeDeviceId(parts[0]),
    sequenceNumber: Number(parts[1]),
    timestamp: Number(parts[2]),
    samplingRate: Number(parts[3]),
    samples,
    eventFlag: Number(parts[5]),
    changePointScore: Number(parts[6]),
    signalQuality: parts[7],
    batteryLevel: Number(parts[8]),
  };
}

function synthesizeSamples(timestamp: number, samplingRate: number): number[] {
  const count = Math.min(50, Math.floor(samplingRate / 5));
  return generateEcgSamples(timestamp, samplingRate, count, {
    heartRateBpm: 68 + Math.random() * 25,
    noise: 0.01 + Math.random() * 0.03,
    rhythmShift: Math.random() > 0.92,
  });
}

export function generateSyntheticWindow(
  samplingRate: number,
  preSeconds: number,
  postSeconds: number,
  eventOffsetSeconds: number,
): { preEventSamples: number[]; postEventSamples: number[]; changePointIndex: number } {
  const preCount = Math.floor(preSeconds * samplingRate);
  const postCount = Math.floor(postSeconds * samplingRate);
  const changePointIndex = Math.floor(eventOffsetSeconds * samplingRate);
  const preEventSamples = Array.from({ length: preCount }, (_, i) =>
    sampleAt(i, samplingRate, false),
  );
  const postEventSamples = Array.from({ length: postCount }, (_, i) =>
    sampleAt(preCount + i, samplingRate, i > changePointIndex),
  );
  return { preEventSamples, postEventSamples, changePointIndex };
}

function sampleAt(index: number, samplingRate: number, afterChange: boolean): number {
  const t = index / samplingRate;
  const rate = afterChange ? 1.45 : 1.2;
  const amp = afterChange ? 0.55 : 0.4;
  return Number(
    (
      Math.sin(2 * Math.PI * rate * t) * amp +
      Math.sin(2 * Math.PI * 0.05 * t) * 0.08 +
      (Math.random() - 0.5) * 0.015
    ).toFixed(4),
  );
}
