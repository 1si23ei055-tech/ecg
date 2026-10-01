"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import type { RealtimeMessage } from "@/lib/realtime/bus";
import { useRealtimeStream } from "@/lib/hooks/useRealtimeStream";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils/cn";

const nav = [
  { href: "/dashboard", label: "Overview", step: "1", req: "§1B Metrics", desc: "Patient & device summary" },
  { href: "/live", label: "Live ECG", step: "2", req: "§2 Monitoring", desc: "Real-time waveform" },
  { href: "/events", label: "Event History", step: "3", req: "§5 Events", desc: "Rhythm change log" },
  { href: "/history", label: "Historical ECG", step: "4", req: "§6 History", desc: "Query & markers" },
  { href: "/patients", label: "Patients & Devices", step: "5", req: "§7 Devices", desc: "Configuration table" },
];

type Alert = {
  eventId: string;
  patientId: string;
  deviceId: string;
  timestamp: number;
  score: number;
  signalQuality: string;
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [livePackets, setLivePackets] = useState(0);

  useRealtimeStream(
    useCallback((message: RealtimeMessage) => {
      if (message.type === "ecg") setLivePackets((n) => n + 1);
      if (message.type === "rhythm_event") {
        setAlert({
          eventId: message.eventId,
          patientId: message.patientId,
          deviceId: message.deviceId,
          timestamp: message.timestamp,
          score: message.score,
          signalQuality: message.signalQuality,
        });
      }
    }, []),
  );

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const activeNav = nav.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href)),
  );

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100 lg:flex">
        <div className="border-b border-slate-800 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-300">University Project</p>
          <h1 className="mt-1 text-lg font-semibold leading-snug text-white">ECG Wearable Patch Dashboard</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">ESP32-C3 patch → BLE gateway → MongoDB → live clinician UI</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="info" className="bg-slate-800 text-indigo-200 ring-slate-700">Next.js</Badge>
            <Badge variant="info" className="bg-slate-800 text-indigo-200 ring-slate-700">MongoDB</Badge>
            <Badge variant="live" className="ring-emerald-700/50">SSE Live</Badge>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn("block rounded-xl px-3 py-3 transition", active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30" : "text-slate-300 hover:bg-slate-800 hover:text-white")}>
                <div className="flex items-center gap-2">
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold", active ? "bg-white/20" : "bg-slate-800 text-indigo-300")}>{item.step}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                <p className={cn("mt-1 pl-8 text-[11px]", active ? "text-indigo-100" : "text-slate-500")}>{item.req} · {item.desc}</p>
              </Link>
            );
          })}
        </nav>
        <div className="border-b border-slate-800 p-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Demo tip for evaluators</p>
          <p className="mt-2 leading-relaxed">Run <code className="text-indigo-200">npm run simulate</code> in a second terminal to stream packets and trigger rhythm events.</p>
        </div>
        <div className="p-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Data pipeline</p>
          <p className="mt-2 leading-relaxed">Patch → ESP32 → BLE → POST /api/ecg → DB → SSE → charts</p>
          <p className="mt-3 text-[11px] text-amber-200/90">Rhythm Change Events are algorithm indications only — not diagnoses.</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div>
              <p className="text-xs text-slate-500 lg:hidden">ECG Patch Dashboard</p>
              <p className="text-sm font-semibold text-slate-900">{activeNav?.label ?? "Dashboard"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="live">Packets: {livePackets}</Badge>
              <Badge variant="success">API Online</Badge>
              <button type="button" onClick={logout} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Logout</button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium", pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600")}>{item.label}</Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 space-y-6 p-4 lg:p-6">{children}</main>
      </div>
      {alert ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">§3 Notification</Badge>
            <p className="text-sm font-semibold text-amber-950">Rhythm Change Event Detected</p>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-amber-950/90">
            <div><dt className="text-xs text-amber-800">Patient</dt><dd className="font-medium">{alert.patientId}</dd></div>
            <div><dt className="text-xs text-amber-800">Device</dt><dd className="font-medium">{alert.deviceId}</dd></div>
            <div><dt className="text-xs text-amber-800">Time</dt><dd>{formatDateTime(alert.timestamp * 1000)}</dd></div>
            <div><dt className="text-xs text-amber-800">Score</dt><dd>{alert.score.toFixed(2)}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-amber-800">Signal quality</dt><dd>{alert.signalQuality}</dd></div>
          </dl>
          <div className="mt-4 flex gap-2">
            <Link href={`/events/${alert.eventId}`} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">View ECG</Link>
            <button type="button" className="rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-950" onClick={() => setAlert(null)}>Dismiss</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
