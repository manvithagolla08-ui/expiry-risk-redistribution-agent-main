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

/** Visual progress bar for risk_score (0–100). Uses actual risk_score value only. */
const RiskProgressBar = ({ score }: { score: number }) => {
  const clamped = Math.min(100, Math.max(0, score));

  let barColor: string;
  if (clamped >= 75) {
    barColor = 'bg-red-500';
  } else if (clamped >= 50) {
    barColor = 'bg-orange-400';
  } else if (clamped >= 25) {
    barColor = 'bg-yellow-400';
  } else {
    barColor = 'bg-green-400';
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-sm font-semibold text-slate-800 tabular-nums">
        {score.toFixed(1)}
      </span>
      <div
        className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Risk score ${score.toFixed(1)} out of 100`}
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

/** Days to Expiry cell with tiered urgency styling. */
const DaysToExpiryCell = ({ days }: { days: number }) => {
  let textClass: string;
  let icon: string | null = null;

  if (days <= 7) {
    textClass = 'text-red-600 font-bold';
    icon = '🔴';
  } else if (days <= 30) {
    textClass = 'text-orange-500 font-semibold';
    icon = '🟠';
  } else if (days <= 60) {
    textClass = 'text-yellow-600 font-medium';
    icon = '🟡';
  } else {
    textClass = 'text-slate-600';
    icon = null;
  }

  return (
    <span className={clsx('inline-flex items-center gap-1', textClass)}>
      {icon && <span className="text-xs leading-none">{icon}</span>}
      {days}
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
        <div className="text-slate-400">No inventory risk data found.</div>
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
      {/* overflow-x-auto keeps the table scrollable on smaller screens */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left" style={{ minWidth: '720px' }}>
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
                  <DaysToExpiryCell days={row.days_to_expiry} />
                </td>
                <td className="px-6 py-4 text-right text-slate-600">
                  {Math.max(0, Math.round(row.potential_excess))}
                </td>
                <td className="px-6 py-4 text-right">
                  <RiskProgressBar score={row.risk_score} />
                </td>
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
