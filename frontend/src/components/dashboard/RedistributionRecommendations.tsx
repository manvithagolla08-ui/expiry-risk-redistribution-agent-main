import type { RedistributionRecommendation } from '../../types/analytics';
import { ArrowRight, AlertTriangle, TrendingUp, MapPin } from 'lucide-react';

export interface RecommendationRowData extends RedistributionRecommendation {
  product_name: string;
  source_warehouse_name: string;
  destination_warehouse_name: string;
}

interface RedistributionRecommendationsProps {
  data: RecommendationRowData[];
  isLoading: boolean;
}

export function RedistributionRecommendations({ data, isLoading }: RedistributionRecommendationsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[300px] flex items-center justify-center">
        <div className="text-slate-400">Loading recommendations...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[300px] flex items-center justify-center">
        <div className="text-slate-400 text-center">
          <p>No redistribution recommended.</p>
          <p className="text-xs mt-1">Inventory risk and demand are balanced.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Redistribution Recommendations</h3>
        <p className="text-sm text-slate-500">Transfers suggested to minimize expiry waste</p>
      </div>

      <div className="p-6 space-y-6">
        {data.map((rec, i) => (
          <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-5 hover:border-blue-300 transition-colors">
            
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between mb-4 pb-4 border-b border-slate-200 gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-lg">{rec.product_name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-600 font-medium">
                  Transfer <span className="text-blue-600 font-bold">{rec.recommended_quantity}</span> units
                </div>
              </div>
            </div>

            {/* Transfer Visual */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Source */}
              <div className="flex-1 bg-white p-4 rounded-lg border border-red-100 shadow-sm w-full relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-400 rounded-l-lg"></div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin size={16} className="text-red-500" /> 
                    {rec.source_warehouse_name}
                  </h4>
                  <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-200">
                    {rec.source_risk_level} RISK
                  </span>
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-2">
                  <AlertTriangle size={14} className="text-orange-400" />
                  Reason: {rec.reason.split(' - ')[0] || "Excess risk"}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center justify-center px-4 text-slate-400">
                <ArrowRight size={24} className="text-blue-500 hidden md:block" />
                <span className="text-xs font-medium mt-1">{rec.distance_km.toFixed(0)} km</span>
              </div>

              {/* Destination */}
              <div className="flex-1 bg-white p-4 rounded-lg border border-green-100 shadow-sm w-full relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-400 rounded-l-lg"></div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin size={16} className="text-green-500" /> 
                    {rec.destination_warehouse_name}
                  </h4>
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-2">
                  <TrendingUp size={14} className="text-green-500" />
                  Demand: {rec.destination_demand.toFixed(1)}/day
                </p>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
