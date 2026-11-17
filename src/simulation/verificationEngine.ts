// Independent Multi-Constraint Recovery Verification Engine (IDF Step 13 & 14)
import { VerificationMetrics, IndianScenarioType } from '../types';
import { SCENARIO_METADATA } from './indianEnvironments';

export class IndependentVerificationEngine {
  private weights = {
    cross: 0.35,
    temporal: 0.25,
    physical: 0.20,
    stability: 0.20,
  };
  private threshold: number = 0.75;

  public setWeights(cross: number, temporal: number, physical: number, stability: number) {
    const sum = cross + temporal + physical + stability;
    this.weights = {
      cross: cross / sum,
      temporal: temporal / sum,
      physical: physical / sum,
      stability: stability / sum,
    };
  }

  public setThreshold(th: number) {
    this.threshold = Math.max(0.1, Math.min(0.99, th));
  }

  public getWeights() {
    return { ...this.weights };
  }

  public getThreshold() {
    return this.threshold;
  }

  /**
   * Evaluates fresh post-reconfiguration measurements independently (IDF Step 13)
   * @param freshSamples Buffer of post-settling samples from reconfigured channel
   * @param redundantSamples Buffer of contemporary samples from redundant channel
   * @param scenario Indian operational scenario
   */
  public evaluateRecovery(
    freshSamples: number[],
    redundantSamples: number[],
    scenario: IndianScenarioType
  ): VerificationMetrics {
    if (freshSamples.length < 3) {
      return {
        crossSensorConsistency: 0,
        temporalConsistency: 0,
        physicalPlausibility: 0,
        measurementStability: 0,
        weights: { ...this.weights },
        totalV: 0,
        threshold: this.threshold,
        passed: false,
        hardGateViolated: true,
        hardGateReason: 'Insufficient fresh post-reconfiguration sample size (< 3)',
      };
    }

    const n = freshSamples.length;
    const meanFresh = freshSamples.reduce((a, b) => a + b, 0) / n;
    const meanRedundant = redundantSamples.length > 0
      ? redundantSamples.reduce((a, b) => a + b, 0) / redundantSamples.length
      : meanFresh;

    // 1. HARD SAFETY GATES
    // Gate A: Open-circuit / Disconnection Check
    if (meanFresh < 2.0 && meanRedundant > 25.0) {
      return {
        crossSensorConsistency: 0.05,
        temporalConsistency: 0.1,
        physicalPlausibility: 0.1,
        measurementStability: 0.9, // flatline might look artificially stable
        weights: { ...this.weights },
        totalV: 0.0,
        threshold: this.threshold,
        passed: false,
        hardGateViolated: true,
        hardGateReason: 'CRITICAL: Open-Circuit / Disconnection Hard Gate Triggered (Mean reading near zero while redundant is nominal)',
      };
    }

    // Gate B: Physical Bound Violations
    const meta = SCENARIO_METADATA[scenario];
    const absoluteMin = 0;
    const absoluteMax = meta.typicalRange[1] * 1.5;
    if (meanFresh < absoluteMin || meanFresh > absoluteMax) {
      return {
        crossSensorConsistency: 0.1,
        temporalConsistency: 0.2,
        physicalPlausibility: 0.0,
        measurementStability: 0.2,
        weights: { ...this.weights },
        totalV: 0.0,
        threshold: this.threshold,
        passed: false,
        hardGateViolated: true,
        hardGateReason: `CRITICAL: Measurement violates physical limits [${absoluteMin}, ${absoluteMax} ${meta.unit}]`,
      };
    }

    // 2. CROSS-SENSOR CONSISTENCY (C_cross)
    // Measures relative deviation against the independent redundant baseline
    const absoluteDeviation = Math.abs(meanFresh - meanRedundant);
    const nominalSpan = Math.max(20, meta.typicalRange[1] - meta.typicalRange[0]);
    const normalizedDev = absoluteDeviation / nominalSpan;
    // Exponential decay curve: 0 deviation => 1.0, 10% span dev => ~0.82, >30% span dev => <0.4
    const c_cross = Math.max(0, Math.min(1.0, Math.exp(-2.2 * normalizedDev)));

    // 3. TEMPORAL CONSISTENCY (C_temporal)
    // Measures step-to-step derivative smoothness
    let maxDerivative = 0;
    for (let i = 1; i < n; i++) {
      const diff = Math.abs(freshSamples[i] - freshSamples[i - 1]);
      if (diff > maxDerivative) maxDerivative = diff;
    }
    const maxAllowableRate = nominalSpan * 0.15; // 15% span per sample maximum allowable
    const rateRatio = maxDerivative / maxAllowableRate;
    const c_temporal = Math.max(0, Math.min(1.0, 1.0 - Math.min(1.0, rateRatio * 0.7)));

    // 4. PHYSICAL PLAUSIBILITY (C_phys)
    // Checks proximity to expected typical operational range for this Indian environment
    let c_phys = 1.0;
    if (meanFresh < meta.typicalRange[0]) {
      const underflow = (meta.typicalRange[0] - meanFresh) / nominalSpan;
      c_phys = Math.max(0, 1.0 - underflow * 2.5);
    } else if (meanFresh > meta.typicalRange[1]) {
      const overflow = (meanFresh - meta.typicalRange[1]) / nominalSpan;
      c_phys = Math.max(0, 1.0 - overflow * 2.5);
    }

    // 5. MEASUREMENT STABILITY (C_stability)
    // Evaluates sample variance; penalizes mechanical vibration, contact bounce or chaotic element breakdown
    let variance = 0;
    for (let i = 0; i < n; i++) {
      variance += Math.pow(freshSamples[i] - meanFresh, 2);
    }
    const stdDev = Math.sqrt(variance / n);
    const nominalStdDev = Math.max(1.0, meanFresh * 0.03); // Expected nominal ~3% standard deviation
    const excessNoiseRatio = Math.max(0, (stdDev - nominalStdDev) / (nominalStdDev * 3));
    const c_stability = Math.max(0, Math.min(1.0, 1.0 - Math.min(1.0, excessNoiseRatio)));

    // WEIGHTED TOTAL SCORE (V)
    const totalV = Number(
      (
        this.weights.cross * c_cross +
        this.weights.temporal * c_temporal +
        this.weights.physical * c_phys +
        this.weights.stability * c_stability
      ).toFixed(3)
    );

    const passed = totalV >= this.threshold;

    return {
      crossSensorConsistency: Number(c_cross.toFixed(3)),
      temporalConsistency: Number(c_temporal.toFixed(3)),
      physicalPlausibility: Number(c_phys.toFixed(3)),
      measurementStability: Number(c_stability.toFixed(3)),
      weights: { ...this.weights },
      totalV,
      threshold: this.threshold,
      passed,
      hardGateViolated: false,
    };
  }
}
