import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, isLoading }: KPICardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-100 rounded mt-1 animate-pulse"></div>
          ) : (
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          )}
        </div>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <Icon size={20} />
        </div>
      </div>
      
      <div className="flex items-center text-sm">
        {trend && !isLoading && (
          <span className={`font-medium mr-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
        <span className="text-slate-500">{subtitle}</span>
      </div>
    </div>
  );
}
