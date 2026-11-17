import React from 'react';
import { ArrowLeft, CheckCircle2, Clock3, MapPin, ShieldAlert, Wrench } from 'lucide-react';
import { TechnicianWorkOrder } from '../../types';

interface IncidentWorkspaceProps {
  workOrder: TechnicianWorkOrder;
  onBack: () => void;
  onAcknowledge: () => void;
  onRepair: () => void;
}

export const IncidentWorkspace: React.FC<IncidentWorkspaceProps> = ({
  workOrder,
  onBack,
  onAcknowledge,
  onRepair,
}) => (
  <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <button type="button" onClick={onBack} className="flex w-fit items-center gap-2 text-xs text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Return to control room
      </button>
      <header className="border-y-2 border-rose-500 bg-rose-950/20 px-4 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 text-rose-400" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-rose-300">Critical incident / field service</p>
              <h1 className="mt-1 text-xl font-semibold text-white">{workOrder.ticketId}</h1>
              <p className="mt-1 text-sm text-slate-300">{workOrder.rootCauseAnalysis}</p>
            </div>
          </div>
          <span className="font-mono text-xs font-semibold text-rose-300">{workOrder.status}</span>
        </div>
      </header>

      <section className="grid gap-5 border-b border-slate-800 pb-5 md:grid-cols-4">
        <Fact label="Station" value={workOrder.stationName} icon={<MapPin />} />
        <Fact label="Location" value={workOrder.location} />
        <Fact label="Fault" value={workOrder.faultCategory} />
        <Fact label="Created" value={new Date(workOrder.timestamp).toLocaleString()} icon={<Clock3 />} />
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="text-sm font-semibold text-white">Investigation timeline</h2>
          <ol className="mt-4 border-l border-slate-700 pl-5 text-xs text-slate-400">
            <li className="relative pb-5"><span className="absolute -left-[25px] top-0 h-2 w-2 bg-rose-400" />Automatic recovery exhausted all candidates.</li>
            <li className="relative pb-5"><span className="absolute -left-[25px] top-0 h-2 w-2 bg-amber-400" />Unverified measurements isolated from downstream analytics.</li>
            <li className="relative"><span className={`absolute -left-[25px] top-0 h-2 w-2 ${workOrder.acknowledged ? 'bg-cyan-400' : 'bg-slate-600'}`} />{workOrder.acknowledged ? 'Crew dispatched and work order acknowledged.' : 'Awaiting operator acknowledgement.'}</li>
          </ol>
        </div>
        <div className="border-l border-slate-700 pl-5">
          <h2 className="text-sm font-semibold text-white">Permitted actions</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">These actions update the simulated work-order lifecycle. They do not claim to control real hardware. After acknowledgement, the dispatched technician remains en route briefly before the simulated repair completes.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!workOrder.acknowledged && <button type="button" onClick={onAcknowledge} className="border border-amber-500/60 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10">Acknowledge & dispatch</button>}
            <button type="button" onClick={onRepair} className="flex items-center gap-2 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"><Wrench className="h-3.5 w-3.5" />Complete simulated repair</button>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 py-5">
        <h2 className="text-sm font-semibold text-white">Field checklist</h2>
        <ul className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-2">
          {workOrder.recommendedActions.map((action) => <li key={action} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />{action}</li>)}
        </ul>
      </section>
    </div>
  </main>
);

const Fact: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="border-l border-slate-700 pl-3">
    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">{icon}{label}</div>
    <div className="mt-1 text-xs font-semibold text-slate-200">{value}</div>
  </div>
);
