import React, { useState } from 'react';
import { 
  Search, 
  ArrowRightLeft, 
  ExternalLink,
  ShieldCheck,
  Building,
  UserCheck,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

export default function QueueTable({ queueData, activeTab, onUpdateStatus, onRouteAllToCivil, deptSettings, setDeptSettings }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');

  // Filter queue data based on sidebar selection, search term, and severity filter
  const getFilteredData = () => {
    let data = [...queueData];
    
    // Sidebar Filter
    if (activeTab === 'trauma') {
      data = data.filter(p => p.department === 'Trauma/Emergency');
    } else if (activeTab === 'cardio') {
      data = data.filter(p => p.department === 'Lari Cardiology');
    } else if (activeTab === 'medicine') {
      data = data.filter(p => p.department === 'General Medicine');
    }

    // Search Term Filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      data = data.filter(p => 
        p.id.toLowerCase().includes(term) || 
        p.name.toLowerCase().includes(term) ||
        p.symptoms.toLowerCase().includes(term)
      );
    }

    // Severity Filter
    if (filterSeverity !== 'all') {
      data = data.filter(p => p.severity === parseInt(filterSeverity));
    }

    return data;
  };

  const filteredPatients = getFilteredData();

  // Get severity dots styling
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 5:
        return {
          dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse',
          bg: 'bg-red-50 border border-red-200 text-red-700',
          label: 'L5 - Critical'
        };
      case 4:
        return {
          dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]',
          bg: 'bg-orange-50 border border-orange-200 text-orange-700',
          label: 'L4 - Urgent'
        };
      case 3:
        return {
          dot: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]',
          bg: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
          label: 'L3 - Emergent'
        };
      case 2:
        return {
          dot: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]',
          bg: 'bg-cyan-50 border border-cyan-200 text-cyan-700',
          label: 'L2 - Semi-Urgent'
        };
      case 1:
      default:
        return {
          dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
          bg: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
          label: 'L1 - Non-Urgent'
        };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Bypassed ⚡':
      case 'Emergency Route':
        return 'bg-red-50 text-red-700 border border-red-200 font-bold';
      case 'Routed to Cardiology':
      case 'Routed to General Medicine':
      case 'Routed':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 'In Treatment':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Awaiting Triage':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-250';
      case 'Routed to Civil':
        return 'bg-purple-55 text-purple-700 border border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const CapacityRing = ({ percent, colorClass, trailColor, label }) => {
    const radius = 36;
    const stroke = 5;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
            <circle
              stroke={trailColor}
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="text-slate-100"
            />
            <circle
              stroke="currentColor"
              className={colorClass}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <span className="absolute text-xs font-black text-slate-800">{percent}%</span>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-2">{label}</span>
      </div>
    );
  };

  if (activeTab === 'load') {
    // Dynamic capacity math based on queue and routing state
    const kgmuWaiting = queueData.filter(p => p.status !== 'In Treatment' && p.status !== 'Routed to Civil').length;
    const civilRouted = queueData.filter(p => p.status === 'Routed to Civil').length;
    
    const kgmuCapacity = Math.min(100, 85 + kgmuWaiting);
    const civilCapacity = Math.min(100, 40 + civilRouted);
    
    // Count low severity patients who can be rerouted
    const reroutableCount = queueData.filter(p => (p.severity === 1 || p.severity === 2) && p.status !== 'Routed to Civil').length;

    return (
      <div className="space-y-6">
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100/10 rounded-bl-full -mr-12 -mt-12 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-cyan-600" />
                KGMU ⇄ Lucknow Civil Hospital Load Balancing
              </h3>
              <p className="text-xs text-slate-500 mt-1">Real-time load optimization and patient overflow redirect protocols</p>
            </div>
            <span className={`px-3 py-1 border rounded-full text-xs font-bold animate-pulse ${
              kgmuCapacity >= 90 ? 'bg-red-50 text-red-650 border-red-200' : 'bg-cyan-50 text-cyan-750 border-cyan-200'
            }`}>
              KGMU Load: {kgmuCapacity >= 90 ? 'High Capacity' : 'Stable'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* KGMU Capacity card with SVG gauges */}
            <div className="bg-white border border-slate-250/70 rounded-xl p-5 flex items-center justify-between shadow-xs">
              <div className="space-y-2 flex-1">
                <span className="text-sm font-semibold text-slate-800 block">KGMU Main Emergency</span>
                <div className="flex justify-between text-xs text-slate-500 pr-4">
                  <span>Active Beds: {Math.round(200 * (kgmuCapacity / 100))} / 200</span>
                  <span className={`${kgmuCapacity >= 90 ? 'text-red-600 font-semibold' : 'text-slate-500'} flex items-center gap-1`}>
                    <TrendingUp className="w-3.5 h-3.5" /> {kgmuCapacity >= 90 ? 'High Inflow' : 'Normal'}
                  </span>
                </div>
              </div>
              <CapacityRing 
                percent={kgmuCapacity} 
                colorClass={kgmuCapacity >= 90 ? 'text-red-500' : 'text-cyan-500'} 
                trailColor="#f1f5f9"
                label="KGMU Load" 
              />
            </div>

            {/* Civil Hospital Capacity card with SVG gauges */}
            <div className="bg-white border border-slate-250/70 rounded-xl p-5 flex items-center justify-between shadow-xs">
              <div className="space-y-2 flex-1">
                <span className="text-sm font-semibold text-slate-800 block">Lucknow Civil Hospital</span>
                <div className="flex justify-between text-xs text-slate-500 pr-4">
                  <span>Available Beds: {150 - Math.round(150 * (civilCapacity / 100))} / 150</span>
                  <span className="text-emerald-650 font-semibold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Stable Capacity
                  </span>
                </div>
              </div>
              <CapacityRing 
                percent={civilCapacity} 
                colorClass="text-emerald-500" 
                trailColor="#f1f5f9"
                label="Civil Load" 
              />
            </div>
          </div>

          <div className="glass-panel border-cyan-200 bg-cyan-50/50 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-100 text-cyan-600 rounded-lg border border-cyan-200 mt-1 shadow-2xs">
                <ArrowRightLeft className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-bold text-cyan-800">Route Suggestion Protocol Active</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                  {kgmuCapacity >= 90 
                    ? `KGMU is currently operating at extreme capacity. There are ${reroutableCount} non-critical patients (Severity Level 1 & 2) in the queue. We recommend routing them to Lucknow Civil Hospital.`
                    : `System status is optimal. There are ${reroutableCount} non-critical patients in queue that can be rerouted if KGMU experiences a patient surge.`
                  }
                </p>
              </div>
            </div>
            
            <button
              onClick={onRouteAllToCivil}
              disabled={reroutableCount === 0}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all duration-300 ${
                reroutableCount > 0 
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/10 hover:-translate-y-0.5 cursor-pointer'
                  : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              Route {reroutableCount} Patients to Civil
            </button>
          </div>
        </div>

        {/* List of Civil routed patients */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Civil Hospital Route Audit</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 font-bold">
                  <th className="pb-3 px-2 font-bold">Patient ID</th>
                  <th className="pb-3 px-2 font-bold">Triage Severity</th>
                  <th className="pb-3 px-2 font-bold">Current Status</th>
                  <th className="pb-3 px-2 font-bold">Transit Eta</th>
                  <th className="pb-3 px-2 font-bold">Destination Care</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queueData.filter(p => p.status === 'Routed to Civil').map((patient) => {
                  const style = getSeverityStyle(patient.severity);
                  return (
                    <tr key={patient.id} className="text-sm text-slate-800 hover:bg-slate-50/50">
                      <td className="py-4 px-2 font-semibold text-slate-900">{patient.id} ({patient.name})</td>
                      <td className="py-4 px-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${style.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="px-2.5 py-1 rounded-full text-xs bg-purple-50 border border-purple-200 text-purple-700 font-semibold">
                          In Transit 🚚
                        </span>
                      </td>
                      <td className="py-4 px-2 text-slate-500">18 mins (via Ambulance)</td>
                      <td className="py-4 px-2 text-cyan-600 font-bold">Civil General OPD</td>
                    </tr>
                  );
                })}
                {queueData.filter(p => p.status === 'Routed to Civil').length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm font-medium">
                      No patients routed to Lucknow Civil Hospital in this session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-6">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>
              {activeTab === 'all' && 'All Triage Queue'}
              {activeTab === 'trauma' && 'Trauma & Emergency Queue'}
              {activeTab === 'cardio' && 'Lari Cardiology Queue'}
              {activeTab === 'medicine' && 'General Medicine Queue'}
            </span>
            <span className="text-xs bg-cyan-50 text-cyan-600 border border-cyan-200 px-2 py-0.5 rounded-full font-bold">
              {filteredPatients.length} Active
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Live updates via KGMU AI Triage Chatbots</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-450" />
            <input
              type="text"
              placeholder="Search patient or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 w-48 sm:w-64 transition-all"
            />
          </div>

          {/* Severity selector */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer font-medium"
          >
            <option value="all" className="bg-white text-slate-750">All Severity</option>
            <option value="5" className="bg-white text-slate-750">Level 5 (Critical)</option>
            <option value="4" className="bg-white text-slate-750">Level 4 (Urgent)</option>
            <option value="3" className="bg-white text-slate-750">Level 3 (Emergent)</option>
            <option value="2" className="bg-white text-slate-750">Level 2 (Semi-Urgent)</option>
            <option value="1" className="bg-white text-slate-750">Level 1 (Non-Urgent)</option>
          </select>
        </div>
      </div>

      {/* Department Resource Editor Panel */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-3xs">
          <div className="col-span-1 md:col-span-3 border-b border-slate-200 pb-2 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hospital Resource Allocation</span>
            <span className="text-[9px] bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full text-cyan-600 font-bold">Dynamic Adjuster</span>
          </div>
          {Object.keys(deptSettings).map(dept => {
            const settings = deptSettings[dept];
            const activeWaiting = queueData.filter(p => p.department === dept && p.status !== 'In Treatment' && p.status !== 'Routed to Civil').length;
            
            return (
              <div key={dept} className="bg-white border border-slate-200/60 rounded-xl p-3.5 flex justify-between items-center shadow-3xs">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{dept === 'General Medicine' ? 'Gen Medicine' : dept === 'Lari Cardiology' ? 'Cardiology' : 'Trauma/Emergency'}</h4>
                  <p className="text-[9px] text-slate-555 font-semibold mt-0.5">Load: {activeWaiting} waiting</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Doctors</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button 
                        onClick={() => {
                          setDeptSettings(prev => ({
                            ...prev,
                            [dept]: { ...prev[dept], doctors: Math.max(1, prev[dept].doctors - 1) }
                          }));
                        }}
                        className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-650 hover:text-slate-800 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-black text-slate-800 w-3 text-center">{settings.doctors}</span>
                      <button 
                        onClick={() => {
                          setDeptSettings(prev => ({
                            ...prev,
                            [dept]: { ...prev[dept], doctors: Math.min(8, prev[dept].doctors + 1) }
                          }));
                        }}
                        className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-650 hover:text-slate-800 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 font-bold">
              <th className="pb-3 px-4 font-bold">Patient ID / Name</th>
              <th className="pb-3 px-4 font-bold">Symptoms</th>
              <th className="pb-3 px-4 font-bold">Department</th>
              <th className="pb-3 px-4 font-bold">Triage Severity</th>
              <th className="pb-3 px-4 font-bold">Est. Wait</th>
              <th className="pb-3 px-4 font-bold">Status</th>
              <th className="pb-3 px-4 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPatients.map((patient) => {
              const severityStyle = getSeverityStyle(patient.severity);
              return (
                <tr 
                  key={patient.id} 
                  className={`text-sm text-slate-800 transition-all duration-300 hover:bg-slate-50/70 group border-transparent`}
                >
                  {/* ID / Name */}
                  <td className="py-4 px-4 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{patient.id}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{patient.name} ({patient.age}y/{patient.gender[0]})</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Symptoms */}
                  <td className="py-4 px-4 max-w-[200px] truncate text-slate-650" title={patient.symptoms}>
                    {patient.symptoms}
                  </td>

                  {/* Department */}
                  <td className="py-4 px-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/60 text-slate-650">
                      {patient.department}
                    </span>
                  </td>

                  {/* Severity */}
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${severityStyle.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${severityStyle.dot}`} />
                      {severityStyle.label}
                    </span>
                  </td>

                  {/* Wait Time */}
                  <td className="py-4 px-4 font-semibold">
                    {patient.waitTime === 0 ? (
                      <span className="text-glow-red text-red-650 font-bold flex items-center gap-1">
                        Bypassed ⚡
                      </span>
                    ) : (
                      <span className="text-slate-700">{patient.waitTime} mins</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(patient.status)}`}>
                      {patient.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      {patient.status !== 'In Treatment' && patient.status !== 'Routed to Civil' ? (
                        <button
                          onClick={() => onUpdateStatus(patient.id, 'In Treatment')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-bold transition-all duration-300 hover:scale-105 flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Admit
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600/70" /> Actioned
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-sm font-semibold">
                  No active patients found matching current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
