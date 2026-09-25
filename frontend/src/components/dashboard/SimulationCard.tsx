import { useState } from 'react';
import { api } from '../../services/api';
import type { RecommendationRowData } from './RedistributionRecommendations';
import type { WhatIfSimulationResponse } from '../../types/analytics';
import { Play, Calculator, AlertCircle, ArrowRight, TrendingDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface SimulationCardProps {
  recommendations: RecommendationRowData[];
  /** Called with the full response every time a simulation succeeds. */
  onSimulationSuccess?: (result: WhatIfSimulationResponse) => void;
}

// ── Custom tooltip for the bar chart ─────────────────────────────────────────
const WasteTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
        <p className="font-semibold text-slate-700">{payload[0].payload.label}</p>
        <p className="text-slate-600">
          {Math.round(payload[0].value)} <span className="text-slate-400">units</span>
        </p>
      </div>
    );
  }
  return null;
};

export function SimulationCard({ recommendations, onSimulationSuccess }: SimulationCardProps) {
  const [selectedRecIndex, setSelectedRecIndex] = useState<number | ''>('');
  const [customQuantity, setCustomQuantity] = useState<number | ''>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<WhatIfSimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    if (selectedRecIndex === '') return;

    setIsSimulating(true);
    setError(null);
    // Do NOT clear result here — preserves previous value until new one arrives

    const rec = recommendations[selectedRecIndex as number];
    const simRequest = {
      recommendation: {
        ...rec,
        recommended_quantity: customQuantity !== '' ? Number(customQuantity) : rec.recommended_quantity
      }
    };

    try {
      const response = await api.simulateTransfer(simRequest);
      setResult(response);
      onSimulationSuccess?.(response);
    } catch (err: any) {
      // On failure: keep previous result, show error only
      setError(err.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  // Build chart data only when we have a result
  const chartData = result
    ? [
        {
          label: 'Before Transfer',
          value: Math.max(0, result.waste_before_transfer),
          fill: '#f87171',   // red-400
        },
        {
          label: 'After Transfer',
          value: Math.max(0, result.waste_after_transfer),
          fill: '#34d399',   // emerald-400
        },
      ]
    : [];

  // Percentage reduction for the summary badge
  const reductionPct =
    result && result.waste_before_transfer > 0
      ? Math.round((result.waste_avoided / result.waste_before_transfer) * 100)
      : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Calculator size={18} className="text-blue-600" />
          What-If Simulation
        </h3>
        <p className="text-sm text-slate-500 mt-1">Test the impact of inventory transfers</p>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        {/* ── Input Form ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Transfer Scenario</label>
            <select
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedRecIndex}
              onChange={(e) => {
                setSelectedRecIndex(e.target.value === '' ? '' : Number(e.target.value));
                setResult(null);
                setError(null);
                if (e.target.value !== '') {
                  setCustomQuantity(recommendations[Number(e.target.value)].recommended_quantity);
                } else {
                  setCustomQuantity('');
                }
              }}
            >
              <option value="">-- Choose a recommendation --</option>
              {recommendations.map((rec, idx) => (
                <option key={idx} value={idx}>
                  {rec.product_name} ({rec.source_warehouse_name} → {rec.destination_warehouse_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Transfer Quantity</label>
            <input
              type="number"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
              placeholder="e.g. 100"
              value={customQuantity}
              onChange={(e) => setCustomQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={selectedRecIndex === ''}
              min={1}
            />
            {/* Inline validation hint */}
            {customQuantity !== '' && Number(customQuantity) <= 0 && (
              <p className="text-xs text-red-500 mt-1">Quantity must be greater than zero.</p>
            )}
          </div>

          <button
            onClick={handleSimulate}
            disabled={selectedRecIndex === '' || isSimulating || customQuantity === '' || Number(customQuantity) <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {isSimulating ? (
              <span className="animate-pulse">Running Simulation...</span>
            ) : (
              <>
                <Play size={16} />
                Run Simulation
              </>
            )}
          </button>
        </div>

        {/* ── Results Area ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Error banner — does NOT clear previous result */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2 border border-red-100">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Empty state */}
          {!result && !error && (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
              Select a scenario and click Run to see the estimated waste reduction.
            </div>
          )}

          {/* ── Result Panel ─────────────────────────────────────── */}
          {result && (
            <div className="flex flex-col gap-4">

              {/* Waste Avoided highlight */}
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingDown size={16} className="text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Waste Avoided</p>
                </div>
                <p className="text-3xl font-black text-emerald-500">
                  {Math.max(0, Math.round(result.waste_avoided)).toLocaleString()}
                  <span className="text-base font-medium text-emerald-600 ml-1.5">units</span>
                </p>
                {reductionPct !== null && (
                  <p className="text-sm text-emerald-600 font-medium mt-1">
                    {reductionPct}% reduction in potential waste
                  </p>
                )}
              </div>

              {/* Before / After bar chart */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Before vs After Transfer
                </p>

                <ResponsiveContainer width="100%" height={130}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip content={<WasteTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(v: unknown) => Math.round(v as number).toLocaleString()}
                        style={{ fontSize: 12, fontWeight: 600, fill: '#475569' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Compact numeric summary row */}
              <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3 text-sm">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-0.5">Before</p>
                  <p className="font-bold text-red-500">
                    {Math.max(0, Math.round(result.waste_before_transfer)).toLocaleString()}
                  </p>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-0.5">After</p>
                  <p className="font-bold text-emerald-600">
                    {Math.max(0, Math.round(result.waste_after_transfer)).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-0.5">Avoided</p>
                  <p className="font-bold text-emerald-700">
                    {Math.max(0, Math.round(result.waste_avoided)).toLocaleString()}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
