import React, { useState } from "react";
import { FaultCategory, IndianScenarioType } from "../../types";
import { SensorShadowEngine } from "../../simulation/sensorShadowEngine";
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle2,
  Bookmark,
} from "lucide-react";

interface ProfessorTourProps {
  engine: SensorShadowEngine;
  onSelectScenario: (scenario: IndianScenarioType) => void;
  onFaultChange: (fault: FaultCategory) => void;
}

interface TourSlide {
  title: string;
  subtitle: string;
  bullets: string[];
  patentHook: string;
  actionButtonLabel?: string;
  onTriggerAction?: () => void;
}

export const ProfessorTour: React.FC<ProfessorTourProps> = ({
  engine,
  onSelectScenario,
  onFaultChange,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slides: TourSlide[] = [
    {
      title: "1. The Physical Sensing Problem in India",
      subtitle:
        "Why software filtering & data imputation cannot fix physical sensor degradation",
      bullets: [
        "IoT sensors in Indian environments (Delhi smog, Thar desert sandstorms, Punjab farm silt) face physical degradation: optical soot coating, 48°C thermal gain drift, and physical disconnection.",
        "Software-only methods (imputation, averaging, Kalman filtering) process bad data but leave the physical sensing arrangement defective.",
        "Core Principle: When a physical transducer is soiled or disconnected, the hardware itself must be physically reconfigured.",
      ],
      patentHook:
        "Distinguishes from US2017184416A1, which only does software correlation and data substitution.",
      actionButtonLabel: "Simulate Delhi Smog Obstruction",
      onTriggerAction: () => {
        onSelectScenario(IndianScenarioType.DELHI_AQI);
        engine
          .getFaultInjector()
          .setFault(FaultCategory.OBSTRUCTION_SOILING, 1.0);
        onFaultChange(FaultCategory.OBSTRUCTION_SOILING);
      },
    },
    {
      title: "2. The 17-Step Closed Loop (IDF Section 7)",
      subtitle:
        "Controlled, verifiable feedback loop linking software diagnosis to mechanical actuation",
      bullets: [
        "SensorShadow-X establishes a strict closed loop: Ingest (1-4) → Assess (5-7) → Physically Reconfigure (8-10) → Settle (11-12) → Verify (13-14) → Memory/Degraded (15-17).",
        "Persistence Rule (Step 6): Requires sustained departures (≥ 3 ticks) to ensure brief spikes/gusts do not cause unnecessary physical wear on actuators.",
        "Fault-Specific Mapping (Step 8): Diagnosed fault directly dictates the mechanical or electrical recovery action.",
      ],
      patentHook:
        "Distinguishes from CN114414026A, which blindly rotates regardless of fault cause.",
    },
    {
      title: "3. Physical Reconfiguration: Servo vs Relay MUX",
      subtitle:
        "Physically grounded recovery mechanisms tailored to transducer physics",
      bullets: [
        "Aperture Soiling: The MG996R servo rotates the gimbal 90° to engage an unsoiled secondary sheltered intake with a protective baffle.",
        "Wiring Disconnection: Rotating a servo cannot fix a broken wire. SensorShadow-X detects this and commands an SPDT relay to switch the signal bus to an independent redundant probe harness.",
        "Observation: Notice how the 3D gimbal swivels and the 2D schematic relay blade snaps to Channel 2!",
      ],
      patentHook:
        "Demonstrates multi-modal physical actuation (actuator movement + electrical path switching).",
      actionButtonLabel: "Simulate Cable Cut (Wire Severance)",
      onTriggerAction: () => {
        engine.getFaultInjector().setFault(FaultCategory.DISCONNECTION, 1.0);
        onFaultChange(FaultCategory.DISCONNECTION);
      },
    },
    {
      title: "4. Stabilization Quarantine Period (Step 11)",
      subtitle: "Why completing a mechanical action is NOT proof of recovery",
      bullets: [
        "Major Technical Flaw in Prior Art: Systems assume that because a servo moved or a switch flipped, sensing is restored.",
        "SensorShadow-X introduces Step 11 (Stabilization Delay): Mechanical vibration and relay contact bounce cause severe transient instability (quarantined in amber on charts).",
        "Step 12: Fresh post-reconfiguration measurements are acquired ONLY after mechanical settling elapses.",
      ],
      patentHook:
        "Prior art CN114414026A and CN119197555A lack a post-reconfiguration stabilization quarantine period.",
    },
    {
      title: "5. Independent Verification Engine V(t) (Step 13)",
      subtitle:
        "Mathematical validation before configuration acceptance with hard safety gates",
      bullets: [
        "Verification Formula: V = 0.35 C_cross + 0.25 C_temporal + 0.20 C_phys + 0.20 C_stability (evaluated on fresh post-settling data).",
        "Hard Safety Gates: If an open-circuit / disconnection or physical limit breach is detected, V is immediately forced to 0.0, preventing false positive acceptance.",
        "Accept/Reject Gate (Step 14): Configuration is accepted if and only if V ≥ V_th (default 0.75).",
      ],
      patentHook:
        "Proves independent recovery verification is based on empirical sensor evidence, not mechanical completion.",
    },
    {
      title: "6. Recovery History Memory & Safe Degraded Fallback",
      subtitle:
        "Autonomous learning from failures and fail-safe graceful degradation",
      bullets: [
        "Recovery History Database (Step 16): Indexed by (Fault, SensorID, ConfigID) → Outcome.",
        "Memory Exclusion: If Candidate 1 failed verification, it is strictly excluded from future ranking. The system will NEVER repeat an ineffective physical configuration.",
        "Safe Degraded Mode (Step 17): If all physical candidates fail, the system isolates the channel, flags data as UNRELIABLE, and triggers fail-safe alarms downstream.",
      ],
      patentHook:
        "Directly fulfills the screening report requirements to elevate SensorShadow-X to Category A patentability.",
      actionButtonLabel: "Reset & Clear All",
      onTriggerAction: () => {
        engine.resetSystem();
        onFaultChange(FaultCategory.NONE);
      },
    },
  ];

  const slide = slides[currentSlideIndex];

  return (
    <section className="font-mono flex flex-col justify-between">
      {/* Header */}
      {/* <div className="flex items-center justify-between border-b border-slate-800/80 pb-2"> */}
      {/*   <div className="flex items-center gap-2"> */}
      {/*     <GraduationCap className="w-4 h-4 text-emerald-400" /> */}
      {/*     <span className="text-xs font-bold text-slate-200 uppercase tracking-wider"> */}
      {/*       Professor Presentation Mode (Guided Walkthrough) */}
      {/*     </span> */}
      {/*   </div> */}
      {/*   <div className="flex items-center gap-2"> */}
      {/*     <span className="text-[11px] text-slate-400"> */}
      {/*       Slide{" "} */}
      {/*       <strong className="text-cyan-300">{currentSlideIndex + 1}</strong>{" "} */}
      {/*       of {slides.length} */}
      {/*     </span> */}
      {/*     <div className="flex gap-1"> */}
      {/*       <button */}
      {/*         onClick={() => */}
      {/*           setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1)) */}
      {/*         } */}
      {/*         disabled={currentSlideIndex === 0} */}
      {/*         className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700" */}
      {/*       > */}
      {/*         <ChevronLeft className="w-3.5 h-3.5" /> */}
      {/*       </button> */}
      {/*       <button */}
      {/*         onClick={() => */}
      {/*           setCurrentSlideIndex( */}
      {/*             Math.min(slides.length - 1, currentSlideIndex + 1), */}
      {/*           ) */}
      {/*         } */}
      {/*         disabled={currentSlideIndex === slides.length - 1} */}
      {/*         className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700" */}
      {/*       > */}
      {/*         <ChevronRight className="w-3.5 h-3.5" /> */}
      {/*       </button> */}
      {/*     </div> */}
      {/*   </div> */}
      {/* </div> */}

      {/* Slide Body */}
      {/* <div className="my-2 flex flex-col gap-2"> */}
      {/*   <h3 className="text-sm font-bold text-white flex items-center gap-2"> */}
      {/*     <Bookmark className="w-3.5 h-3.5 text-cyan-400" /> */}
      {/*     <span>{slide.title}</span> */}
      {/*   </h3> */}
      {/*   <p className="text-xs text-slate-400 italic">{slide.subtitle}</p> */}
      {/**/}
      {/*   <ul className="flex flex-col gap-1.5 my-1 text-xs text-slate-300"> */}
      {/*     {slide.bullets.map((b, i) => ( */}
      {/*       <li key={i} className="flex items-start gap-2"> */}
      {/*         <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" /> */}
      {/*         <span className="leading-relaxed">{b}</span> */}
      {/*       </li> */}
      {/*     ))} */}
      {/*   </ul> */}
      {/**/}
      {/* Patent Hook Callout */}
      {/*   <div className="p-2 rounded bg-cyan-950/40 border border-cyan-800/60 text-[11px] text-cyan-200 flex items-center gap-2"> */}
      {/*     <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" /> */}
      {/*     <span> */}
      {/*       <strong>Patent Differentiator:</strong> {slide.patentHook} */}
      {/*     </span> */}
      {/*   </div> */}
      {/* </div> */}
      {/**/}
      {/* Interactive Trigger Button for This Slide */}
      {/* {slide.actionButtonLabel && slide.onTriggerAction && ( */}
      {/*   <div className="pt-2 border-t border-slate-800/80 flex justify-end"> */}
      {/*     <button */}
      {/*       onClick={slide.onTriggerAction} */}
      {/*       className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all" */}
      {/*     > */}
      {/*       <Play className="w-3 h-3 text-emerald-400" /> */}
      {/*       <span>{slide.actionButtonLabel}</span> */}
      {/*     </button> */}
      {/*   </div> */}
      {/* )} */}
    </section>
  );
};
