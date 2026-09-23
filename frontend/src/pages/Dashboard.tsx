
import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type {
  Warehouse, Product, InventoryBatch, RiskScoreResponse, RedistributionRecommendation
} from '../types/analytics';

import { Sidebar } from '../components/dashboard/Sidebar';
import { Header } from '../components/dashboard/Header';
import { KPICard } from '../components/dashboard/KPICard';
import { RiskTable } from '../components/dashboard/RiskTable';
import type { RiskRowData } from '../components/dashboard/RiskTable';
import { RiskDistributionChart } from '../components/dashboard/RiskDistributionChart';
import { DemandForecastChart } from '../components/dashboard/DemandForecastChart';
import { RedistributionRecommendations } from '../components/dashboard/RedistributionRecommendations';
import type { RecommendationRowData } from '../components/dashboard/RedistributionRecommendations';
import { SimulationCard } from '../components/dashboard/SimulationCard';

import { Package, AlertTriangle, TrendingDown, Leaf } from 'lucide-react';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryBatch[]>([]);
  const [riskScores, setRiskScores] = useState<RiskScoreResponse[]>([]);
  const [recommendations, setRecommendations] = useState<RedistributionRecommendation[]>([]);

  // Loading State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [whData, prodData, invData, riskData, recData] = await Promise.all([
          api.getWarehouses(),
          api.getProducts(),
          api.getInventory(),
          api.getRiskScores(),
          api.getRecommendations()
        ]);

        setWarehouses(whData);
        setProducts(prodData);
        setInventory(invData);
        setRiskScores(riskData);
        setRecommendations(recData.recommendations);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Memos for lookups
  const productMap = useMemo(() =>
    products.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {} as Record<string, string>),
    [products]);

  const warehouseMap = useMemo(() =>
    warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w.name }), {} as Record<string, string>),
    [warehouses]);

  const batchMap = useMemo(() =>
    inventory.reduce((acc, b) => ({ ...acc, [b.id]: b }), {} as Record<string, InventoryBatch>),
    [inventory]);

  // Enriched Data
  const riskTableData: RiskRowData[] = useMemo(() => {
    return riskScores.map(score => {
      const batch = batchMap[score.batch_id];
      return {
        ...score,
        product_name: productMap[score.product_id] || 'Unknown Product',
        warehouse_name: warehouseMap[score.warehouse_id] || 'Unknown Warehouse',
        quantity: batch ? batch.quantity : 0
      };
    });
  }, [riskScores, productMap, warehouseMap, batchMap]);

  const recTableData: RecommendationRowData[] = useMemo(() => {
    return recommendations.map(rec => ({
      ...rec,
      product_name: productMap[rec.product_id] || 'Unknown Product',
      source_warehouse_name: warehouseMap[rec.source_warehouse_id] || 'Unknown Warehouse',
      destination_warehouse_name: warehouseMap[rec.destination_warehouse_id] || 'Unknown Warehouse'
    }));
  }, [recommendations, productMap, warehouseMap]);

  // KPIs
  const totalInventory = useMemo(() => inventory.reduce((sum, b) => sum + b.quantity, 0), [inventory]);

  const atRiskInventory = useMemo(() => {
    return riskTableData
      .filter(r => r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL')
      .reduce((sum, r) => sum + r.quantity, 0);
  }, [riskTableData]);

  const potentialExcess = useMemo(() => {
    return riskScores.reduce((sum, r) => sum + Math.max(0, r.potential_excess), 0);
  }, [riskScores]);

  // Filter riskTableData by searchQuery (product name or warehouse name, case-insensitive)
  const filteredRiskTableData: RiskRowData[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return riskTableData;
    return riskTableData.filter(
      (row) =>
        row.product_name.toLowerCase().includes(q) ||
        row.warehouse_name.toLowerCase().includes(q)
    );
  }, [riskTableData, searchQuery]);

  // Scroll to matching section whenever the active sidebar tab changes
  useEffect(() => {
    const sectionMap: Record<string, string> = {
      dashboard: 'dashboard-section',
      risk: 'risk-section',
      demand: 'demand-section',
      redistribution: 'redistribution-section',
      simulation: 'simulation-section',
    };
    const sectionId = sectionMap[activeTab];
    if (sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-200 max-w-md w-full text-center">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Header Area + KPIs — dashboard-section */}
            <div id="dashboard-section">
              <h1 className="text-2xl font-bold text-slate-800">Inventory Overview</h1>
              <p className="text-slate-500 mt-1">Monitor risk, forecast demand, and redistribute excess.</p>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <KPICard
                  title="Total Inventory"
                  value={totalInventory.toLocaleString()}
                  subtitle="Units across all locations"
                  icon={Package}
                  isLoading={isLoading}
                />
                <KPICard
                  title="At-Risk Inventory"
                  value={atRiskInventory.toLocaleString()}
                  subtitle="High & Critical risk units"
                  icon={AlertTriangle}
                  isLoading={isLoading}
                />
                <KPICard
                  title="Potential Excess"
                  value={Math.round(potentialExcess).toLocaleString()}
                  subtitle="Units above forecasted demand"
                  icon={TrendingDown}
                  isLoading={isLoading}
                />
                <KPICard
                  title="Waste Avoided"
                  value="No sim run"
                  subtitle="Run simulation to estimate"
                  icon={Leaf}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Top Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <RiskDistributionChart data={riskScores} isLoading={isLoading} />
              </div>
              {/* demand-section wraps the Demand Forecast chart */}
              <div id="demand-section" className="lg:col-span-2">
                <DemandForecastChart
                  data={null} // Passing null as we need selection for Forecast, handled below or as a placeholder
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Main Risk Table — risk-section */}
            <div id="risk-section">
              <RiskTable data={filteredRiskTableData} isLoading={isLoading} />
            </div>

            {/* Action Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* redistribution-section */}
              <div id="redistribution-section">
                <RedistributionRecommendations data={recTableData} isLoading={isLoading} />
              </div>
              {/* simulation-section */}
              <div id="simulation-section">
                <SimulationCard recommendations={recTableData} />
              </div>
            </div>

            <div className="pb-10"></div>
          </div>
        </main>
      </div>
    </div>
  );
}
