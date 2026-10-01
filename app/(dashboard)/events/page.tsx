"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, formatScore } from "@/lib/format";

type EventRow = { eventId: string; deviceId: string; patientId: string; timestamp: string; type: string; algorithmScore: number; signalQuality: string };

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    fetch("/api/events?limit=100").then((r) => r.json()).then((d) => setEvents(d.events ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Rhythm Change Event History" requirement="Requirements §5 — Event log" description="Complete list of algorithm-detected rhythm change indications stored in MongoDB. Each row links to the high-resolution pre/event/post window (§4)." tags={["Not a diagnosis", "Change-point score", "Signal quality"]} steps={["Compare scores and signal quality columns", "Click View to inspect ECG segment", "Cross-check notification popup on overview"]} />
      <SectionCard title="Event log" subtitle={`${events.length} events loaded from GET /api/events`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="py-2 pr-4">Time</th><th className="py-2 pr-4">Patient</th><th className="py-2 pr-4">Device</th><th className="py-2 pr-4">Event</th><th className="py-2 pr-4">Score</th><th className="py-2 pr-4">Signal quality</th><th className="py-2">Action</th></tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.eventId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 pr-4">{formatDateTime(event.timestamp)}</td>
                  <td className="py-3 pr-4">{event.patientId}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{event.deviceId}</td>
                  <td className="py-3 pr-4"><Badge variant="warning">{event.type}</Badge></td>
                  <td className="py-3 pr-4 font-mono">{formatScore(event.algorithmScore)}</td>
                  <td className="py-3 pr-4">{event.signalQuality}</td>
                  <td className="py-3"><Link href={`/events/${event.eventId}`} className="font-semibold text-indigo-600 hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
