#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4004";
const DEVICE_ID = process.env.DEVICE_ID ?? "ECG_001";
const INTERVAL_MS = Number(process.env.INTERVAL_MS ?? 400);

let sequence = 10234;
let heartRate = 72;
let rhythmShift = false;

function generateEcgSamples(timestampSec, samplingRate, count) {
  const period = 60 / heartRate;
  const samples = [];
  for (let i = 0; i < count; i++) {
    const t = timestampSec + i / samplingRate;
    const phase = ((t % period) / period) * 2 * Math.PI;
    const rate = rhythmShift ? 1.35 : 1;
    const qrs =
      Math.exp(-Math.pow((phase - Math.PI) * rate, 2) * 18) * 0.85 +
      Math.exp(-Math.pow((phase - 0.4 * Math.PI) * rate, 2) * 40) * 0.15;
    const baseline = Math.sin(t * 0.25) * 0.05;
    const noise = (Math.random() - 0.5) * (0.01 + Math.random() * 0.04);
    samples.push(Number((qrs + baseline + noise).toFixed(4)));
  }
  return samples;
}

function pickSignalQuality() {
  const r = Math.random();
  if (r > 0.9) return "FAIR";
  if (r > 0.97) return "POOR";
  return "GOOD";
}

async function sendPacket({ eventFlag = 0, score = 0.82 } = {}) {
  if (Math.random() > 0.97) heartRate = 65 + Math.random() * 35;
  if (Math.random() > 0.985) rhythmShift = !rhythmShift;

  const timestamp = Math.floor(Date.now() / 1000);
  const samplingRate = 250;
  const battery = Math.max(18, 92 - Math.floor(sequence / 120) + Math.floor(Math.random() * 3));
  sequence += 1;

  const body = {
    deviceId: DEVICE_ID,
    sequenceNumber: sequence,
    timestamp,
    samplingRate,
    samples: generateEcgSamples(timestamp, samplingRate, 30 + Math.floor(Math.random() * 20)),
    eventFlag,
    changePointScore: score,
    signalQuality: pickSignalQuality(),
    batteryLevel: battery,
  };

  const headers = { "Content-Type": "application/json" };
  if (process.env.INGEST_API_KEY) headers["x-ingest-key"] = process.env.INGEST_API_KEY;

  const response = await fetch(`${BASE_URL}/api/ecg`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!response.ok) console.error("Ingest failed", response.status, await response.text());
  else {
    const json = await response.json();
    console.log("seq", sequence, "hr", heartRate.toFixed(0), rhythmShift ? "shift" : "stable", json.eventId ? `EVENT ${json.eventId}` : "ok");
  }
}

console.log(`Simulating varied ECG → ${BASE_URL} (${DEVICE_ID})`);

setInterval(() => {
  const triggerEvent = sequence % 35 === 0 || (Math.random() > 0.992 && sequence > 10240);
  sendPacket({ eventFlag: triggerEvent ? 1 : 0, score: triggerEvent ? 0.72 + Math.random() * 0.22 : 0 }).catch(console.error);
}, INTERVAL_MS);
