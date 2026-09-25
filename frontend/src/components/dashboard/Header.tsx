import { Search } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">

      {/* ── Search ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative w-80 hidden md:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={14}
          />
          <input
            type="search"
            id="global-search"
            placeholder="Search products, warehouses…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search inventory"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
      </div>

      {/* ── Right side ─────────────────────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-700">Live</span>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Avatar placeholder — no fake user name */}
        <div
          className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-semibold text-blue-700 select-none"
          title="Logged in"
          aria-label="User avatar"
        >
          IM
        </div>
      </div>
    </header>
  );
}
