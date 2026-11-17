import React from "react";
import { RecoveryHistoryRecord } from "../../types";
import { InfoHint } from "../common/InfoHint";
import {
  Database,
  CheckCircle,
  XCircle,
  Clock,
  ShieldX,
  Check,
} from "lucide-react";

interface RecoveryHistoryLogProps {
  history: RecoveryHistoryRecord[];
}

export const RecoveryHistoryLog: React.FC<RecoveryHistoryLogProps> = ({
  history,
}) => {
  return (
    <section className="w-full font-mono flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Recovery History Database & Memory (IDF Step 16)
          </h3>
          <InfoHint
            title="Recovery History & Learning Memory"
            description="Stores the immutable tuple: (Fault Category, Sensor ID, Config ID) -> Outcome. When a physical reconfiguration fails verification, it is flagged as REJECTED_FAILED in this database. Step 9 consults this table and assigns -infinity rank to failed candidates, preventing the system from ever repeating an ineffective physical action."
            example="If servo rotation fails for a broken wire, the system records it as failed and autonomously selects the electrical SPDT relay switch on the next retry."
          />
        </div>
        <div className="text-xs text-slate-400">
          Logged Events:{" "}
          <strong className="text-cyan-300 font-bold">{history.length}</strong>
        </div>
      </div>

      <div className="text-xs text-slate-400 font-sans leading-relaxed">
        Traceable tuple memory:{" "}
        <code className="text-cyan-300 font-bold font-mono">
          (Fault Category, Sensor ID, Config ID) &rarr; Outcome
        </code>
        . Configurations marked as failed are strictly excluded from future
        candidate ranking.
      </div>

      {/* History Audit Table */}
      <div className="w-full overflow-x-auto max-h-[220px] scrollbar-thin rounded-lg border border-slate-800">
        {history.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-sans">
            No recovery events logged yet. Inject a physical fault above to
            observe the closed-loop recovery sequence.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Fault Category</th>
                <th className="py-2 px-3">Physical Action Executed</th>
                <th className="py-2 px-3">Verification V</th>
                <th className="py-2 px-3">Outcome</th>
                <th className="py-2 px-3">Memory Exclusion Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-[11px]">
              {history.map((record) => {
                const timeStr = new Date(record.timestamp).toLocaleTimeString();

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2 px-3 text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{timeStr}</span>
                    </td>
                    <td className="py-2 px-3 text-amber-300 font-semibold">
                      {record.faultCategory}
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[10px]">
                        {record.physicalConfigSummary}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold font-mono">
                      <span
                        className={
                          record.verificationScore >= 0.75
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }
                      >
                        {record.verificationScore}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {record.outcome === "SUCCESS" && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 w-max">
                          <Check className="w-3 h-3" />
                          <span>ACCEPTED</span>
                        </span>
                      )}
                      {record.outcome === "REJECTED_FAILED" && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1 w-max">
                          <XCircle className="w-3 h-3" />
                          <span>REJECTED</span>
                        </span>
                      )}
                      {record.outcome === "INCONCLUSIVE" && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 w-max">
                          <ShieldX className="w-3 h-3" />
                          <span>INCONCLUSIVE</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      {record.outcome === "REJECTED_FAILED" ? (
                        <span className="text-rose-400 text-[11px] font-semibold flex items-center gap-1">
                          <ShieldX className="w-3 h-3 text-rose-500 flex-shrink-0" />
                          <span>
                            Candidate excluded from future Step 9 ranking
                          </span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          <span>Active accepted physical configuration</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
