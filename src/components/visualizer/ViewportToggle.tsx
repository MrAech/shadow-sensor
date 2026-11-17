import React, { useState } from "react";
import { HardwareRig3D } from "./HardwareRig3D";
import { Schematic2D } from "./Schematic2D";
import { IndianScenarioType, PhysicalHardwareState, SensorTelemetry } from "../../types";
import { InfoHint } from "../common/InfoHint";

interface ViewportToggleProps {
  hardwareState: PhysicalHardwareState;
  telemetry: SensorTelemetry | null;
  scenario: IndianScenarioType;
}

export const ViewportToggle: React.FC<ViewportToggleProps> = ({
  hardwareState,
  telemetry,
  scenario,
}) => {
  const [viewMode, setViewMode] = useState<"3D" | "2D" | "SPLIT">("3D");

  return (
    <section className="w-full flex flex-col gap-4">
      {/* Viewport Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-0.5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Physical & Electrical Rig Cockpit
          </h3>
          <InfoHint
            title="Physical vs Electrical Visualization"
            description="The 3D view shows what physically happens in the real world (servo gimbal rotating to a clean intake angle). The 2D view shows how the electrical system executes the reconfiguration (ESP32 GPIOs, SPDT relay switching, PWM pulse trains)."
            example="Notice that during settling (Step 11), the 3D model shows mechanical vibration while the 2D schematic shows a data quarantine lock over the ADC bus."
          />
        </div>

        {/* View Mode Switcher */}
        <div className="flex w-full max-w-full flex-nowrap overflow-x-auto bg-slate-950 border border-slate-800 rounded-lg p-0.5 shadow-inner xl:w-auto">
          <button
            onClick={() => setViewMode("3D")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
              viewMode === "3D"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>3D Model (Physical)</span>
          </button>

          <button
            onClick={() => setViewMode("2D")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
              viewMode === "2D"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>2D Schematic (Electrical)</span>
          </button>

          <button
            onClick={() => setViewMode("SPLIT")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
              viewMode === "SPLIT"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Dual Split View</span>
          </button>
        </div>
      </div>

      {/* Viewport Canvas Container */}
      <div className="w-full min-h-[380px] h-[380px]">
        {viewMode === "3D" && (
          <HardwareRig3D hardwareState={hardwareState} telemetry={telemetry} scenario={scenario} />
        )}
        {viewMode === "2D" && (
          <Schematic2D hardwareState={hardwareState} telemetry={telemetry} scenario={scenario} />
        )}
        {viewMode === "SPLIT" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
            <HardwareRig3D
              hardwareState={hardwareState}
              telemetry={telemetry}
              scenario={scenario}
            />
            <Schematic2D hardwareState={hardwareState} telemetry={telemetry} scenario={scenario} />
          </div>
        )}
      </div>
    </section>
  );
};
