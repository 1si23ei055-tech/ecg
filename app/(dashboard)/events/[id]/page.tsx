"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  buildEventWindowPoints,
  EcgWaveform,
} from "@/components/ecg/EcgWaveform";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";

type WindowResponse = {
  eventId: string;
  deviceId: string;
  patientId: string;
  samplingRate: number;
  preSeconds: number;
  postSeconds: number;
  changePointIndex: number;
  preEventSamples: number[];
  postEventSamples: number[];
};

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const [windowData, setWindowData] = useState<WindowResponse | null>(null);
  const [eventMeta, setEventMeta] = useState<{
    timestamp: string;
    algorithmScore: number;
    signalQuality: string;
  } | null>(null);

  useEffect(() => {
    const eventId = params.id;
    fetch(`/api/events/${eventId}/ecg-window`)
      .then((res) => res.json())
      .then((data) => setWindowData(data));
    fetch("/api/events?limit=200")
      .then((res) => res.json())
      .then((data) => {
        const match = (data.events ?? []).find(
          (event: { eventId: string }) => event.eventId === eventId,
        );
        if (match) {
          setEventMeta({
            timestamp: match.timestamp,
            algorithmScore: match.algorithmScore,
            signalQuality: match.signalQuality,
          });
        }
      });
  }, [params.id]);

  const { points, changePointIndex } = useMemo(() => {
    if (!windowData || !eventMeta) {
      return { points: [], changePointIndex: 0 };
    }
    const eventTimestamp = new Date(eventMeta.timestamp).getTime() / 1000;
    return buildEventWindowPoints(
      windowData.preEventSamples,
      windowData.postEventSamples,
      windowData.samplingRate,
      eventTimestamp,
    );
  }, [windowData, eventMeta]);

  const segments = useMemo(() => {
    if (!windowData) return undefined;
    const preEnd = windowData.preEventSamples.length - 1;
    const postStart = windowData.preEventSamples.length;
    const postEnd = postStart + windowData.postEventSamples.length - 1;
    return [
      {
        label: "PRE-EVENT",
        startIndex: 0,
        endIndex: preEnd,
        tone: "pre" as const,
      },
      {
        label: "EVENT",
        startIndex: Math.max(0, windowData.changePointIndex - 5),
        endIndex: Math.min(points.length - 1, windowData.changePointIndex + 5),
        tone: "event" as const,
      },
      {
        label: "POST-EVENT",
        startIndex: postStart,
        endIndex: postEnd,
        tone: "post" as const,
      },
    ];
  }, [windowData, points.length]);

  if (!windowData) {
    return <p className="text-sm text-slate-600">Loading event ECG window...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pre-Event · Event · Post-Event Review" requirement="Requirements §4" description="High-resolution window with change-point marker and PRE | EVENT | POST shading (~10s + ~10s)." tags={["Change-point", "Interactive zoom"]} steps={["Locate yellow change-point line", "Zoom EVENT band", "Compare pre vs post morphology"]} />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Rhythm Change Event Review</h2>
        {eventMeta ? (
          <p className="mt-2 text-sm text-slate-700">
            Patient {windowData.patientId} · Device {windowData.deviceId} ·{" "}
            {formatDateTime(eventMeta.timestamp)} · Score{" "}
            {eventMeta.algorithmScore.toFixed(2)} · Signal{" "}
            {eventMeta.signalQuality}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-slate-500">
          PRE-EVENT | EVENT | POST-EVENT window (~{windowData.preSeconds}s / ~
          {windowData.postSeconds}s)
        </p>
      </section>

      <EcgWaveform
        points={points}
        samplingRate={windowData.samplingRate}
        changePointIndex={changePointIndex}
        segments={segments}
        title="Event ECG Segment — PRE | EVENT | POST"
        theme="paper"
      />
    </div>
  );
}
