import React from "react";
import { FaultCategory, IndianScenarioType } from "../../types";
import { FaultInjector } from "../../simulation/faultInjector";
import {
  SITE_SPECIFIC_FAULTS,
  SCENARIO_METADATA,
} from "../../simulation/indianEnvironments";
import { InfoHint } from "../common/InfoHint";

interface FaultInjectionPadProps {
  currentScenario: IndianScenarioType;
  faultInjector: FaultInjector;
  activeFault: FaultCategory;
  onFaultChange: (fault: FaultCategory) => void;
  onReset: () => void;
}

export const FaultInjectionPad: React.FC<FaultInjectionPadProps> = ({
  currentScenario,
  faultInjector,
  activeFault,
  onFaultChange,
  onReset,
}) => {
  const handleTrigger = (fault: FaultCategory) => {
    faultInjector.setFault(fault, 1.0);
    onFaultChange(fault);
  };

  const handleClear = () => {
    faultInjector.clearFault();
    onFaultChange(FaultCategory.NONE);
  };

  const meta = SCENARIO_METADATA[currentScenario];
  const siteFaults = SITE_SPECIFIC_FAULTS[currentScenario] || [];

  return (
    <section className="w-full font-mono flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Site-Specific Physical Fault Injection ({meta.name})
          </h3>
          <InfoHint
            title="Site-Specific Sensor Failures"
            description="Unlike generic simulations that use identical dummy errors everywhere, each test site here models its genuine local environmental failure physics: Delhi stubble smoke and ISBT draft, Thar desert 49°C solar soak and sandstorms, or Punjab canal silt encrustation and tractor tillage wire severance."
            example="Switch test sites above to see the fault cards and transducer physics change specifically for that Indian environment."
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-sans hidden sm:inline">
            {meta.location}
          </span>
          <button
            onClick={handleClear}
            className={`text-xs px-3 py-1 rounded-lg transition-all font-semibold cursor-pointer ${
              activeFault === FaultCategory.NONE
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            }`}
          >
            Clear / Nominal
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          >
            <span>Reset Rig</span>
          </button>
        </div>
      </div>

      {/* Grid of 4 Site-Specific Physical Fault Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-6">
        {siteFaults.map((card) => {
          const isActive = activeFault === card.category;
          return (
            <div
              key={card.category}
              onClick={() => handleTrigger(card.category)}
              className={`p-3 border-l-2 flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-rose-950/30 border-rose-500"
                  : "bg-slate-950/30 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span className="truncate">{card.title}</span>
                  </div>
                  {/* <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 flex-shrink-0"> */}
                  {/*   {card.tag} */}
                  {/* </span> */}
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {card.physicalPhenomenon}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/70 text-[10px] font-sans flex flex-col gap-1">
                <span className="text-slate-400">
                  <strong className="text-rose-400">Software Limit:</strong>{" "}
                  {card.whySoftwareFails}
                </span>
                <span className="text-cyan-400 font-mono mt-0.5">
                  <strong>Physical Action:</strong> {card.reconfigurationAction}
                </span>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
                {isActive ? (
                  <span className="text-rose-300 font-bold flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />{" "}
                    INJECTED (ACTIVE)
                  </span>
                ) : (
                  <span className="text-slate-500 hover:text-cyan-400 flex items-center gap-1">
                    Click to Inject &rarr;
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
