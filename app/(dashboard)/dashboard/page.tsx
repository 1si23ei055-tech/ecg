"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, formatTime } from "@/lib/format";
import { useRealtimeStream } from "@/lib/hooks/useRealtimeStream";

type PatientSummary = {
  patientId: string;
  displayName: string;
  deviceId: string;
  eventCount: number;
  device: {
    batteryLevel: number;
    connectionStatus: string;
    ecgStatus: string;
    lastSeen?: string;
    firmwareVersion?: string;
    samplingRate: number;
  } | null;
  recentEvents: Array<{ eventId: string; timestamp: string; type: string; algorithmScore: number; signalQuality: string }>;
};

export default function DashboardPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPatients = useCallback(() => {
    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data.patients ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  useRealtimeStream(useCallback((m) => {
    if (m.type === "device_status" || m.type === "rhythm_event" || m.type === "ecg") loadPatients();
  }, [loadPatients]));

  const primary = patients[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring Overview"
        requirement="Requirements §1B — Main Dashboard"
        description="Summary view for evaluators: who is monitored, whether the patch is connected, battery state, when data last arrived, and how many rhythm change indications were logged."
        tags={["Patient P001", "Live SSE", "MongoDB persisted"]}
        steps={[
          "Confirm BLE / ECG status badges below",
          "Open Live ECG to watch the waveform update",
          "Wait for a Rhythm Change popup (run npm run simulate)",
          "Review recent events and open View ECG",
        ]}
      />

      {loading ? <p className="text-sm text-slate-600">Loading patient metrics…</p> : null}

      {primary ? (
        <>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 font-mono text-sm text-indigo-950">
            Patient: {primary.patientId} | Device: {primary.deviceId} | BLE Status: {primary.device?.connectionStatus} | ECG Status: {primary.device?.ecgStatus} | Battery: {primary.device?.batteryLevel}%
            {primary.recentEvents[0] ? ` · ${formatTime(primary.recentEvents[0].timestamp)} — ${primary.recentEvents[0].type}` : ""}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Patient ID" value={primary.patientId} hint={primary.displayName} />
            <StatCard label="Device ID" value={primary.deviceId} hint={`Firmware ${primary.device?.firmwareVersion ?? "1.0.0"}`} />
            <StatCard label="BLE connection" value={primary.device?.connectionStatus ?? "—"} status={primary.device?.connectionStatus === "Connected" ? "good" : "warn"} />
            <StatCard label="ECG stream" value={primary.device?.ecgStatus ?? "—"} status={primary.device?.ecgStatus === "Receiving" ? "live" : "neutral"} />
            <StatCard label="Battery" value={`${primary.device?.batteryLevel ?? 0}%`} hint="From patch telemetry packet" status={(primary.device?.batteryLevel ?? 0) < 25 ? "warn" : "good"} />
            <StatCard label="Last data received" value={primary.device?.lastSeen ? formatDateTime(primary.device.lastSeen) : "—"} />
            <StatCard label="Rhythm change events" value={String(primary.eventCount)} hint="Algorithm indications (not diagnoses)" />
            <StatCard label="Sampling rate" value={`${primary.device?.samplingRate ?? 250} Hz`} hint="Sequence ordering enforced on ingest" />
          </div>
        </>
      ) : null}

      <SectionCard title="Recent Rhythm Change Events" subtitle="§1B + §5 — click View to open the pre/event/post ECG window" action={<Link href="/events" className="text-sm font-semibold text-indigo-600">Full history →</Link>}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="py-2 pr-4">Time</th><th className="py-2 pr-4">Event</th><th className="py-2 pr-4">Score</th><th className="py-2 pr-4">Signal quality</th><th className="py-2">Action</th></tr>
            </thead>
            <tbody>
              {(primary?.recentEvents ?? []).map((event) => (
                <tr key={event.eventId} className="border-b border-slate-100">
                  <td className="py-3 pr-4">{formatDateTime(event.timestamp)}</td>
                  <td className="py-3 pr-4"><Badge variant="warning">{event.type}</Badge></td>
                  <td className="py-3 pr-4 font-mono">{event.algorithmScore.toFixed(2)}</td>
                  <td className="py-3 pr-4">{event.signalQuality}</td>
                  <td className="py-3"><Link href={`/events/${event.eventId}`} className="font-semibold text-indigo-600 hover:underline">View ECG</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
