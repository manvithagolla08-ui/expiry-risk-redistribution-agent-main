import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** When true, the card pulses its accent border to signal urgency */
  urgent?: boolean;
  isLoading?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  urgent,
  isLoading,
}: KPICardProps) {
  return (
    <div
      className={clsx(
        'bg-white p-5 rounded-xl border shadow-sm transition-shadow hover:shadow-md',
        urgent ? 'border-red-200' : 'border-slate-200'
      )}
    >
      {/* ── Top row: title + icon ─────────────────────── */}
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none">
          {title}
        </p>
        <div
          className={clsx(
            'p-2 rounded-lg',
            urgent ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
          )}
        >
          <Icon size={16} />
        </div>
      </div>

      {/* ── Primary value ────────────────────────────── */}
      {isLoading ? (
        <div className="h-8 w-28 bg-slate-100 rounded-md animate-pulse mb-3" />
      ) : (
        <p className="text-2xl font-bold text-slate-800 leading-none mb-3 tabular-nums">
          {value}
        </p>
      )}

      {/* ── Trend + subtitle ─────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs">
        {trend && !isLoading && (
          <span
            className={clsx(
              'font-semibold',
              trend.isPositive ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value)}%
          </span>
        )}
        <span className="text-slate-500 leading-snug">{subtitle}</span>
      </div>
    </div>
  );
}
