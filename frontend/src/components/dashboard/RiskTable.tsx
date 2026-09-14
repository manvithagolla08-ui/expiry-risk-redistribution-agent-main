import type { RiskScoreResponse } from '../../types/analytics';
import { clsx } from 'clsx';


export interface RiskRowData extends RiskScoreResponse {
  product_name: string;
  warehouse_name: string;
  quantity: number;
}

interface RiskTableProps {
  data: RiskRowData[];
  isLoading: boolean;
}

const RiskBadge = ({ level }: { level: string }) => {
  const styles = {
    LOW: 'bg-green-100 text-green-700 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  }[level] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold border", styles)}>
      {level}
    </span>
  );
};

export function RiskTable({ data, isLoading }: RiskTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-slate-400">Loading risk analysis...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-slate-400">No high-risk inventory found.</div>
      </div>
    );
  }

  // Sort by risk score descending
  const sortedData = [...data].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Inventory at Risk</h3>
        <p className="text-sm text-slate-500">Batches sorted by expiry risk score</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Warehouse</th>
              <th className="px-6 py-3 text-right">Quantity</th>
              <th className="px-6 py-3 text-right">Days to Expiry</th>
              <th className="px-6 py-3 text-right">Potential Excess</th>
              <th className="px-6 py-3 text-right">Risk Score</th>
              <th className="px-6 py-3 text-center">Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map((row) => (
              <tr key={row.batch_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">{row.product_name}</td>
                <td className="px-6 py-4 text-slate-600">{row.warehouse_name}</td>
                <td className="px-6 py-4 text-right text-slate-600">{row.quantity}</td>
                <td className="px-6 py-4 text-right">
                  <span className={row.days_to_expiry < 30 ? "text-red-600 font-semibold" : "text-slate-600"}>
                    {row.days_to_expiry}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-slate-600">{Math.max(0, Math.round(row.potential_excess))}</td>
                <td className="px-6 py-4 text-right font-medium text-slate-800">{row.risk_score.toFixed(1)}</td>
                <td className="px-6 py-4 text-center">
                  <RiskBadge level={row.risk_level} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
