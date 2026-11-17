import React from "react";
import { IndianScenarioType } from "../../types";
import { SCENARIO_METADATA } from "../../simulation/indianEnvironments";
import { InfoHint } from "../common/InfoHint";
import {
  MapPin,
  Wind,
  Sun,
  Sprout,
  Thermometer,
  Droplets,
  ShieldAlert,
} from "lucide-react";

interface IndianScenarioBarProps {
  currentScenario: IndianScenarioType;
  onSelectScenario: (scenario: IndianScenarioType) => void;
  ambientConditions: { temp: number; humidity: number };
}

export const IndianScenarioBar: React.FC<IndianScenarioBarProps> = ({
  currentScenario,
  onSelectScenario,
  ambientConditions,
}) => {
  const currentMeta = SCENARIO_METADATA[currentScenario];

  return (
    <section className="w-full border-b border-slate-800/80 pb-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Scenario Selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <span>Test Site:</span>
            <InfoHint
              title="Indian Field Deployment Scenarios"
              description="Real Indian field environments with severe physical stresses: winter smog in Delhi NCR, desert sandstorms in Rajasthan, and flood silt in Punjab farms. These physical stresses cause sensor degradation that software filters cannot fix."
              example="Delhi CAAQMS station at Anand Vihar experiences PM2.5 spikes up to 450 µg/m³ during winter temperature inversions."
            />
          </span>

          <button
            onClick={() => onSelectScenario(IndianScenarioType.DELHI_AQI)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              currentScenario === IndianScenarioType.DELHI_AQI
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-sm font-semibold"
                : "bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {/* <Wind className="w-3.5 h-3.5 text-amber-400" /> */}
            <span>1. Delhi CPCB AQI Station</span>
          </button>

          <button
            onClick={() => onSelectScenario(IndianScenarioType.BHADLA_SOLAR)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              currentScenario === IndianScenarioType.BHADLA_SOLAR
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/60 shadow-sm font-semibold"
                : "bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {/* <Sun className="w-3.5 h-3.5 text-orange-400" /> */}
            <span>2. Bhadla Solar Park (Rajasthan)</span>
          </button>

          <button
            onClick={() =>
              onSelectScenario(IndianScenarioType.PUNJAB_AGRICULTURE)
            }
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              currentScenario === IndianScenarioType.PUNJAB_AGRICULTURE
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-sm font-semibold"
                : "bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {/* <Sprout className="w-3.5 h-3.5 text-emerald-400" /> */}
            <span>3. Punjab Agro Field Station</span>
          </button>
        </div>

        {/* Live Weather & Telemetry Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
            {/* <Thermometer className="w-3.5 h-3.5 text-amber-400" /> */}
            <span className="text-slate-400">Ambient Temp:</span>
            <span className="text-amber-300 font-bold">
              {ambientConditions.temp}°C
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
            {/* <Droplets className="w-3.5 h-3.5 text-cyan-400" /> */}
            <span className="text-slate-400">Humidity:</span>
            <span className="text-cyan-300 font-bold">
              {ambientConditions.humidity}% RH
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-300">
            <span className="text-slate-400">Target Standard:</span>
            <span className="text-emerald-400 font-medium text-[11px]">
              {currentMeta.cpcbStandardOrNorm}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-description Bar */}
      <div className="mt-3 grid gap-2 border-t border-slate-800/60 pt-3 text-xs font-sans text-slate-400 md:grid-cols-[minmax(0,1fr)_minmax(18rem,1fr)] md:items-start md:gap-6">
        <div className="flex min-w-0 items-start gap-1.5">
          {/* <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" /> */}
          <div className="min-w-0">
            <span className="font-semibold text-slate-200">
              {currentMeta.name}
            </span>
            <span className="ml-1 text-slate-500 font-mono text-[11px]">
              ({currentMeta.location})
            </span>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-1.5 text-amber-300/90 text-xs md:justify-self-end">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="break-words">
            <strong>Physical Threat:</strong>{" "}
            {currentMeta.environmentalChallenge}
          </span>
        </div>
      </div>
    </section>
  );
};
