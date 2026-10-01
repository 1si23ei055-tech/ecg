"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  EcgWaveform,
  type EcgPoint,
  type TimeMarker,
} from "@/components/ecg/EcgWaveform";
import { formatDateTime } from "@/lib/format";

type EventMarker = {
  eventId: string;
  timestamp: string;
  algorithmScore: number;
};

import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";

export default function HistoryPage() {
  const [patientId, setPatientId] = useState("P001");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [points, setPoints] = useState<EcgPoint[]>([]);
  const [samplingRate, setSamplingRate] = useState(250);
  const [events, setEvents] = useState<EventMarker[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadHistory(jumpEventId?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", new Date(from).toISOString());
      if (to) params.set("to", new Date(to).toISOString());
      params.set("limit", "1500");

      const [ecgRes, eventsRes] = await Promise.all([
        fetch(`/api/patients/${patientId}/ecg?${params.toString()}`),
        fetch(`/api/events?patientId=${patientId}&limit=100`),
      ]);
      const ecgData = await ecgRes.json();
      const eventsData = await eventsRes.json();
      setPoints(ecgData.points ?? []);
      setSamplingRate(ecgData.samplingRate ?? 250);
      setEvents(eventsData.events ?? []);

      if (jumpEventId) {
        const target = (eventsData.events ?? []).find(
          (event: EventMarker) => event.eventId === jumpEventId,
        );
        if (target) {
          const ts = new Date(target.timestamp).getTime() / 1000;
          setFrom(new Date((ts - durationMinutes * 30) * 1000).toISOString().slice(0, 16));
          setTo(new Date((ts + durationMinutes * 30) * 1000).toISOString().slice(0, 16));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timeMarkers: TimeMarker[] = useMemo(
    () =>
      events.map((event) => ({
        t: new Date(event.timestamp).getTime() / 1000,
        label: event.eventId,
      })),
    [events],
  );

  const eventLinks = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        label: `${formatDateTime(event.timestamp)} · score ${event.algorithmScore.toFixed(2)}`,
      })),
    [events],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Historical ECG Viewer" requirement="Requirements §6 — Historical query" description="Filter by patient, date/time range, and duration. Orange markers show rhythm events; use Jump to Event for direct navigation." tags={["Zoom & scroll", "Event markers", "MongoDB EcgRecord"]} steps={["Set patient ID and optional date range", "Click Query Historical Data", "Use event chips to jump the window", "Open high-res segment from event links"]} />
      <SectionCard title="Query filters" subtitle="Patient, date/time, duration">
        <h2 className="text-xl font-semibold">Historical ECG Viewer</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-slate-700">
            Patient ID
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
          </label>
          <label className="text-sm text-slate-700">
            From
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-sm text-slate-700">
            To
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="text-sm text-slate-700">
            Duration (minutes)
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            />
          </label>
        </div>
        <button
          type="button"
          className="mt-4 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white"
          onClick={() => loadHistory()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Query Historical Data"}
        </button>
      </SectionCard>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Jump to Event</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {eventLinks.map((event) => (
            <button
              key={event.eventId}
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
              onClick={() => loadHistory(event.eventId)}
            >
              {event.label}
            </button>
          ))}
          {eventLinks.length === 0 ? (
            <p className="text-xs text-slate-500">No events for this patient yet.</p>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {events.map((event) => (
            <Link
              key={event.eventId}
              href={`/events/${event.eventId}`}
              className="text-cyan-700 hover:underline"
            >
              Open {event.eventId}
            </Link>
          ))}
        </div>
      </section>

      <EcgWaveform
        points={points}
        samplingRate={samplingRate}
        timeMarkers={timeMarkers}
        title="Historical ECG"
        theme="paper"
      />
    </div>
  );
}
