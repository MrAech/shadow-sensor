import React, { useState } from "react";
import { VerificationMetrics } from "../../types";
import { IndependentVerificationEngine } from "../../simulation/verificationEngine";
import { InfoHint } from "../common/InfoHint";
import {
  ShieldAlert,
  CheckCircle,
  Sliders,
  AlertOctagon,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

interface VerificationGaugeProps {
  metrics: VerificationMetrics | null;
  verifEngine: IndependentVerificationEngine;
}

export const VerificationGauge: React.FC<VerificationGaugeProps> = ({
  metrics,
  verifEngine,
}) => {
  const [showTuning, setShowTuning] = useState(false);
  const [threshold, setThreshold] = useState(verifEngine.getThreshold());

  const weights = verifEngine.getWeights();

  const handleThresholdChange = (val: number) => {
    setThreshold(val);
    verifEngine.setThreshold(val);
  };

  const vScore = metrics ? metrics.totalV : 0;
  const isPassed = metrics ? metrics.passed : false;
  const isHardGateViolated = metrics?.hardGateViolated;

  return (
    <section className="w-full font-mono flex flex-col justify-between gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Independent Verification Function V(t) (IDF Step 13 & 14)
          </h3>
          <InfoHint
            title="Independent Verification Formula"
            description="Evaluates fresh post-reconfiguration samples independently. The score V is an inspectable linear combination of 4 criteria: Cross-Sensor deviation, Temporal rate bounds, Physical limits, and Mechanical settling stability. Recovery is accepted if V >= V_th."
            example="If a severed wire is detected (mean value near zero while redundant is nominal), a Hard Safety Gate overrides V to 0.0, preventing false positive acceptance."
          />
        </div>

        <button
          onClick={() => setShowTuning(!showTuning)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>{showTuning ? "Hide Sliders" : "Tune V_th Parameters"}</span>
        </button>
      </div>

      {/* Safety Gate Alert Banner */}
      {isHardGateViolated && (
        <div className="p-3 rounded-lg bg-rose-950/90 border border-rose-600/80 text-rose-200 text-xs flex items-center gap-2.5 animate-pulse">
          <AlertOctagon className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-xs uppercase tracking-wide">
              Hard Safety Gate Override Triggered: V = 0.0
            </span>
            <span className="text-[11px] text-rose-300 font-sans mt-0.5">
              {metrics?.hardGateReason}
            </span>
          </div>
        </div>
      )}

      {/* 4 Multi-Constraint Criteria Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Metric 1: C_cross */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-300 font-semibold">
                1. Cross-Sensor
              </span>
              <InfoHint
                title="C_cross (Weight: 35%)"
                description="Relative consistency between the reconfigured primary probe and the independent redundant channel. Exponential decay curve penalizes divergence."
              />
            </div>
            <span className="text-slate-500 text-[10px]">
              w = {weights.cross}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base font-bold text-cyan-300">
              {metrics ? metrics.crossSensorConsistency : 0.0}
            </span>
            <span className="text-[10px] text-slate-500 font-sans">
              Matching Redundant
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-300"
              style={{
                width: `${(metrics?.crossSensorConsistency || 0) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: C_temporal */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-300 font-semibold">
                2. Temporal Rate
              </span>
              <InfoHint
                title="C_temporal (Weight: 25%)"
                description="Validates step-to-step smoothness. Physical parameters (e.g. ambient air or soil) cannot change faster than realistic physics limits."
              />
            </div>
            <span className="text-slate-500 text-[10px]">
              w = {weights.temporal}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base font-bold text-blue-300">
              {metrics ? metrics.temporalConsistency : 0.0}
            </span>
            <span className="text-[10px] text-slate-500 font-sans">
              Derivative Check
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${(metrics?.temporalConsistency || 0) * 100}%` }}
            />
          </div>
        </div>

        {/* Metric 3: C_phys */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-300 font-semibold">
                3. Physical Bounds
              </span>
              <InfoHint
                title="C_phys (Weight: 20%)"
                description="Checks that the value falls within expected seasonal and physical limits for the selected Indian environment (e.g. Delhi AQI 0-500 µg/m³)."
              />
            </div>
            <span className="text-slate-500 text-[10px]">
              w = {weights.physical}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base font-bold text-emerald-300">
              {metrics ? metrics.physicalPlausibility : 0.0}
            </span>
            <span className="text-[10px] text-slate-500 font-sans">
              Seasonal Range
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{
                width: `${(metrics?.physicalPlausibility || 0) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 4: C_stability */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-300 font-semibold">
                4. Settling Stability
              </span>
              <InfoHint
                title="C_stability (Weight: 20%)"
                description="Sample variance check on post-settling buffer. Penalizes mechanical vibration, actuator jitter, and electrical contact bounce."
              />
            </div>
            <span className="text-slate-500 text-[10px]">
              w = {weights.stability}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base font-bold text-purple-300">
              {metrics ? metrics.measurementStability : 0.0}
            </span>
            <span className="text-[10px] text-slate-500 font-sans">
              Vibration Damped
            </span>
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-400 h-full rounded-full transition-all duration-300"
              style={{
                width: `${(metrics?.measurementStability || 0) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Aggregate Score & Decision */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Total Verification Score:</span>
          <span
            className={`text-lg font-bold font-mono ${isPassed ? "text-emerald-400" : "text-rose-400"}`}
          >
            V = {vScore}
          </span>
          <span className="text-slate-500 text-[11px]">
            (Required Threshold V_th ={" "}
            <strong className="text-slate-300">{threshold}</strong>)
          </span>
        </div>

        <div>
          {isPassed ? (
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold flex items-center gap-1.5 text-xs shadow-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>STEP 14: VERIFIED & ACCEPTED</span>
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold flex items-center gap-1.5 text-xs shadow-sm">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>STEP 14: REJECTED & RETRYING</span>
            </span>
          )}
        </div>
      </div>

      {/* Parameter Tuning Drawer */}
      {showTuning && (
        <div className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between text-slate-400 font-sans">
            <span>
              Simulation Parameter Tuning (Illustrative Demonstration)
            </span>
            <span className="text-slate-500 italic text-[11px]">
              IDF: Thresholds are implementation parameters
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <label className="text-slate-300 w-44">
              Acceptance Threshold (V_th):
            </label>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) =>
                handleThresholdChange(parseFloat(e.target.value))
              }
              className="flex-1 accent-cyan-400 cursor-pointer"
            />
            <span className="font-bold text-cyan-300 w-12 text-right">
              {threshold}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
