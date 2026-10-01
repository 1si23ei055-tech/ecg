"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";

type PatientRow = { patientId: string; displayName: string; deviceId: string; device: { batteryLevel: number; connectionStatus: string; ecgStatus: string; lastSeen?: string; firmwareVersion: string; samplingRate: number } | null };

export default function PatientsPage() {
  const [rows, setRows] = useState<PatientRow[]>([]);
  useEffect(() => { fetch("/api/patients").then((r) => r.json()).then((d) => setRows(d.patients ?? [])); }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Patient & Device Management" requirement="Requirements §7 — Device configuration" description="Maps each patient to a BLE patch: connection state, ECG streaming status, battery, sampling rate, firmware, and last sync timestamp." tags={["BLE", "ECG Receiving", "NFC /device/ECG_001"]} steps={["Verify Connected + Receiving during simulation", "Note sampling rate 250 Hz", "Optional NFC URL opens this patient after login"]} />
      <SectionCard title="Registered devices" subtitle="Persisted in MongoDB Device + Patient collections">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="py-2 pr-4">Patient ID</th><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Device ID</th><th className="py-2 pr-4">BLE</th><th className="py-2 pr-4">ECG</th><th className="py-2 pr-4">Battery</th><th className="py-2 pr-4">Rate</th><th className="py-2 pr-4">Firmware</th><th className="py-2">Last sync</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.patientId} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-semibold">{row.patientId}</td>
                  <td className="py-3 pr-4">{row.displayName}</td>
                  <td className="py-3 pr-4 font-mono">{row.deviceId}</td>
                  <td className="py-3 pr-4"><Badge variant={row.device?.connectionStatus === "Connected" ? "success" : "warning"}>{row.device?.connectionStatus ?? "—"}</Badge></td>
                  <td className="py-3 pr-4"><Badge variant={row.device?.ecgStatus === "Receiving" ? "live" : "default"}>{row.device?.ecgStatus ?? "—"}</Badge></td>
                  <td className="py-3 pr-4">{row.device ? `${row.device.batteryLevel}%` : "—"}</td>
                  <td className="py-3 pr-4">{row.device ? `${row.device.samplingRate} Hz` : "—"}</td>
                  <td className="py-3 pr-4">{row.device?.firmwareVersion ?? "—"}</td>
                  <td className="py-3">{row.device?.lastSeen ? formatDateTime(row.device.lastSeen) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
