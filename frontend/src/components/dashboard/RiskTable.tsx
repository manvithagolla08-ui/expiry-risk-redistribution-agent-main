import { useState } from 'react';
import type { RiskScoreResponse } from '../../types/analytics';
import { api } from '../../services/api';
import { clsx } from 'clsx';
import { Sparkles, X } from 'lucide-react';


export interface RiskRowData extends RiskScoreResponse {
  product_name: string;
  warehouse_name: string;
  quantity: number;
}

interface RiskTableProps {
  data: RiskRowData[];
  isLoading: boolean;
}

// ── Explanation panel state per row ──────────────────────────────────────────
type ExplainState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; text: string }
  | { status: 'error' };

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

// ── AI Explanation Panel ──────────────────────────────────────────────────────
interface ExplainPanelProps {
  row: RiskRowData;
  state: ExplainState;
  onRequest: () => void;
  onDismiss: () => void;
}

function ExplainPanel({ row, state, onRequest, onDismiss }: ExplainPanelProps) {
  return (
    <tr>
      {/* span all 8 columns (7 data + 1 AI action) */}
      <td colSpan={8} className="px-6 pb-4 pt-0">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
              <Sparkles size={15} />
              AI Explanation — {row.product_name} @ {row.warehouse_name}
            </div>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss explanation"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          {state.status === 'loading' && (
            <p className="text-sm text-slate-500 italic">Generating explanation…</p>
          )}
          {state.status === 'success' && (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {state.text}
            </p>
          )}
          {state.status === 'error' && (
            <p className="text-sm text-red-600">
              AI explanation is currently unavailable. Please try again later.
            </p>
          )}

          {/* Re-request button when in error state */}
          {state.status === 'error' && (
            <button
              onClick={onRequest}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function RiskTable({ data, isLoading }: RiskTableProps) {
  // Map: batch_id -> ExplainState
  const [explainStates, setExplainStates] = useState<Record<string, ExplainState>>({});

  function setRowState(batchId: string, state: ExplainState) {
    setExplainStates(prev => ({ ...prev, [batchId]: state }));
  }

  async function handleExplain(row: RiskRowData) {
    const batchId = row.batch_id;
    const current = explainStates[batchId];

    // Toggle off if already showing a result
    if (current?.status === 'success' || current?.status === 'error') {
      setRowState(batchId, { status: 'idle' });
      return;
    }

    setRowState(batchId, { status: 'loading' });

    try {
      const result = await api.explainInventory({
        product_name: row.product_name,
        warehouse_name: row.warehouse_name,
        quantity: row.quantity,
        days_to_expiry: row.days_to_expiry,
        risk_score: row.risk_score,
        risk_level: row.risk_level,
        potential_excess: row.potential_excess,
      });
      setRowState(batchId, { status: 'success', text: result.explanation });
    } catch {
      setRowState(batchId, { status: 'error' });
    }
  }

  function handleDismiss(batchId: string) {
    setRowState(batchId, { status: 'idle' });
  }

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
        <table className="w-full text-sm text-left" style={{ minWidth: '820px' }}>
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Warehouse</th>
              <th className="px-6 py-3 text-right">Quantity</th>
              <th className="px-6 py-3 text-right">Days to Expiry</th>
              <th className="px-6 py-3 text-right">Potential Excess</th>
              <th className="px-6 py-3 text-right">Risk Score</th>
              <th className="px-6 py-3 text-center">Level</th>
              <th className="px-6 py-3 text-center">AI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map((row) => {
              const state: ExplainState = explainStates[row.batch_id] ?? { status: 'idle' };
              const isActive = state.status !== 'idle';
              const isLoading = state.status === 'loading';

              return (
                <>
                  <tr
                    key={row.batch_id}
                    className={clsx(
                      'hover:bg-slate-50 transition-colors',
                      isActive && 'bg-blue-50/40'
                    )}
                  >
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
                    <td className="px-6 py-4 text-center">
                      <button
                        id={`explain-btn-${row.batch_id}`}
                        onClick={() => handleExplain(row)}
                        disabled={isLoading}
                        title={isActive ? 'Dismiss explanation' : 'Explain with AI'}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          isLoading
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : isActive
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                        )}
                      >
                        <Sparkles size={12} />
                        {isLoading ? 'Thinking…' : isActive ? 'Dismiss' : 'Explain'}
                      </button>
                    </td>
                  </tr>

                  {/* Inline explanation panel — rendered only when active */}
                  {isActive && (
                    <ExplainPanel
                      key={`explain-${row.batch_id}`}
                      row={row}
                      state={state}
                      onRequest={() => handleExplain(row)}
                      onDismiss={() => handleDismiss(row.batch_id)}
                    />
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
