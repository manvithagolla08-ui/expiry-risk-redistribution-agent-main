import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { RiskScoreResponse } from '../../types/analytics';

interface RiskDistributionChartProps {
  data: RiskScoreResponse[];
  isLoading: boolean;
}

const COLORS = {
  LOW: '#10b981',      // Emerald 500
  MEDIUM: '#f59e0b',   // Amber 500
  HIGH: '#f97316',     // Orange 500
  CRITICAL: '#ef4444'  // Red 500
};

export function RiskDistributionChart({ data, isLoading }: RiskDistributionChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[400px]">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Risk Distribution</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400">Loading chart data...</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[400px]">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Risk Distribution</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400">No data available.</div>
        </div>
      </div>
    );
  }

  // Aggregate data by risk level
  const distribution = data.reduce((acc, curr) => {
    acc[curr.risk_level] = (acc[curr.risk_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(distribution).map(([name, value]) => ({
    name,
    value
  }));

  // Sort logically
  const order = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
  chartData.sort((a, b) => (order[a.name as keyof typeof order] || 0) - (order[b.name as keyof typeof order] || 0));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[400px]">
      <div>
        <h3 className="text-lg font-semibold text-slate-800">Risk Distribution</h3>
        <p className="text-sm text-slate-500 mb-6">Number of batches by risk level</p>
      </div>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#cbd5e1'} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [`${value} Batches`, 'Count']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
          <span className="text-3xl font-bold text-slate-800">{data.length}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Total</span>
        </div>
      </div>
    </div>
  );
}
