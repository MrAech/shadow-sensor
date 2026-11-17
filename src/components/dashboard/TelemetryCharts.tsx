import React from "react";
import { SensorTelemetry, ScenarioMetadata } from "../../types";
import { InfoHint } from "../common/InfoHint";
import { Activity, ShieldCheck, AlertCircle, Clock, Zap } from "lucide-react";

interface TelemetryChartsProps {
  history: SensorTelemetry[];
  metadata: ScenarioMetadata;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  history,
  metadata,
}) => {
  if (history.length === 0) {
    return (
      <div className="w-full border-y border-slate-800/80 py-16 text-left text-slate-500 font-mono text-xs">
        Initializing telemetry waveforms...
      </div>
    );
  }

  const latest = history[history.length - 1];

  // SVG Chart Dimensions
  const width = 800;
  const height = 200;
  const padding = { top: 15, right: 25, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const yMin = 0;
  const maxInHistory = Math.max(
    ...history.map((h) =>
      Math.max(h.groundTruth, h.primaryRaw, h.redundantRaw),
    ),
  );
  const yMax = Math.max(metadata.typicalRange[1] * 1.15, maxInHistory * 1.05);

  const scaleX = (idx: number) =>
    padding.left + (idx / Math.max(1, history.length - 1)) * chartW;
  const scaleY = (val: number) =>
    padding.top +
    chartH -
    ((Math.max(yMin, Math.min(yMax, val)) - yMin) / (yMax - yMin)) * chartH;

  const groundTruthPath = history
    .map(
      (d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.groundTruth)}`,
    )
    .join(" ");
  const primaryRawPath = history
    .map(
      (d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.primaryRaw)}`,
    )
    .join(" ");
  const redundantRawPath = history
    .map(
      (d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.redundantRaw)}`,
    )
    .join(" ");
  const activeReadingPath = history
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.activeReading < 0 ? 0 : d.activeReading)}`,
    )
    .join(" ");

  // Status badge with clear engineering description
  const getStatusBadge = () => {
    switch (latest.status) {
      case "NORMAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NORMAL MONITORING</span>
          </span>
        );
      case "ANOMALOUS":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 text-xs font-mono font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>ANOMALY: EVALUATING PERSISTENCE</span>
          </span>
        );
      case "RECONFIGURING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/50 text-xs font-mono font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>PHYSICAL ACTUATION IN PROGRESS</span>
          </span>
        );
      case "STABILIZING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-mono font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>STABILIZING (DATA QUARANTINED)</span>
          </span>
        );
      case "VERIFYING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 text-xs font-mono font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>INDEPENDENT VERIFICATION ENGINE</span>
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 text-xs font-mono font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>RECOVERY VERIFIED & ACCEPTED</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/50 text-xs font-mono font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
            <span>REJECTED (ATTEMPTING ALTERNATIVE)</span>
          </span>
        );
      case "SAFE_DEGRADED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500 text-xs font-mono font-bold animate-bounce">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>SAFE DEGRADED MODE (ISOLATED)</span>
          </span>
        );
    }
  };

  return (
    <section className="w-full flex flex-col justify-between gap-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Live Telemetry Waveform Monitor (Raw vs Verified Output)
          </h3>
          <InfoHint
            title="Telemetry Waveforms Explained"
            description="Displays the real-time time-series traces: Environmental Ground Truth (gray dashed), Primary Sensor (blue/red), Redundant Sensor (green), and the final SensorShadow-X Output (thick cyan). When a fault occurs, notice how the raw primary signal diverges while the verified output protects downstream analytics."
            example="During settling delay (Step 11), output is held in quarantine to prevent mechanical vibration noise from contaminating downstream decision models."
          />
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Trace Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 py-2 border-y border-slate-800/60">
        <span className="text-slate-500 font-semibold mr-1">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-b border-dashed border-slate-400" />
          <span className="text-slate-300">Ground Truth</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-400" />
          <span className="text-blue-300">Primary Channel (CH1)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-400" />
          <span className="text-emerald-300">Redundant Channel (CH2)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-cyan-400 rounded-full" />
          <span className="text-cyan-300 font-bold">SensorShadow-X Output</span>
        </div>
      </div>

      {/* SVG Oscilloscope Waveform Display */}
      <div className="w-full bg-slate-950/60 p-2 border-y border-slate-800/80 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
        >
          {/* Background Grid */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="#1e293b"
            strokeDasharray="3,3"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH / 2}
            x2={width - padding.right}
            y2={padding.top + chartH / 2}
            stroke="#1e293b"
            strokeDasharray="3,3"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={width - padding.right}
            y2={padding.top + chartH}
            stroke="#334155"
          />

          {/* Y Axis Values */}
          <text
            x={padding.left - 8}
            y={padding.top + 4}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            {Math.round(yMax)}
          </text>
          <text
            x={padding.left - 8}
            y={padding.top + chartH / 2 + 4}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            {Math.round(yMax / 2)}
          </text>
          <text
            x={padding.left - 8}
            y={padding.top + chartH + 4}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            0
          </text>

          {/* Unit on Y axis */}
          <text
            x={padding.left - 8}
            y={padding.top - 4}
            fill="#94a3b8"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="end"
          >
            ({metadata.unit})
          </text>

          {/* Trace 1: Ground Truth */}
          <path
            d={groundTruthPath}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="5,4"
            opacity="0.65"
          />

          {/* Trace 2: Redundant Baseline */}
          <path
            d={redundantRawPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            opacity="0.85"
          />

          {/* Trace 3: Primary Raw */}
          <path
            d={primaryRawPath}
            fill="none"
            stroke={latest.activeFault !== "NONE" ? "#f43f5e" : "#38bdf8"}
            strokeWidth="2"
            opacity="0.9"
          />

          {/* Trace 4: SensorShadow-X Active Telemetry */}
          <path
            d={activeReadingPath}
            fill="none"
            stroke={
              latest.isStabilizing
                ? "#f59e0b"
                : latest.isSafeDegraded
                  ? "#ef4444"
                  : "#06b6d4"
            }
            strokeWidth="3.2"
          />

          {/* Current Operating Point Pin */}
          <circle
            cx={scaleX(history.length - 1)}
            cy={scaleY(latest.activeReading < 0 ? 0 : latest.activeReading)}
            r="4.5"
            fill="#22d3ee"
            stroke="#0f172a"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Clear Numerical Readout Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>Ground Truth</span>
            <span className="text-slate-600 font-sans">Ideal</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-bold text-slate-200">
              {latest.groundTruth}
            </span>
            <span className="text-[10px] text-slate-500">{metadata.unit}</span>
          </div>
          <span className="text-[9px] text-slate-500 mt-0.5 truncate font-sans">
            Environmental Reality
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>Primary Sensor (CH1)</span>
            <span className="text-blue-400 font-sans">
              {latest.activeChannel === 1 ? "ACTIVE" : "STANDBY"}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={`text-base font-bold ${latest.activeFault !== "NONE" ? "text-rose-400" : "text-blue-300"}`}
            >
              {latest.primaryRaw}
            </span>
            <span className="text-[10px] text-slate-500">{metadata.unit}</span>
          </div>
          <span className="text-[9px] text-slate-500 mt-0.5 truncate font-sans">
            {metadata.primarySensorName}
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>Redundant Probe (CH2)</span>
            <span className="text-emerald-400 font-sans">
              {latest.activeChannel === 2 ? "ACTIVE" : "REF BUS"}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-bold text-emerald-400">
              {latest.redundantRaw}
            </span>
            <span className="text-[10px] text-slate-500">{metadata.unit}</span>
          </div>
          <span className="text-[9px] text-slate-500 mt-0.5 truncate font-sans">
            {metadata.redundantSensorName}
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-cyan-800/50 flex flex-col justify-between bg-gradient-to-br from-cyan-950/20 to-slate-950">
          <div className="flex items-center justify-between text-cyan-400 text-[10px]">
            <span className="font-bold">Verified Output</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            {latest.isSafeDegraded ? (
              <span className="text-xs font-bold text-rose-400">
                SAFE DEGRADED
              </span>
            ) : (
              <>
                <span className="text-base font-bold text-cyan-300">
                  {latest.activeReading}
                </span>
                <span className="text-[10px] text-cyan-500">
                  {metadata.unit}
                </span>
              </>
            )}
          </div>
          <span className="text-[9px] text-cyan-400/80 mt-0.5 truncate font-sans">
            {latest.isStabilizing
              ? "Held in Quarantine"
              : latest.isSafeDegraded
                ? "Channel Isolated"
                : "Passed Step 13 Verification"}
          </span>
        </div>
      </div>
    </section>
  );
};
