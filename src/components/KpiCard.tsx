export function KpiCard({
  title,
  value,
  sub,
  color = "indigo",
  icon,
}: {
  title: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: string;
}) {
  const colors: Record<string, { bg: string; text: string; ring: string }> = {
    indigo: { bg: "bg-primary-50", text: "text-primary-600", ring: "group-hover:ring-primary-100" },
    emerald: { bg: "bg-success-50", text: "text-success-600", ring: "group-hover:ring-success-50" },
    amber: { bg: "bg-warning-50", text: "text-warning-600", ring: "group-hover:ring-warning-50" },
    rose: { bg: "bg-danger-50", text: "text-danger-600", ring: "group-hover:ring-danger-50" },
    sky: { bg: "bg-sky-50", text: "text-sky-600", ring: "group-hover:ring-sky-50" },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className="card-hover p-5 group cursor-default">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5 tabular-nums tracking-tight truncate">
            {value}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ring-4 ring-transparent transition-all duration-200 group-hover:scale-105 ${c.bg} ${c.text} ${c.ring}`}
        >
          {icon || "◫"}
        </div>
      </div>
    </div>
  );
}
