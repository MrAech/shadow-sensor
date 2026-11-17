import React, { useState, useEffect, useRef } from "react";
import {
  IndianScenarioType,
  FaultCategory,
  SensorTelemetry,
  PhysicalHardwareState,
  VerificationMetrics,
  IDFStep,
  TechnicianWorkOrder,
} from "./types";
import { SensorShadowEngine } from "./simulation/sensorShadowEngine";
import { SCENARIO_METADATA } from "./simulation/indianEnvironments";
import { IndianScenarioBar } from "./components/dashboard/IndianScenarioBar";
import { TelemetryCharts } from "./components/dashboard/TelemetryCharts";
import { StateFlowInspector } from "./components/dashboard/StateFlowInspector";
import { VerificationGauge } from "./components/dashboard/VerificationGauge";
import { RecoveryHistoryLog } from "./components/dashboard/RecoveryHistoryLog";
import { ViewportToggle } from "./components/visualizer/ViewportToggle";
import { FaultInjectionPad } from "./components/controls/FaultInjectionPad";
import { ProfessorTour } from "./components/controls/ProfessorTour";
import { PatentMatrix } from "./components/patent/PatentMatrix";
import { IncidentWorkspace } from "./components/operations/IncidentWorkspace";
import { AuditWorkspace } from "./components/audit/AuditWorkspace";
import { OperationalSummary } from "./components/dashboard/OperationalSummary";
import { buildAuditEvidence, OperatorActivity } from "./domain/operational";
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Cpu,
  Zap,
  GitCommit,
  ShieldCheck,
  Database,
  GraduationCap,
  Layers,
  Activity,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";

export const App: React.FC = () => {
  // Engine instance
  const engineRef = useRef<SensorShadowEngine>(
    new SensorShadowEngine(IndianScenarioType.DELHI_AQI),
  );
  const engine = engineRef.current;

  // Reactive simulation states
  const [scenario, setScenario] = useState<IndianScenarioType>(
    engine.getScenario(),
  );
  const [activeFault, setActiveFault] = useState<FaultCategory>(
    FaultCategory.NONE,
  );
  const [telemetry, setTelemetry] = useState<SensorTelemetry | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<SensorTelemetry[]>(
    [],
  );
  const [hardwareState, setHardwareState] = useState<PhysicalHardwareState>(
    engine.getHardwareState(),
  );
  const [currentStep, setCurrentStep] = useState<IDFStep>(
    engine.getCurrentStep(),
  );
  const [lastVerification, setLastVerification] =
    useState<VerificationMetrics | null>(null);
  const [recoveryHistory, setRecoveryHistory] = useState(
    engine.getRecoveryHistory(),
  );

  // Technician Dispatch Work Order & Modals
  const [workOrder, setWorkOrder] = useState<TechnicianWorkOrder | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<
    "CONTROL" | "AUDIT" | "INCIDENT"
  >("CONTROL");
  const [operatorActivities, setOperatorActivities] = useState<
    OperatorActivity[]
  >([]);
  const [alarmAcknowledged, setAlarmAcknowledged] = useState(false);
  const technicianRepairTimerRef = useRef<number | null>(null);

  // Simulation run controls
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 1x, 2x, 4x

  // Workbench Tab selection
  const [activeTab, setActiveTab] = useState<
    "FAULTS" | "PIPELINE" | "VERIFICATION" | "HISTORY" | "PRESENTATION" | "ALL"
  >("FAULTS");

  // Master Simulation Loop
  useEffect(() => {
    if (!isRunning) return;

    const baseIntervalMs = 500 / speedMultiplier;
    const interval = setInterval(() => {
      const dt = 0.5;
      const latestTelem = engine.tick(dt);

      setTelemetry(latestTelem);
      setTelemetryHistory([...engine.getTelemetryHistory()]);
      setHardwareState(engine.getHardwareState());
      setCurrentStep(engine.getCurrentStep());
      setLastVerification(engine.getLastVerification());
      setRecoveryHistory([...engine.getRecoveryHistory()]);
      setActiveFault(engine.getFaultInjector().getActiveFault());

      const activeWO = engine.getActiveWorkOrder();
      if (activeWO && !workOrder) {
        // New unrecoverable work order triggered! Open modal automatically
        setWorkOrder(activeWO);
        setActiveWorkspace("INCIDENT");
      } else {
        setWorkOrder(activeWO);
      }
    }, baseIntervalMs);

    return () => clearInterval(interval);
  }, [isRunning, speedMultiplier, workOrder]);

  useEffect(
    () => () => {
      if (technicianRepairTimerRef.current !== null) {
        window.clearTimeout(technicianRepairTimerRef.current);
      }
    },
    [],
  );

  const handleScenarioChange = (newScenario: IndianScenarioType) => {
    engine.setScenario(newScenario);
    setScenario(newScenario);
    setActiveFault(FaultCategory.NONE);
    setAlarmAcknowledged(false);
    setTelemetryHistory([]);
    setHardwareState(engine.getHardwareState());
    setCurrentStep(engine.getCurrentStep());
    setRecoveryHistory([]);
    setWorkOrder(null);
  };

  const handleFaultChange = (fault: FaultCategory) => {
    engine.resetSystem();
    setActiveFault(fault);
    setAlarmAcknowledged(false);
    setWorkOrder(null);
    setActiveWorkspace("CONTROL");
    setTelemetryHistory([]);
    setLastVerification(null);
    if (fault !== FaultCategory.NONE) {
      engine.getFaultInjector().setFault(fault, 1.0);
    }
    const immediateTelemetry = engine.tick(0.5);
    setTelemetry(immediateTelemetry);
    setTelemetryHistory([...engine.getTelemetryHistory()]);
    setHardwareState(engine.getHardwareState());
    setCurrentStep(engine.getCurrentStep());
    setLastVerification(engine.getLastVerification());
    setRecoveryHistory([...engine.getRecoveryHistory()]);
    setWorkOrder(engine.getActiveWorkOrder());
  };

  const handleResetSystem = () => {
    engine.resetSystem();
    setActiveFault(FaultCategory.NONE);
    setAlarmAcknowledged(false);
    setTelemetry(null);
    setTelemetryHistory([]);
    setHardwareState(engine.getHardwareState());
    setCurrentStep(engine.getCurrentStep());
    setLastVerification(null);
    setWorkOrder(null);
  };

  const handleAcknowledgeWorkOrder = () => {
    engine.acknowledgeWorkOrder();
    setAlarmAcknowledged(true);
    setWorkOrder(engine.getActiveWorkOrder());
    setOperatorActivities((current) => [
      ...current,
      {
        id: `operator-ack-${Date.now()}`,
        timestamp: Date.now(),
        action: "ALARM_ACKNOWLEDGED",
        description: `Acknowledged field work order ${workOrder?.ticketId ?? "active incident"}`,
      },
    ]);
    technicianRepairTimerRef.current = window.setTimeout(() => {
      technicianRepairTimerRef.current = null;
      handleSimulateTechnicianRepair();
    }, 8000);
  };

  const handleAcknowledgeAlarm = () => {
    setAlarmAcknowledged(true);
    setOperatorActivities((current) => [
      ...current,
      {
        id: `operator-alarm-ack-${Date.now()}`,
        timestamp: Date.now(),
        action: "ALARM_ACKNOWLEDGED",
        description:
          "Acknowledged the active anomaly alarm and retained it under investigation.",
      },
    ]);
  };

  const handleSimulateTechnicianRepair = () => {
    if (technicianRepairTimerRef.current !== null) {
      window.clearTimeout(technicianRepairTimerRef.current);
      technicianRepairTimerRef.current = null;
    }
    engine.resolveWorkOrderTechnicianRepaired();
    setWorkOrder(null);
    setActiveWorkspace("CONTROL");
    setOperatorActivities((current) => [
      ...current,
      {
        id: `operator-repair-${Date.now()}`,
        timestamp: Date.now(),
        action: "SIMULATED_REPAIR_COMPLETED",
        description: `Completed simulated repair for ${workOrder?.ticketId ?? "field incident"}`,
      },
    ]);
    handleResetSystem();
  };

  const metadata = SCENARIO_METADATA[scenario];
  const ambient = {
    temp: hardwareState.enclosureTemp,
    humidity:
      scenario === IndianScenarioType.BHADLA_SOLAR
        ? 22
        : scenario === IndianScenarioType.DELHI_AQI
          ? 78
          : 55,
  };
  const auditEvidence = buildAuditEvidence(
    recoveryHistory,
    telemetryHistory,
    workOrder,
    operatorActivities,
  );

  if (activeWorkspace === "AUDIT") {
    return (
      <AuditWorkspace
        metadata={metadata}
        history={recoveryHistory}
        telemetry={telemetryHistory}
        workOrder={workOrder}
        evidence={auditEvidence}
        onBack={() => setActiveWorkspace("CONTROL")}
      />
    );
  }

  if (activeWorkspace === "INCIDENT" && workOrder) {
    return (
      <IncidentWorkspace
        workOrder={workOrder}
        onBack={() => setActiveWorkspace("CONTROL")}
        onAcknowledge={handleAcknowledgeWorkOrder}
        onRepair={handleSimulateTechnicianRepair}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
      {/* 1. TOP INDUSTRIAL TELEMETRY HEADER */}
      <header className="w-full border-b border-slate-800/90 bg-slate-900/95 sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* <div className="w-9 h-9 bg-cyan-700/80 flex items-center justify-center"> */}
            {/*   <Cpu className="w-5 h-5 text-white" /> */}
            {/* </div> */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-mono font-bold tracking-tight text-white">
                  SensorShadow-X
                </h1>
                {/* <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/15 text-cyan-300 border-l border-cyan-500/40"> */}
                {/*   IDF Strict 17-Step Loop */}
                {/* </span> */}
                {/* <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/15 text-amber-300 border-l border-amber-500/40"> */}
                {/*   India Field Suite */}
                {/* </span> */}
                {workOrder ? (
                  <button
                    onClick={() => setActiveWorkspace("INCIDENT")}
                    className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500 font-bold animate-pulse flex items-center gap-1 cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>FIELD DISPATCH REQUIRED</span>
                  </button>
                ) : telemetry?.isSafeDegraded ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500 font-bold animate-pulse">
                    SAFE DEGRADED
                  </span>
                ) : telemetry?.isStabilizing ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold animate-pulse">
                    STABILIZING (QUARANTINED)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    SYSTEM OPERATIONAL
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Autonomous Physical IoT Sensor Recovery with Closed-Loop
                Multi-Constraint Verification
              </p>
            </div>
          </div>

          {/* Action Bar: Audits, Notification Bell, Simulation Controls */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs w-full md:w-auto justify-end">
            {/* Audit & Compliance Report Modal Trigger */}
            <button
              onClick={() => setActiveWorkspace("AUDIT")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 transition-all cursor-pointer font-semibold shadow-sm"
              title="Open Official Audit & Excel Report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audit workspace</span>
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-semibold ${
                isRunning
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
              }`}
            >
              {isRunning ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{isRunning ? "Pause Sim" : "Resume Sim"}</span>
            </button>

            {/* Speed Multiplier */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    speedMultiplier === spd
                      ? "bg-cyan-500/30 text-cyan-200 border border-cyan-500/50"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              onClick={handleResetSystem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. FULL-BLEED WORKBENCH LAYOUT */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-7">
        {/* Scenario Selection & Weather Bar */}
        <IndianScenarioBar
          currentScenario={scenario}
          onSelectScenario={handleScenarioChange}
          ambientConditions={ambient}
        />

        <OperationalSummary
          telemetry={telemetry}
          hardwareState={hardwareState}
          currentStep={currentStep}
          workOrder={workOrder}
          alarmAcknowledged={alarmAcknowledged}
          onAcknowledgeAlarm={handleAcknowledgeAlarm}
        />

        {/* PRIMARY OPERATIONAL COCKPIT (Dual 50/50 Columns on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
          {/* Left Cockpit: Physical & Electrical Rig Visualizer */}
          <div className="w-full flex flex-col">
            <ViewportToggle
              hardwareState={hardwareState}
              telemetry={telemetry}
              scenario={scenario}
            />
          </div>

          {/* Right Cockpit: Real-time Telemetry Oscilloscope Monitor */}
          <div className="w-full flex flex-col">
            <TelemetryCharts history={telemetryHistory} metadata={metadata} />
          </div>
        </div>

        {/* 3. ENGINEERING WORKBENCH TABS */}
        <div className="w-full border-y border-slate-800/80 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setActiveTab("FAULTS")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeTab === "FAULTS"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {/* <Zap className="w-3.5 h-3.5 text-amber-400" /> */}
                <span>1. Fault Injection Sandbox</span>
              </button>

              <button
                onClick={() => setActiveTab("PIPELINE")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeTab === "PIPELINE"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {/* <GitCommit className="w-3.5 h-3.5 text-cyan-400" /> */}
                <span>2. 17-Step Process Pipeline</span>
              </button>

              <button
                onClick={() => setActiveTab("VERIFICATION")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeTab === "VERIFICATION"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/60 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {/* <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> */}
                <span>3. Verification Engine Math (V)</span>
              </button>

              <button
                onClick={() => setActiveTab("HISTORY")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeTab === "HISTORY"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {/* <Database className="w-3.5 h-3.5 text-emerald-400" /> */}
                <span>4. Recovery Memory Database</span>
              </button>

              <button
                onClick={() => setActiveTab("PRESENTATION")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeTab === "PRESENTATION"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/60 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {/* <GraduationCap className="w-3.5 h-3.5 text-purple-400" /> */}
                <span>5. Professor Presentation & Patent Matrix</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setActiveTab(activeTab === "ALL" ? "FAULTS" : "ALL")
                }
                className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  activeTab === "ALL"
                    ? "bg-slate-800 text-white border-slate-600 font-bold"
                    : "text-slate-400 hover:text-white border-slate-800"
                }`}
              >
                {activeTab === "ALL" ? "Collapse to Tabs" : "View All Panels"}
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE WORKBENCH PANEL CONTENT */}
        <div className="w-full flex flex-col gap-4">
          {(activeTab === "FAULTS" || activeTab === "ALL") && (
            <FaultInjectionPad
              currentScenario={scenario}
              faultInjector={engine.getFaultInjector()}
              activeFault={activeFault}
              onFaultChange={handleFaultChange}
              onReset={handleResetSystem}
            />
          )}

          {(activeTab === "PIPELINE" || activeTab === "ALL") && (
            <StateFlowInspector currentStep={currentStep} />
          )}

          {(activeTab === "VERIFICATION" || activeTab === "ALL") && (
            <VerificationGauge
              metrics={lastVerification}
              verifEngine={engine.getVerificationEngine()}
            />
          )}

          {(activeTab === "HISTORY" || activeTab === "ALL") && (
            <RecoveryHistoryLog history={recoveryHistory} />
          )}

          {(activeTab === "PRESENTATION" || activeTab === "ALL") && (
            <div className="grid grid-cols-1 gap-4 w-full">
              {/* <ProfessorTour */}
              {/*   engine={engine} */}
              {/*   onSelectScenario={handleScenarioChange} */}
              {/*   onFaultChange={handleFaultChange} */}
              {/* /> */}
              <PatentMatrix
                history={recoveryHistory}
                telemetryHistory={telemetryHistory}
              />
            </div>
          )}
        </div>
      </main>

      {/* 4. MODALS & SLIDEOVERS */}
      {/* FOOTER */}
      {/* <footer className="w-full border-t border-slate-800/80 bg-slate-900/60 py-3 px-6 text-left text-xs font-mono text-slate-500"> */}
      {/*   SensorShadow-X Autonomous IoT Recovery Simulation Platform | Strictly */}
      {/*   verified against IDF & Patentability Screening Report */}
      {/* </footer> */}
    </div>
  );
};
