import React from "react";
import { RecoveryHistoryRecord, SensorTelemetry } from "../../types";
import { Award, Download, Check, X, HelpCircle, FileText } from "lucide-react";

interface PatentMatrixProps {
  history: RecoveryHistoryRecord[];
  telemetryHistory: SensorTelemetry[];
}

export const PatentMatrix: React.FC<PatentMatrixProps> = ({
  history,
  telemetryHistory,
}) => {
  const exportCSV = () => {
    if (telemetryHistory.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "Timestamp,GroundTruth,PrimaryRaw,RedundantRaw,ActiveReading,Residual,Status,ServoAngle,RelayChannel,CurrentStep,DiagnosedFault\n";

    telemetryHistory.forEach((row) => {
      csvContent += `${row.timestamp},${row.groundTruth},${row.primaryRaw},${row.redundantRaw},${row.activeReading},${row.residual},${row.status},${row.servoAngle},${row.activeChannel},${row.currentStep},${row.diagnosedFault}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `SensorShadowX_Experimental_Data_${Date.now()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const matrixRows = [
    {
      feature: "Fault-Specific Physical Recovery Selection",
      cn114414026A: {
        status: "NO",
        remark: "Uniform hydraulic rotation regardless of fault type",
      },
      us2017184416A1: { status: "NO", remark: "Software-only substitution" },
      cn119197555A: {
        status: "NO",
        remark: "Rail proximity switch without fault diagnosis",
      },
      sensorShadowX: {
        status: "YES",
        remark:
          "Diagnosed fault (Drift vs Soiling vs Disconnect) dictates actuator or MUX action",
      },
    },
    {
      feature: "Physical Sensing Arrangement Reconfiguration",
      cn114414026A: {
        status: "YES",
        remark: "Rotates weighing sensor positions",
      },
      us2017184416A1: { status: "NO", remark: "Data source substitution only" },
      cn119197555A: {
        status: "YES",
        remark: "Transfers sensing along rail track",
      },
      sensorShadowX: {
        status: "YES",
        remark: "Servo gimbal reorientation + SPDT relay bus channel switching",
      },
    },
    {
      feature: "Stabilization & Damped Settling Period",
      cn114414026A: { status: "NO", remark: "Not expressly disclosed" },
      us2017184416A1: {
        status: "NO",
        remark: "No mechanical reconfiguration involved",
      },
      cn119197555A: { status: "NO", remark: "Not expressly disclosed" },
      sensorShadowX: {
        status: "YES",
        remark:
          "Enforces settling quarantine delay t_settle (1.5-3.0s); data marked STABILIZING",
      },
    },
    {
      feature: "Fresh Post-Reconfiguration Acquisition",
      cn114414026A: {
        status: "NO",
        remark: "Uses pre-existing hydraulic pressure testing",
      },
      us2017184416A1: { status: "NO", remark: "Not disclosed" },
      cn119197555A: { status: "NO", remark: "Not expressly disclosed" },
      sensorShadowX: {
        status: "YES",
        remark:
          "Disregards prior corrupted buffer; captures clean post-settling samples",
      },
    },
    {
      feature: "Independent Multi-Constraint Verification (V)",
      cn114414026A: {
        status: "NO",
        remark: "Simple hydraulic pressure threshold only",
      },
      us2017184416A1: {
        status: "NO",
        remark: "Software correlation rules only",
      },
      cn119197555A: { status: "NO", remark: "Not expressly disclosed" },
      sensorShadowX: {
        status: "YES",
        remark:
          "Evaluates V = f(cross, temporal, physical, stability) with safety gates",
      },
    },
    {
      feature: "Recovery-History-Driven Exclusion & Retry",
      cn114414026A: { status: "NO", remark: "Not disclosed; repeats rotation" },
      us2017184416A1: {
        status: "NO",
        remark: "No physical reconfiguration history",
      },
      cn119197555A: { status: "NO", remark: "Not disclosed" },
      sensorShadowX: {
        status: "YES",
        remark:
          "Stores failed configs in memory; strictly excludes them from future ranking",
      },
    },
    {
      feature: "Defined Safe Degraded Operation Mode",
      cn114414026A: {
        status: "NO",
        remark: "Triggers generic alarm without isolated degraded mode",
      },
      us2017184416A1: { status: "NO", remark: "Not disclosed" },
      cn119197555A: { status: "NO", remark: "Not disclosed" },
      sensorShadowX: {
        status: "YES",
        remark:
          "Isolates damaged channel; flags data UNRELIABLE to downstream analytics",
      },
    },
  ];

  return (
    <section className="font-mono flex flex-col gap-4 w-full min-w-0 pt-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Factual Prior-Art Differentiation Matrix (Patent Screening
            Benchmark)
          </span>
        </div>
        {/* <button */}
        {/*   onClick={exportCSV} */}
        {/*   className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all" */}
        {/* > */}
        {/*   <Download className="w-3.5 h-3.5" /> */}
        {/*   <span>Export Experimental CSV</span> */}
        {/* </button> */}
      </div>

      {/* <div className="text-[11px] text-slate-400"> */}
      {/*   Directly evaluates the distinguishing technical features identified in */}
      {/*   the Patentability Screening Report ( */}
      {/*   <code className="text-cyan-300">paper_text.txt</code>) against the 3 */}
      {/*   primary cited prior-art disclosures: */}
      {/* </div> */}

      {/* Feature Comparison Table */}
      <div className="overflow-x-auto max-h-[260px] scrollbar-thin">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
              <th className="pb-2 w-1/4">Novel Inventive Capability</th>
              <th className="pb-2 text-center w-1/6">
                CN114414026A
                <br />
                <span className="text-slate-500 font-normal">
                  (Weighing Sys)
                </span>
              </th>
              <th className="pb-2 text-center w-1/6">
                US2017184416A1
                <br />
                <span className="text-slate-500 font-normal">
                  (Anomaly Corr)
                </span>
              </th>
              <th className="pb-2 text-center w-1/6">
                CN119197555A
                <br />
                <span className="text-slate-500 font-normal">
                  (Rail Switch)
                </span>
              </th>
              <th className="pb-2 text-center w-1/4 bg-cyan-950/40 text-cyan-300 font-bold border-x border-cyan-800/40">
                SensorShadow-X
                <br />
                <span className="text-cyan-400/70 font-normal">
                  (Disclosed Invention)
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-[11px]">
            {matrixRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2 font-medium text-slate-200">
                  {row.feature}
                </td>

                <td className="py-2 text-center">
                  {row.cn114414026A.status === "YES" ? (
                    <span className="inline-flex items-center text-emerald-400 font-bold gap-0.5">
                      <Check className="w-3.5 h-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-rose-400/80 gap-0.5">
                      <X className="w-3.5 h-3.5" /> No
                    </span>
                  )}
                  <span className="block text-[9px] text-slate-500 mt-0.5">
                    {row.cn114414026A.remark}
                  </span>
                </td>

                <td className="py-2 text-center">
                  {row.us2017184416A1.status === "YES" ? (
                    <span className="inline-flex items-center text-emerald-400 font-bold gap-0.5">
                      <Check className="w-3.5 h-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-rose-400/80 gap-0.5">
                      <X className="w-3.5 h-3.5" /> No
                    </span>
                  )}
                  <span className="block text-[9px] text-slate-500 mt-0.5">
                    {row.us2017184416A1.remark}
                  </span>
                </td>

                <td className="py-2 text-center">
                  {row.cn119197555A.status === "YES" ? (
                    <span className="inline-flex items-center text-emerald-400 font-bold gap-0.5">
                      <Check className="w-3.5 h-3.5" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-rose-400/80 gap-0.5">
                      <X className="w-3.5 h-3.5" /> No
                    </span>
                  )}
                  <span className="block text-[9px] text-slate-500 mt-0.5">
                    {row.cn119197555A.remark}
                  </span>
                </td>

                <td className="py-2 text-center bg-cyan-950/20 border-x border-cyan-800/30">
                  <span className="inline-flex items-center text-cyan-300 font-bold gap-1">
                    <Check className="w-4 h-4 text-cyan-400" /> Fully
                    Implemented
                  </span>
                  <span className="block text-[9px] text-cyan-200/80 mt-0.5 px-1 font-sans">
                    {row.sensorShadowX.remark}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
