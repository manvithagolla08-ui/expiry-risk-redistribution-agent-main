import { LayoutDashboard, AlertTriangle, TrendingUp, RefreshCw, BarChart2, Package2 } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard',      label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'risk',           label: 'Inventory Risk',  icon: AlertTriangle   },
  { id: 'demand',         label: 'Demand Forecast', icon: TrendingUp      },
  { id: 'redistribution', label: 'Redistribution',  icon: RefreshCw       },
  { id: 'simulation',     label: 'Simulation',      icon: BarChart2       },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col shrink-0 border-r border-slate-800">

      {/* ── Branding ─────────────────────────────────────── */}
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <Package2 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight tracking-tight">Expiry Agent</p>
            <p className="text-slate-500 text-xs leading-tight mt-0.5">Inventory Intelligence</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <li key={id}>
                <button
                  onClick={() => setActiveTab(id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  )}
                >
                  <Icon
                    size={16}
                    className={clsx('shrink-0', isActive ? 'text-white' : 'text-slate-500')}
                  />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer ───────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600 leading-relaxed">
          SH-204 · Hackathon Project
        </p>
      </div>
    </aside>
  );
}
