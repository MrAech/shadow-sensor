// Realistic Indian Operational Environmental Physics Models & Site-Specific Semantic Definitions
import { IndianScenarioType, ScenarioMetadata, FaultCategory } from "../types";

export interface SiteSpecificFaultDef {
  category: FaultCategory;
  title: string;
  tag: string;
  iconType: "wind" | "sun" | "sprout" | "compass" | "unlink" | "droplet";
  physicalPhenomenon: string;
  transducerPhysicsImpact: string;
  whySoftwareFails: string;
  reconfigurationAction: string;
  targetServoAngle: number;
  cand1Description: string;
  cand2Description: string;
  technicianChecklist: string[];
}

export const SCENARIO_METADATA: Record<IndianScenarioType, ScenarioMetadata> = {
  [IndianScenarioType.DELHI_AQI]: {
    id: IndianScenarioType.DELHI_AQI,
    name: "Delhi-NCR Anand Vihar CPCB CAAQMS",
    location: "Anand Vihar, New Delhi (Indo-Gangetic Plain)",
    primaryParameter: "Particulate Matter (PM2.5)",
    unit: "µg/m³",
    typicalRange: [40, 480],
    primarySensorName: "Laser Nephelometer (Inlet A)",
    redundantSensorName: "Beta Attenuation Monitor (BAM-1020 Channel B)",
    environmentalChallenge:
      "Severe winter thermal inversion smog, post-harvest stubble smoke plumes, high vehicular dust.",
    cpcbStandardOrNorm: "NAAQS Standard: 60 µg/m³ (24h avg)",
    temperatureRange: [6, 32],
    humidityRange: [40, 95],
  },
  [IndianScenarioType.BHADLA_SOLAR]: {
    id: IndianScenarioType.BHADLA_SOLAR,
    name: "Bhadla Mega Solar Park (Phases I-IV)",
    location: "Thar Desert, Phalodi District, Rajasthan",
    primaryParameter: "Solar Global Horizontal Irradiance (GHI)",
    unit: "W/m²",
    typicalRange: [0, 1150],
    primarySensorName: "Thermopile Pyranometer (Class A, Mount 1)",
    redundantSensorName: "Calibrated Silicon Reference Photodiode (Channel 2)",
    environmentalChallenge:
      "Extreme desert heatwaves (up to 49°C), severe sandstorms (Andhi), rapid quartz soiling.",
    cpcbStandardOrNorm: "ISO 9060 Class A Pyranometer Standard",
    temperatureRange: [18, 49],
    humidityRange: [12, 45],
  },
  [IndianScenarioType.PUNJAB_AGRICULTURE]: {
    id: IndianScenarioType.PUNJAB_AGRICULTURE,
    name: "Ludhiana Agro-Ecological IoT Field Station",
    location: "PAU Experimental Farm, Ludhiana, Punjab",
    primaryParameter: "Root-Zone Volumetric Soil Moisture (VWC)",
    unit: "% VWC",
    typicalRange: [15, 80],
    primarySensorName: "Frequency Domain Reflectometry (FDR Probe 1)",
    redundantSensorName:
      "Time Domain Transmissometry (TDT Probe 2 - Parallel Furrow)",
    environmentalChallenge:
      "Canal flood irrigation silt encrustation, fertilizer salinization, field tractor wire damage.",
    cpcbStandardOrNorm: "ICAR Precision Agriculture Standards",
    temperatureRange: [8, 42],
    humidityRange: [35, 90],
  },
};

export const SITE_SPECIFIC_FAULTS: Record<
  IndianScenarioType,
  SiteSpecificFaultDef[]
> = {
  [IndianScenarioType.DELHI_AQI]: [
    {
      category: FaultCategory.OBSTRUCTION_SOILING,
      title: "Winter Smog & Stubble Smoke Soot Clog",
      tag: "Aperture Soot Occlusion",
      iconType: "wind",
      physicalPhenomenon:
        "Dense stubble smoke (Parali plumes) and Anand Vihar ISBT bus diesel soot deposits on laser scatter optics.",
      transducerPhysicsImpact:
        "Optical beam attenuation; laser photodiode reads falsely attenuated particulate scatter intensity.",
      whySoftwareFails:
        "Software filters average corrupt data; software cannot wipe or clear soot off physical laser glass.",
      reconfigurationAction:
        "Servo rotates gimbal 90° to engage clean secondary heated intake cowl with aerodynamic baffle.",
      targetServoAngle: 90,
      cand1Description:
        "Rotate servo to 90° secondary shielded heated intake cowl",
      cand2Description:
        "Switch SPDT relay bus to Channel 2 BAM-1020 reference analyzer",
      technicianChecklist: [
        "1. Disassemble optical particle counter chamber and clean lenses with isopropyl alcohol.",
        "2. Inspect sample tube heating ribbon to prevent dew condensation.",
        "3. Perform zero-count test with HEPA filter cartridge on Inlet A.",
      ],
    },
    {
      category: FaultCategory.DRIFT,
      title: "Monsoon Fog Humidity Saturation Drift",
      tag: "Hygroscopic Drift",
      iconType: "droplet",
      physicalPhenomenon:
        "95% relative humidity during monsoon/winter fog condenses water droplets on optical particle counters.",
      transducerPhysicsImpact:
        "Water droplets scatter laser light like heavy dust particles, causing severe artificial upward mass drift.",
      whySoftwareFails:
        "Software cannot distinguish micron-sized moisture droplets from genuine particulate matter without physical heating/compensation.",
      reconfigurationAction:
        "Servo tilts sensor arm 45° to sheltered underside; engages Channel 2 heated sample line.",
      targetServoAngle: 45,
      cand1Description:
        "Tilt sensor 45° away from direct rain/fog vector to engage sheltered aerodynamic intake",
      cand2Description:
        "Switch SPDT relay to Channel 2 calibrated heated reference analyzer",
      technicianChecklist: [
        "1. Inspect optical chamber humidity heater and temperature sensor.",
        "2. Replace saturated desiccant canister in ambient inlet line.",
        "3. Verify zero-drift compliance against CPCB CAAQMS guidelines.",
      ],
    },
    {
      category: FaultCategory.ABNORMAL_ORIENTATION,
      title: "ISBT Highway Vehicular Turbulence Tilt",
      tag: "Isokinetic Tilt Error",
      iconType: "compass",
      physicalPhenomenon:
        "Severe aerodynamic pressure drafts from Anand Vihar flyover traffic knocks directional intake horn off axis.",
      transducerPhysicsImpact:
        "Loss of isokinetic sampling geometry; coarse PM10 particles fail to enter non-aligned intake.",
      whySoftwareFails:
        "Sampling geometry violation cannot be fixed in software without physically pointing intake back into wind stream.",
      reconfigurationAction:
        "Servo drives closed-loop rotation back to true 90° calibrated isokinetic intake vector.",
      targetServoAngle: 90,
      cand1Description:
        "Re-align gimbal back to true calibrated 90° isokinetic azimuth vector",
      cand2Description: "Switch to Channel 2 omnidirectional sampling head",
      technicianChecklist: [
        "1. Check mounting bracket clamp torque on CAAQMS sampling mast.",
        "2. Verify servo horn indexing pin and mechanical stop integrity.",
      ],
    },
    {
      category: FaultCategory.DISCONNECTION,
      title: "RS-485 Modbus Cable Terminal Severance",
      tag: "Open-Circuit Bus Cut",
      iconType: "unlink",
      physicalPhenomenon:
        "Vibration from heavy Delhi road traffic or rodent chewing severs differential RS-485 cable to Primary Inlet A.",
      transducerPhysicsImpact:
        "Complete signal open circuit; ADC reads floating zero-volt ground noise.",
      whySoftwareFails:
        "A mechanical servo rotation CANNOT repair a severed electrical conductor! Mechanical retries must fail.",
      reconfigurationAction:
        "SPDT Relay switches electrical bus to independent Channel 2 backup wiring harness.",
      targetServoAngle: 0,
      cand1Description:
        "Attempt mechanical mount reseating (Fails: broken wire cannot be fixed by rotation)",
      cand2Description:
        "Switch SPDT relay bus to Channel 2 BAM-1020 independent cable harness",
      technicianChecklist: [
        "1. Test cable loop continuity with digital multimeter at DIN rail terminal block.",
        "2. Replace severed shielded twisted-pair Belden 9841 cable.",
        "3. Inspect IP67 junction box cable gland for mechanical strain relief.",
      ],
    },
  ],

  [IndianScenarioType.BHADLA_SOLAR]: [
    {
      category: FaultCategory.OBSTRUCTION_SOILING,
      title: "Thar Desert Quartz Sandstorm Soiling (Andhi)",
      tag: "Glass Dome Soiling",
      iconType: "sun",
      physicalPhenomenon:
        "Violent Thar desert sandstorm deposits opaque layer of fine quartz sand across pyranometer glass dome.",
      transducerPhysicsImpact:
        "Solar irradiance attenuation; thermopile sees up to 75% drop in incident shortwave radiation.",
      whySoftwareFails:
        "Algorithms assuming 200 W/m² in clear desert midday will trigger false panel curtailment alarms.",
      reconfigurationAction:
        "Servo rotates pyranometer assembly 90° to engage clean secondary shielded reference cell with shutter.",
      targetServoAngle: 90,
      cand1Description:
        "Rotate servo 90° to engage clean secondary pyranometer aperture under windbreak",
      cand2Description:
        "Switch SPDT relay to Channel 2 Calibrated Silicon Reference Photodiode",
      technicianChecklist: [
        "1. Inspect pyranometer optical dome for quartz micro-abrasions and pitting.",
        "2. Clean dome with deionized water and lint-free optical lens cloth.",
        "3. Inspect desiccant silica gel pellets inside pyranometer body.",
      ],
    },
    {
      category: FaultCategory.DRIFT,
      title: "Extreme 49°C Desert Thermal Soak Drift",
      tag: "Thermocouple Offset",
      iconType: "sun",
      physicalPhenomenon:
        "Direct solar heating pushes aluminum sensor enclosure temperature to 68°C in Thar desert summer midday.",
      transducerPhysicsImpact:
        "Thermopile cold-junction thermal gradient saturation; produces progressive baseline millivolt offset drift.",
      whySoftwareFails:
        "Mathematical temperature models drift under extreme ambient non-linear thermal shock.",
      reconfigurationAction:
        "Servo tilts sensor arm 45° into shaded underside quadrant of tracker frame to suppress thermal radiation.",
      targetServoAngle: 45,
      cand1Description:
        "Tilt gimbal 45° to shaded underside quadrant to suppress extreme solar enclosure heating",
      cand2Description:
        "Switch SPDT relay to Channel 2 Temperature-Compensated Silicon Reference Cell",
      technicianChecklist: [
        "1. Verify pyranometer zero-offset response (Type A and Type B infrared radiation).",
        "2. Inspect thermal radiation shield white lacquer coating for yellowing.",
        "3. Re-zero pyranometer in dark box calibrator.",
      ],
    },
    {
      category: FaultCategory.ABNORMAL_ORIENTATION,
      title: "Sand Dune Accumulation Tracker Tilt Error",
      tag: "Solar Zenith Tilt Error",
      iconType: "compass",
      physicalPhenomenon:
        "Shifting sand dunes accumulate against solar tracker torque tube, causing angular misalignment away from solar zenith.",
      transducerPhysicsImpact:
        "Cosine response error; pyranometer receives non-perpendicular direct beam radiation.",
      whySoftwareFails:
        "Software cosine correction fails because physical tracker angle is mechanically stuck.",
      reconfigurationAction:
        "Servo actuator drives autonomous angular realignment back to true 90° calibrated solar zenith.",
      targetServoAngle: 90,
      cand1Description:
        "Drive autonomous servo realignment to true 90° solar zenith tracking plane",
      cand2Description:
        "Switch to Channel 2 fixed horizontal Global Reference Sensor",
      technicianChecklist: [
        "1. Clear accumulated sand dunes from tracker slew drive gears.",
        "2. Re-level pyranometer using bubble spirit level and leveling screws.",
      ],
    },
    {
      category: FaultCategory.DISCONNECTION,
      title: "Extreme Thermal Expansion / Rodent Wire Snap",
      tag: "Thermopile Lead Severance",
      iconType: "unlink",
      physicalPhenomenon:
        "Daily thermal expansion (15°C night to 50°C day) snaps millivolt pyranometer lead at conduit junction.",
      transducerPhysicsImpact:
        "Open-circuit break; analog signal drops to zero microvolts.",
      whySoftwareFails:
        "Gimbal movement cannot reconnect a severed millivolt wire.",
      reconfigurationAction:
        "SPDT Relay switches analog acquisition bus to Channel 2 independent reference cell.",
      targetServoAngle: 0,
      cand1Description:
        "Attempt gimbal mechanical re-aiming (Fails: broken wire cannot be fixed by rotation)",
      cand2Description:
        "Switch SPDT relay to Channel 2 redundant silicon cell independent cable harness",
      technicianChecklist: [
        "1. Inspect UV-rated conduit for thermal stress fracturing.",
        "2. Terminate new shielded thermocouple wire with gold-plated spade lugs.",
        "3. Verify signal shielding and earth grounding resistance (< 5 Ohms).",
      ],
    },
  ],

  [IndianScenarioType.PUNJAB_AGRICULTURE]: [
    {
      category: FaultCategory.OBSTRUCTION_SOILING,
      title: "Canal Flood Irrigation Silt Encrustation",
      tag: "Waveguide Silt Layer",
      iconType: "sprout",
      physicalPhenomenon:
        "Sirhind canal flood irrigation deposits heavy clay-silt mud cake directly across FDR probe steel waveguides.",
      transducerPhysicsImpact:
        "The hardened silt cake forms an artificial moisture barrier, reading falsely saturated 100% moisture long after field drained.",
      whySoftwareFails:
        "Software sees high moisture and stops irrigation pumps, causing root-zone water stress and crop drought.",
      reconfigurationAction:
        "Servo actuator rotates probe arm 90° into secondary root-zone profile away from surface silt crust.",
      targetServoAngle: 90,
      cand1Description:
        "Actuate servo to rotate probe 90° into secondary root-zone depth away from surface silt crust",
      cand2Description:
        "Switch SPDT relay to Channel 2 TDT probe installed in adjacent furrow",
      technicianChecklist: [
        "1. Excavate sensor furrow and inspect probe waveguides for clay compaction.",
        "2. Clean stainless steel rods with wire brush and rinse with distilled water.",
        "3. Re-install probe ensuring intimate soil contact without air gaps.",
      ],
    },
    {
      category: FaultCategory.DRIFT,
      title: "Urea / DAP Fertilizer Salinization Ionic Drift",
      tag: "Ionic EC Drift",
      iconType: "sprout",
      physicalPhenomenon:
        "Top-dressing urea and Diammonium Phosphate (DAP) fertilizer increases soil bulk Electrical Conductivity (EC > 4 dS/m).",
      transducerPhysicsImpact:
        "High ionic conductivity dampens 70MHz high-frequency dielectric pulses, causing progressive calibration drift.",
      whySoftwareFails:
        "Dielectric FDR equations assume constant soil salinity; software cannot adjust without physical reference.",
      reconfigurationAction:
        "Servo tilts probe to deeper desalinized root-zone layer; MUX switches to salinity-corrected TDT probe.",
      targetServoAngle: 45,
      cand1Description:
        "Tilt sensor 45° to sample deeper desalinized root-zone soil layer",
      cand2Description:
        "Switch SPDT relay to Channel 2 Salinity-Corrected Time Domain Transmissometer",
      technicianChecklist: [
        "1. Measure soil pore water electrical conductivity using optical refractometer.",
        "2. Recalibrate FDR frequency-to-VWC calibration curve for saline soil profile.",
      ],
    },
    {
      category: FaultCategory.ABNORMAL_ORIENTATION,
      title: "Canopy Shading & Stem Weight Soil Displacement",
      tag: "Waveguide Angle Shift",
      iconType: "compass",
      physicalPhenomenon:
        "Mature wheat/paddy crop stems lean heavily on soil sensor head during wind, shifting probe angle in soil bed.",
      transducerPhysicsImpact:
        "Probe rods lose horizontal furrow alignment, reading vertical infiltration moisture gradient incorrectly.",
      whySoftwareFails:
        "Orientation displacement cannot be corrected in code without mechanical repositioning.",
      reconfigurationAction:
        "Servo motor drives mechanical realignment back to true calibrated 90° horizontal furrow plane.",
      targetServoAngle: 90,
      cand1Description:
        "Drive servo realignment back to true calibrated 90° horizontal furrow plane",
      cand2Description: "Switch to Channel 2 vertical deep-profile probe",
      technicianChecklist: [
        "1. Install protective crop-deflector cage over soil sensor riser.",
        "2. Re-pack disturbed soil around sensor body to restore natural bulk density.",
      ],
    },
    {
      category: FaultCategory.DISCONNECTION,
      title: "Tractor Plough Furrow Tillage Cable Severance",
      tag: "Furrow Cable Cut",
      iconType: "unlink",
      physicalPhenomenon:
        "Inter-row tractor cultivator plough tines snag and sever buried underground sensor cable harness.",
      transducerPhysicsImpact:
        "Complete open circuit; FDR frequency oscillator signal cuts to zero.",
      whySoftwareFails:
        "A mechanical probe adjustment cannot reconnect severed underground copper wires.",
      reconfigurationAction:
        "SPDT Relay switches signal bus to Channel 2 parallel furrow sensor on an independent conduit run.",
      targetServoAngle: 0,
      cand1Description:
        "Attempt mechanical mount reseating (Fails: broken wire cannot be fixed by rotation)",
      cand2Description:
        "Switch SPDT relay to Channel 2 independent furrow conduit cable harness",
      technicianChecklist: [
        "1. Locate underground cable fault using time-domain reflectometer cable tracer.",
        "2. Splice severed cable using IP68 waterproof resin-filled gel splice kit.",
        "3. Bury cable inside heavy-duty HDPE conduit at minimum 45cm depth below plough layer.",
      ],
    },
  ],
};

export class IndianEnvironmentEngine {
  private scenario: IndianScenarioType;
  private simTime: number = 0; // seconds

  constructor(scenario: IndianScenarioType = IndianScenarioType.DELHI_AQI) {
    this.scenario = scenario;
  }

  public setScenario(scenario: IndianScenarioType) {
    this.scenario = scenario;
    this.simTime = 0;
  }

  public getScenarioMetadata(): ScenarioMetadata {
    return SCENARIO_METADATA[this.scenario];
  }

  public getSiteSpecificFaults(): SiteSpecificFaultDef[] {
    return SITE_SPECIFIC_FAULTS[this.scenario];
  }

  /**
   * Generates continuous ground-truth physical parameter based on realistic Indian diurnal curve
   */
  public generateGroundTruth(dt: number = 0.5): number {
    this.simTime += dt;
    const t = this.simTime;

    switch (this.scenario) {
      case IndianScenarioType.DELHI_AQI: {
        const base = 210;
        const diurnalWave = Math.sin(t * 0.08) * 85;
        const microTurbulence = (Math.sin(t * 0.4) + Math.cos(t * 0.9)) * 8;
        const ambientNoise = (Math.random() - 0.5) * 6;
        return Math.max(
          35,
          Math.min(480, base + diurnalWave + microTurbulence + ambientNoise),
        );
      }

      case IndianScenarioType.BHADLA_SOLAR: {
        const dayProgress = (Math.sin(t * 0.05) + 1) / 2;
        const maxIrradiance = 1050;
        const rawGHI = dayProgress * maxIrradiance;
        const dustScattering = Math.sin(t * 0.3) * 15;
        const ambientNoise = (Math.random() - 0.5) * 5;
        return Math.max(
          0,
          Math.min(1150, rawGHI + dustScattering + ambientNoise),
        );
      }

      case IndianScenarioType.PUNJAB_AGRICULTURE: {
        const irrigationCycle = (t % 120) / 120;
        let moisture: number;
        if (irrigationCycle < 0.2) {
          moisture = 35 + (irrigationCycle / 0.2) * 35;
        } else {
          const drain = (irrigationCycle - 0.2) / 0.8;
          moisture = 70 - drain * 30;
        }
        const rootZoneNoise = (Math.random() - 0.5) * 1.5;
        return Math.max(15, Math.min(85, moisture + rootZoneNoise));
      }
    }
  }

  public getAmbientConditions(): { temp: number; humidity: number } {
    const meta = SCENARIO_METADATA[this.scenario];
    const t = this.simTime;
    const tempWave = (Math.sin(t * 0.05) + 1) / 2;
    const temp =
      meta.temperatureRange[0] +
      tempWave * (meta.temperatureRange[1] - meta.temperatureRange[0]);
    const humWave = 1 - tempWave;
    const humidity =
      meta.humidityRange[0] +
      humWave * (meta.humidityRange[1] - meta.humidityRange[0]);
    return {
      temp: Number(temp.toFixed(1)),
      humidity: Number(humidity.toFixed(1)),
    };
  }
}
