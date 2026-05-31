import React from 'react';
import { 
  Activity, 
  Flame, 
  Heart, 
  Stethoscope, 
  LogOut,
  Shield,
  Share2
} from 'lucide-react';

export default function DashboardSidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'all', label: 'Live Queue', icon: Activity, color: 'text-cyan-600' },
    { id: 'trauma', label: 'Emergency/Trauma', icon: Flame, color: 'text-red-600' },
    { id: 'cardio', label: 'Cardiology', icon: Heart, color: 'text-pink-600' },
    { id: 'medicine', label: 'Gen Medicine', icon: Stethoscope, color: 'text-emerald-600' },
    { id: 'load', label: 'Civil Load Balance', icon: Share2, color: 'text-amber-600' },
  ];

  return (
    <div className="glass-panel w-full lg:w-64 rounded-2xl p-4 flex flex-col justify-between h-fit lg:h-[calc(100vh-120px)] sticky top-24 transition-all duration-300 select-none">
      <div className="space-y-6">
        <div className="px-3 py-2 border-b border-slate-200/60 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-600 animate-pulse" />
            <span className="font-bold tracking-wider text-[10px] uppercase text-slate-500">Staff Portal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1 tracking-tight">KGMU Command</h2>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left group ${
                  isActive 
                    ? 'bg-cyan-50 text-cyan-600 border border-cyan-200/60 shadow-[0_2px_8px_rgba(6,182,212,0.06)]' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? item.color : 'text-slate-500 group-hover:text-slate-800'}`} />
                <span className="font-semibold text-sm">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-200/60 mt-6 lg:mt-0">
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-100/80 rounded-xl border border-slate-200/60 hover:border-cyan-500/40 transition-all duration-300">
          <div className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center font-bold text-cyan-700 text-xs">
            DS
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-850 truncate">Dr. S. Tripathi</p>
            <p className="text-[10px] text-slate-500 truncate font-medium">Trauma Chief</p>
          </div>
          <button 
            onClick={onLogout}
            title="Lock Portal (Logout)"
            className="p-1.5 hover:bg-red-55 text-slate-400 hover:text-red-650 rounded-lg ml-auto transition-all duration-300 hover:scale-105 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
