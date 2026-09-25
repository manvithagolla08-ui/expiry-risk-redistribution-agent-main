import type { RedistributionRecommendation } from '../../types/analytics';
import { ArrowRight, AlertTriangle, TrendingUp, MapPin, Package2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface RecommendationRowData extends RedistributionRecommendation {
  product_name: string;
  source_warehouse_name: string;
  destination_warehouse_name: string;
}

interface RedistributionRecommendationsProps {
  data: RecommendationRowData[];
  isLoading: boolean;
}

const RISK_BADGE: Record<string, string> = {
  LOW:      'bg-green-50  text-green-700  border-green-200',
  MEDIUM:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  HIGH:     'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50    text-red-700    border-red-200',
};

export function RedistributionRecommendations({ data, isLoading }: RedistributionRecommendationsProps) {
  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[280px] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading recommendations…</p>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[280px] flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Package2 size={18} className="text-slate-400" />
        </div>
        <p className="text-slate-600 text-sm font-medium">No redistribution needed</p>
        <p className="text-slate-400 text-xs mt-1">Inventory risk and demand are balanced across warehouses.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800">Redistribution Recommendations</h3>
        <p className="text-xs text-slate-500 mt-0.5">Engine-suggested transfers to minimise expiry waste</p>
      </div>

      <div className="p-5 space-y-4">
        {data.map((rec, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/20 transition-colors"
          >
            {/* Card header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Package2 size={14} className="text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-800 text-sm">{rec.product_name}</span>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                Transfer{' '}
                <span className="font-bold text-blue-600">{rec.recommended_quantity}</span>{' '}
                units
              </span>
            </div>

            {/* Transfer visual */}
            <div className="flex flex-col md:flex-row items-stretch gap-0 px-5 py-4">
              {/* Source */}
              <div className="flex-1 bg-white rounded-lg border border-red-100 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-400 rounded-l-lg" />
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm">
                    <MapPin size={13} className="text-red-500 shrink-0" />
                    {rec.source_warehouse_name}
                  </div>
                  <span
                    className={clsx(
                      'text-xs font-semibold px-2 py-0.5 rounded-full border',
                      RISK_BADGE[rec.source_risk_level] || 'bg-slate-50 text-slate-600 border-slate-200'
                    )}
                  >
                    {rec.source_risk_level}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <AlertTriangle size={11} className="text-orange-400 shrink-0" />
                  {rec.reason.split(' - ')[0] || 'Excess risk'}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center justify-center px-4 py-2 shrink-0">
                <ArrowRight size={18} className="text-blue-400 hidden md:block" />
                <span className="text-xs text-slate-500 mt-1 font-medium">
                  {rec.distance_km.toFixed(0)} km
                </span>
              </div>

              {/* Destination */}
              <div className="flex-1 bg-white rounded-lg border border-emerald-100 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400 rounded-l-lg" />
                <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm mb-2">
                  <MapPin size={13} className="text-emerald-500 shrink-0" />
                  {rec.destination_warehouse_name}
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <TrendingUp size={11} className="text-emerald-500 shrink-0" />
                  Demand: {rec.destination_demand.toFixed(1)} units/day
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
