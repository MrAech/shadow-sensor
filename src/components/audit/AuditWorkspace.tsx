import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, FileCheck2, Printer, Search, X } from 'lucide-react';
import { RecoveryHistoryRecord, ScenarioMetadata, SensorTelemetry, TechnicianWorkOrder } from '../../types';
import { AuditEvidenceEvent } from '../../domain/operational';

interface AuditWorkspaceProps {
  metadata: ScenarioMetadata;
  history: RecoveryHistoryRecord[];
  telemetry: SensorTelemetry[];
  workOrder: TechnicianWorkOrder | null;
  evidence: AuditEvidenceEvent[];
  onBack: () => void;
}

export const AuditWorkspace: React.FC<AuditWorkspaceProps> = ({ metadata, history, telemetry, workOrder, evidence, onBack }) => {
  const [selectedId, setSelectedId] = useState(evidence[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AuditEvidenceEvent['category']>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showRoutine, setShowRoutine] = useState(false);
  const filteredEvidence = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return evidence.filter((event) => {
      const matchesCategory = categoryFilter === 'ALL' || event.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
      const matchesRoutine = showRoutine || !event.routine;
      const searchable = `${event.title} ${event.source} ${event.status} ${event.category}`.toLowerCase();
      return matchesCategory && matchesStatus && matchesRoutine && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [categoryFilter, evidence, query, showRoutine, statusFilter]);
  const selected = useMemo(() => evidence.find((event) => event.id === selectedId), [evidence, selectedId]);
  useEffect(() => {
    if (selectedId && filteredEvidence.some((event) => event.id === selectedId)) return;
    setSelectedId(filteredEvidence[0]?.id ?? null);
  }, [filteredEvidence, selectedId]);
  const exportAudit = () => {
    const rows = evidence.map((event) => [event.id, new Date(event.timestamp).toISOString(), event.category, event.title, event.status, event.source]);
    const csv = ['ID,Timestamp,Category,Event,Status,Source', ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `SensorShadowX-audit-${metadata.id}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Return to control room</button>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:text-white"><Printer className="h-3.5 w-3.5" />Print</button>
            <button type="button" onClick={exportAudit} className="flex items-center gap-2 bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Download className="h-3.5 w-3.5" />Export evidence</button>
          </div>
        </div>
        <header className="border-y border-cyan-500/70 bg-cyan-950/15 px-1 py-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-400">Evidence and accountability</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Audit workspace</h1>
          <p className="mt-1 text-sm text-slate-400">{metadata.name} · {metadata.location} · {metadata.cpcbStandardOrNorm}</p>
        </header>
        <section className="grid gap-x-8 gap-y-4 border-b border-slate-800 pb-5 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Telemetry samples" value={String(telemetry.length)} />
          <Metric label="Recovery events" value={String(history.length)} />
          <Metric label="Visible records" value={`${filteredEvidence.length} / ${evidence.length}`} />
          <Metric label="Active work order" value={workOrder ? workOrder.ticketId : 'None'} />
        </section>
        <section className="grid gap-8 xl:grid-cols-[minmax(24rem,0.9fr)_minmax(0,1.4fr)]">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Operational record</h2>
                <p className="mt-1 text-xs text-slate-500">Search and filter the record to trace a fault, recovery decision, or field action.</p>
              </div>
              {(query || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || showRoutine) && (
                <button type="button" onClick={() => { setQuery(''); setCategoryFilter('ALL'); setStatusFilter('ALL'); setShowRoutine(false); }} className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white">
                  <X className="h-3.5 w-3.5" />Clear filters
                </button>
              )}
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="flex items-center gap-2 border border-slate-700 bg-slate-900/60 px-3 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="sr-only">Search audit records</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search fault, event, station, or source" className="min-w-0 flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600" />
              </label>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)} className="border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
                <option value="ALL">All record types</option>
                <option value="RECOVERY">Recovery decisions</option>
                <option value="TELEMETRY">Station states</option>
                <option value="WORK_ORDER">Field service</option>
                <option value="OPERATOR">Operator actions</option>
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
                <option value="ALL">All outcomes</option>
                {Array.from(new Set(evidence.map((event) => event.status))).map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={showRoutine} onChange={(event) => setShowRoutine(event.target.checked)} className="accent-cyan-500" />
              Show routine telemetry samples
            </label>
            <div className="mt-3 divide-y divide-slate-800 border-y border-slate-800">
              {filteredEvidence.length === 0 ? <p className="py-8 text-xs text-slate-500">{evidence.length === 0 ? 'No audit evidence has been recorded yet.' : 'No records match the current filters.'}</p> : filteredEvidence.map((event) => (
                <button key={event.id} type="button" onClick={() => setSelectedId(event.id)} className={`block w-full px-3 py-3 text-left hover:bg-slate-900 ${event.id === selectedId ? 'border-l-2 border-cyan-400 bg-slate-900/70' : ''}`}>
                  <div className="flex justify-between gap-3 text-[10px] font-mono text-slate-500"><span>{formatCategory(event.category)} · {event.source}</span><span>{new Date(event.timestamp).toLocaleString()}</span></div>
                  <div className="mt-1 text-xs font-semibold text-slate-200">{event.title}</div>
                  <div className="mt-1 text-[11px] text-slate-400">Outcome: {event.status}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="border-l border-slate-800 pl-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><FileCheck2 className="h-4 w-4 text-cyan-400" />Selected evidence</h2>
            {selected ? <EvidenceDetail event={selected} /> : <p className="mt-4 text-xs text-slate-500">Select an event to inspect its source data and decision context.</p>}
          </div>
        </section>
      </div>
    </main>
  );
};

const formatCategory = (category: AuditEvidenceEvent['category']): string => ({
  RECOVERY: 'Recovery decision',
  TELEMETRY: 'Station state',
  WORK_ORDER: 'Field service',
  OPERATOR: 'Operator action',
}[category]);

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="border-l border-slate-700 pl-3">
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-1 break-words text-sm font-semibold text-slate-200">{value}</div>
  </div>
);

const EvidenceDetail: React.FC<{ event: AuditEvidenceEvent }> = ({ event }) => {
  const detail = Object.entries(event.detail as unknown as Record<string, unknown>)
    .filter(([key]) => !['id', 'timestamp'].includes(key));

  return (
    <div className="mt-4 flex flex-col gap-4 text-xs">
      <div className="border-y border-slate-800 py-3">
        <p className="text-slate-400">Event</p>
        <p className="mt-1 text-slate-100">{event.title}</p>
        <p className="mt-2 font-mono text-[11px] text-slate-500">
          {new Date(event.timestamp).toLocaleString()} · {event.status} · {event.source}
        </p>
      </div>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {detail.map(([key, value]) => (
          <div key={key} className="border-b border-slate-800/80 pb-2">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">
              {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
            </dt>
            <dd className="mt-1 break-words text-slate-200">
              {formatEvidenceValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const formatEvidenceValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.length === 0 ? 'None recorded' : value.map((item) => formatEvidenceValue(item)).join(' · ');
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key.replace(/_/g, ' ')}: ${formatEvidenceValue(item)}`)
      .join(' · ');
  }
  return String(value ?? 'Not recorded');
};
