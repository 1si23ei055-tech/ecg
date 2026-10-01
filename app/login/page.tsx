"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("doctor@ecg.local");
  const [password, setPassword] = useState("doctor123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/seed", { method: "POST" }).catch(() => undefined); }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Login failed"); return; }
      router.replace(searchParams.get("next") ?? "/dashboard");
      router.refresh();
    } catch { setError("Unable to reach server"); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-4 py-10 text-white">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">University demonstration</p>
          <h1 className="text-3xl font-semibold leading-tight">ECG Wearable Patch Monitoring Dashboard</h1>
          <p className="text-sm leading-relaxed text-slate-300">Web UI for ESP32-C3 patch data: live ECG, rhythm change events, historical review, and device telemetry.</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info" className="bg-white/10 text-indigo-100 ring-white/20">Req §1 Login</Badge>
            <Badge variant="info" className="bg-white/10 text-indigo-100 ring-white/20">Req §2 Live ECG</Badge>
            <Badge variant="info" className="bg-white/10 text-indigo-100 ring-white/20">Req §10 Real-time</Badge>
          </div>
          <ol className="space-y-2 text-sm text-slate-300">
            <li>1. Sign in with the demo clinician account</li>
            <li>2. Run npm run simulate in a second terminal</li>
            <li>3. Follow numbered steps in the sidebar</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white p-8 text-slate-900 shadow-2xl">
          <h2 className="text-xl font-semibold">Clinician login</h2>
          <p className="mt-1 text-sm text-slate-600">Session-based access to protected dashboard pages</p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm font-medium">Email<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label className="block text-sm font-medium">Password<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? "Signing in…" : "Enter dashboard"}</button>
          </form>
          <p className="mt-4 text-xs text-slate-500">Demo: doctor@ecg.local / doctor123</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (<Suspense fallback={<p className="p-8 text-white">Loading…</p>}><LoginForm /></Suspense>);
}
