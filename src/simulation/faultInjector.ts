// Realistic Sensor Transducer Fault Injection Engine
import { FaultCategory, PhysicalHardwareState } from "../types";

export class FaultInjector {
  private activeFault: FaultCategory = FaultCategory.NONE;
  private faultSeverity: number = 1.0; // 0.0 to 1.0
  private faultDuration: number = 0; // seconds fault has been active
  private driftAccumulator: number = 0;

  public setFault(fault: FaultCategory, severity: number = 1.0) {
    this.activeFault = fault;
    this.faultSeverity = Math.max(0.1, Math.min(1.0, severity));
    this.faultDuration = 0;
    this.driftAccumulator = 0;
  }

  public clearFault() {
    this.activeFault = FaultCategory.NONE;
    this.faultDuration = 0;
    this.driftAccumulator = 0;
  }

  public getActiveFault(): FaultCategory {
    return this.activeFault;
  }

  public getFaultSeverity(): number {
    return this.faultSeverity;
  }

  /**
   * Applies realistic physical fault distortion to raw sensor transducer output
   * based on current physical hardware state (servo angle, relay channel, cable state)
   */
  public applyFault(
    groundTruth: number,
    hardwareState: PhysicalHardwareState,
    dt: number = 0.5,
  ): { primaryRaw: number; redundantRaw: number } {
    this.faultDuration += dt;

    // Normal baseline sensor noise (0.8% standard deviation)
    const primNominalNoise =
      (Math.random() - 0.5) * (groundTruth * 0.015 + 1.0);
    const redunNominalNoise =
      (Math.random() - 0.5) * (groundTruth * 0.015 + 1.0);

    let primary = groundTruth + primNominalNoise;
    let redundant = groundTruth + redunNominalNoise;

    // If active channel switched to Channel 2 (Redundant Probe),
    // primary wire issues or primary aperture soiling are bypassed!
    // However, if the fault is an environmental whole-station issue or total disconnect, it affects both unless mitigated.
    switch (this.activeFault) {
      case FaultCategory.NONE:
        break;

      case FaultCategory.DRIFT: {
        // Progressive calibration drift on Primary (e.g. electrochemical cell exhaustion or extreme heat)
        // Scale drift with the measured quantity so high-range irradiance
        // stations reach the same persistence threshold as AQI and VWC sites.
        this.driftAccumulator +=
          dt * (1.8 + groundTruth * 0.004) * this.faultSeverity;
        // If servo tilted into shaded position (angle >= 45°), thermal drift is mitigated
        const shadeFactor = hardwareState.servoAngle >= 45 ? 0.2 : 1.0;
        primary += this.driftAccumulator * shadeFactor;
        break;
      }

      case FaultCategory.OBSTRUCTION_SOILING: {
        // Severe optical obstruction / particulate clogging on Primary Inlet
        // If servo repositioned to shielded port (angle >= 45°), soiling is bypassed!
        if (hardwareState.servoAngle >= 45) {
          // Clean secondary intake active! Signal restored
          primary = groundTruth + primNominalNoise;
        } else {
          // Severely attenuated reading (e.g. only 20% to 35% of true particulate/light gets through)
          const attenuation = 1.0 - 0.75 * this.faultSeverity;
          primary = groundTruth * attenuation + (Math.random() - 0.5) * 2;
        }
        break;
      }

      case FaultCategory.ABNORMAL_ORIENTATION: {
        // Physical misalignment (e.g. high wind gust knocked mount out of true azimuth)
        // If servo rotated back to corrected azimuth (angle == 90°), orientation restored
        if (Math.abs(hardwareState.servoAngle - 90) < 5) {
          primary = groundTruth + primNominalNoise;
        } else {
          // Off-axis attenuation
          primary =
            groundTruth * (0.45 / this.faultSeverity) + primNominalNoise;
        }
        break;
      }

      case FaultCategory.DISCONNECTION: {
        // Broken wiring harness / open-circuit terminal
        // Rotating the servo CANNOT fix a broken wire!
        // Only switching the electrical MUX / relay to Channel 2 (Redundant Probe) fixes it!
        primary = (Math.random() - 0.5) * 0.8; // Open-circuit floating ground noise near 0
        break;
      }

      case FaultCategory.DEGRADED_ELEMENT: {
        // Hardware transducer element breakdown: extreme noise variance and intermittent zero dropouts
        const isDropout = Math.random() < 0.35 * this.faultSeverity;
        if (isDropout) {
          primary = 0;
        } else {
          const chaoticNoise =
            (Math.random() - 0.5) * groundTruth * 0.8 * this.faultSeverity;
          primary = Math.max(0, groundTruth + chaoticNoise);
        }
        break;
      }
    }

    return {
      primaryRaw: Math.max(0, Number(primary.toFixed(2))),
      redundantRaw: Math.max(0, Number(redundant.toFixed(2))),
    };
  }
}
