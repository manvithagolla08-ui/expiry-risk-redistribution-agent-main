import { useState } from 'react';
import { api } from '../../services/api';
import type { RecommendationRowData } from './RedistributionRecommendations';
import type { WhatIfSimulationResponse } from '../../types/analytics';
import { Play, Calculator, AlertCircle, ArrowRight } from 'lucide-react';

interface SimulationCardProps {
  recommendations: RecommendationRowData[];
}

export function SimulationCard({ recommendations }: SimulationCardProps) {
  const [selectedRecIndex, setSelectedRecIndex] = useState<number | ''>('');
  const [customQuantity, setCustomQuantity] = useState<number | ''>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<WhatIfSimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    if (selectedRecIndex === '') return;
    
    setIsSimulating(true);
    setError(null);
    setResult(null);

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
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

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
        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Transfer Scenario</label>
            <select 
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedRecIndex}
              onChange={(e) => {
                setSelectedRecIndex(e.target.value === '' ? '' : Number(e.target.value));
                setResult(null);
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
            />
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

        {/* Results Area */}
        <div className="flex-1 mt-2">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2 border border-red-100">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result && !error && (
             <div className="h-full flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
               Select a scenario and click run to see the estimated waste reduction.
             </div>
          )}

          {result && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-center w-5/12">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Before Transfer</p>
                  <p className="text-xl font-bold text-red-600">
                    {Math.max(0, Math.round(result.waste_before_transfer))}
                  </p>
                  <p className="text-xs text-slate-500">Expected Waste</p>
                </div>
                
                <div className="w-2/12 flex justify-center text-slate-400">
                  <ArrowRight size={20} />
                </div>

                <div className="text-center w-5/12">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">After Transfer</p>
                  <p className="text-xl font-bold text-green-600">
                    {Math.max(0, Math.round(result.waste_after_transfer))}
                  </p>
                  <p className="text-xs text-slate-500">Expected Waste</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-green-200 p-3 text-center shadow-sm">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Waste Avoided</p>
                <p className="text-2xl font-black text-green-500">
                  {Math.max(0, Math.round(result.waste_avoided))}
                  <span className="text-sm font-medium text-green-600 ml-1">units</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
