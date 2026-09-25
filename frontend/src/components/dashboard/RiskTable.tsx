import { useState, useMemo } from 'react';
import type { RiskScoreResponse } from '../../types/analytics';
import { api } from '../../services/api';
import { clsx } from 'clsx';
import {
  Sparkles,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Package2,
  MapPin,
  Clock,
  TrendingDown,
  BarChart2,
  AlertTriangle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RiskRowData extends RiskScoreResponse {
  product_name: string;
  warehouse_name: string;
  quantity: number;
}

interface RiskTableProps {
  data: RiskRowData[];
  isLoading: boolean;
}

type RiskLevel = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type SortField =
  | 'risk_score'
  | 'days_to_expiry'
  | 'potential_excess'
  | 'quantity';

type SortDir = 'asc' | 'desc';

// ── Constants ─────────────────────────────────────────────────────────────────

const RISK_LEVELS: RiskLevel[] = [
  'ALL',
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

const RISK_PILL: Record<string, string> = {
  ALL: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
  LOW: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200',
  MEDIUM:
    'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200',
  CRITICAL:
    'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
};

const RISK_PILL_ACTIVE: Record<string, string> = {
  ALL: 'bg-slate-700 text-white border-slate-700',
  LOW: 'bg-green-600 text-white border-green-600',
  MEDIUM: 'bg-yellow-500 text-white border-yellow-500',
  HIGH: 'bg-orange-500 text-white border-orange-500',
  CRITICAL: 'bg-red-600 text-white border-red-600',
};

const RISK_BADGE: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
};

const SORT_DEFAULTS: Record<SortField, SortDir> = {
  risk_score: 'desc',
  days_to_expiry: 'asc',
  potential_excess: 'desc',
  quantity: 'desc',
};

// ── ExplainState ──────────────────────────────────────────────────────────────

type ExplainState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; text: string }
  | { status: 'error' };

// ── Sub-components ────────────────────────────────────────────────────────────

const RiskBadge = ({ level }: { level: string }) => (
  <span
    className={clsx(
      'px-2.5 py-1 rounded-full text-xs font-semibold border',
      RISK_BADGE[level] ||
      'bg-slate-100 text-slate-700 border-slate-200',
    )}
  >
    {level}
  </span>
);

const RiskProgressBar = ({ score }: { score: number }) => {
  const clamped = Math.min(100, Math.max(0, score));

  const barColor =
    clamped >= 75
      ? 'bg-red-500'
      : clamped >= 50
        ? 'bg-orange-400'
        : clamped >= 25
          ? 'bg-yellow-400'
          : 'bg-green-400';

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
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            barColor,
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

const DaysToExpiryCell = ({ days }: { days: number }) => {
  const [textClass, icon] =
    days <= 7
      ? ['text-red-600 font-bold', '🔴']
      : days <= 30
        ? ['text-orange-500 font-semibold', '🟠']
        : days <= 60
          ? ['text-yellow-600 font-medium', '🟡']
          : ['text-slate-600', null];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1',
        textClass,
      )}
    >
      {icon && (
        <span className="text-xs leading-none">
          {icon}
        </span>
      )}
      {days}
    </span>
  );
};

// ── Sort indicator icon ───────────────────────────────────────────────────────

function SortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir: SortDir | null;
}) {
  if (!active || !dir) {
    return (
      <ChevronsUpDown
        size={12}
        className="text-slate-300 ml-1 inline"
      />
    );
  }

  return dir === 'asc' ? (
    <ChevronUp
      size={12}
      className="text-blue-500 ml-1 inline"
    />
  ) : (
    <ChevronDown
      size={12}
      className="text-blue-500 ml-1 inline"
    />
  );
}

// ── Sortable <th> ─────────────────────────────────────────────────────────────

interface SortableThProps {
  label: string;
  field: SortField;
  sortField: SortField | null;
  sortDir: SortDir | null;
  onSort: (f: SortField) => void;
  className?: string;
}

function SortableTh({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  className,
}: SortableThProps) {
  const active = sortField === field;

  return (
    <th
      className={clsx(
        'px-5 py-3 cursor-pointer select-none whitespace-nowrap transition-colors',
        active ? 'text-blue-600' : 'hover:text-slate-700',
        className,
      )}
      onClick={() => onSort(field)}
      aria-sort={
        active
          ? sortDir === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
    >
      {label}
      <SortIcon active={active} dir={sortDir} />
    </th>
  );
}

// ── AI Explain Panel ──────────────────────────────────────────────────────────

interface ExplainPanelProps {
  row: RiskRowData;
  state: ExplainState;
  onRequest: () => void;
  onDismiss: () => void;
}

function ExplainPanel({
  row,
  state,
  onRequest,
  onDismiss,
}: ExplainPanelProps) {
  return (
    <tr>
      <td colSpan={8} className="px-5 pb-4 pt-0">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
              <Sparkles size={14} />
              AI Explanation — {row.product_name} @ {row.warehouse_name}
            </div>

            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss explanation"
            >
              <X size={14} />
            </button>
          </div>

          {state.status === 'loading' && (
            <p className="text-sm text-slate-500 italic">
              Generating explanation…
            </p>
          )}

          {state.status === 'success' && (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {state.text}
            </p>
          )}

          {state.status === 'error' && (
            <>
              <p className="text-sm text-red-600">
                AI explanation is currently unavailable. Please try again later.
              </p>

              <button
                onClick={onRequest}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  row,
  onClose,
}: {
  row: RiskRowData;
  onClose: () => void;
}) {
  const barColor =
    row.risk_score >= 75
      ? 'bg-red-500'
      : row.risk_score >= 50
        ? 'bg-orange-400'
        : row.risk_score >= 25
          ? 'bg-yellow-400'
          : 'bg-green-400';

  return (
    <tr>
      <td colSpan={8} className="px-5 pb-4 pt-0">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          {/* Panel header */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
            <div>
              <p className="font-semibold text-slate-800 text-sm">
                {row.product_name}
              </p>

              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="shrink-0" />
                {row.warehouse_name}
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors mt-0.5"
              aria-label="Close detail panel"
            >
              <X size={14} />
            </button>
          </div>

          {/* Panel body */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-5 py-4">

            {/* Quantity */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Package2 size={12} />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Quantity
                </span>
              </div>

              <p className="text-xl font-bold text-slate-800 tabular-nums">
                {row.quantity.toLocaleString()}
                <span className="text-xs font-normal text-slate-500 ml-1">
                  units
                </span>
              </p>
            </div>

            {/* Days to Expiry */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock size={12} />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Days to Expiry
                </span>
              </div>

              <div className="text-xl font-bold tabular-nums">
                <DaysToExpiryCell days={row.days_to_expiry} />
                <span className="text-xs font-normal text-slate-500 ml-1">
                  days
                </span>
              </div>
            </div>

            {/* Risk Score */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <BarChart2 size={12} />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Risk Score
                </span>
              </div>

              <p className="text-xl font-bold text-slate-800 tabular-nums">
                {row.risk_score.toFixed(1)}
              </p>

              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-0.5">
                <div
                  className={clsx('h-full rounded-full', barColor)}
                  style={{
                    width: `${Math.min(100, row.risk_score)}%`,
                  }}
                />
              </div>
            </div>

            {/* Risk Level */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <AlertTriangle size={12} />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Risk Level
                </span>
              </div>

              <div className="mt-1">
                <RiskBadge level={row.risk_level} />
              </div>
            </div>

            {/* Expected Demand */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <TrendingDown size={12} />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Expected Demand
                </span>
              </div>

              <p className="text-xl font-bold text-slate-800 tabular-nums">
                {Math.round(
                  row.expected_demand_before_expiry,
                ).toLocaleString()}

                <span className="text-xs font-normal text-slate-500 ml-1">
                  units
                </span>
              </p>

              <p className="text-xs text-slate-400">
                before expiry
              </p>
            </div>

            {/* Potential Excess */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <TrendingDown size={12} />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Potential Excess
                </span>
              </div>

              <p className="text-xl font-bold text-orange-600 tabular-nums">
                {Math.max(
                  0,
                  Math.round(row.potential_excess),
                ).toLocaleString()}

                <span className="text-xs font-normal text-slate-500 ml-1">
                  units
                </span>
              </p>

              <p className="text-xs text-slate-400">
                above demand
              </p>
            </div>

          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function RiskTable({
  data,
  isLoading,
}: RiskTableProps) {

  // Filter state
  const [riskLevelFilter, setRiskLevelFilter] =
    useState<RiskLevel>('ALL');

  const [warehouseFilter, setWarehouseFilter] =
    useState('');

  // Sort state — default: risk_score desc
  const [sortField, setSortField] =
    useState<SortField | null>('risk_score');

  const [sortDir, setSortDir] =
    useState<SortDir | null>('desc');

  // Detail panel state
  const [selectedBatchId, setSelectedBatchId] =
    useState<string | null>(null);

  // AI explain state
  const [explainStates, setExplainStates] =
    useState<Record<string, ExplainState>>({});

  // ── Derived: unique warehouse names from data ───────────────────────────────

  const warehouseNames = useMemo(() => {
    const names = [
      ...new Set(data.map((r) => r.warehouse_name)),
    ].filter(Boolean);

    return names.sort();
  }, [data]);

  // ── Sort handler ────────────────────────────────────────────────────────────

  function handleSort(field: SortField) {
    if (sortField !== field) {
      // New column → use its default direction
      setSortField(field);
      setSortDir(SORT_DEFAULTS[field]);
      return;
    }

    if (sortDir === SORT_DEFAULTS[field]) {
      // Second click → reverse direction
      setSortDir(
        sortDir === 'asc' ? 'desc' : 'asc',
      );
    } else {
      // Third click → clear sorting
      setSortField(null);
      setSortDir(null);
    }
  }

  // ── Filtered rows ───────────────────────────────────────────────────────────

  // NOTE: `data` has already been through the Dashboard search filter.
  const filteredRows = useMemo(() => {
    let rows = data;

    if (riskLevelFilter !== 'ALL') {
      rows = rows.filter(
        (r) => r.risk_level === riskLevelFilter,
      );
    }

    if (warehouseFilter) {
      rows = rows.filter(
        (r) => r.warehouse_name === warehouseFilter,
      );
    }

    return rows;
  }, [data, riskLevelFilter, warehouseFilter]);

  // ── Sorted rows ─────────────────────────────────────────────────────────────

  const sortedRows = useMemo(() => {

    // No active sort → preserve original filtered order
    if (!sortField || !sortDir) {
      return filteredRows;
    }

    const copy = [...filteredRows];

    copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      const diff =
        (aVal as number) - (bVal as number);

      return sortDir === 'asc'
        ? diff
        : -diff;
    });

    return copy;
  }, [filteredRows, sortField, sortDir]);

  // ── AI explain handlers ─────────────────────────────────────────────────────

  function setRowExplainState(
    batchId: string,
    state: ExplainState,
  ) {
    setExplainStates((prev) => ({
      ...prev,
      [batchId]: state,
    }));
  }

  async function handleExplain(
    e: React.MouseEvent,
    row: RiskRowData,
  ) {
    e.stopPropagation();

    const batchId = row.batch_id;
    const current = explainStates[batchId];

    if (
      current?.status === 'success' ||
      current?.status === 'error'
    ) {
      setRowExplainState(batchId, {
        status: 'idle',
      });

      return;
    }

    setRowExplainState(batchId, {
      status: 'loading',
    });

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

      setRowExplainState(batchId, {
        status: 'success',
        text: result.explanation,
      });
    } catch {
      setRowExplainState(batchId, {
        status: 'error',
      });
    }
  }

  function handleDismissExplain(
    e: React.MouseEvent,
    batchId: string,
  ) {
    e.stopPropagation();

    setRowExplainState(batchId, {
      status: 'idle',
    });
  }

  // ── Row detail toggle ───────────────────────────────────────────────────────

  function handleRowClick(batchId: string) {
    setSelectedBatchId((prev) =>
      prev === batchId ? null : batchId,
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center min-h-[280px] gap-2">
        <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />

        <p className="text-sm text-slate-400">
          Loading risk analysis…
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-center min-h-[280px]">
        <p className="text-sm text-slate-400">
          No inventory risk data found.
        </p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Card header ──────────────────────────────────────────────────────── */}

      <div className="px-5 py-4 border-b border-slate-200 space-y-3">

        <div className="flex items-start justify-between gap-3 flex-wrap">

          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Inventory at Risk
            </h3>

            <p className="text-xs text-slate-500 mt-0.5">
              Showing{' '}
              <span className="font-medium text-slate-700">
                {sortedRows.length}
              </span>{' '}
              of{' '}
              <span className="font-medium text-slate-700">
                {data.length}
              </span>{' '}
              batches
            </p>
          </div>

          {/* Warehouse filter */}

          <div className="flex items-center gap-2 shrink-0">

            <label
              htmlFor="warehouse-filter"
              className="text-xs text-slate-500 whitespace-nowrap hidden sm:block"
            >
              Warehouse
            </label>

            <select
              id="warehouse-filter"
              value={warehouseFilter}
              onChange={(e) =>
                setWarehouseFilter(e.target.value)
              }
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            >
              <option value="">
                All warehouses
              </option>

              {warehouseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Risk level filter pills */}

        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter by risk level"
        >
          {RISK_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() =>
                setRiskLevelFilter(level)
              }
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                riskLevelFilter === level
                  ? RISK_PILL_ACTIVE[level]
                  : RISK_PILL[level],
              )}
              aria-pressed={
                riskLevelFilter === level
              }
            >
              {level === 'ALL'
                ? 'All'
                : level.charAt(0) +
                level.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}

      <div className="overflow-x-auto">

        <table
          className="w-full text-sm text-left"
          style={{ minWidth: '820px' }}
        >
          <thead className="text-xs font-semibold text-slate-500 uppercase tracking-widest bg-slate-50 border-b border-slate-200">
            <tr>

              <th className="px-5 py-3">
                Product
              </th>

              <th className="px-5 py-3">
                Warehouse
              </th>

              <SortableTh
                label="Qty"
                field="quantity"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="text-right"
              />

              <SortableTh
                label="Days Left"
                field="days_to_expiry"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="text-right"
              />

              <SortableTh
                label="Excess"
                field="potential_excess"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="text-right"
              />

              <SortableTh
                label="Risk Score"
                field="risk_score"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="text-right"
              />

              <th className="px-5 py-3 text-center">
                Level
              </th>

              <th className="px-5 py-3 text-center">
                AI
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">

            {sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  No batches match the current filters.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {

                const explainState: ExplainState =
                  explainStates[row.batch_id] ?? {
                    status: 'idle',
                  };

                const isExplainActive =
                  explainState.status !== 'idle';

                const isExplainLoading =
                  explainState.status === 'loading';

                const isDetailOpen =
                  selectedBatchId === row.batch_id;

                return (
                  <>

                    <tr
                      key={row.batch_id}
                      onClick={() =>
                        handleRowClick(row.batch_id)
                      }
                      className={clsx(
                        'cursor-pointer transition-colors',
                        isDetailOpen
                          ? 'bg-blue-50/60 border-l-2 border-l-blue-400'
                          : isExplainActive
                            ? 'bg-blue-50/30'
                            : 'hover:bg-slate-50',
                      )}
                    >

                      <td className="px-5 py-3 font-medium text-slate-800 text-sm">
                        {row.product_name}
                      </td>

                      <td className="px-5 py-3 text-slate-500 text-sm">
                        {row.warehouse_name}
                      </td>

                      <td className="px-5 py-3 text-right text-slate-600 text-sm tabular-nums">
                        {row.quantity.toLocaleString()}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <DaysToExpiryCell
                          days={row.days_to_expiry}
                        />
                      </td>

                      <td className="px-5 py-3 text-right text-slate-600 text-sm tabular-nums">
                        {Math.max(
                          0,
                          Math.round(
                            row.potential_excess,
                          ),
                        ).toLocaleString()}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <RiskProgressBar
                          score={row.risk_score}
                        />
                      </td>

                      <td className="px-5 py-3 text-center">
                        <RiskBadge
                          level={row.risk_level}
                        />
                      </td>

                      <td className="px-5 py-3 text-center">

                        <button
                          id={`explain-btn-${row.batch_id}`}
                          onClick={(e) =>
                            handleExplain(e, row)
                          }
                          disabled={isExplainLoading}
                          title={
                            isExplainActive
                              ? 'Dismiss explanation'
                              : 'Explain with AI'
                          }
                          className={clsx(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            isExplainLoading
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : isExplainActive
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700',
                          )}
                        >
                          <Sparkles size={12} />

                          {isExplainLoading
                            ? 'Thinking…'
                            : isExplainActive
                              ? 'Dismiss'
                              : 'Explain'}
                        </button>

                      </td>

                    </tr>

                    {/* Detail panel */}

                    {isDetailOpen && (
                      <DetailPanel
                        key={`detail-${row.batch_id}`}
                        row={row}
                        onClose={() =>
                          setSelectedBatchId(null)
                        }
                      />
                    )}

                    {/* AI Explain panel */}

                    {isExplainActive && (
                      <ExplainPanel
                        key={`explain-${row.batch_id}`}
                        row={row}
                        state={explainState}
                        onRequest={() =>
                          handleExplain(
                            {
                              stopPropagation: () => { },
                            } as React.MouseEvent,
                            row,
                          )
                        }
                        onDismiss={() =>
                          handleDismissExplain(
                            {
                              stopPropagation: () => { },
                            } as React.MouseEvent,
                            row.batch_id,
                          )
                        }
                      />
                    )}

                  </>
                );
              })
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}