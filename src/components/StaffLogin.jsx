import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, Sparkles } from 'lucide-react';

export default function StaffLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulated short network delay for realism
    setTimeout(() => {
      if (username.trim() === 'kgmustaff' && password === 'lucknow2026') {
        onLoginSuccess();
      } else {
        setError('Invalid username or password. Please try again.');
        setIsLoading(false);
      }
    }, 600);
  };

  const handleQuickAutofill = () => {
    setUsername('kgmustaff');
    setPassword('lucknow2026');
    setError('');
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-md w-full space-y-8 glass-panel rounded-3xl p-8 relative overflow-hidden shadow-[0_15px_50px_rgba(6,182,212,0.08)] border border-slate-200/80 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100/30 rounded-bl-full pointer-events-none" />
        
        {/* Header */}
        <div className="text-center relative">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shadow-3xs animate-pulse-slow">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold text-slate-900 tracking-tight">
            Staff Portal Authorization
          </h2>
          <p className="mt-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Secured Command Center Login
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-750 flex items-center gap-2 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-red-650 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Username Input */}
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter staff username"
                  className="w-full bg-white/70 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 transition-all shadow-3xs font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/70 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 transition-all shadow-3xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Quick Autofill chip for Hackathon Jury */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleQuickAutofill}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-50 hover:bg-cyan-100/70 border border-cyan-200/60 rounded-full text-[10px] font-bold text-cyan-700 transition-all duration-300 hover:scale-105 cursor-pointer shadow-3xs"
            >
              <Sparkles className="w-3 h-3 text-cyan-600 animate-pulse" />
              Demo Autofill Credentials
            </button>
            <p className="text-[9px] text-slate-400 mt-2 font-medium">
              Demo credentials: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-650">kgmustaff</code> / <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-650">lucknow2026</code>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-600/15 cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Authorize Access'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
