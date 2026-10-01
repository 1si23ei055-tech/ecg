"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EcgWaveform, type EcgPoint } from "@/components/ecg/EcgWaveform";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import type { RealtimeMessage } from "@/lib/realtime/bus";
import { useRealtimeStream } from "@/lib/hooks/useRealtimeStream";

const MAX_POINTS = 8000;

export default function LiveEcgPage() {
  const [points, setPoints] = useState<EcgPoint[]>([]);
  const [samplingRate, setSamplingRate] = useState(250);
  const [running, setRunning] = useState(true);
  const [paused, setPaused] = useState(false);
  const [lastSeq, setLastSeq] = useState<number | null>(null);
  const [packetCount, setPacketCount] = useState(0);
  const [status, setStatus] = useState({ deviceId: "ECG_001", patientId: "P001", battery: 78, connectionStatus: "Connected", ecgStatus: "Receiving" });

  useEffect(() => {
    fetch("/api/patients/P001/ecg?limit=300").then((r) => r.json()).then((d) => {
      if (d.points?.length) { setPoints(d.points); setSamplingRate(d.samplingRate ?? 250); }
    });
  }, []);

  const appendSamples = useCallback((message: Extract<RealtimeMessage, { type: "ecg" }>) => {
    if (!running || paused) return;
    setSamplingRate(message.samplingRate);
    setLastSeq(message.sequenceNumber);
    setPacketCount((n) => n + 1);
    setStatus({ deviceId: message.deviceId, patientId: message.patientId, battery: message.battery, connectionStatus: message.connectionStatus, ecgStatus: message.ecgStatus });
    setPoints((prev) => {
      const next = [...prev];
      message.samples.forEach((v, i) => next.push({ t: message.timestamp + i / message.samplingRate, v }));
      return next.slice(-MAX_POINTS);
    });
  }, [paused, running]);

  useRealtimeStream(useCallback((m) => {
    if (m.type === "ecg") appendSamples(m);
    if (m.type === "device_status") setStatus((p) => ({ ...p, deviceId: m.deviceId, patientId: m.patientId, battery: m.battery, connectionStatus: m.connectionStatus, ecgStatus: m.ecgStatus }));
  }, [appendSamples]));

  const headline = useMemo(() => `Patient: ${status.patientId} | Device: ${status.deviceId} | BLE: ${status.connectionStatus} | ECG: ${status.ecgStatus} | Battery: ${status.battery}%`, [status]);

  return (
    <div className="space-y-6">
      <PageHeader title="Live ECG Monitoring" requirement="Requirements §2 — Real-time waveform" description="Waveform updates automatically via Server-Sent Events (no page refresh). Use playback controls, zoom (scroll), pan (drag), and time windows as required." tags={["Amplitude vs Time", "250 Hz", "SSE /api/stream"]} steps={["Press Start and run npm run simulate", "Observe trace updating in green monitor view", "Pause to freeze inspection; scroll to zoom", "Stop halts append (SSE still connected)"]} />

      <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-800">{headline}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sampling rate" value={`${samplingRate} Hz`} status="live" />
        <StatCard label="Last sequence #" value={lastSeq != null ? String(lastSeq) : "—"} hint="Detects missing/duplicate packets" />
        <StatCard label="Packets rendered" value={String(packetCount)} />
        <StatCard label="Buffer points" value={String(points.length)} hint={`Max ${MAX_POINTS} samples`} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => { setRunning(true); setPaused(false); }}>Start</button>
        <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold" onClick={() => setRunning(false)}>Stop</button>
        <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold" onClick={() => setPaused((v) => !v)}>{paused ? "Resume" : "Pause"}</button>
        {!running || paused ? <Badge variant="warning">Playback paused</Badge> : <Badge variant="live">Receiving live</Badge>}
        <Link href="/events" className="ml-auto text-sm font-semibold text-indigo-600">Event history →</Link>
      </div>

      <EcgWaveform points={points} samplingRate={samplingRate} paused={paused || !running} title="Live ECG — Amplitude vs Time" theme="monitor" />
    </div>
  );
}
