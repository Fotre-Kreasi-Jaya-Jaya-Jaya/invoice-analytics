import React from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

export interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  trend?: { value: number; label: string };
  color?: "brand" | "success" | "warning" | "danger" | "purple" | "slate";
  icon?: LucideIcon | React.ComponentType<{ className?: string; strokeWidth?: number }> | React.ReactNode;
  badge?: string;
}

export function KpiCard({
  title,
  value,
  sub,
  trend,
  color = "brand",
  icon: IconOrNode,
  badge,
}: KpiCardProps) {
  const configs = {
    brand: {
      cardBg: "bg-white",
      topBorder: "from-brand-500 to-indigo-600",
      iconBg: "bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-sm shadow-brand-500/20",
      accentText: "text-brand-600",
      badgeCls: "bg-brand-50 text-brand-700 border-brand-200",
    },
    success: {
      cardBg: "bg-white",
      topBorder: "from-emerald-400 to-emerald-600",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/20",
      accentText: "text-emerald-600",
      badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    purple: {
      cardBg: "bg-white",
      topBorder: "from-purple-400 to-purple-600",
      iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-sm shadow-purple-500/20",
      accentText: "text-purple-600",
      badgeCls: "bg-purple-50 text-purple-700 border-purple-200",
    },
    slate: {
      cardBg: "bg-white",
      topBorder: "from-slate-400 to-slate-600",
      iconBg: "bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-sm shadow-slate-500/20",
      accentText: "text-slate-600",
      badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
    },
    warning: {
      cardBg: "bg-white",
      topBorder: "from-amber-400 to-amber-500",
      iconBg: "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-500/20",
      accentText: "text-amber-600",
      badgeCls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    danger: {
      cardBg: "bg-white",
      topBorder: "from-rose-500 to-red-600",
      iconBg: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm shadow-rose-500/20",
      accentText: "text-rose-600",
      badgeCls: "bg-rose-50 text-rose-700 border-rose-200",
    },
  };

  const cfg = configs[color] || configs.brand;
  const trendUp = trend && trend.value > 0;
  const trendDown = trend && trend.value < 0;

  const renderIcon = () => {
    if (!IconOrNode) return null;
    if (React.isValidElement(IconOrNode)) {
      return IconOrNode;
    }
    if (typeof IconOrNode === "string") {
      return <span className="text-base font-semibold">{IconOrNode}</span>;
    }
    // Component type (LucideIcon / React Component)
    const IconComp = IconOrNode as React.ComponentType<{ className?: string; strokeWidth?: number }>;
    return <IconComp className="w-5 h-5" strokeWidth={2} />;
  };

  return (
    <div className={`card-hover relative p-5 overflow-hidden group ${cfg.cardBg}`}>
      {/* Top gradient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cfg.topBorder} opacity-90 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {badge && (
            <span className={`ml-2 inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded-md border ${cfg.badgeCls}`}>
              {badge}
            </span>
          )}
        </div>
        {IconOrNode && (
          <div className={`w-9 h-9 rounded-xl ${cfg.iconBg} flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0`}>
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="text-2xl lg:text-[28px] font-bold text-slate-900 tracking-tight leading-none mb-2 tabular-nums">
        {value}
      </div>

      {(sub || trend) && (
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {trend && (
            <span className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-md ${
              trendUp ? "bg-emerald-50 text-emerald-700" : trendDown ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700"
            }`}>
              {trendUp && <TrendingUp className="w-3 h-3" />}
              {trendDown && <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend.value)}% {trend.label}
            </span>
          )}
          {sub && <span className="text-slate-500 font-medium">{sub}</span>}
        </div>
      )}
    </div>
  );
}