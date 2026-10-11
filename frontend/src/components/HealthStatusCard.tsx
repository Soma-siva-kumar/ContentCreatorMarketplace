import React from 'react';
import { useHealth } from '../hooks/useHealth';
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, Database, Sparkles, Clock } from 'lucide-react';

export const HealthStatusCard: React.FC = () => {
  const { health, loading, error, latencyMs, refresh } = useHealth();

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-400" />
              Live Backend & Database Connectivity
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status check verified against live API endpoint{' '}
            <code className="text-xs font-mono bg-slate-800 px-1.5 py-0.5 rounded text-brand-300">
              /api/health
            </code>
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white transition self-start sm:self-auto shadow-md shadow-brand-600/20 active:scale-95 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Pinging API...' : 'Refresh Status'}
        </button>
      </div>

      <div className="mt-6">
        {loading && !health ? (
          <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-400" />
            <span className="text-sm">Connecting to Express API and MongoDB...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Backend Connectivity Check Failed</p>
              <p className="text-xs text-rose-300/80">{error}</p>
              <p className="text-[11px] text-slate-400 mt-2">
                Ensure the backend Express server is running on port 5000 and MongoDB service is active.
              </p>
            </div>
          </div>
        ) : health ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* System Status */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">System Status</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-white uppercase text-base tracking-wide">
                  {health.status}
                </span>
                {latencyMs !== null && (
                  <span className="text-[11px] font-mono text-emerald-400">
                    {latencyMs}ms
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 block truncate">
                {health.environment} mode
              </span>
            </div>

            {/* Database Engine */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Database Engine</span>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    health.database.status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
                <span className="font-extrabold text-white text-base">
                  {health.database.engine}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block truncate">
                db: {health.database.database} ({health.database.status})
              </span>
            </div>

            {/* AI Engine Abstraction */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">AI Adapter</span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm">
                  {health.aiService.provider.toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block truncate">
                mode: {health.aiService.mode}
              </span>
            </div>

            {/* Server Timestamp */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Server Clock</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="font-mono text-xs text-brand-300 truncate">
                {new Date(health.timestamp).toLocaleTimeString()}
              </div>
              <span className="text-[11px] text-slate-500 block truncate">
                {new Date(health.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
