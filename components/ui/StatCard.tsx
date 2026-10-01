import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  hint,
  status = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  status?: "neutral" | "good" | "warn" | "live";
}) {
  const border =
    status === "good"
      ? "border-emerald-200 bg-emerald-50/50"
      : status === "warn"
        ? "border-amber-200 bg-amber-50/40"
        : status === "live"
          ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-white"
          : "border-slate-200 bg-white";

  return (
    <div className={cn("rounded-xl border p-4 shadow-sm", border)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {status === "live" ? <Badge variant="live">Live</Badge> : null}
        {status === "good" ? <Badge variant="success">OK</Badge> : null}
        {status === "warn" ? <Badge variant="warning">Check</Badge> : null}
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
