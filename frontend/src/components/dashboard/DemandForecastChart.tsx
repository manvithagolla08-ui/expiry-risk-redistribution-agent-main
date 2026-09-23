import type { ForecastResponse, Product, Warehouse } from '../../types/analytics';
import { TrendingUp, Calendar, Info } from 'lucide-react';

interface DemandForecastChartProps {
  data: ForecastResponse | null;
  productName?: string;
  warehouseName?: string;
  isLoading: boolean;

  // Selector data & callbacks
  products: Product[];
  warehouses: Warehouse[];
  selectedProductId: string;
  selectedWarehouseId: string;
  onProductChange: (id: string) => void;
  onWarehouseChange: (id: string) => void;
}

export function DemandForecastChart({
  data,
  productName,
  warehouseName,
  isLoading,
  products,
  warehouses,
  selectedProductId,
  selectedWarehouseId,
  onProductChange,
  onWarehouseChange,
}: DemandForecastChartProps) {

  const selectClass =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-700 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

  const selectors = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
      {/* Product selector */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
        <select
          value={selectedProductId}
          onChange={(e) => onProductChange(e.target.value)}
          className={selectClass}
        >
          <option value="">— Select product —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Warehouse selector */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Warehouse</label>
        <select
          value={selectedWarehouseId}
          onChange={(e) => onWarehouseChange(e.target.value)}
          className={selectClass}
        >
          <option value="">— Select warehouse —</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[300px]">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Demand Forecast</h3>
        {selectors}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400">Loading forecast...</div>
        </div>
      </div>
    );
  }

  // ── Empty / awaiting selection ─────────────────────────────────────────────
  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[300px]">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Demand Forecast</h3>
        {selectors}
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div className="text-slate-400 flex flex-col items-center">
            <Info className="mb-2" size={24} />
            <p>Select a product and warehouse to view the forecast.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Forecast data ──────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[300px]">
      <div>
        <h3 className="text-lg font-semibold text-slate-800">Demand Forecast</h3>
        <p className="text-sm text-slate-500 mb-4">
          {productName && warehouseName ? `${productName} at ${warehouseName}` : 'Forecast details'}
        </p>
      </div>

      {selectors}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <TrendingUp size={20} />
            <h4 className="font-medium">Forecasted Daily Demand</h4>
          </div>
          <p className="text-4xl font-bold text-slate-800">
            {data.forecast_daily_demand.toFixed(2)}
            <span className="text-base font-normal text-slate-500 ml-2">units/day</span>
          </p>
        </div>

        <div className="flex flex-col gap-4 justify-center">
          <div className="flex items-start gap-4">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-500 mt-1">
              <Info size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Method</p>
              <p className="text-sm text-slate-500">{data.method}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-500 mt-1">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Historical Period Used</p>
              <p className="text-sm text-slate-500">{data.historical_period_used_days} days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
