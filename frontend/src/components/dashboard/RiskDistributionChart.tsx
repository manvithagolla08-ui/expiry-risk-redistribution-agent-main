import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { RiskScoreResponse } from '../../types/analytics';

interface RiskDistributionChartProps {
  data: RiskScoreResponse[];
  isLoading: boolean;
}

const RISK_COLORS: Record<string, string> = {
  LOW:      '#10b981',   // emerald-500
  MEDIUM:   '#f59e0b',   // amber-500
  HIGH:     '#f97316',   // orange-500
  CRITICAL: '#ef4444',   // red-500
};

const RISK_ORDER: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

const CardShell = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[380px]">
    {children}
  </div>
);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const { name, value } = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
        <p className="font-semibold text-slate-700">{name}</p>
        <p className="text-slate-500">{value} batch{value !== 1 ? 'es' : ''}</p>
      </div>
    );
  }
  return null;
};

export function RiskDistributionChart({ data, isLoading }: RiskDistributionChartProps) {
  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <CardShell>
        <SectionHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading chart data…</div>
        </div>
      </CardShell>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (!data || data.length === 0) {
    return (
      <CardShell>
        <SectionHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400 text-sm">No data available.</div>
        </div>
      </CardShell>
    );
  }

  // Aggregate by risk level
  const distribution = data.reduce((acc, curr) => {
    acc[curr.risk_level] = (acc[curr.risk_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(distribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (RISK_ORDER[a.name] ?? 0) - (RISK_ORDER[b.name] ?? 0));

  return (
    <CardShell>
      <SectionHeader />

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="48%"
              innerRadius={72}
              outerRadius={108}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={2}
              stroke="#fff"
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={RISK_COLORS[entry.name] || '#cbd5e1'}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: 12, color: '#64748b' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Donut centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
          <span className="text-3xl font-bold text-slate-800 leading-none">{data.length}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider mt-1">Batches</span>
        </div>
      </div>
    </CardShell>
  );
}

function SectionHeader() {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-800">Risk Distribution</h3>
      <p className="text-xs text-slate-500 mt-0.5">Inventory batches by risk level</p>
    </div>
  );
}
