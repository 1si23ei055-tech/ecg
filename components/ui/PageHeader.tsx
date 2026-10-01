import { Badge } from "@/components/ui/Badge";

export function PageHeader({
  title,
  description,
  requirement,
  tags = [],
  steps = [],
}: {
  title: string;
  description: string;
  requirement?: string;
  tags?: string[];
  steps?: string[];
}) {
  return (
    <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          {requirement ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              {requirement}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="info">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      {steps.length > 0 ? (
        <ol className="mt-5 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </header>
  );
}
