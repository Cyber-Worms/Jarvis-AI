import React, { useState } from 'react';
import { Wifi, WifiOff, Cpu, Server, ShieldCheck, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { ConnectivityState } from '../types/jarvis';

interface ConnectivityStatusProps {
  status: ConnectivityState;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const ConnectivityStatus: React.FC<ConnectivityStatusProps> = ({
  status,
  onRefresh,
  isRefreshing = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const isAllConnected =
    status.internet &&
    status.backend === 'connected' &&
    (status.geminiConfigured || status.localAiAvailable);

  return (
    <div className="relative z-30">
      <div className="glass-panel rounded-xl p-3 border border-cyan-500/20 text-slate-200 transition-all duration-300 hover:border-cyan-400/40 shadow-lg">
        {/* Compact summary bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isAllConnected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'
              }`}
            />
            <span className="text-xs font-mono font-semibold tracking-wider text-cyan-200 uppercase">
              LINK // {isAllConnected ? 'OPTIMAL' : 'DEGRADED'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>·</span>
            <span>{status.provider}</span>
            <span>·</span>
            <span>{status.backend}</span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40 transition-colors ml-auto flex items-center gap-1 text-xs font-mono"
            aria-label="Toggle detailed connectivity diagnostics"
          >
            <span className="text-[10px] hidden md:inline">DIAGNOSTICS</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded detailed diagnostics */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-cyan-500/15 space-y-2.5 text-xs font-mono animate-fade-in">
            {/* Internet Check */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                {status.internet ? (
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                )}
                Global Internet Link
              </span>
              <span className={status.internet ? 'text-emerald-400' : 'text-rose-400'}>
                {status.internet ? 'ONLINE' : 'DISCONNECTED'}
              </span>
            </div>

            {/* AI Provider */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                AI Intelligence Provider
              </span>
              <span className={status.geminiConfigured ? 'text-cyan-300' : 'text-amber-400'}>
                {status.geminiConfigured ? 'Google Gemini 3.8 Flash' : 'API Key Pending'}
              </span>
            </div>

            {/* Backend Server */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                Express Core Backend
              </span>
              <span className={status.backend === 'connected' ? 'text-emerald-400' : 'text-rose-400'}>
                {status.backend.toUpperCase()}
              </span>
            </div>

            {/* Local AI / Ollama Availability */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Local AI (Ollama Fallback)
              </span>
              <span className={status.localAiAvailable ? 'text-emerald-400' : 'text-slate-500'}>
                {status.localAiAvailable ? 'STANDBY READY' : 'OFFLINE'}
              </span>
            </div>

            {/* Refresh Diagnostics Action */}
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
              <span>Synced: {new Date(status.lastChecked).toLocaleTimeString()}</span>
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Probe Network</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
