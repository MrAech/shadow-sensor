import React, { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Radio,
  Wrench,
} from "lucide-react";
import {
  IDFStep,
  PhysicalHardwareState,
  SensorTelemetry,
  TechnicianWorkOrder,
} from "../../types";

interface OperationalSummaryProps {
  telemetry: SensorTelemetry | null;
  hardwareState: PhysicalHardwareState;
  currentStep: IDFStep;
  workOrder: TechnicianWorkOrder | null;
  alarmAcknowledged: boolean;
  onAcknowledgeAlarm: () => void;
}

type AlarmState = "ACTIVE" | "ACKNOWLEDGED" | "CLEARED";

export const OperationalSummary: React.FC<OperationalSummaryProps> = ({
  telemetry,
  hardwareState,
  currentStep,
  workOrder,
  alarmAcknowledged,
  onAcknowledgeAlarm,
}) => {
  const alarm = useMemo(() => {
    if (workOrder || telemetry?.isSafeDegraded) {
      return {
        severity: "CRITICAL",
        title: "Sensor channel isolated",
        description:
          "Automatic recovery exhausted its available candidates and field intervention is required.",
        source: "SensorShadow-X / primary channel",
      };
    }

    if (telemetry && !["NORMAL", "ACCEPTED"].includes(telemetry.status)) {
      return {
        severity: "HIGH",
        title: "Physical sensor fault under recovery",
        description: `The ${telemetry?.activeFault?.toLowerCase().replace(/_/g, " ")} condition is being evaluated by the recovery loop.`,
        source: "Primary transducer",
      };
    }

    return null;
  }, [telemetry, workOrder]);

  const effectiveAlarmState: AlarmState = alarm
    ? alarmAcknowledged
      ? "ACKNOWLEDGED"
      : "ACTIVE"
    : "CLEARED";
  const operationalMode =
    workOrder || telemetry?.isSafeDegraded
      ? "SAFE DEGRADED"
      : telemetry?.status === "STABILIZING"
        ? "STABILIZING / QUARANTINED"
        : telemetry && !["NORMAL", "ACCEPTED"].includes(telemetry.status)
          ? "AUTOMATIC RECOVERY"
          : "NORMAL MONITORING";

  return (
    <section
      aria-labelledby="operational-summary-title"
      className="border-y border-slate-800/80 py-4"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-400">
              Operational overview
            </p>
            <h2
              id="operational-summary-title"
              className="mt-1 text-lg font-semibold text-white"
            >
              Sensor station control room
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
              Live condition of the simulated station, its physical recovery
              state, and operator attention queue.
            </p>
          </div>
          <div className="text-right font-mono text-xs">
            <span className="text-slate-500">Mode</span>
            <strong className="ml-2 text-slate-200">{operationalMode}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <SummaryValue
            label="System health"
            value={telemetry?.isSafeDegraded ? "DEGRADED" : "AVAILABLE"}
            tone={telemetry?.isSafeDegraded ? "rose" : "emerald"}
          />
          <SummaryValue
            label="Active channel"
            value={`CH${hardwareState.relayChannel} / ${hardwareState.relayChannel === 1 ? "PRIMARY" : "REDUNDANT"}`}
          />
          <SummaryValue
            label="Controller step"
            value={`IDF ${currentStep}/17`}
          />
          <SummaryValue
            label="Comms path"
            value="MQTT / SIMULATED"
            icon={<Radio className="h-3.5 w-3.5" />}
          />
        </div>

        {alarm ? (
          <div
            className="border-l-2 border-rose-500 bg-rose-950/20 px-3 py-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="text-rose-300">
                      {alarm.severity} ALARM
                    </span>
                    <span className="text-slate-500">ALM-001</span>
                    <span
                      className={
                        effectiveAlarmState === "ACKNOWLEDGED"
                          ? "text-amber-300"
                          : "text-rose-400"
                      }
                    >
                      {effectiveAlarmState}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-100">{alarm.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {alarm.description}
                  </p>
                  <p className="mt-2 text-[11px] font-mono text-slate-500">
                    Source: {alarm.source} ·{" "}
                    {telemetry
                      ? new Date(telemetry.timestamp).toLocaleTimeString()
                      : "Awaiting telemetry"}
                  </p>
                </div>
              </div>
              {effectiveAlarmState === "ACTIVE" && (
                <button
                  type="button"
                  onClick={onAcknowledgeAlarm}
                  className="self-start border border-amber-500/50 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/10"
                >
                  Acknowledge alarm
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-l-2 border-emerald-500/60 bg-emerald-950/10 px-3 py-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            No active alarms. Station is operating within the current monitoring
            rules.
          </div>
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-800/60 pt-3 text-[11px] text-slate-400">
          {/* <span className="inline-flex items-center gap-1.5"> */}
          {/*   <CircleDot className="h-3.5 w-3.5 text-emerald-400" /> */}
          {/*   Telemetry stream connected */}
          {/* </span> */}
          {/* <span className="inline-flex items-center gap-1.5"> */}
          {/*   <Wrench className="h-3.5 w-3.5 text-amber-400" /> */}
          {/*   Physical commands are simulation-only */}
          {/* </span> */}
          {workOrder && (
            <span className="text-rose-300">
              Work order {workOrder.ticketId} · {workOrder.status}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

const SummaryValue: React.FC<{
  label: string;
  value: string;
  tone?: "rose" | "emerald";
  icon?: React.ReactNode;
}> = ({ label, value, tone, icon }) => (
  <div className="border-l border-slate-700 pl-3">
    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-slate-500">
      {icon}
      {label}
    </div>
    <div
      className={`mt-1 text-sm font-semibold ${tone === "rose" ? "text-rose-300" : tone === "emerald" ? "text-emerald-300" : "text-slate-200"}`}
    >
      {value}
    </div>
  </div>
);
