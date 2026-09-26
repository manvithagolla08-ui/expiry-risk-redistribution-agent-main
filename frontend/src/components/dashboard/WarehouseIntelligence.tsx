import { useMemo } from 'react';
import { AlertTriangle, TrendingDown, RefreshCw, Building2 } from 'lucide-react';
import { clsx } from 'clsx';

// ── Exported type — imported by Dashboard.tsx for useMemo aggregation ─────────

export interface WarehouseStats {
  warehouse_id: string;
  warehouse_name: string;
  capacity: number;
  current_inventory: number;
  utilisation_percent: number;
  at_risk_batches: number;
  at_risk_quantity: number;
  potential_excess: number;
  average_risk_score: number;
  transfers_out_count: number;
  transfers_out_quantity: number;
  transfers_in_count: number;
  transfers_in_quantity: number;
}

interface WarehouseIntelligenceProps {
  data: WarehouseStats[];
  isLoading: boolean;
}

// ── Risk helpers — mirrors exact thresholds from RiskTable / scorer.py ────────

function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 80) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

/** Bar colour matches RiskProgressBar in RiskTable.tsx exactly */
function getRiskBarColor(score: number): string {
  if (score >= 75) return 'bg-red-500';
  if (score >= 50) return 'bg-orange-400';
  if (score >= 25) return 'bg-yellow-400';
  return 'bg-green-400';
}

function getRiskIconClass(riskLevel: string): string {
  switch (riskLevel) {
    case 'CRITICAL': return 'bg-red-50 text-red-600';
    case 'HIGH':     return 'bg-orange-50 text-orange-600';
    case 'MEDIUM':   return 'bg-yellow-50 text-yellow-600';
    default:         return 'bg-green-50 text-green-600';
  }
}

const RISK_BADGE_CLASS: Record<string, string> = {
  LOW:      'bg-green-100  text-green-700  border-green-200',
  MEDIUM:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  HIGH:     'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100    text-red-700    border-red-200',
};

// ── Utilisation helpers — UI thresholds only; no backend logic changed ────────

function getUtilisationBarColor(pct: number): string {
  if (pct > 90)  return 'bg-red-500';
  if (pct >= 70) return 'bg-amber-400';
  return 'bg-emerald-500';
}

function getUtilisationTextColor(pct: number): string {
  if (pct > 90)  return 'text-red-600';
  if (pct >= 70) return 'text-amber-600';
  return 'text-emerald-600';
}

// ── Spotlight Card ─────────────────────────────────────────────────────────────

interface SpotlightCardProps {
  title: string;
  icon: React.ElementType;
  iconClass: string;
  warehouseName: string;
  badgeLabel?: string;
  badgeClass?: string;
  metric1Label: string;
  metric1Value: string;
  metric2Label: string;
  metric2Value: string;
}

function SpotlightCard({
  title,
  icon: Icon,
  iconClass,
  warehouseName,
  badgeLabel,
  badgeClass,
  metric1Label,
  metric1Value,
  metric2Label,
  metric2Value,
}: SpotlightCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 min-w-0">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest leading-tight">
          {title}
        </p>
        <div className={clsx('p-2 rounded-lg shrink-0', iconClass)}>
          <Icon size={14} />
        </div>
      </div>

      {/* Warehouse name + optional risk badge */}
      <div>
        <p
          className="font-bold text-slate-800 text-sm leading-snug truncate"
          title={warehouseName}
        >
          {warehouseName}
        </p>
        {badgeLabel && badgeClass && (
          <span
            className={clsx(
              'inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
              badgeClass,
            )}
          >
            {badgeLabel}
          </span>
        )}
      </div>

      {/* Two-metric row */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">{metric1Label}</p>
          <p className="text-base font-bold text-slate-800 tabular-nums leading-tight">
            {metric1Value}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">{metric2Label}</p>
          <p className="text-base font-bold text-slate-800 tabular-nums leading-tight">
            {metric2Value}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Table row (extracted for readability) ─────────────────────────────────────

function TableRow({ wh }: { wh: WarehouseStats }) {
  const riskLevel = getRiskLevel(wh.average_risk_score);
  const utilClamped  = Math.min(100, Math.max(0, wh.utilisation_percent));
  const scoreClamped = Math.min(100, Math.max(0, wh.average_risk_score));

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      {/* Warehouse */}
      <td className="px-5 py-3.5">
        <p className="font-medium text-slate-800 leading-snug">{wh.warehouse_name}</p>
      </td>

      {/* Capacity */}
      <td className="px-5 py-3.5 text-right tabular-nums text-slate-500 text-sm">
        {wh.capacity.toLocaleString()}
      </td>

      {/* Current Inventory */}
      <td className="px-5 py-3.5 text-right tabular-nums font-medium text-slate-700">
        {wh.current_inventory.toLocaleString()}
      </td>

      {/* Utilisation — progress bar + percentage */}
      <td className="px-5 py-3.5">
        {wh.capacity > 0 ? (
          <div className="flex flex-col gap-1">
            <span
              className={clsx(
                'text-xs font-semibold tabular-nums',
                getUtilisationTextColor(wh.utilisation_percent),
              )}
            >
              {Math.round(wh.utilisation_percent)}%
            </span>
            <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={clsx('h-full rounded-full', getUtilisationBarColor(wh.utilisation_percent))}
                style={{ width: `${utilClamped}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )}
      </td>

      {/* At-Risk Batches */}
      <td className="px-5 py-3.5 text-right">
        {wh.at_risk_batches > 0 ? (
          <span
            className={clsx(
              'inline-flex items-center justify-center rounded-full text-xs font-bold border px-2 py-0.5',
              wh.at_risk_batches >= 5
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-orange-100 text-orange-700 border-orange-200',
            )}
          >
            {wh.at_risk_batches}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )}
      </td>

      {/* Potential Excess */}
      <td className="px-5 py-3.5 text-right tabular-nums">
        {wh.potential_excess > 0 ? (
          <span className="font-medium text-orange-600">
            {Math.round(wh.potential_excess).toLocaleString()}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )}
      </td>

      {/* Avg Risk Score — number + level badge + mini bar */}
      <td className="px-5 py-3.5">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-800 tabular-nums">
              {wh.average_risk_score.toFixed(1)}
            </span>
            <span
              className={clsx(
                'px-1.5 py-px rounded text-xs font-semibold border',
                RISK_BADGE_CLASS[riskLevel],
              )}
            >
              {riskLevel}
            </span>
          </div>
          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={clsx('h-full rounded-full', getRiskBarColor(wh.average_risk_score))}
              style={{ width: `${scoreClamped}%` }}
            />
          </div>
        </div>
      </td>

      {/* Transfers Out — "count · qty units" */}
      <td className="px-5 py-3.5 text-right">
        {wh.transfers_out_count > 0 ? (
          <span className="tabular-nums text-blue-600 font-medium text-sm whitespace-nowrap">
            {wh.transfers_out_count}&nbsp;&middot;&nbsp;{wh.transfers_out_quantity.toLocaleString()} units
          </span>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function WarehouseIntelligence({ data, isLoading }: WarehouseIntelligenceProps) {

  // Spotlight: highest average_risk_score — shown whenever any warehouse data exists
  const mostAtRisk = useMemo(
    () =>
      data.length > 0
        ? data.reduce((m, w) => (w.average_risk_score > m.average_risk_score ? w : m))
        : null,
    [data],
  );

  // Spotlight: highest potential_excess — only shown when at least one warehouse has excess > 0
  const mostExcess = useMemo(
    () =>
      data.some((w) => w.potential_excess > 0)
        ? data.reduce((m, w) => (w.potential_excess > m.potential_excess ? w : m))
        : null,
    [data],
  );

  // Spotlight: highest transfers_out_count — only shown when redistribution exists
  const mostActiveSource = useMemo(
    () =>
      data.some((w) => w.transfers_out_count > 0)
        ? data.reduce((m, w) => (w.transfers_out_count > m.transfers_out_count ? w : m))
        : null,
    [data],
  );

  // Table sorted descending by average_risk_score
  const sortedRows = useMemo(
    () => [...data].sort((a, b) => b.average_risk_score - a.average_risk_score),
    [data],
  );

  // Section heading is always rendered (even during loading / empty)
  const sectionHeader = (
    <div className="pb-1 border-b border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">
        Warehouse Intelligence
      </h2>
      <p className="text-sm text-slate-500 mt-0.5">
        Warehouse-level inventory, risk, capacity and redistribution overview.
      </p>
    </div>
  );

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-5">
        {sectionHeader}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center min-h-[200px] gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Loading warehouse intelligence…</p>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className="space-y-5">
        {sectionHeader}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center min-h-[200px] gap-3">
          <Building2 size={32} className="text-slate-300" />
          <p className="text-sm text-slate-500">No warehouse intelligence data available.</p>
        </div>
      </div>
    );
  }

  // ── Full render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {sectionHeader}

      {/* Spotlight Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Card A — Most At-Risk Warehouse */}
        {mostAtRisk !== null && (() => {
          const level = getRiskLevel(mostAtRisk.average_risk_score);
          return (
            <SpotlightCard
              title="Most At-Risk Warehouse"
              icon={AlertTriangle}
              iconClass={getRiskIconClass(level)}
              warehouseName={mostAtRisk.warehouse_name}
              badgeLabel={level}
              badgeClass={RISK_BADGE_CLASS[level]}
              metric1Label="Avg Risk Score"
              metric1Value={mostAtRisk.average_risk_score.toFixed(1)}
              metric2Label="At-Risk Batches"
              metric2Value={mostAtRisk.at_risk_batches.toLocaleString()}
            />
          );
        })()}

        {/* Card B — Most Excess Inventory */}
        {mostExcess !== null && (
          <SpotlightCard
            title="Most Excess Inventory"
            icon={TrendingDown}
            iconClass="bg-orange-50 text-orange-600"
            warehouseName={mostExcess.warehouse_name}
            metric1Label="Potential Excess"
            metric1Value={`${Math.round(mostExcess.potential_excess).toLocaleString()} units`}
            metric2Label="Current Inventory"
            metric2Value={`${mostExcess.current_inventory.toLocaleString()} units`}
          />
        )}

        {/* Card C — Most Active Transfer Source */}
        {mostActiveSource !== null && (
          <SpotlightCard
            title="Most Active Transfer Source"
            icon={RefreshCw}
            iconClass="bg-blue-50 text-blue-600"
            warehouseName={mostActiveSource.warehouse_name}
            metric1Label="Transfers Out"
            metric1Value={mostActiveSource.transfers_out_count.toLocaleString()}
            metric2Label="Total Qty Out"
            metric2Value={`${mostActiveSource.transfers_out_quantity.toLocaleString()} units`}
          />
        )}
      </div>

      {/* Comparison Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">Warehouse Comparison</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {sortedRows.length} warehouse{sortedRows.length !== 1 ? 's' : ''} — sorted by average risk score
          </p>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full text-sm text-left"
            style={{ minWidth: '900px' }}
          >
            <thead className="text-xs font-semibold text-slate-500 uppercase tracking-widest bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Warehouse</th>
                <th className="px-5 py-3 text-right">Capacity</th>
                <th className="px-5 py-3 text-right">Current Inventory</th>
                <th className="px-5 py-3">Utilisation</th>
                <th className="px-5 py-3 text-right">At-Risk Batches</th>
                <th className="px-5 py-3 text-right">Potential Excess</th>
                <th className="px-5 py-3 text-right">Avg Risk Score</th>
                <th className="px-5 py-3 text-right">Transfers Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRows.map((wh) => (
                <TableRow key={wh.warehouse_id} wh={wh} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
