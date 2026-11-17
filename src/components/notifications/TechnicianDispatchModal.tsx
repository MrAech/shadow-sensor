import React, { useState } from 'react';
import { TechnicianWorkOrder } from '../../types';
import {
  AlertTriangle,
  X,
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  Radio,
  FileCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface TechnicianDispatchModalProps {
  workOrder: TechnicianWorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  onSimulateRepair: () => void;
}

export const TechnicianDispatchModal: React.FC<TechnicianDispatchModalProps> = ({
  workOrder,
  isOpen,
  onClose,
  onAcknowledge,
  onSimulateRepair,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isOpen || !workOrder) return null;

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Audio not permitted or supported
    }
  };

  const handleAcknowledge = () => {
    playChime();
    onAcknowledge();
  };

  const handleRepair = () => {
    playChime();
    onSimulateRepair();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="relative w-full max-w-2xl bg-slate-900 border-y-2 border-rose-500 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Emergency Red Banner */}
        <div className="bg-rose-950/90 border-b border-rose-700/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-rose-600/30 text-rose-400 border-l border-rose-500 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Field Service Work Order</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono">
                  {workOrder.status}
                </span>
              </h2>
              <p className="text-[11px] text-rose-200/90 font-sans">
                Autonomous recovery exhausted all candidates. Hardware & software cannot recover without physical site intervention.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title={soundEnabled ? 'Mute Audio Alerts' : 'Unmute Audio Alerts'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Work Order Body */}
        <div className="p-4 overflow-y-auto scrollbar-thin flex flex-col gap-3 text-xs">
          {/* Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 bg-slate-950/60 p-2.5 border-y border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Ticket ID</span>
              <span className="text-cyan-300 font-bold">{workOrder.ticketId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Timestamp</span>
              <span className="text-slate-300">{new Date(workOrder.timestamp).toLocaleTimeString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Station Node</span>
              <span className="text-slate-200 font-semibold truncate block">{workOrder.stationName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Current State</span>
              <span className="text-rose-400 font-bold">SAFE DEGRADED</span>
            </div>
          </div>

          {/* Root Cause Technical Analysis */}
          <div className="bg-slate-950/50 p-3 border-l-2 border-rose-700 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Root Cause Diagnostic Analysis</span>
            </div>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              {workOrder.rootCauseAnalysis}
            </p>
          </div>

          {/* Reconfiguration Failure Chain */}
          <div className="bg-slate-950/40 p-3 border-y border-slate-800 flex flex-col gap-2">
            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wide">
              Autonomous Physical Reconfigurations Attempted & Rejected:
            </span>
            <div className="space-y-1.5">
              {workOrder.attemptedReconfigurations.length === 0 ? (
                <div className="text-slate-500 text-[11px] font-sans">
                  All available physical candidates previously flagged as failed in Recovery History. No valid configurations remain.
                </div>
              ) : (
                workOrder.attemptedReconfigurations.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-900/70 border-l border-slate-700 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">Attempt #{idx + 1}:</span>
                      <span className="text-cyan-300 font-semibold">{att.action}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">Score: V = {att.verificationScore}</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                        {att.outcome}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recommended Field Actions for Technician */}
          <div className="bg-slate-950/40 p-3 border-y border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Mandatory Physical Service Checklist for Field Crew:</span>
            </div>
            <ul className="space-y-1 text-slate-300 font-sans text-xs">
              {workOrder.recommendedActions.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono mt-0.5">•</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-sans">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Telemetry isolation active. Unverified measurements blocked from downstream models.</span>
          </div>

          <div className="flex items-center gap-2">
            {!workOrder.acknowledged ? (
              <button
                onClick={handleAcknowledge}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Acknowledge & Dispatch Crew</span>
              </button>
            ) : (
              <span className="px-3 py-1 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 text-xs font-semibold">
                Crew Dispatched (Ticket In Progress)
              </span>
            )}

            <button
              onClick={handleRepair}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Wrench className="w-4 h-4" />
              <span>Simulate Physical Repair (Restores Hardware)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
