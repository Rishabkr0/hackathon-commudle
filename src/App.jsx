import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Bell, 
  Sparkles, 
  CheckCircle2,
  ArrowRightLeft,
  Building2,
  X,
  ShieldAlert,
  Database,
  CloudLightning,
  Settings,
  RefreshCw,
  Info
} from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import DashboardSidebar from './components/DashboardSidebar';
import StatsCards from './components/StatsCards';
import QueueTable from './components/QueueTable';
import StaffLogin from './components/StaffLogin';
import { appwriteService } from './services/appwrite';

const INITIAL_QUEUE_DATA = [];

export default function App() {
  const [currentView, setCurrentView] = useState('patient'); // 'patient' or 'staff'
  const [language, setLanguage] = useState('EN'); // 'EN' or 'HI'
  const [isLiveStats, setIsLiveStats] = useState(true);
  
  // Initialize states from localStorage or default values
  const [queueData, setQueueData] = useState(() => {
    const local = localStorage.getItem('kgmu_queue_data');
    return local ? JSON.parse(local) : INITIAL_QUEUE_DATA;
  });

  const [deptSettings, setDeptSettings] = useState(() => {
    const local = localStorage.getItem('kgmu_dept_settings');
    return local ? JSON.parse(local) : {
      'General Medicine': { doctors: 3, avgTime: 10 },
      'Lari Cardiology': { doctors: 2, avgTime: 15 },
      'Trauma/Emergency': { doctors: 4, avgTime: 12 }
    };
  });

  const [totalOPD, setTotalOPD] = useState(() => {
    const local = localStorage.getItem('kgmu_total_opd');
    return local ? parseInt(local) : 4210;
  });

  const [criticalAlert, setCriticalAlert] = useState(() => {
    const local = localStorage.getItem('kgmu_critical_alert');
    if (local === 'null') return null;
    if (local) return JSON.parse(local);
    return null;
  });

  const [avgWaitTime, setAvgWaitTime] = useState(45);
  const [activeTab, setActiveTab] = useState('all');
  const [viewDetailsPatient, setViewDetailsPatient] = useState(null);
  const [toast, setToast] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('kgmu_staff_authenticated') === 'true';
  });

  const [epidemicAlert, setEpidemicAlert] = useState(() => {
    return localStorage.getItem('kgmu_epidemic_alert') === 'true';
  });

  const [isAppwriteEnabled, setIsAppwriteEnabled] = useState(() => {
    return localStorage.getItem('kgmu_appwrite_enabled') === 'true';
  });

  const [appwriteConfig, setAppwriteConfig] = useState(() => {
    const local = localStorage.getItem('kgmu_appwrite_config');
    return local ? JSON.parse(local) : {
      endpoint: 'https://cloud.appwrite.io/v1',
      projectId: '',
      databaseId: '',
      collectionId: ''
    };
  });

  const [appwriteStatus, setAppwriteStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'error'
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Appwrite Connection & Sync Manager
  useEffect(() => {
    if (!isAppwriteEnabled) {
      setAppwriteStatus('disconnected');
      return;
    }

    let unsubscribe = null;
    const connectAppwrite = async () => {
      setAppwriteStatus('connecting');
      const isInit = appwriteService.init(appwriteConfig);
      
      if (!isInit) {
        setAppwriteStatus('error');
        return;
      }

      try {
        const patients = await appwriteService.getPatients();
        setQueueData(patients);
        setAppwriteStatus('connected');
        showToast('Connected to Appwrite Cloud Database successfully!', 'success');

        unsubscribe = appwriteService.subscribe((event) => {
          const { events, payload } = event;
          const isDocEvent = events.some(e => e.includes('.documents.'));
          
          if (!isDocEvent) return;

          const mappedPatient = {
            id: payload.patientId || payload.$id,
            name: payload.name,
            age: payload.age,
            gender: payload.gender,
            mobile: payload.mobile,
            symptoms: payload.symptoms,
            department: payload.department,
            severity: payload.severity,
            waitTime: payload.waitTime,
            status: payload.status,
            isVoice: !!payload.isVoice,
            $id: payload.$id
          };

          if (events.some(e => e.includes('.create'))) {
            setQueueData(prev => {
              if (prev.some(p => p.id === mappedPatient.id)) return prev;
              return [mappedPatient, ...prev];
            });
          }
          else if (events.some(e => e.includes('.update'))) {
            setQueueData(prev => prev.map(p => p.$id === mappedPatient.$id ? mappedPatient : p));
          }
          else if (events.some(e => e.includes('.delete'))) {
            setQueueData(prev => prev.filter(p => p.$id !== payload.$id));
          }
        });

      } catch (err) {
        console.error("Appwrite Sync Fail:", err);
        setAppwriteStatus('error');
        showToast('Appwrite Cloud Database failed to synchronize. Verify configuration and attributes.', 'danger');
      }
    };

    connectAppwrite();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAppwriteEnabled, appwriteConfig]);

  // Compute Code Red Alert count dynamically from active bypassed queue entries and criticalAlert state
  const codeRedCount = queueData.filter(p => p.severity === 5 && p.status === 'Bypassed ⚡').length + (criticalAlert ? 1 : 0);

  // 1. Sync queueData to localStorage
  useEffect(() => {
    localStorage.setItem('kgmu_queue_data', JSON.stringify(queueData));
  }, [queueData]);

  // 2. Sync criticalAlert to localStorage
  useEffect(() => {
    localStorage.setItem('kgmu_critical_alert', JSON.stringify(criticalAlert));
  }, [criticalAlert]);

  // 3. Sync totalOPD to localStorage
  useEffect(() => {
    localStorage.setItem('kgmu_total_opd', totalOPD.toString());
  }, [totalOPD]);

  // Sync deptSettings to localStorage
  useEffect(() => {
    localStorage.setItem('kgmu_dept_settings', JSON.stringify(deptSettings));
  }, [deptSettings]);

  // Helper to estimate wait time for a new registration based on current queue state
  const getEstimatedWait = (department, severity) => {
    const settings = deptSettings[department] || { doctors: 2, avgTime: 10 };
    // Count active waiting patients in this department (excluding bypassed, in treatment, or civil routed)
    const activeWaiting = queueData.filter(p => 
      p.department === department && 
      p.status !== 'In Treatment' && 
      p.status !== 'Routed to Civil' && 
      p.waitTime > 0
    ).length;

    let waitModifier = 1.0;
    if (severity === 4) waitModifier = 0.4;
    else if (severity === 3) waitModifier = 0.7;
    else if (severity === 2) waitModifier = 1.0;
    else if (severity === 1) waitModifier = 1.3;

    return Math.round(Math.max(5, ((activeWaiting * settings.avgTime) / settings.doctors) * waitModifier));
  };

  // Recalculate wait times dynamically whenever department settings (doctors/avg time) change
  useEffect(() => {
    setQueueData(prevQueue => {
      // Group queue by department and calculate wait times based on position in line
      const reversed = [...prevQueue].reverse();
      const countsByDept = {};
      
      const updated = reversed.map(patient => {
        if (patient.status === 'In Treatment' || patient.status === 'Routed to Civil' || patient.waitTime === 0) {
          return patient;
        }
        
        const dept = patient.department;
        countsByDept[dept] = (countsByDept[dept] || 0) + 1;
        
        const settings = deptSettings[dept] || { doctors: 1, avgTime: 15 };
        const patientsAhead = countsByDept[dept] - 1;
        
        let waitModifier = 1.0;
        if (patient.severity === 4) waitModifier = 0.4;
        else if (patient.severity === 3) waitModifier = 0.7;
        else if (patient.severity === 2) waitModifier = 1.0;
        else if (patient.severity === 1) waitModifier = 1.3;
        
        const calculatedWait = Math.round(Math.max(5, ((patientsAhead * settings.avgTime) / settings.doctors) * waitModifier));
        
        return {
          ...patient,
          waitTime: calculatedWait
        };
      });
      
      return updated.reverse();
    });
  }, [deptSettings]);

  // 4. Synchronize states in real-time across multiple browser tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'kgmu_queue_data') {
        if (e.newValue) setQueueData(JSON.parse(e.newValue));
      }
      if (e.key === 'kgmu_critical_alert') {
        if (e.newValue === 'null' || !e.newValue) {
          setCriticalAlert(null);
        } else {
          setCriticalAlert(JSON.parse(e.newValue));
        }
      }
      if (e.key === 'kgmu_total_opd') {
        if (e.newValue) setTotalOPD(parseInt(e.newValue) || 4210);
      }
      if (e.key === 'kgmu_staff_authenticated') {
        setIsAuthenticated(e.newValue === 'true');
      }
      if (e.key === 'kgmu_dept_settings') {
        if (e.newValue) setDeptSettings(JSON.parse(e.newValue));
      }
      if (e.key === 'kgmu_epidemic_alert') {
        setEpidemicAlert(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync epidemicAlert to localStorage
  useEffect(() => {
    localStorage.setItem('kgmu_epidemic_alert', epidemicAlert.toString());
  }, [epidemicAlert]);

  // AI Daemon: Outbreak / Epidemic Detection
  useEffect(() => {
    // Count patients with Dengue-like symptoms in the queue
    const dengueCount = queueData.filter(p => 
      p.symptoms && (p.symptoms.toLowerCase().includes('joint pain') || p.symptoms.toLowerCase().includes('जोड़ों का दर्द'))
    ).length;

    if (dengueCount >= 5 && !epidemicAlert) {
      setEpidemicAlert(true);
      showToast('⚠️ OUTBREAK PROTOCOL INITIATED: Potential Dengue Cluster Detected!', 'danger');
    }
  }, [queueData, epidemicAlert]);

  // Live Stats interval simulator (updates stats slowly, no random patient injection)
  useEffect(() => {
    if (!isLiveStats) return;

    const interval = setInterval(() => {
      // 1. Slowly increment total OPD
      setTotalOPD(prev => prev + Math.floor(Math.random() * 2) + 1);

      // 2. Randomly shift wait times slightly
      setAvgWaitTime(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const next = prev + change;
        return next > 30 && next < 60 ? next : prev;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [isLiveStats]);

  // Scroll to top when switching views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Callback when patient simulator registers critical triage
  const handleCriticalTriage = (patient) => {
    setCriticalAlert(patient);
    
    // Automatically trigger notification sound visual alert
    showToast(`🚨 CRITICAL TRIAGE DETECTED: Patient ${patient.id} bypassed to Cardiology!`, 'danger');
  };

  // Callback when patient simulator registers normal triage
  const handleNormalTriage = async (patient) => {
    if (isAppwriteEnabled && appwriteStatus === 'connected') {
      try {
        const doc = await appwriteService.createPatient(patient);
        if (doc) {
          showToast(`Patient ${patient.id} synchronized directly to Appwrite Cloud!`, 'success');
        }
      } catch (err) {
        showToast('Appwrite Cloud connection lost. Saving patient locally.', 'danger');
        setQueueData(prev => [patient, ...prev]);
      }
    } else {
      setQueueData(prev => [patient, ...prev]);
      showToast(`Patient ${patient.id} registered & added to live queue.`);
    }
  };

  // Accept and Route critical patient
  const handleAcceptRoute = async () => {
    if (!criticalAlert) return;

    const routedPatient = {
      ...criticalAlert,
      status: 'Routed to Cardiology'
    };

    if (isAppwriteEnabled && appwriteStatus === 'connected') {
      try {
        const doc = await appwriteService.createPatient(routedPatient);
        if (doc) {
          showToast(`Critical Patient ${criticalAlert.id} routed & synced to Appwrite Cloud!`, 'success');
        }
      } catch (err) {
        showToast('Appwrite Cloud sync failed. Saving locally.', 'danger');
        const exists = queueData.some(p => p.id === criticalAlert.id);
        if (!exists) {
          setQueueData(prev => [routedPatient, ...prev]);
        }
      }
    } else {
      const exists = queueData.some(p => p.id === criticalAlert.id);
      if (!exists) {
        setQueueData(prev => [routedPatient, ...prev]);
      }
      showToast(`Patient ${criticalAlert.id} successfully routed to Lari Cardiology Emergency!`, 'success');
    }
    setCriticalAlert(null);
  };

  // Route low severity patients to Civil Hospital (Load Balance Protocol)
  const handleRouteAllToCivil = async () => {
    let count = 0;
    const promises = [];

    if (isAppwriteEnabled && appwriteStatus === 'connected') {
      for (const p of queueData) {
        if ((p.severity === 1 || p.severity === 2) && p.status !== 'Routed to Civil' && p.$id) {
          count++;
          promises.push(appwriteService.updatePatientStatus(p.$id, 'Routed to Civil'));
        }
      }
      if (promises.length > 0) {
        try {
          await Promise.all(promises);
          showToast(`Successfully load-balanced ${count} patients directly to Civil in Appwrite Cloud!`, 'success');
        } catch (err) {
          showToast('Appwrite bulk redirect sync error.', 'danger');
        }
      }
    } else {
      setQueueData(prev => prev.map(p => {
        if ((p.severity === 1 || p.severity === 2) && p.status !== 'Routed to Civil') {
          count++;
          return {
            ...p,
            status: 'Routed to Civil',
            waitTime: 0
          };
        }
        return p;
      }));
      showToast(`Successfully routed ${count} non-critical patients to Civil Hospital.`, 'success');
    }
  };

  const handleUpdatePatientStatus = async (patientId, newStatus) => {
    const patient = queueData.find(p => p.id === patientId);
    
    if (isAppwriteEnabled && appwriteStatus === 'connected' && patient && patient.$id) {
      try {
        await appwriteService.updatePatientStatus(patient.$id, newStatus);
        showToast(`Patient ${patientId} status updated in Appwrite Cloud to ${newStatus}.`, 'success');
      } catch (err) {
        showToast('Appwrite Cloud update failed.', 'danger');
      }
    } else {
      setQueueData(prev => prev.map(p => {
        if (p.id === patientId) {
          return { ...p, status: newStatus };
        }
        return p;
      }));
      showToast(`Patient ${patientId} status updated to ${newStatus}.`, 'success');
    }
  };

  const handleResetSystem = async () => {
    localStorage.removeItem('kgmu_queue_data');
    localStorage.removeItem('kgmu_critical_alert');
    localStorage.removeItem('kgmu_epidemic_alert');
    localStorage.setItem('kgmu_total_opd', '4210');
    
    if (isAppwriteEnabled && appwriteStatus === 'connected') {
      try {
        const patients = await appwriteService.getPatients();
        const deletePromises = patients.map(p => appwriteService.deletePatient(p.$id));
        await Promise.all(deletePromises);
        showToast('Appwrite Cloud Database and queue records successfully reset!', 'success');
      } catch (err) {
        showToast('Local queue reset, but failed to wipe some Appwrite entries.', 'danger');
      }
    } else {
      showToast('Dashboard statistics and queue records have been reset.', 'success');
    }
    
    setQueueData([]);
    setCriticalAlert(null);
    setEpidemicAlert(false);
    setTotalOPD(4210);
  };

  const handleLoginSuccess = () => {
    localStorage.setItem('kgmu_staff_authenticated', 'true');
    setIsAuthenticated(true);
    showToast('KGMU Command Center authorized successfully!', 'success');
  };

  const handleLogout = () => {
    localStorage.setItem('kgmu_staff_authenticated', 'false');
    setIsAuthenticated(false);
    setActiveTab('all');
    showToast('Secure session locked. Portal restricted.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative overflow-x-hidden font-sans pb-12">
      {/* Light Professional Radial Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-red-100/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Digital Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* Floating Pill Navigation Bar */}
      <header className="sticky top-0 w-full max-w-6xl mx-auto px-4 pt-4 pb-2 z-50 select-none bg-slate-50/80 backdrop-blur-md">
        <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between transition-all duration-300">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-600/10">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-slate-900 flex items-center gap-1.5">
                KGMU AI TRIAGE
                <span className="text-[9px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full uppercase tracking-widest text-glow-cyan animate-pulse">
                  v2.0
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-tight">Lucknow Command Hub</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-6">
            {/* Live Stats Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                Live Stream
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isLiveStats}
                  onChange={(e) => setIsLiveStats(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-white peer-checked:after:border-transparent transition-all border border-slate-300/40" />
              </div>
              {isLiveStats && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-ping" />
              )}
            </label>

            {/* Reset Button */}
            <button
              onClick={handleResetSystem}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-xs select-none"
            >
              Reset Queue
            </button>

            {/* Appwrite Cloud Sync Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`px-3.5 py-1.5 border rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 hover:shadow-xs select-none ${
                isAppwriteEnabled && appwriteStatus === 'connected'
                  ? 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100 font-extrabold'
                  : isAppwriteEnabled && appwriteStatus === 'connecting'
                  ? 'bg-yellow-50 border-yellow-250 text-yellow-750 animate-pulse font-extrabold'
                  : isAppwriteEnabled && appwriteStatus === 'error'
                  ? 'bg-red-50 border-red-250 text-red-750 hover:bg-red-100 font-extrabold'
                  : 'bg-white hover:bg-slate-100 border-slate-250 text-slate-500 hover:text-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              {isAppwriteEnabled && appwriteStatus === 'connected' ? 'Cloud Synced' : 'Cloud Setup'}
            </button>

            {/* View Switcher (Pill-shaped toggle button) */}
            <div className="bg-slate-200/60 p-1 rounded-full border border-slate-300/30 flex items-center gap-1">
              <button
                onClick={() => setCurrentView('patient')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                  currentView === 'patient'
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/10'
                    : 'text-slate-650 hover:text-slate-850'
                }`}
              >
                Patient Chat
              </button>
              <button
                onClick={() => setCurrentView('staff')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                  currentView === 'staff'
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/10'
                    : 'text-slate-650 hover:text-slate-850'
                }`}
              >
                Staff Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 mt-8 z-10">
        
        {/* Toast Alerts */}
        {toast && (
          <div className={`fixed top-24 right-6 z-50 glass-panel rounded-2xl p-4 shadow-2xl border-l-4 max-w-md animate-fade-in-right flex items-start gap-3 ${
            toast.type === 'danger' ? 'border-l-red-500 bg-red-50 text-red-950' : 
            toast.type === 'success' ? 'border-l-emerald-500 bg-emerald-50 text-emerald-950' : 
            'border-l-cyan-500 bg-cyan-50 text-cyan-950'
          }`}>
            <Bell className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              toast.type === 'danger' ? 'text-red-500 animate-bounce' : 
              toast.type === 'success' ? 'text-emerald-500' : 
              'text-cyan-500'
            }`} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {toast.type === 'danger' ? 'Emergency Dispatch' : 'System Notification'}
              </p>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed font-semibold">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="ml-auto text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View 1: Patient Triage Simulator */}
        {currentView === 'patient' && (
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 py-6 animate-fade-in">
            {/* Left intro panel */}
            <div className="flex-1 max-w-lg space-y-6 text-center lg:text-left select-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full text-xs font-bold shadow-3xs">
                <Sparkles className="w-3.5 h-3.5" />
                Emergency AI Triage Platform
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Patient Triage Simulator
              </h2>
              <p className="text-slate-500 text-xs font-bold -mt-3 uppercase tracking-wider flex items-center gap-1.5 justify-center lg:justify-start">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                WhatsApp Interactive Channel
              </p>
              <p className="text-slate-650 text-sm leading-relaxed font-medium">
                This simulator showcases how outpatients report symptoms to the KGMU AI Triage assistant via WhatsApp. The chatbot assesses acuity level, issues critical bypass routing for life-threatening conditions, and syncs status live with the Hospital staff portal.
              </p>
              
              <div className="p-6 bg-white/80 border border-slate-200/80 rounded-3xl space-y-4 shadow-sm relative overflow-hidden backdrop-blur-md text-left">
                <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-100/30 rounded-bl-full pointer-events-none" />
                <h4 className="text-xs font-black text-cyan-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  Triage Demonstration Guide:
                </h4>
                
                <div className="space-y-3.5 text-xs text-slate-650 font-semibold">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-55 border border-cyan-200 text-cyan-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                    <p className="leading-relaxed">Change language between <strong className="text-cyan-700">English / Hindi</strong> using the header button inside the WhatsApp phone simulator.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-55 border border-cyan-200 text-cyan-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                    <p className="leading-relaxed">Tap the <strong className="text-red-650">Chest Pain & Sweating 🚨</strong> suggestion chip to simulate an emergency intake flow.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-55 border border-cyan-200 text-cyan-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
                    <p className="leading-relaxed">Complete registration steps. The AI will issue an <strong className="text-red-650">Emergency Bypass Receipt</strong> and trigger a Code Red Alert.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-55 border border-cyan-200 text-cyan-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">4</span>
                    <p className="leading-relaxed">Switch to the <strong className="text-cyan-700">Staff Dashboard</strong> using the toggle in the top header bar to verify the real-time queue insertion and route the alert.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentView('staff')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-bold text-xs transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-600/15 cursor-pointer mx-auto lg:mx-0 select-none"
              >
                Enter Command Portal
                <span>→</span>
              </button>
            </div>

            {/* Right phone simulator */}
            <div className="w-full lg:w-fit flex justify-center">
              <ChatInterface 
                language={language} 
                setLanguage={setLanguage} 
                onCriticalTriage={handleCriticalTriage}
                onNormalTriage={handleNormalTriage}
                deptSettings={deptSettings}
                getEstimatedWait={getEstimatedWait}
                queueData={queueData}
              />
            </div>
          </div>
        )}

        {/* View 2: KGMU Staff Dashboard */}
        {currentView === 'staff' && (
          !isAuthenticated ? (
            <StaffLogin onLoginSuccess={handleLoginSuccess} />
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 items-start animate-fade-in">
              {/* Left Sidebar */}
              <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

            {/* Main Command Center Grid */}
            <div className="flex-1 w-full space-y-6">

              {/* Epidemic Alert Banner */}
              {epidemicAlert && (
                <div className="w-full bg-red-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-[0_0_30px_rgba(220,38,38,0.4)] animate-pulse border-2 border-red-400">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8 text-white animate-bounce" />
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-widest text-white drop-shadow-md">⚠️ OUTBREAK PROTOCOL INITIATED</h2>
                      <p className="text-sm font-bold text-red-100 uppercase tracking-wider mt-0.5">Potential Dengue Cluster Detected in Queue</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEpidemicAlert(false)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-colors border border-white/40 cursor-pointer"
                  >
                    Acknowledge Alert
                  </button>
                </div>
              )}
              
              {/* Top Row: Stats Cards */}
              <StatsCards 
                totalOPD={totalOPD} 
                avgWaitTime={avgWaitTime} 
                codeRedCount={codeRedCount} 
                isLiveStats={isLiveStats}
              />

              {/* Middle Row: Critical Alerts & Load Balancer Widget */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Critical Alerts Panel (2/3 width) */}
                <div className="xl:col-span-2">
                  {criticalAlert ? (
                    <div className="glass-panel-neon-red rounded-2xl p-6 border-red-200 relative overflow-hidden group flex flex-col justify-between h-full min-h-[180px] animate-pulse-slow">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/30 rounded-bl-full pointer-events-none" />
                      
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 rounded-xl border border-red-200 text-red-650 animate-pulse mt-1 shadow-2xs">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-glow-red text-red-650 font-extrabold text-sm uppercase tracking-wider">
                              Critical Alert Detected
                            </span>
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          </div>
                          
                          <h4 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
                            {criticalAlert.name} <span className="text-xs text-slate-500">({criticalAlert.age}y/{criticalAlert.gender})</span>
                          </h4>
                          
                          <p className="text-xs text-slate-700 mt-2 bg-white/70 p-3 rounded-lg border border-slate-200/60 font-mono italic leading-relaxed shadow-3xs">
                            "{criticalAlert.symptoms}"
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-red-200/60 pt-4">
                        <div className="flex items-center gap-3 text-xs text-red-750 font-semibold">
                          <span>Patient ID: {criticalAlert.id}</span>
                          <span>•</span>
                          <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded font-bold text-[9px]">Lari Cardiology Route</span>
                        </div>
                        
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          <button 
                            onClick={() => setViewDetailsPatient(criticalAlert)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:text-slate-800 transition-all cursor-pointer shadow-3xs"
                          >
                            View Details
                          </button>
                          
                          <button 
                            onClick={handleAcceptRoute}
                            className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all duration-300 hover:shadow-md hover:shadow-red-550/15 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            Accept & Route
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center h-full min-h-[180px]">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-3xs">
                        <CheckCircle2 className="w-6 h-6 text-glow-emerald" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">All Clear</h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed font-semibold">
                        No pending critical alerts from the patient triage simulators. System state is optimized.
                      </p>
                    </div>
                  )}
                </div>

                {/* Lucknow Context (Load Balance) Widget (1/3 width) */}
                <div>
                  <div className="glass-panel rounded-2xl p-6 h-full flex flex-col justify-between relative overflow-hidden group select-none border-cyan-200">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-50 rounded-bl-full pointer-events-none" />
                    
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4.5 h-4.5 text-cyan-600" />
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Civil Load Balance</h4>
                        </div>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-semibold">KGMU Bed Capacity</span>
                          <span className="font-bold text-red-650">94%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-semibold">Lucknow Civil Hospital</span>
                          <span className="font-bold text-cyan-600">48%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60">
                      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-glow-cyan animate-pulse shadow-3xs">
                        <div className="flex items-center gap-1.5 text-cyan-800 font-bold text-[10px]">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Routing Recommended</span>
                        </div>
                        <p className="text-[10px] text-slate-650 mt-1 leading-relaxed font-semibold">
                          KGMU emergency is saturated. Suggest routing non-critical cases to Civil.
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => setActiveTab('load')}
                        className="w-full mt-3 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-cyan-600 hover:text-cyan-700 transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                      >
                        Launch Load Balancer
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom: Live Queue Table */}
              <QueueTable 
                queueData={queueData} 
                activeTab={activeTab} 
                onUpdateStatus={handleUpdatePatientStatus}
                onRouteAllToCivil={handleRouteAllToCivil}
                deptSettings={deptSettings}
                setDeptSettings={setDeptSettings}
              />

            </div>
          </div>
          )
        )}

      </main>

      {/* Patient Details / Audio Transcript Modal */}
      {viewDetailsPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-300 max-w-lg w-full rounded-3xl p-6 relative shadow-2xl">
            <button 
              onClick={() => setViewDetailsPatient(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-205 border border-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-650" />
              Patient Case Details
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-semibold">Chat transcript compiled by KGMU AI Triage Agent</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block font-semibold">Patient ID</span>
                  <span className="text-slate-900 font-extrabold">{viewDetailsPatient.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Name</span>
                  <span className="text-slate-900 font-extrabold">{viewDetailsPatient.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Demographics</span>
                  <span className="text-slate-900 font-extrabold">{viewDetailsPatient.age} years / {viewDetailsPatient.gender}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Contact No.</span>
                  <span className="text-slate-900 font-extrabold">{viewDetailsPatient.mobile || '9876543210'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block font-semibold">Initial Severity</span>
                  <span className={`font-bold flex items-center gap-1.5 mt-0.5 ${viewDetailsPatient.severity === 5 ? 'text-red-650' : 'text-cyan-750'}`}>
                    <span className={`w-2 h-2 rounded-full ${viewDetailsPatient.severity === 5 ? 'bg-red-500 shadow-[0_0_5px_red] animate-pulse' : 'bg-cyan-500'}`} />
                    Level {viewDetailsPatient.severity} ({viewDetailsPatient.severity === 5 ? 'Critical / Immediate Bypass' : 'Registered / Normal Priority'})
                  </span>
                </div>
              </div>

              {viewDetailsPatient.isVoice && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Simulated Voice Telemetry</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 h-8 rounded-lg overflow-hidden flex items-center px-2 gap-1.5 border border-slate-300/60">
                      <span className="w-1 bg-cyan-500 h-4 rounded animate-pulse" />
                      <span className="w-1 bg-cyan-600 h-6 rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1 bg-cyan-500 h-3 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1 bg-cyan-600 h-7 rounded animate-pulse" style={{ animationDelay: '0.3s' }} />
                      <span className="w-1 bg-cyan-500 h-5 rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
                      <span className="w-1 bg-cyan-600 h-2 rounded animate-pulse" style={{ animationDelay: '0.5s' }} />
                      <span className="w-1 bg-cyan-500 h-6 rounded animate-pulse" style={{ animationDelay: '0.6s' }} />
                      <span className="w-1 bg-cyan-600 h-4 rounded animate-pulse" style={{ animationDelay: '0.7s' }} />
                      <span className="w-1 bg-cyan-500 h-5 rounded animate-pulse" style={{ animationDelay: '0.8s' }} />
                      <span className="w-1 bg-cyan-650 h-2 rounded animate-pulse" style={{ animationDelay: '0.9s' }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">2.5s</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[10px] font-semibold text-slate-500">
                    <span>Speech Confidence: <strong className="text-emerald-600">98.7%</strong></span>
                    <span>Format: AMR-WB (16kHz)</span>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Simulated Chat Transcript</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 max-h-[170px] overflow-y-auto font-mono text-xs font-medium">
                  <div className="text-slate-500">
                    <strong className="text-cyan-700">KGMU AI:</strong> Welcome to KGMU AI Triage. Please describe your symptoms.
                  </div>
                  <div className="text-slate-800">
                    <strong className="text-pink-700">Patient:</strong> {viewDetailsPatient.symptoms}
                  </div>
                  <div className="text-slate-550">
                    <strong className="text-cyan-700">KGMU AI:</strong> Symptoms logged. Please state your Name, Age, Gender, and Mobile.
                  </div>
                  <div className="text-slate-800">
                    <strong className="text-pink-700">Patient Details:</strong> Name: {viewDetailsPatient.name}, Age: {viewDetailsPatient.age}, Gender: {viewDetailsPatient.gender}, Mobile: {viewDetailsPatient.mobile || '9876543210'}
                  </div>
                  <div className="text-red-750 font-bold border-t border-slate-200/60 pt-1.5 mt-1.5">
                    <strong className="text-red-650">KGMU AI:</strong> {viewDetailsPatient.severity === 5 
                      ? '🚨 CRITICAL BYPASS DETECTED. Proceeding immediately to Cardiology Emergency.' 
                      : `✅ REGISTRATION COMPLETE. OPD wait list scheduled for ${viewDetailsPatient.department} (Est. wait: ${viewDetailsPatient.waitTime} mins).`}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setViewDetailsPatient(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:text-slate-850 transition-all cursor-pointer shadow-3xs"
              >
                Close Case Log
              </button>
              {criticalAlert && criticalAlert.id === viewDetailsPatient.id && (
                <button 
                  onClick={() => {
                    handleAcceptRoute();
                    setViewDetailsPatient(null);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-550 hover:to-rose-550 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center gap-1.5"
                >
                  Accept & Route Patient
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appwrite Cloud Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-350 max-w-xl w-full rounded-3xl p-6 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-205 border border-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-605 animate-pulse" />
              Appwrite Cloud Sync Settings
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-semibold">Integrate live out-patient queues dynamically with Appwrite Cloud Backend</p>

            <div className="space-y-5">
              {/* Cloud Sync Toggle */}
              <div className="flex items-center justify-between p-4 bg-cyan-50/50 border border-cyan-200/65 rounded-2xl">
                <div>
                  <span className="text-sm font-bold text-cyan-900 block">Enable Appwrite Cloud Sync</span>
                  <span className="text-[11px] text-slate-500 font-medium">Bypass local database in favor of real-time cloud data.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isAppwriteEnabled}
                    onChange={(e) => {
                      setIsAppwriteEnabled(e.target.checked);
                      localStorage.setItem('kgmu_appwrite_enabled', e.target.checked.toString());
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-white peer-checked:after:border-transparent transition-all border border-slate-300/40" />
                </label>
              </div>

              {/* Status Banner */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                appwriteStatus === 'connected' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                appwriteStatus === 'connecting' ? 'bg-yellow-50 border-yellow-250 text-yellow-800' :
                appwriteStatus === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    appwriteStatus === 'connected' ? 'bg-emerald-500 animate-ping' :
                    appwriteStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                    appwriteStatus === 'error' ? 'bg-red-500 shadow-[0_0_4px_red]' :
                    'bg-slate-450'
                  }`} />
                  Connection Status: <strong className="uppercase">{appwriteStatus}</strong>
                </span>
                <span className="text-[10px] font-bold text-slate-400">APPWRITE WEB SDK</span>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Appwrite Endpoint</label>
                  <input 
                    type="text" 
                    placeholder="https://cloud.appwrite.io/v1"
                    value={appwriteConfig.endpoint}
                    onChange={(e) => {
                      const updated = { ...appwriteConfig, endpoint: e.target.value };
                      setAppwriteConfig(updated);
                      localStorage.setItem('kgmu_appwrite_config', JSON.stringify(updated));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 font-medium transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-slate-500 block mb-1">Project ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 660ea1..."
                      value={appwriteConfig.projectId}
                      onChange={(e) => {
                        const updated = { ...appwriteConfig, projectId: e.target.value };
                        setAppwriteConfig(updated);
                        localStorage.setItem('kgmu_appwrite_config', JSON.stringify(updated));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 font-medium transition-all"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-slate-500 block mb-1">Database ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. queue_db"
                      value={appwriteConfig.databaseId}
                      onChange={(e) => {
                        const updated = { ...appwriteConfig, databaseId: e.target.value };
                        setAppwriteConfig(updated);
                        localStorage.setItem('kgmu_appwrite_config', JSON.stringify(updated));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 font-medium transition-all"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-slate-500 block mb-1">Collection ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. patients"
                      value={appwriteConfig.collectionId}
                      onChange={(e) => {
                        const updated = { ...appwriteConfig, collectionId: e.target.value };
                        setAppwriteConfig(updated);
                        localStorage.setItem('kgmu_appwrite_config', JSON.stringify(updated));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Guide Accordion */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-cyan-600" />
                  Appwrite Collection Schema Guide:
                </h4>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  In order for Cloud Sync to function flawlessly, create a Collection with the following attributes in your Appwrite console:
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {[
                    { name: 'patientId', type: 'String (Size: 255)' },
                    { name: 'name', type: 'String (Size: 255)' },
                    { name: 'age', type: 'Integer' },
                    { name: 'gender', type: 'String (Size: 255)' },
                    { name: 'mobile', type: 'String (Size: 255)' },
                    { name: 'symptoms', type: 'String (Size: 4000)' },
                    { name: 'department', type: 'String (Size: 255)' },
                    { name: 'severity', type: 'Integer' },
                    { name: 'waitTime', type: 'Integer' },
                    { name: 'status', type: 'String (Size: 255)' },
                    { name: 'isVoice', type: 'Boolean' },
                  ].map((attr) => (
                    <div key={attr.name} className="flex justify-between items-center text-[10px] bg-white border border-slate-150 px-2.5 py-1.5 rounded-lg">
                      <code className="text-cyan-700 font-extrabold font-mono">{attr.name}</code>
                      <span className="text-slate-400 font-semibold">{attr.type}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 text-[10px] text-slate-400 font-bold leading-normal">
                  ⚠️ Note: Disable Appwrite Document Security rules (allow read/write for guest role or configure appropriate API permissions) to test out the integration smoothly!
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:text-slate-850 transition-all cursor-pointer shadow-3xs"
              >
                Close Settings
              </button>
              <button 
                onClick={() => {
                  setIsAppwriteEnabled(false);
                  setTimeout(() => {
                    setIsAppwriteEnabled(true);
                    localStorage.setItem('kgmu_appwrite_enabled', 'true');
                  }, 100);
                  showToast('Re-initializing cloud sync connection...', 'info');
                }}
                disabled={!isAppwriteEnabled}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 select-none ${
                  isAppwriteEnabled
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-550 hover:to-blue-550 text-white shadow-cyan-500/10 cursor-pointer'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Connect & Sync Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="w-full max-w-6xl mx-auto px-4 mt-auto pt-8 border-t border-slate-200 select-none text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-slate-500 font-bold">
          © {new Date().getFullYear()} King George's Medical University (KGMU) AI Triage Command Hub, Lucknow.
        </p>
        <p className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Secure Encrypted Glass Connection
        </p>
      </footer>
    </div>
  );
}
