// SensorShadow-X: Explicit Data Types and 17-Step IDF State Definitions

export enum IDFStep {
  STEP_1_DEPLOYMENT = 1,
  STEP_2_ACQUISITION = 2,
  STEP_3_PREPROCESSING = 3,
  STEP_4_TRANSMISSION = 4,
  STEP_5_RELIABILITY_ASSESSMENT = 5,
  STEP_6_FAULT_DETECTION = 6,
  STEP_7_FAULT_DIAGNOSIS = 7,
  STEP_8_CANDIDATE_GENERATION = 8,
  STEP_9_CANDIDATE_RANKING = 9,
  STEP_10_PHYSICAL_RECONFIGURATION = 10,
  STEP_11_STABILIZATION = 11,
  STEP_12_FRESH_ACQUISITION = 12,
  STEP_13_INDEPENDENT_VERIFICATION = 13,
  STEP_14_ACCEPT_REJECT_DECISION = 14,
  STEP_15_ALTERNATIVE_RECOVERY = 15,
  STEP_16_HISTORY_UPDATE = 16,
  STEP_17_SAFE_DEGRADED_MODE = 17,
}

export interface IDFStepDetail {
  number: IDFStep;
  name: string;
  shortName: string;
  phase: 'INGEST' | 'ASSESS' | 'ACTUATE' | 'VERIFY' | 'SETTLE';
  description: string;
  inputDescription: string;
  operationDescription: string;
  outputDescription: string;
}

export enum FaultCategory {
  NONE = 'NONE',
  DRIFT = 'DRIFT',
  OBSTRUCTION_SOILING = 'OBSTRUCTION_SOILING',
  ABNORMAL_ORIENTATION = 'ABNORMAL_ORIENTATION',
  DISCONNECTION = 'DISCONNECTION',
  DEGRADED_ELEMENT = 'DEGRADED_ELEMENT',
}

export enum IndianScenarioType {
  DELHI_AQI = 'DELHI_AQI',
  BHADLA_SOLAR = 'BHADLA_SOLAR',
  PUNJAB_AGRICULTURE = 'PUNJAB_AGRICULTURE',
}

export interface ScenarioMetadata {
  id: IndianScenarioType;
  name: string;
  location: string;
  primaryParameter: string;
  unit: string;
  typicalRange: [number, number];
  primarySensorName: string;
  redundantSensorName: string;
  environmentalChallenge: string;
  cpcbStandardOrNorm?: string;
  temperatureRange: [number, number]; // Celsius
  humidityRange: [number, number];    // %
}

export enum RecoveryActionType {
  SERVO_REORIENT_SHIELDED_PORT = 'SERVO_REORIENT_SHIELDED_PORT',
  SERVO_TILT_SOLAR_SHADE = 'SERVO_TILT_SOLAR_SHADE',
  SERVO_REALIGN_AZIMUTH = 'SERVO_REALIGN_AZIMUTH',
  MUX_SWITCH_REDUNDANT_PROBE = 'MUX_SWITCH_REDUNDANT_PROBE',
  CIRCUIT_IMPEDANCE_RESET = 'CIRCUIT_IMPEDANCE_RESET',
  ISOLATE_CHANNEL_DEGRADED = 'ISOLATE_CHANNEL_DEGRADED',
}

export interface RecoveryCandidate {
  id: string;
  actionType: RecoveryActionType;
  description: string;
  physicalTarget: 'SERVO_GIMBAL' | 'MUX_RELAY' | 'ANALOG_FRONTEND';
  targetServoAngle: number; // degrees (0, 45, 90, 180)
  targetRelayChannel: 1 | 2; // Channel 1 = Primary, Channel 2 = Redundant
  estimatedEnergyCost: number; // mJ
  historicalReliability: number; // 0 to 1
}

export type RecoveryOutcome = 'SUCCESS' | 'REJECTED_FAILED' | 'INCONCLUSIVE';

export interface RecoveryHistoryRecord {
  id: string;
  timestamp: number;
  scenario: IndianScenarioType;
  faultCategory: FaultCategory;
  sensorId: string;
  configId: string;
  actionType: RecoveryActionType;
  physicalConfigSummary: string;
  freshReadingsSample: number[];
  verificationScore: number;
  outcome: RecoveryOutcome;
  notes: string;
}

export interface VerificationMetrics {
  crossSensorConsistency: number; // C_cross (0 - 1)
  temporalConsistency: number;    // C_temporal (0 - 1)
  physicalPlausibility: number;   // C_phys (0 - 1)
  measurementStability: number;   // C_stability (0 - 1)
  weights: {
    cross: number;
    temporal: number;
    physical: number;
    stability: number;
  };
  totalV: number;
  threshold: number;
  passed: boolean;
  hardGateViolated: boolean;
  hardGateReason?: string;
}

export interface SensorTelemetry {
  timestamp: number;
  groundTruth: number;
  primaryRaw: number;
  primaryPreprocessed: number;
  redundantRaw: number;
  activeReading: number;
  residual: number;
  status: 'NORMAL' | 'ANOMALOUS' | 'RECONFIGURING' | 'STABILIZING' | 'VERIFYING' | 'ACCEPTED' | 'REJECTED' | 'SAFE_DEGRADED';
  activeChannel: 1 | 2;
  servoAngle: number;
  isStabilizing: boolean;
  isSafeDegraded: boolean;
  currentStep: IDFStep;
  activeFault: FaultCategory;
  diagnosedFault: FaultCategory;
  verificationScore?: number;
}

export interface PhysicalHardwareState {
  servoAngle: number;           // Target angle in degrees
  actualServoAngle: number;     // Physical continuous angle tracking
  relayChannel: 1 | 2;          // 1 = Primary, 2 = Redundant
  intakePortStatus: 'EXPOSED_DUST' | 'SHIELDED_BAFFLE' | 'GROUND_PORT';
  vibrationIntensity: number;   // Damped vibration during stabilization (0 to 1)
  cableIntegrity: number;       // 1.0 = healthy, 0.0 = severed
  enclosureTemp: number;        // °C
}

// Technician Field Intervention Dispatch Work Order (Unrecoverable Hardware Faults)
export interface TechnicianWorkOrder {
  ticketId: string;
  timestamp: number;
  scenario: IndianScenarioType;
  stationName: string;
  location: string;
  severity: 'CRITICAL_DISPATCH' | 'HIGH_PRIORITY' | 'SCHEDULED_MAINTENANCE';
  faultCategory: FaultCategory;
  rootCauseAnalysis: string;
  attemptedReconfigurations: {
    candidateId: string;
    action: string;
    outcome: string;
    verificationScore: number;
  }[];
  systemState: string;
  recommendedActions: string[];
  status: 'PENDING_DISPATCH' | 'CREW_EN_ROUTE' | 'RESOLVED_HEALTHY';
  acknowledged: boolean;
}
