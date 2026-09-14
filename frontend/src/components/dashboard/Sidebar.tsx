import { LayoutDashboard, AlertTriangle, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'risk', label: 'Inventory Risk', icon: AlertTriangle },
    { id: 'demand', label: 'Demand Forecast', icon: TrendingUp },
    { id: 'redistribution', label: 'Redistribution', icon: RefreshCw },
    { id: 'simulation', label: 'Simulation', icon: BarChart2 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <RefreshCw size={18} className="text-white" />
          </div>
          Expiry Agent
        </div>
      </div>
      
      <nav className="flex-1 mt-6">
        <ul className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id} className="px-3">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-blue-600/10 text-blue-400" 
                      : "hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon size={18} className={clsx(isActive ? "text-blue-500" : "text-slate-500")} />
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-6 text-xs text-slate-500">
        <p>SH-204 Hackathon Project</p>
      </div>
    </aside>
  );
}
