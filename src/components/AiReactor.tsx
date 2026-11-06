import React, { useMemo } from 'react';
import { AssistantState } from '../types/jarvis';

interface AiReactorProps {
  state: AssistantState;
  transcript?: string;
  isListening: boolean;
  onReactorClick: () => void;
  onOpenSecondaryConsole?: () => void;
}

export const AiReactor: React.FC<AiReactorProps> = ({
  state,
  transcript,
  isListening,
  onReactorClick,
  onOpenSecondaryConsole,
}) => {
  // State colors and animation properties
  const config = useMemo(() => {
    switch (state) {
      case 'LISTENING':
        return {
          glowColor: 'rgba(6, 182, 212, 0.95)',
          coreColor: 'from-cyan-400 via-sky-500 to-blue-600',
          ringBorder: 'border-cyan-400/80',
          ringSpeed: 'animate-spin-medium',
          statusText: 'LISTENING FOR AUDIO INPUT',
          stateCode: 'ACQ // 001',
          pulseScale: 'scale-105',
          coreRingScale: 'scale-110',
        };
      case 'THINKING':
      case 'PROCESSING':
        return {
          glowColor: 'rgba(56, 189, 248, 0.9)',
          coreColor: 'from-sky-300 via-indigo-500 to-cyan-500',
          ringBorder: 'border-sky-300/90',
          ringSpeed: 'animate-spin-slow',
          statusText: state === 'THINKING' ? 'NEURAL SYNAPSE REASONING' : 'PROCESSING DIRECTIVE',
          stateCode: 'CALC // RUN',
          pulseScale: 'scale-100',
          coreRingScale: 'scale-105',
        };
      case 'SPEAKING':
        return {
          glowColor: 'rgba(14, 165, 233, 0.95)',
          coreColor: 'from-teal-300 via-cyan-400 to-sky-600',
          ringBorder: 'border-cyan-300',
          ringSpeed: 'animate-spin-slow',
          statusText: 'VOCAL SYNTHESIS ACTIVE',
          stateCode: 'VOX // OUT',
          pulseScale: 'scale-105',
          coreRingScale: 'scale-115',
        };
      case 'EXECUTING':
        return {
          glowColor: 'rgba(45, 212, 191, 0.95)',
          coreColor: 'from-emerald-300 via-teal-400 to-cyan-600',
          ringBorder: 'border-teal-400',
          ringSpeed: 'animate-spin-medium',
          statusText: 'EXECUTING PROTOCOL',
          stateCode: 'EXE // TRUE',
          pulseScale: 'scale-105',
          coreRingScale: 'scale-110',
        };
      case 'ERROR':
        return {
          glowColor: 'rgba(239, 68, 68, 0.85)',
          coreColor: 'from-amber-400 via-rose-500 to-red-600',
          ringBorder: 'border-rose-500/80',
          ringSpeed: 'animate-spin-slow',
          statusText: 'SYSTEM EXCEPTION DETECTED',
          stateCode: 'ERR // 404',
          pulseScale: 'scale-95',
          coreRingScale: 'scale-95',
        };
      case 'STANDBY':
      default:
        return {
          glowColor: 'rgba(14, 165, 233, 0.45)',
          coreColor: 'from-cyan-500/70 via-blue-600/70 to-indigo-800/80',
          ringBorder: 'border-cyan-500/30',
          ringSpeed: 'animate-spin-slow',
          statusText: 'STANDBY // ALL SYSTEMS NOMINAL',
          stateCode: 'SYS // ONLINE',
          pulseScale: 'scale-100',
          coreRingScale: 'scale-100',
        };
    }
  }, [state]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 select-none">
      {/* Outer ambient glow field */}
      <div
        className="absolute w-[440px] h-[440px] md:w-[540px] md:h-[540px] rounded-full blur-[90px] pointer-events-none transition-all duration-700 -z-10"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, rgba(3, 7, 18, 0) 70%)`,
          opacity: state === 'STANDBY' ? 0.35 : 0.7,
        }}
      />

      {/* Main Reactor Interactive Housing */}
      <div
        onClick={onReactorClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onReactorClick();
        }}
        aria-label={`Central AI Reactor. Current state: ${state}. Click to interact or speak.`}
        className={`relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px] flex items-center justify-center cursor-pointer transition-transform duration-500 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full ${config.pulseScale}`}
      >
        {/* Layer 0: Concentric Holographic Ring 1 (Widest with degree ticks) */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-spin-slow pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="0.4"
              strokeDasharray="2 6"
            />
            {/* North/South/East/West indicator brackets */}
            <circle
              cx="50"
              cy="50"
              r="49"
              fill="none"
              stroke="rgba(6, 182, 212, 0.45)"
              strokeWidth="0.8"
              strokeDasharray="8 82"
            />
          </svg>
        </div>

        {/* Layer 1: Reverse Spin Segment Ring */}
        <div className="absolute inset-4 rounded-full border border-dashed border-cyan-400/25 animate-spin-reverse-slow pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(14, 165, 233, 0.35)"
              strokeWidth="0.75"
              strokeDasharray="18 12"
            />
          </svg>
        </div>

        {/* Layer 2: Geometric Arc Reactor Housing Ring */}
        <div className="absolute inset-10 rounded-full border border-cyan-400/30 group-hover:border-cyan-400/60 transition-colors pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Triangular tri-phase arc guides */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="rgba(56, 189, 248, 0.6)"
              strokeWidth="1.2"
              strokeDasharray="4 20"
            />
          </svg>
        </div>

        {/* Layer 3: Rotating Orbital Brackets */}
        <div
          className={`absolute inset-16 rounded-full border-2 ${config.ringBorder} ${config.ringSpeed} pointer-events-none transition-all duration-500`}
          style={{
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 35%, 0% 35%, 0% 65%, 100% 65%, 100% 100%, 0% 100%)',
          }}
        />

        {/* Layer 4: Interactive Concentric Core Glow */}
        <div
          className={`relative w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center p-6 bg-radial ${config.coreColor} shadow-[0_0_60px_rgba(6,182,212,0.65)] transition-all duration-500 ${config.coreRingScale}`}
        >
          {/* Inner metallic glass face */}
          <div className="absolute inset-2 rounded-full bg-[#040d1a]/90 backdrop-blur-md border border-cyan-400/40 flex flex-col items-center justify-center overflow-hidden">
            {/* Center Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.06)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {/* Central Holographic Monogram */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-widest text-cyan-200 drop-shadow-[0_0_12px_rgba(56,189,248,0.85)]">
                J.A.R.V.I.S.
              </span>
              <span className="text-[10px] sm:text-xs font-mono tracking-wider text-cyan-400/80 uppercase mt-0.5">
                Mark VII Core
              </span>

              {/* State Pulse Badge */}
              <div className="mt-2.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-400/30 text-[10px] sm:text-[11px] font-mono tracking-wider text-cyan-300">
                {state}
              </div>
            </div>

            {/* Speaking / Audio Reactive Waveform simulation in core */}
            {(state === 'SPEAKING' || state === 'LISTENING') && (
              <div className="absolute bottom-4 flex items-center justify-center gap-1 h-6">
                {[40, 75, 100, 60, 90, 45, 80, 50].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-cyan-400 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 120}ms`,
                      animationDuration: '600ms',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Orbiting Telemetry Crosshairs */}
        <div className="absolute top-2 text-[9px] font-mono text-cyan-500/60 tracking-widest">
          340° // NORTH POLARIS
        </div>
        <div className="absolute bottom-2 text-[9px] font-mono text-cyan-500/60 tracking-widest">
          ARC-REACT // 3.8 GJ/S
        </div>
      </div>

      {/* Clean Telemetry Readout Below Reactor */}
      <div className="mt-6 flex flex-col items-center text-center max-w-lg z-10">
        <div className="text-xs sm:text-sm font-mono tracking-widest text-cyan-400 uppercase flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>{config.statusText}</span>
          <span className="text-cyan-600/70">[{config.stateCode}]</span>
        </div>

        {/* Live voice transcript display if speaking or recognized */}
        {transcript && (
          <div className="mt-2.5 px-4 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs sm:text-sm text-cyan-100 font-mono tracking-wide max-w-md animate-fade-in shadow-lg backdrop-blur-sm">
            <span className="text-cyan-400 mr-2">&gt;</span>
            {transcript}
          </div>
        )}

        <p className="mt-3 text-xs text-slate-400 max-w-md leading-relaxed">
          {isListening
            ? 'Continuous acoustic surveillance engaged. Speak "Hey JARVIS" or issue any command directly.'
            : 'Click the central reactor to activate acoustic engagement or configure vocal protocol in Settings.'}
        </p>

        {/* Secondary Console Access link (Strict rule: all secondary features remain accessible outside the main dashboard) */}
        {onOpenSecondaryConsole && (
          <button
            onClick={onOpenSecondaryConsole}
            className="mt-4 px-3.5 py-1.5 text-xs font-mono text-cyan-300 hover:text-cyan-100 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <span>Open Secondary Systems Console</span>
            <span className="text-cyan-400">→</span>
          </button>
        )}
      </div>
    </div>
  );
};
