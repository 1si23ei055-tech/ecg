"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";

export type EcgPoint = { t: number; v: number };
export type TimeMarker = { t: number; label?: string };

type SegmentMarker = {
  label: string;
  startIndex: number;
  endIndex: number;
  tone: "pre" | "event" | "post";
};

type Props = {
  points: EcgPoint[];
  samplingRate: number;
  changePointIndex?: number;
  segments?: SegmentMarker[];
  paused?: boolean;
  height?: number;
  title?: string;
  timeMarkers?: TimeMarker[];
  theme?: "monitor" | "paper";
};

const segmentFill = {
  pre: "rgba(56, 189, 248, 0.12)",
  event: "rgba(251, 191, 36, 0.18)",
  post: "rgba(167, 139, 250, 0.12)",
};

const themes = {
  monitor: {
    bg: "#0b1220",
    grid: "#1f2937",
    gridAccent: "#334155",
    trace: "#34d399",
    tracePaused: "#94a3b8",
    text: "#e2e8f0",
    subtext: "#94a3b8",
  },
  paper: {
    bg: "#f8fafc",
    grid: "#e2e8f0",
    gridAccent: "#cbd5e1",
    trace: "#059669",
    tracePaused: "#64748b",
    text: "#0f172a",
    subtext: "#64748b",
  },
};

export function EcgWaveform({
  points,
  samplingRate,
  changePointIndex,
  segments,
  paused = false,
  height = 320,
  title,
  timeMarkers,
  theme = "monitor",
}: Props) {
  const palette = themes[theme];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; start: number; end: number } | null>(null);
  const [viewRange, setViewRange] = useState<{ start: number; end: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; t: number; v: number } | null>(null);

  const domain = useMemo(() => {
    if (points.length === 0) return { minT: 0, maxT: 1, minV: -0.2, maxV: 1 };
    let minT = points[0].t, maxT = points[0].t, minV = points[0].v, maxV = points[0].v;
    for (const p of points) {
      minT = Math.min(minT, p.t); maxT = Math.max(maxT, p.t);
      minV = Math.min(minV, p.v); maxV = Math.max(maxV, p.v);
    }
    const vPad = Math.max(0.08, (maxV - minV) * 0.2);
    return { minT, maxT, minV: minV - vPad, maxV: maxV + vPad };
  }, [points]);

  useEffect(() => {
    if (points.length === 0) return;
    setViewRange((prev) => {
      if (prev) return prev;
      const span = Math.min(10, domain.maxT - domain.minT || 10);
      return { start: Math.max(domain.minT, domain.maxT - span), end: domain.maxT };
    });
  }, [points.length, domain.minT, domain.maxT]);

  const visibleStats = useMemo(() => {
    if (!viewRange) return null;
    const visible = points.filter((p) => p.t >= viewRange.start && p.t <= viewRange.end);
    if (!visible.length) return null;
    let minV = visible[0].v, maxV = visible[0].v;
    for (const p of visible) { minV = Math.min(minV, p.v); maxV = Math.max(maxV, p.v); }
    return {
      count: visible.length,
      span: viewRange.end - viewRange.start,
      minV,
      maxV,
    };
  }, [points, viewRange]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !viewRange) return;
    const width = container.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);

    const visible = points.filter((p) => p.t >= viewRange.start && p.t <= viewRange.end);
    if (visible.length < 2) return;

    const xScale = (t: number) => ((t - viewRange.start) / (viewRange.end - viewRange.start)) * width;
    const yScale = (v: number) => height - ((v - domain.minV) / (domain.maxV - domain.minV)) * height;

    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const y = (height / 8) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.strokeStyle = i % 5 === 0 ? palette.gridAccent : palette.grid;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }

    if (segments?.length) {
      for (const segment of segments) {
        const startT = points[segment.startIndex]?.t ?? viewRange.start;
        const endT = points[segment.endIndex]?.t ?? viewRange.end;
        ctx.fillStyle = segmentFill[segment.tone];
        ctx.fillRect(xScale(startT), 0, Math.max(1, xScale(endT) - xScale(startT)), height);
      }
    }

    const drawVLine = (t: number, color: string, dash: number[]) => {
      if (t < viewRange.start || t > viewRange.end) return;
      const x = xScale(t);
      ctx.strokeStyle = color;
      ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      ctx.setLineDash([]);
    };

    timeMarkers?.forEach((m) => drawVLine(m.t, "#fb923c", [4, 4]));
    if (changePointIndex != null && points[changePointIndex]) {
      drawVLine(points[changePointIndex].t, "#fbbf24", [8, 4]);
    }

    if (hover) drawVLine(hover.t, "#818cf8", [2, 3]);

    ctx.strokeStyle = paused ? palette.tracePaused : palette.trace;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    visible.forEach((p, i) => {
      const x = xScale(p.t), y = yScale(p.v);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    if (hover) {
      const hx = xScale(hover.t), hy = yScale(hover.v);
      ctx.fillStyle = "#818cf8";
      ctx.beginPath(); ctx.arc(hx, hy, 4, 0, Math.PI * 2); ctx.fill();
    }
  }, [points, viewRange, domain, height, segments, changePointIndex, paused, timeMarkers, hover, palette]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  const setWindowSeconds = (seconds: number) => {
    const span = Math.min(seconds, domain.maxT - domain.minT);
    setViewRange({ start: Math.max(domain.minT, domain.maxT - span), end: domain.maxT });
  };

  const onWheel = (event: React.WheelEvent) => {
    if (!viewRange) return;
    event.preventDefault();
    const span = viewRange.end - viewRange.start;
    const factor = event.deltaY > 0 ? 1.12 : 0.88;
    const nextSpan = Math.max(0.4, Math.min(span * factor, domain.maxT - domain.minT));
    const center = (viewRange.start + viewRange.end) / 2;
    setViewRange({
      start: Math.max(domain.minT, center - nextSpan / 2),
      end: Math.min(domain.maxT, center + nextSpan / 2),
    });
  };

  const pickHover = (clientX: number) => {
    const container = containerRef.current;
    if (!container || !viewRange || points.length === 0) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = x / rect.width;
    const t = viewRange.start + ratio * (viewRange.end - viewRange.start);
    let nearest = points[0], best = Math.abs(points[0].t - t);
    for (const p of points) {
      const d = Math.abs(p.t - t);
      if (d < best) { best = d; nearest = p; }
    }
    setHover({ x, t: nearest.t, v: nearest.v });
  };

  const onMouseDown = (event: ReactMouseEvent) => {
    if (!viewRange) return;
    dragRef.current = { x: event.clientX, start: viewRange.start, end: viewRange.end };
  };

  const onMouseMove = (event: ReactMouseEvent) => {
    pickHover(event.clientX);
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container || !viewRange) return;
    const deltaPx = event.clientX - drag.x;
    const span = drag.end - drag.start;
    const deltaT = (deltaPx / container.clientWidth) * span * -1;
    let start = drag.start + deltaT, end = drag.end + deltaT;
    if (start < domain.minT) { end += domain.minT - start; start = domain.minT; }
    if (end > domain.maxT) { start -= end - domain.maxT; end = domain.maxT; }
    setViewRange({ start, end });
  };

  return (
    <div className={cn("overflow-hidden rounded-2xl border shadow-sm", theme === "monitor" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
      <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3", theme === "monitor" ? "border-slate-700" : "border-slate-100")}>
        <div>
          {title ? <h3 className={cn("text-sm font-semibold", theme === "monitor" ? "text-white" : "text-slate-900")}>{title}</h3> : null}
          <p className={cn("text-xs", theme === "monitor" ? "text-slate-400" : "text-slate-500")}>Amplitude vs time · {samplingRate} Hz · scroll zoom · drag pan · hover inspect</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 30].map((s) => (
            <button key={s} type="button" onClick={() => setWindowSeconds(s)} className={cn("rounded-md px-2 py-1 text-xs font-medium", theme === "monitor" ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "border border-slate-200 text-slate-700 hover:bg-slate-50")}>{s}s window</button>
          ))}
          <button type="button" onClick={() => setViewRange({ start: domain.minT, end: domain.maxT })} className={cn("rounded-md px-2 py-1 text-xs font-medium", theme === "monitor" ? "bg-indigo-600 text-white" : "bg-indigo-600 text-white")}>Fit all</button>
        </div>
      </div>
      {segments?.length ? (
        <div className={cn("flex flex-wrap gap-2 px-4 py-2 text-[11px]", theme === "monitor" ? "bg-slate-800/50" : "bg-slate-50")}>
          <Badge variant="info">PRE-EVENT</Badge>
          <Badge variant="warning">EVENT / change-point</Badge>
          <Badge variant="default">POST-EVENT</Badge>
        </div>
      ) : null}
      <div ref={containerRef} className="relative cursor-crosshair px-1 pb-2" onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={() => { dragRef.current = null; }} onMouseLeave={() => { dragRef.current = null; setHover(null); }}>
        <canvas ref={canvasRef} className="w-full" />
        {hover ? (
          <div className="pointer-events-none absolute right-3 top-3 rounded-lg bg-slate-950/85 px-3 py-2 text-xs text-emerald-100 shadow-lg">
            <p>Time: {hover.t.toFixed(3)} s</p>
            <p>Amplitude: {hover.v.toFixed(4)} mV (norm.)</p>
          </div>
        ) : null}
      </div>
      <div className={cn("grid grid-cols-2 gap-2 border-t px-4 py-3 text-xs sm:grid-cols-4", theme === "monitor" ? "border-slate-700 text-slate-400" : "border-slate-100 text-slate-500")}>
        <p>Points in view: <span className={theme === "monitor" ? "text-white" : "text-slate-900"}>{visibleStats?.count ?? 0}</span></p>
        <p>Window: <span className={theme === "monitor" ? "text-white" : "text-slate-900"}>{visibleStats ? `${visibleStats.span.toFixed(2)} s` : "—"}</span></p>
        <p>Min amp: <span className={theme === "monitor" ? "text-emerald-300" : "text-emerald-700"}>{visibleStats?.minV.toFixed(3) ?? "—"}</span></p>
        <p>Max amp: <span className={theme === "monitor" ? "text-emerald-300" : "text-emerald-700"}>{visibleStats?.maxV.toFixed(3) ?? "—"}</span></p>
      </div>
    </div>
  );
}

export function buildEventWindowPoints(preEventSamples: number[], postEventSamples: number[], samplingRate: number, eventTimestamp: number) {
  const preSeconds = preEventSamples.length / samplingRate;
  const start = eventTimestamp - preSeconds;
  const points: EcgPoint[] = [];
  preEventSamples.forEach((v, i) => points.push({ t: start + i / samplingRate, v }));
  const changePointIndex = preEventSamples.length;
  postEventSamples.forEach((v, i) => points.push({ t: eventTimestamp + i / samplingRate, v }));
  return { points, changePointIndex };
}
