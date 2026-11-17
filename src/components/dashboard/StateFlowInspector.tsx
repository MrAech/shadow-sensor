import React, { useState } from "react";
import { IDFStep, IDFStepDetail } from "../../types";
import { InfoHint } from "../common/InfoHint";
import {
  GitCommit,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  RefreshCw,
  AlertTriangle,
  Layers,
} from "lucide-react";

interface StateFlowInspectorProps {
  currentStep: IDFStep;
}

export const IDF_STEPS_CATALOG: IDFStepDetail[] = [
  {
    number: IDFStep.STEP_1_DEPLOYMENT,
    name: "Step 1: Sensor Deployment",
    shortName: "1. Deployment",
    phase: "INGEST",
    description:
      "Hardware initialization of primary and redundant IoT sensor nodes on an actuated gimbal and multiplexed electrical bus.",
    inputDescription: "Pin assignments, servo PWM channel, SPDT relay GPIO",
    operationDescription:
      "Initializes MCU GPIOs, PWM drivers, and SPDT relay channels",
    outputDescription: "Active sensing rig in baseline configuration",
  },
  {
    number: IDFStep.STEP_2_ACQUISITION,
    name: "Step 2: Measurement Acquisition",
    shortName: "2. Acquire",
    phase: "INGEST",
    description:
      "Continuous high-frequency sampling of physical environmental parameters from sensor transducers.",
    inputDescription: "Transducer analog / digital signals",
    operationDescription: "ADC sampling at 500ms intervals",
    outputDescription: "Raw continuous measurement vector x(t)",
  },
  {
    number: IDFStep.STEP_3_PREPROCESSING,
    name: "Step 3: Edge Preprocessing",
    shortName: "3. Preprocess",
    phase: "INGEST",
    description:
      "Edge microcontroller (ESP32) applies low-pass smoothing, hardware timestamps, and link checks.",
    inputDescription: "Raw sensor vector x(t)",
    operationDescription:
      "Sliding window filtering and communication health verification",
    outputDescription:
      "Preprocessed telemetry tuple (x_filtered, timestamp, link_ok)",
  },
  {
    number: IDFStep.STEP_4_TRANSMISSION,
    name: "Step 4: Data Transmission",
    shortName: "4. Transmit",
    phase: "INGEST",
    description:
      "Telemetry forwarded over MQTT/Wi-Fi to edge controller / cloud backend.",
    inputDescription: "Preprocessed telemetry packet",
    operationDescription: "MQTT publish with QoS 1 confirmation",
    outputDescription: "Ingested telemetry buffer on edge gateway",
  },
  {
    number: IDFStep.STEP_5_RELIABILITY_ASSESSMENT,
    name: "Step 5: Reliability Assessment",
    shortName: "5. Assess",
    phase: "ASSESS",
    description:
      "Multi-rule evaluator checking temporal variance, cross-sensor deviation, and physical constraints.",
    inputDescription: "Primary telemetry buffer & redundant sensor baseline",
    operationDescription:
      "Computes residual r(t) = |x_prim - x_redun| and rate-of-change limits",
    outputDescription: "Reliability metrics vector R(t)",
  },
  {
    number: IDFStep.STEP_6_FAULT_DETECTION,
    name: "Step 6: Fault Detection",
    shortName: "6. Detect (Persistence)",
    phase: "ASSESS",
    description:
      "Enforces persistence rule: requires sustained departure (>= 3 consecutive samples) to filter transient noise.",
    inputDescription: "Reliability metrics R(t) & persistence counter",
    operationDescription:
      "Evaluates if anomaly persists across N_persist cycles",
    outputDescription: "Fault confirmation trigger (NORMAL vs FAULT_DETECTED)",
  },
  {
    number: IDFStep.STEP_7_FAULT_DIAGNOSIS,
    name: "Step 7: Fault Diagnosis",
    shortName: "7. Diagnose",
    phase: "ASSESS",
    description:
      "Classifies probable fault category: Drift, Obstruction, Orientation, Disconnection, or Degraded Element.",
    inputDescription:
      "Residual signatures, gradient, and open-circuit health indicators",
    operationDescription: "Rule-based diagnostic classification engine",
    outputDescription: "Diagnosed fault category F_k",
  },
  {
    number: IDFStep.STEP_8_CANDIDATE_GENERATION,
    name: "Step 8: Candidate Generation",
    shortName: "8. Candidates",
    phase: "ACTUATE",
    description:
      "Generates specific physical reconfiguration candidates matching the diagnosed fault category.",
    inputDescription: "Diagnosed fault F_k and available hardware resources",
    operationDescription:
      "Enumerates servo swivel angles, aperture baffles, or MUX channels",
    outputDescription: "Candidate list {C_1, C_2, ... C_m}",
  },
  {
    number: IDFStep.STEP_9_CANDIDATE_RANKING,
    name: "Step 9: Candidate Ranking & Memory Filter",
    shortName: "9. Rank & Filter",
    phase: "ACTUATE",
    description:
      "Ranks candidates and STRICTLY EXCLUDES any candidate previously recorded as failed in Recovery History.",
    inputDescription: "Candidate list & Recovery History database",
    operationDescription:
      "Filters out past failed configurations; ranks by expected recovery affinity and energy",
    outputDescription: "Selected candidate C* (or fallback if all exhausted)",
  },
  {
    number: IDFStep.STEP_10_PHYSICAL_RECONFIGURATION,
    name: "Step 10: Physical Reconfiguration",
    shortName: "10. Reconfigure",
    phase: "ACTUATE",
    description:
      "Dispatches physical actuation signal to servo motor (PWM) or SPDT relay / multiplexer switch.",
    inputDescription: "Selected candidate C*",
    operationDescription:
      "Rotates servo to target angle or toggles electrical relay bus",
    outputDescription: "Physical sensing state physically modified",
  },
  {
    number: IDFStep.STEP_11_STABILIZATION,
    name: "Step 11: Stabilization Period",
    shortName: "11. Stabilize (Quarantine)",
    phase: "SETTLE",
    description:
      "Enforces settling quarantine delay (1.5s - 3.0s). Readings during this period are quarantined.",
    inputDescription: "Hardware settling time t_settle",
    operationDescription:
      "Waits for mechanical vibration damping and contact bounce to settle",
    outputDescription: "Settled physical sensing hardware",
  },
  {
    number: IDFStep.STEP_12_FRESH_ACQUISITION,
    name: "Step 12: Fresh Post-Reconfig Acquisition",
    shortName: "12. Fresh Data",
    phase: "SETTLE",
    description:
      "Disregards all pre-reconfiguration data; captures fresh measurement buffer only after settling.",
    inputDescription: "Settled hardware transducer stream",
    operationDescription:
      "Captures clean post-reconfiguration buffer of size W = 6",
    outputDescription: "Fresh post-reconfiguration measurement buffer",
  },
  {
    number: IDFStep.STEP_13_INDEPENDENT_VERIFICATION,
    name: "Step 13: Independent Verification Engine",
    shortName: "13. Verify V(t)",
    phase: "VERIFY",
    description:
      "Evaluates fresh data using independent mathematical function: V = f(cross, temporal, physical, stability).",
    inputDescription:
      "Fresh buffer, redundant sensor buffer, physical operational limits",
    operationDescription:
      "Calculates V score and checks hard safety gates (open-circuit / limit breaches)",
    outputDescription: "Verification metrics vector & total V score",
  },
  {
    number: IDFStep.STEP_14_ACCEPT_REJECT_DECISION,
    name: "Step 14: Accept / Reject Decision",
    shortName: "14. Decision",
    phase: "VERIFY",
    description:
      "Explicit accept/reject decision. If V >= V_th, configuration is accepted; if V < V_th, rejected.",
    inputDescription: "Total V score & threshold V_th (0.75)",
    operationDescription: "Binary gate decision: ACCEPTED or REJECTED",
    outputDescription: "Acceptance state signal",
  },
  {
    number: IDFStep.STEP_15_ALTERNATIVE_RECOVERY,
    name: "Step 15: Alternative Recovery Retry",
    shortName: "15. Alternative",
    phase: "VERIFY",
    description:
      "When verification fails, marks candidate as REJECTED_FAILED and evaluates remaining candidate pool.",
    inputDescription: "Rejected candidate & remaining pool",
    operationDescription:
      "Selects alternative physical action or triggers fallback if pool exhausted",
    outputDescription: "Loop back to Step 10 OR trigger Step 17",
  },
  {
    number: IDFStep.STEP_16_HISTORY_UPDATE,
    name: "Step 16: History & Memory Update",
    shortName: "16. Log Memory",
    phase: "VERIFY",
    description:
      "Logs immutable recovery tuple (Timestamp, Fault, ConfigID, FreshReadings, V_Score, Outcome) to database.",
    inputDescription: "Verified configuration details and audit metadata",
    operationDescription:
      "Appends to time-series recovery database; updates state memory",
    outputDescription: "Traceable recovery audit record saved; resumes Step 2",
  },
  {
    number: IDFStep.STEP_17_SAFE_DEGRADED_MODE,
    name: "Step 17: Safe Degraded Fallback Mode",
    shortName: "17. Safe Degraded",
    phase: "VERIFY",
    description:
      "When all physical candidates fail, isolates sensing channel, flags data as unreliable, and alerts dashboard.",
    inputDescription: "Exhausted candidate pool / unrecoverable failure",
    operationDescription:
      "Trips software isolation circuit breaker; stops propagation of corrupt data",
    outputDescription: "Fail-safe state active; system protected from bad data",
  },
];

interface PhaseGroup {
  id: string;
  name: string;
  steps: IDFStep[];
  badgeColor: string;
}

const PHASES: PhaseGroup[] = [
  {
    id: "PHASE_1",
    name: "1. Ingest & Transmit",
    steps: [1, 2, 3, 4],
    badgeColor: "border-blue-500/40 text-blue-300",
  },
  {
    id: "PHASE_2",
    name: "2. Assess & Diagnose",
    steps: [5, 6, 7],
    badgeColor: "border-amber-500/40 text-amber-300",
  },
  {
    id: "PHASE_3",
    name: "3. Physical Reconfigure",
    steps: [8, 9, 10],
    badgeColor: "border-purple-500/40 text-purple-300",
  },
  {
    id: "PHASE_4",
    name: "4. Settle & Fresh Data",
    steps: [11, 12],
    badgeColor: "border-orange-500/40 text-orange-300",
  },
  {
    id: "PHASE_5",
    name: "5. Verify & Decide",
    steps: [13, 14],
    badgeColor: "border-cyan-500/40 text-cyan-300",
  },
  {
    id: "PHASE_6",
    name: "6. Memory & Fallback",
    steps: [15, 16, 17],
    badgeColor: "border-emerald-500/40 text-emerald-300",
  },
];

export const StateFlowInspector: React.FC<StateFlowInspectorProps> = ({
  currentStep,
}) => {
  const [selectedStepNumber, setSelectedStepNumber] =
    useState<IDFStep>(currentStep);

  const selectedStep =
    IDF_STEPS_CATALOG.find((s) => s.number === selectedStepNumber) ||
    IDF_STEPS_CATALOG[0];

  return (
    <section className="w-full flex flex-col gap-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Deterministic 17-Step Process Pipeline (IDF Section 7)
          </h3>
          <InfoHint
            title="17-Step Architecture Flow"
            description="The core novelty of SensorShadow-X lies in this specific closed-loop sequence: detection leads to fault-specific diagnosis, followed by physical reconfiguration, a stabilization delay, fresh post-reconfiguration measurements, independent mathematical verification, and memory exclusion."
            example="If verification fails, the system logs the configuration as REJECTED_FAILED in recovery history so it will never attempt it again for that fault."
          />
        </div>
        <div className="text-xs">
          <span className="text-slate-400">Current Active Engine State: </span>
          <span className="text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 animate-pulse">
            Step {currentStep}:{" "}
            {IDF_STEPS_CATALOG.find((s) => s.number === currentStep)?.shortName}
          </span>
        </div>
      </div>

      {/* 6-Phase Pipeline Stepper Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {PHASES.map((phase) => {
          const isPhaseActive = phase.steps.includes(currentStep);

          return (
            <div
              key={phase.id}
              className={`p-2.5 rounded-lg border flex flex-col justify-between transition-all ${
                isPhaseActive
                  ? "bg-cyan-950/40 border-cyan-400 shadow-md glow-blue"
                  : "bg-slate-950/60 border-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${phase.badgeColor}`}
                >
                  {phase.name}
                </span>
                {isPhaseActive && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>

              {/* Step Pills in this phase */}
              <div className="flex flex-col gap-1 mt-1">
                {phase.steps.map((sNum) => {
                  const isCurrent = sNum === currentStep;
                  const isSelected = sNum === selectedStepNumber;
                  const sDetail = IDF_STEPS_CATALOG.find(
                    (d) => d.number === sNum,
                  );

                  return (
                    <button
                      key={sNum}
                      onClick={() => setSelectedStepNumber(sNum)}
                      className={`text-left px-2 py-1 rounded text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400 font-bold"
                          : isSelected
                            ? "bg-slate-800 text-slate-200 border border-slate-600"
                            : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      <span className="truncate">{sDetail?.shortName}</span>
                      {isCurrent && (
                        <span className="text-[9px] text-cyan-400 font-sans font-bold">
                          ● ACTIVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Selected Step Audit Inspector */}
      <div className="bg-slate-950/40 p-3.5 border-y border-slate-800 text-xs flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold">
              PHASE: {selectedStep.phase}
            </span>
            <h4 className="font-bold text-sm text-white">
              {selectedStep.name}
            </h4>
          </div>
          {selectedStep.number === currentStep ? (
            <span className="text-cyan-400 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> EXECUTING IN
              CURRENT CLOSED LOOP
            </span>
          ) : (
            <span className="text-slate-500 text-[11px]">
              Click any step in the pipeline above to inspect its logic
            </span>
          )}
        </div>

        <p className="text-slate-300 text-xs leading-relaxed font-sans">
          {selectedStep.description}
        </p>

        {/* Triple Input / Operation / Output Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px] block font-mono">
              1. Hardware Input
            </span>
            <span className="text-slate-300 font-semibold font-sans mt-0.5 block">
              {selectedStep.inputDescription}
            </span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px] block font-mono">
              2. Edge MCU Operation
            </span>
            <span className="text-cyan-300 font-semibold font-sans mt-0.5 block">
              {selectedStep.operationDescription}
            </span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px] block font-mono">
              3. Output & Next State
            </span>
            <span className="text-emerald-300 font-semibold font-sans mt-0.5 block">
              {selectedStep.outputDescription}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
