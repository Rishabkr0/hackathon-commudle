import React from 'react';
import { Users, Clock, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatsCards({ totalOPD, avgWaitTime, codeRedCount, isLiveStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total OPD Patients */}
      <div className="glass-panel rounded-2xl p-6 antigravity-hover relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-100/40 rounded-bl-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-110" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">Total OPD Patients</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {totalOPD.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="font-semibold">+12% from yesterday</span>
            </div>
          </div>
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-200/60 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Average Wait Time */}
      <div className="glass-panel rounded-2xl p-6 antigravity-hover relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/40 rounded-bl-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-110" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">Average Wait Time</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {avgWaitTime}m
            </h3>
            <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">-8m improvement</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200/60 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Code Red Alerts */}
      <div className={`glass-panel-neon-red rounded-2xl p-6 antigravity-hover-red relative overflow-hidden group border-red-200/80 ${codeRedCount > 0 ? 'animate-pulse-slow' : ''}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/40 rounded-bl-full -mr-4 -mt-4 transition-all duration-300 group-hover:scale-110" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-red-600">Code Red Alerts</p>
            <h3 className="text-3xl font-extrabold text-red-900 mt-2 tracking-tight text-glow-red">
              {codeRedCount}
            </h3>
            <div className="flex items-center gap-1 mt-2 text-red-600 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping mr-1" />
              <span>{codeRedCount > 0 ? 'Urgent triage required' : 'System stable'}</span>
            </div>
          </div>
          <div className="p-3 bg-red-100/80 rounded-xl border border-red-200/60 text-red-600 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
