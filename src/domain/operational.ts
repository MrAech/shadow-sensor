import { RecoveryHistoryRecord, SensorTelemetry, TechnicianWorkOrder } from '../types';

export type AlarmLifecycle = 'ACTIVE' | 'ACKNOWLEDGED' | 'UNDER_INVESTIGATION' | 'CLEARED';

export interface OperatorActivity {
  id: string;
  timestamp: number;
  action: 'ALARM_ACKNOWLEDGED' | 'WORK_ORDER_DISPATCHED' | 'SIMULATED_REPAIR_COMPLETED';
  description: string;
}

export interface AuditEvidenceEvent {
  id: string;
  timestamp: number;
  category: 'RECOVERY' | 'TELEMETRY' | 'WORK_ORDER' | 'OPERATOR';
  title: string;
  status: string;
  source: string;
  routine?: boolean;
  detail: RecoveryHistoryRecord | SensorTelemetry | TechnicianWorkOrder | OperatorActivity;
}

export const buildAuditEvidence = (
  history: RecoveryHistoryRecord[],
  telemetry: SensorTelemetry[],
  workOrder: TechnicianWorkOrder | null,
  activities: OperatorActivity[],
): AuditEvidenceEvent[] => {
  const recoveryEvents = history.map((record): AuditEvidenceEvent => ({
    id: record.id,
    timestamp: record.timestamp,
    category: 'RECOVERY',
    title: `${record.faultCategory} recovery attempt`,
    status: record.outcome,
    source: record.sensorId,
    detail: record,
  }));

  const telemetryEvents = telemetry.map((sample, index, samples): AuditEvidenceEvent => {
    const previous = samples[index - 1];
    const routine = Boolean(
      previous &&
      previous.status === sample.status &&
      previous.currentStep === sample.currentStep,
    );
    return {
      id: `telemetry-${sample.timestamp}-${index}`,
      timestamp: sample.timestamp,
      category: 'TELEMETRY',
      routine,
      title: routine
        ? `Routine telemetry sample at IDF ${sample.currentStep}/17`
        : telemetryMilestoneTitle(sample.status, sample.currentStep),
      status: sample.status,
      source: `Channel ${sample.activeChannel}`,
      detail: sample,
    };
  });

  const workOrderEvents = workOrder
    ? [{
        id: workOrder.ticketId,
        timestamp: workOrder.timestamp,
        category: 'WORK_ORDER' as const,
        title: `Field work order ${workOrder.ticketId}`,
        status: workOrder.status,
        source: workOrder.stationName,
        detail: workOrder,
      }]
    : [];

  const operatorEvents = activities.map((activity): AuditEvidenceEvent => ({
    id: activity.id,
    timestamp: activity.timestamp,
    category: 'OPERATOR',
    title: activity.description,
    status: 'RECORDED',
    source: 'Control room',
    detail: activity,
  }));

  return [...recoveryEvents, ...telemetryEvents, ...workOrderEvents, ...operatorEvents]
    .sort((a, b) => b.timestamp - a.timestamp);
};

const telemetryMilestoneTitle = (status: SensorTelemetry['status'], step: number): string => {
  const labels: Record<SensorTelemetry['status'], string> = {
    NORMAL: 'Station returned to normal monitoring',
    ANOMALOUS: 'Anomaly confirmed for automatic recovery',
    RECONFIGURING: 'Physical reconfiguration started',
    STABILIZING: 'Hardware settling; readings quarantined',
    VERIFYING: 'Recovery verification started',
    ACCEPTED: 'Recovery configuration accepted',
    REJECTED: 'Recovery configuration rejected',
    SAFE_DEGRADED: 'Station placed in safe degraded mode',
  };
  return `${labels[status]} (IDF ${step}/17)`;
};
