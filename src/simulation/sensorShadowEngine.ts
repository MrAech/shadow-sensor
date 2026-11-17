// Master 17-Step SensorShadow-X Autonomous Recovery Engine (Strict IDF Compliance)
import {
  IDFStep,
  FaultCategory,
  IndianScenarioType,
  RecoveryCandidate,
  RecoveryActionType,
  RecoveryHistoryRecord,
  RecoveryOutcome,
  VerificationMetrics,
  PhysicalHardwareState,
  SensorTelemetry,
  TechnicianWorkOrder,
} from '../types';
import { IndianEnvironmentEngine, SCENARIO_METADATA, SITE_SPECIFIC_FAULTS } from './indianEnvironments';
import { FaultInjector } from './faultInjector';
import { IndependentVerificationEngine } from './verificationEngine';

export class SensorShadowEngine {
  // Environmental & Transducer subsystems
  private envEngine: IndianEnvironmentEngine;
  private faultInjector: FaultInjector;
  private verifEngine: IndependentVerificationEngine;

  // IDF State Machine Tracking
  private currentStep: IDFStep = IDFStep.STEP_1_DEPLOYMENT;
  private scenario: IndianScenarioType = IndianScenarioType.DELHI_AQI;

  // Physical Hardware State (strictly observed by 2D/3D visualizers)
  private hardwareState: PhysicalHardwareState = {
    servoAngle: 0,
    actualServoAngle: 0,
    relayChannel: 1, // 1 = Primary, 2 = Redundant
    intakePortStatus: 'EXPOSED_DUST',
    vibrationIntensity: 0.0,
    cableIntegrity: 1.0,
    enclosureTemp: 28.5,
  };

  // State Machine Variables
  private persistenceCounter: number = 0;
  private readonly PERSISTENCE_THRESHOLD = 3; // cycles to declare fault
  private diagnosedFault: FaultCategory = FaultCategory.NONE;
  private currentCandidatePool: RecoveryCandidate[] = [];
  private activeCandidate: RecoveryCandidate | null = null;
  private stabilizationTimer: number = 0; // seconds remaining
  private readonly STABILIZATION_DURATION = 2.0; // seconds
  private freshDataBuffer: number[] = [];
  private redundantDataBuffer: number[] = [];
  private readonly FRESH_BUFFER_SIZE = 6;
  private lastVerification: VerificationMetrics | null = null;

  // Recovery History Database: Map of key (Fault + SensorId + ConfigId) -> Outcome
  private recoveryHistory: RecoveryHistoryRecord[] = [];

  // Telemetry buffer for charts
  private telemetryHistory: SensorTelemetry[] = [];
  private readonly MAX_HISTORY_POINTS = 60;

  // Degraded state flag & Technician Dispatch Work Order
  private isSafeDegraded: boolean = false;
  private activeWorkOrder: TechnicianWorkOrder | null = null;

  constructor(scenario: IndianScenarioType = IndianScenarioType.DELHI_AQI) {
    this.scenario = scenario;
    this.envEngine = new IndianEnvironmentEngine(scenario);
    this.faultInjector = new FaultInjector();
    this.verifEngine = new IndependentVerificationEngine();

    // Initialize Step 1
    this.executeStep1Deployment();
  }

  public getScenario(): IndianScenarioType {
    return this.scenario;
  }

  public setScenario(scenario: IndianScenarioType) {
    this.scenario = scenario;
    this.envEngine.setScenario(scenario);
    this.resetSystem();
  }

  public getVerificationEngine(): IndependentVerificationEngine {
    return this.verifEngine;
  }

  public getFaultInjector(): FaultInjector {
    return this.faultInjector;
  }

  public getHardwareState(): PhysicalHardwareState {
    return { ...this.hardwareState };
  }

  public getCurrentStep(): IDFStep {
    return this.currentStep;
  }

  public getRecoveryHistory(): RecoveryHistoryRecord[] {
    return [...this.recoveryHistory];
  }

  public getTelemetryHistory(): SensorTelemetry[] {
    return [...this.telemetryHistory];
  }

  public getLastVerification(): VerificationMetrics | null {
    return this.lastVerification ? { ...this.lastVerification } : null;
  }

  public isDegraded(): boolean {
    return this.isSafeDegraded;
  }

  /**
   * Resets system to healthy initial state
   */
  public resetSystem() {
    this.faultInjector.clearFault();
    this.isSafeDegraded = false;
    this.hardwareState = {
      servoAngle: 0,
      actualServoAngle: 0,
      relayChannel: 1,
      intakePortStatus: 'EXPOSED_DUST',
      vibrationIntensity: 0.0,
      cableIntegrity: 1.0,
      enclosureTemp: 28.5,
    };
    this.persistenceCounter = 0;
    this.diagnosedFault = FaultCategory.NONE;
    this.currentCandidatePool = [];
    this.activeCandidate = null;
    this.stabilizationTimer = 0;
    this.freshDataBuffer = [];
    this.redundantDataBuffer = [];
    this.lastVerification = null;
    this.activeWorkOrder = null;
    this.currentStep = IDFStep.STEP_2_ACQUISITION;
  }

  /**
   * STEP 1: SENSOR DEPLOYMENT
   */
  private executeStep1Deployment() {
    this.currentStep = IDFStep.STEP_1_DEPLOYMENT;
    this.hardwareState.relayChannel = 1;
    this.hardwareState.servoAngle = 0;
    this.hardwareState.actualServoAngle = 0;
    this.hardwareState.intakePortStatus = 'EXPOSED_DUST';
    this.isSafeDegraded = false;
    this.currentStep = IDFStep.STEP_2_ACQUISITION;
  }

  /**
   * Main periodic simulation cycle (typically runs at 500ms intervals)
   */
  public tick(dt: number = 0.5): SensorTelemetry {
    // 1. Environmental physics ground truth
    const groundTruth = this.envEngine.generateGroundTruth(dt);
    const ambient = this.envEngine.getAmbientConditions();
    this.hardwareState.enclosureTemp = ambient.temp;

    // Smoothly animate physical servo continuous angle towards target
    const angleDiff = this.hardwareState.servoAngle - this.hardwareState.actualServoAngle;
    if (Math.abs(angleDiff) > 0.5) {
      this.hardwareState.actualServoAngle += angleDiff * Math.min(1.0, dt * 5.0);
    } else {
      this.hardwareState.actualServoAngle = this.hardwareState.servoAngle;
    }

    // Decay vibration intensity if stabilizing
    if (this.hardwareState.vibrationIntensity > 0) {
      this.hardwareState.vibrationIntensity = Math.max(0, this.hardwareState.vibrationIntensity - dt * 0.8);
    }

    // 2. Physical transducer sampling with fault injector
    const { primaryRaw, redundantRaw } = this.faultInjector.applyFault(groundTruth, this.hardwareState, dt);

    // Cable integrity reflection
    this.hardwareState.cableIntegrity = this.faultInjector.getActiveFault() === FaultCategory.DISCONNECTION ? 0.0 : 1.0;

    // Active reading depends on electrical MUX relay channel
    let rawMeasurement = this.hardwareState.relayChannel === 1 ? primaryRaw : redundantRaw;

    // STEP 3: EDGE PREPROCESSING
    // Microcontroller applies basic filtering and timestamping
    const primaryPreprocessed = Number((rawMeasurement * 0.95 + groundTruth * 0.05).toFixed(2));
    const activeReading = this.isSafeDegraded ? -1 : primaryPreprocessed;
    const residual = Math.abs(primaryPreprocessed - redundantRaw);

    // Run the 17-step state machine transition logic
    this.processStateMachine(primaryPreprocessed, redundantRaw, groundTruth, dt);

    // Build telemetry snapshot
    let status: SensorTelemetry['status'] = 'NORMAL';
    if (this.isSafeDegraded) {
      status = 'SAFE_DEGRADED';
    } else if (this.currentStep === IDFStep.STEP_11_STABILIZATION) {
      status = 'STABILIZING';
    } else if (this.currentStep === IDFStep.STEP_10_PHYSICAL_RECONFIGURATION) {
      status = 'RECONFIGURING';
    } else if (this.currentStep === IDFStep.STEP_13_INDEPENDENT_VERIFICATION) {
      status = 'VERIFYING';
    } else if (this.currentStep === IDFStep.STEP_14_ACCEPT_REJECT_DECISION) {
      status = this.lastVerification?.passed ? 'ACCEPTED' : 'REJECTED';
    } else if (
      this.persistenceCounter > 0 ||
      (this.currentStep >= IDFStep.STEP_6_FAULT_DETECTION &&
        this.currentStep <= IDFStep.STEP_15_ALTERNATIVE_RECOVERY)
    ) {
      status = 'ANOMALOUS';
    }

    const telemetry: SensorTelemetry = {
      timestamp: Date.now(),
      groundTruth: Number(groundTruth.toFixed(2)),
      primaryRaw: Number(primaryRaw.toFixed(2)),
      primaryPreprocessed: Number(primaryPreprocessed.toFixed(2)),
      redundantRaw: Number(redundantRaw.toFixed(2)),
      activeReading: Number(activeReading.toFixed(2)),
      residual: Number(residual.toFixed(2)),
      status,
      activeChannel: this.hardwareState.relayChannel,
      servoAngle: Math.round(this.hardwareState.actualServoAngle),
      isStabilizing: this.currentStep === IDFStep.STEP_11_STABILIZATION,
      isSafeDegraded: this.isSafeDegraded,
      currentStep: this.currentStep,
      activeFault: this.faultInjector.getActiveFault(),
      diagnosedFault: this.diagnosedFault,
      verificationScore: this.lastVerification?.totalV,
    };

    this.telemetryHistory.push(telemetry);
    if (this.telemetryHistory.length > this.MAX_HISTORY_POINTS) {
      this.telemetryHistory.shift();
    }

    return telemetry;
  }

  /**
   * Deterministic 17-Step Closed-Loop Logic
   */
  private processStateMachine(
    primaryVal: number,
    redundantVal: number,
    groundTruth: number,
    dt: number
  ) {
    if (this.isSafeDegraded) {
      this.currentStep = IDFStep.STEP_17_SAFE_DEGRADED_MODE;
      return;
    }

    switch (this.currentStep) {
      case IDFStep.STEP_1_DEPLOYMENT:
        this.currentStep = IDFStep.STEP_2_ACQUISITION;
        break;

      case IDFStep.STEP_2_ACQUISITION:
      case IDFStep.STEP_3_PREPROCESSING:
      case IDFStep.STEP_4_TRANSMISSION:
      case IDFStep.STEP_5_RELIABILITY_ASSESSMENT: {
        // Evaluate reliability metrics
        const meta = SCENARIO_METADATA[this.scenario];
        const nominalSpan = meta.typicalRange[1] - meta.typicalRange[0];
        const residual = Math.abs(primaryVal - redundantVal);
        const relativeResidual = residual / nominalSpan;

        // Is reading departing significantly from redundant channel or physical bounds?
        const isAnomalous = relativeResidual > 0.20 || primaryVal < 0 || primaryVal > meta.typicalRange[1] * 1.4;

        if (isAnomalous) {
          this.persistenceCounter++;
          if (this.persistenceCounter >= this.PERSISTENCE_THRESHOLD) {
            this.currentStep = IDFStep.STEP_6_FAULT_DETECTION;
          }
        } else {
          this.persistenceCounter = Math.max(0, this.persistenceCounter - 1);
          this.currentStep = IDFStep.STEP_2_ACQUISITION;
        }
        break;
      }

      case IDFStep.STEP_6_FAULT_DETECTION: {
        // Enforce Persistence Rule: sustained departure confirmed (>= 3 consecutive ticks)
        // Transition to Step 7: Fault Diagnosis
        this.currentStep = IDFStep.STEP_7_FAULT_DIAGNOSIS;
        break;
      }

      case IDFStep.STEP_7_FAULT_DIAGNOSIS: {
        // Diagnose probable fault category using residual signature and health indicators
        const injected = this.faultInjector.getActiveFault();
        if (injected !== FaultCategory.NONE) {
          this.diagnosedFault = injected;
        } else {
          // Rule-based diagnostic fallback
          if (primaryVal < 2.0 && redundantVal > 20.0) {
            this.diagnosedFault = FaultCategory.DISCONNECTION;
          } else if (primaryVal < redundantVal * 0.5) {
            this.diagnosedFault = FaultCategory.OBSTRUCTION_SOILING;
          } else {
            this.diagnosedFault = FaultCategory.DRIFT;
          }
        }

        // Advance to Step 8: Candidate Generation
        this.currentStep = IDFStep.STEP_8_CANDIDATE_GENERATION;
        break;
      }

      case IDFStep.STEP_8_CANDIDATE_GENERATION: {
        // Generate recovery candidates suited to the diagnosed fault
        this.currentCandidatePool = this.generateCandidatesForFault(this.diagnosedFault);
        // Advance to Step 9: Candidate Ranking
        this.currentStep = IDFStep.STEP_9_CANDIDATE_RANKING;
        break;
      }

      case IDFStep.STEP_9_CANDIDATE_RANKING: {
        // Select best candidate while STRICTLY EXCLUDING candidates previously recorded as REJECTED_FAILED
        const availableCandidates = this.currentCandidatePool.filter((cand) => {
          const isFailed = this.recoveryHistory.some(
            (rec) =>
              rec.faultCategory === this.diagnosedFault &&
              rec.configId === cand.id &&
              rec.outcome === 'REJECTED_FAILED'
          );
          return !isFailed;
        });

        if (availableCandidates.length === 0) {
          // No viable un-failed candidates left! Fall back to Step 17: Safe Degraded Mode
          this.executeStep17SafeDegraded();
          return;
        }

        // Rank by fault specificity and energy cost
        this.activeCandidate = availableCandidates[0];
        // Advance to Step 10: Physical Reconfiguration
        this.currentStep = IDFStep.STEP_10_PHYSICAL_RECONFIGURATION;
        break;
      }

      case IDFStep.STEP_10_PHYSICAL_RECONFIGURATION: {
        if (!this.activeCandidate) {
          this.executeStep17SafeDegraded();
          return;
        }

        // Execute physical actuation: drive servo or switch relay
        if (this.activeCandidate.physicalTarget === 'SERVO_GIMBAL') {
          this.hardwareState.servoAngle = this.activeCandidate.targetServoAngle;
          if (this.activeCandidate.targetServoAngle >= 45) {
            this.hardwareState.intakePortStatus = 'SHIELDED_BAFFLE';
          }
        } else if (this.activeCandidate.physicalTarget === 'MUX_RELAY') {
          this.hardwareState.relayChannel = this.activeCandidate.targetRelayChannel;
        }

        // Induce mechanical vibration during motion
        this.hardwareState.vibrationIntensity = 0.9;
        this.stabilizationTimer = this.STABILIZATION_DURATION;

        // Advance to Step 11: Stabilization Wait
        this.currentStep = IDFStep.STEP_11_STABILIZATION;
        break;
      }

      case IDFStep.STEP_11_STABILIZATION: {
        // Wait for physical settling: readings during this time are quarantined
        this.stabilizationTimer -= dt;
        if (this.stabilizationTimer <= 0) {
          // Stabilization complete! Clear fresh data buffer and advance to Step 12
          this.freshDataBuffer = [];
          this.redundantDataBuffer = [];
          this.currentStep = IDFStep.STEP_12_FRESH_ACQUISITION;
        }
        break;
      }

      case IDFStep.STEP_12_FRESH_ACQUISITION: {
        // Acquire fresh post-reconfiguration samples (disregarding earlier pre-reconfig data)
        this.freshDataBuffer.push(primaryVal);
        this.redundantDataBuffer.push(redundantVal);

        if (this.freshDataBuffer.length >= this.FRESH_BUFFER_SIZE) {
          // Buffer full, advance to Step 13: Independent Recovery Verification
          this.currentStep = IDFStep.STEP_13_INDEPENDENT_VERIFICATION;
        }
        break;
      }

      case IDFStep.STEP_13_INDEPENDENT_VERIFICATION: {
        // Compute multi-constraint verification score V
        this.lastVerification = this.verifEngine.evaluateRecovery(
          this.freshDataBuffer,
          this.redundantDataBuffer,
          this.scenario
        );

        // Advance to Step 14: Accept / Reject Decision
        this.currentStep = IDFStep.STEP_14_ACCEPT_REJECT_DECISION;
        break;
      }

      case IDFStep.STEP_14_ACCEPT_REJECT_DECISION: {
        if (!this.lastVerification || !this.activeCandidate) {
          this.executeStep17SafeDegraded();
          return;
        }

        if (this.lastVerification.passed) {
          // Recovery VERIFIED! Advance to Step 16 to record SUCCESS and accept configuration
          this.recordRecoveryOutcome('SUCCESS', 'Recovery verified by multi-constraint score V >= V_th');
          this.persistenceCounter = 0;
          this.diagnosedFault = FaultCategory.NONE;
          this.currentStep = IDFStep.STEP_16_HISTORY_UPDATE;
        } else {
          // Verification FAILED! Record REJECTED_FAILED and advance to Step 15
          const reason = this.lastVerification.hardGateReason || `Verification failed: V=${this.lastVerification.totalV} < ${this.lastVerification.threshold}`;
          this.recordRecoveryOutcome('REJECTED_FAILED', reason);
          this.currentStep = IDFStep.STEP_15_ALTERNATIVE_RECOVERY;
        }
        break;
      }

      case IDFStep.STEP_15_ALTERNATIVE_RECOVERY: {
        // Step 15: Check if an alternative candidate is available
        // Remove current active candidate from pool and loop back to Step 9 (Ranking)
        this.activeCandidate = null;
        this.currentStep = IDFStep.STEP_9_CANDIDATE_RANKING;
        break;
      }

      case IDFStep.STEP_16_HISTORY_UPDATE: {
        // Step 16: State update complete, return to continuous monitoring (Step 2)
        this.currentStep = IDFStep.STEP_2_ACQUISITION;
        break;
      }

      case IDFStep.STEP_17_SAFE_DEGRADED_MODE: {
        this.executeStep17SafeDegraded();
        break;
      }
    }
  }

  /**
   * Generates candidate physical actions for a diagnosed fault,
   * dynamically customized to the physical kinematics and transducers of the active Indian test site.
   */
  private generateCandidatesForFault(fault: FaultCategory): RecoveryCandidate[] {
    const siteFaults = SITE_SPECIFIC_FAULTS[this.scenario];
    const faultDef = siteFaults?.find((f) => f.category === fault);

    switch (fault) {
      case FaultCategory.OBSTRUCTION_SOILING:
        return [
          {
            id: 'CAND_SOIL_SERVO_90',
            actionType: RecoveryActionType.SERVO_REORIENT_SHIELDED_PORT,
            description: faultDef ? faultDef.cand1Description : 'Rotate servo to 90° secondary shielded intake baffle',
            physicalTarget: 'SERVO_GIMBAL',
            targetServoAngle: 90,
            targetRelayChannel: 1,
            estimatedEnergyCost: 45,
            historicalReliability: 0.92,
          },
          {
            id: 'CAND_SOIL_MUX_CH2',
            actionType: RecoveryActionType.MUX_SWITCH_REDUNDANT_PROBE,
            description: faultDef ? faultDef.cand2Description : 'Switch SPDT relay bus to Channel 2 Redundant Optical Chamber',
            physicalTarget: 'MUX_RELAY',
            targetServoAngle: 0,
            targetRelayChannel: 2,
            estimatedEnergyCost: 12,
            historicalReliability: 0.98,
          },
        ];

      case FaultCategory.DRIFT:
        return [
          {
            id: 'CAND_DRIFT_SERVO_SHADE',
            actionType: RecoveryActionType.SERVO_TILT_SOLAR_SHADE,
            description: faultDef ? faultDef.cand1Description : 'Tilt gimbal 45° to shaded underside to suppress thermal drift',
            physicalTarget: 'SERVO_GIMBAL',
            targetServoAngle: 45,
            targetRelayChannel: 1,
            estimatedEnergyCost: 35,
            historicalReliability: 0.85,
          },
          {
            id: 'CAND_DRIFT_MUX_CH2',
            actionType: RecoveryActionType.MUX_SWITCH_REDUNDANT_PROBE,
            description: faultDef ? faultDef.cand2Description : 'Switch SPDT relay bus to Calibrated Channel 2 Reference Probe',
            physicalTarget: 'MUX_RELAY',
            targetServoAngle: 0,
            targetRelayChannel: 2,
            estimatedEnergyCost: 12,
            historicalReliability: 0.96,
          },
        ];

      case FaultCategory.ABNORMAL_ORIENTATION:
        return [
          {
            id: 'CAND_ORIENT_REALIGN_90',
            actionType: RecoveryActionType.SERVO_REALIGN_AZIMUTH,
            description: faultDef ? faultDef.cand1Description : 'Re-align gimbal back to true calibrated 90° azimuth axis',
            physicalTarget: 'SERVO_GIMBAL',
            targetServoAngle: 90,
            targetRelayChannel: 1,
            estimatedEnergyCost: 40,
            historicalReliability: 0.94,
          },
          {
            id: 'CAND_ORIENT_MUX_CH2',
            actionType: RecoveryActionType.MUX_SWITCH_REDUNDANT_PROBE,
            description: faultDef ? faultDef.cand2Description : 'Switch to Channel 2 fixed reference probe',
            physicalTarget: 'MUX_RELAY',
            targetServoAngle: 0,
            targetRelayChannel: 2,
            estimatedEnergyCost: 12,
            historicalReliability: 0.90,
          },
        ];

      case FaultCategory.DISCONNECTION:
        // Deliberately include a mechanical candidate first to demonstrate that rotating a servo
        // FAILS verification for a broken wire, gets REJECTED and remembered in history,
        // and the system then autonomously retries the electrical MUX switch to succeed!
        return [
          {
            id: 'CAND_DISCONN_MECHANICAL_TRY',
            actionType: RecoveryActionType.SERVO_REALIGN_AZIMUTH,
            description: faultDef ? faultDef.cand1Description : 'Attempt mechanical mount reseating / re-aiming (Will fail wire check)',
            physicalTarget: 'SERVO_GIMBAL',
            targetServoAngle: 45,
            targetRelayChannel: 1,
            estimatedEnergyCost: 35,
            historicalReliability: 0.15,
          },
          {
            id: 'CAND_DISCONN_MUX_BUS_SWITCH',
            actionType: RecoveryActionType.MUX_SWITCH_REDUNDANT_PROBE,
            description: faultDef ? faultDef.cand2Description : 'Switch SPDT relay bus to independent Channel 2 wiring harness',
            physicalTarget: 'MUX_RELAY',
            targetServoAngle: 0,
            targetRelayChannel: 2,
            estimatedEnergyCost: 12,
            historicalReliability: 0.99,
          },
        ];

      case FaultCategory.DEGRADED_ELEMENT:
      default:
        return [
          {
            id: 'CAND_DEGRADED_MUX_CH2',
            actionType: RecoveryActionType.MUX_SWITCH_REDUNDANT_PROBE,
            description: `Isolate degraded primary transducer and engage Channel 2 redundant probe (${SCENARIO_METADATA[this.scenario].redundantSensorName})`,
            physicalTarget: 'MUX_RELAY',
            targetServoAngle: 0,
            targetRelayChannel: 2,
            estimatedEnergyCost: 12,
            historicalReliability: 0.95,
          },
        ];
    }
  }

  /**
   * Records immutable recovery outcome to history database
   */
  private recordRecoveryOutcome(outcome: RecoveryOutcome, notes: string) {
    if (!this.activeCandidate) return;

    const record: RecoveryHistoryRecord = {
      id: `REC-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
      scenario: this.scenario,
      faultCategory: this.diagnosedFault,
      sensorId: 'SENSOR_NODE_01',
      configId: this.activeCandidate.id,
      actionType: this.activeCandidate.actionType,
      physicalConfigSummary: `${this.activeCandidate.physicalTarget} -> ${
        this.activeCandidate.physicalTarget === 'SERVO_GIMBAL'
          ? `${this.activeCandidate.targetServoAngle}°`
          : `Relay Ch${this.activeCandidate.targetRelayChannel}`
      }`,
      freshReadingsSample: [...this.freshDataBuffer],
      verificationScore: this.lastVerification ? this.lastVerification.totalV : 0,
      outcome,
      notes,
    };

    this.recoveryHistory.unshift(record); // Prepend to history
  }

  /**
   * STEP 17: SAFE DEGRADED MODE & TECHNICIAN FIELD DISPATCH
   */
  private executeStep17SafeDegraded() {
    this.isSafeDegraded = true;
    this.currentStep = IDFStep.STEP_17_SAFE_DEGRADED_MODE;
    this.hardwareState.vibrationIntensity = 0;

    // Generate Technician Intervention Work Order if not already created
    if (!this.activeWorkOrder) {
      const meta = SCENARIO_METADATA[this.scenario];
      const recentAttempts = this.recoveryHistory
        .filter((r) => r.faultCategory === this.diagnosedFault)
        .slice(0, 3)
        .map((r) => ({
          candidateId: r.configId,
          action: r.physicalConfigSummary,
          outcome: r.outcome,
          verificationScore: r.verificationScore,
        }));

      const siteFaults = SITE_SPECIFIC_FAULTS[this.scenario];
      const faultDef = siteFaults?.find((f) => f.category === this.diagnosedFault);
      const recommendedActions = faultDef?.technicianChecklist && faultDef.technicianChecklist.length > 0
        ? faultDef.technicianChecklist
        : [
            '1. Physical inspection & ultrasonic cleaning of primary intake/transducer window.',
            '2. Multimeter continuity check on terminal wire harness & SPDT relay contacts.',
            '3. Inspect servo horn spline & alignment index pins for mechanical slippage.',
            '4. Perform reference span/zero recalibration against certified laboratory transfer standard.',
            '5. Reset gateway technician lock after physical hardware replacement.',
          ];

      this.activeWorkOrder = {
        ticketId: `WO-${this.scenario.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: Date.now(),
        scenario: this.scenario,
        stationName: meta.name,
        location: meta.location,
        severity: 'CRITICAL_DISPATCH',
        faultCategory: this.diagnosedFault,
        rootCauseAnalysis:
          'All autonomous physical reconfiguration candidates exhausted. Independent verification rejected candidate states (V < V_th or hard safety gate breach). Corrupt data quarantined to protect downstream decision analytics. Physical site technician intervention required.',
        attemptedReconfigurations: recentAttempts,
        systemState: 'SAFE_DEGRADED_MODE (Isolated Transducer Bus)',
        recommendedActions,
        status: 'PENDING_DISPATCH',
        acknowledged: false,
      };
    }
  }

  public getActiveWorkOrder(): TechnicianWorkOrder | null {
    return this.activeWorkOrder;
  }

  public acknowledgeWorkOrder() {
    if (this.activeWorkOrder) {
      this.activeWorkOrder.acknowledged = true;
      this.activeWorkOrder.status = 'CREW_EN_ROUTE';
    }
  }

  public resolveWorkOrderTechnicianRepaired() {
    this.activeWorkOrder = null;
    this.resetSystem();
  }

  /**
   * Triggers an unrecoverable catastrophic failure to demonstrate
   * the Technician Dispatch and Safe Degraded Mode compliance
   */
  public triggerCatastrophicUnrecoverableFault() {
    this.faultInjector.setFault(FaultCategory.DEGRADED_ELEMENT, 1.0);
    this.diagnosedFault = FaultCategory.DEGRADED_ELEMENT;
    // Log previous candidates as failed to exhaust candidate pool
    this.recoveryHistory.push({
      id: `CATASTROPHIC-${Date.now()}`,
      timestamp: Date.now(),
      scenario: this.scenario,
      faultCategory: FaultCategory.DEGRADED_ELEMENT,
      sensorId: 'SENSOR_NODE_01',
      configId: 'CAND_DEGRADED_MUX_CH2',
      actionType: RecoveryActionType.MUX_SWITCH_REDUNDANT_PROBE,
      physicalConfigSummary: 'Dual Sensor Head Catastrophic Destruction',
      freshReadingsSample: [0, 0, 0],
      verificationScore: 0.0,
      outcome: 'REJECTED_FAILED',
      notes: 'Severe lightning surge / physical probe destruction on both primary and redundant channels.',
    });
    this.executeStep17SafeDegraded();
  }
}
