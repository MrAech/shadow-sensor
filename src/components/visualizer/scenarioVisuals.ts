import { IndianScenarioType } from '../../types';

export interface ScenarioVisualConfig {
  siteLabel: string;
  sensorAssembly: string;
  intakeLabel: string;
  environmentLabel: string;
  controllerLabel: string;
  primaryModule: string;
  redundantModule: string;
  actuatorLabel: string;
  signalLabel: string;
  topologyNote: string;
  primarySensorModel: string;
  redundantSensorModel: string;
  signalPathLabel: string;
  switchingModuleLabel: string;
  activeChannelLabel: string;
  standbyChannelLabel: string;
  primaryColor: number;
  accentColor: number;
}

export const SCENARIO_VISUALS: Record<IndianScenarioType, ScenarioVisualConfig> = {
  [IndianScenarioType.DELHI_AQI]: {
    siteLabel: 'DELHI NCR / CPCB AQI',
    sensorAssembly: 'Optical PM intake',
    intakeLabel: 'Baffled particulate intake',
    environmentLabel: 'SMOG / DUST EXPOSURE',
    controllerLabel: 'AQI EDGE NODE',
    primaryModule: 'OPTICAL PM2.5 HEAD',
    redundantModule: 'REFERENCE PM HEAD',
    actuatorLabel: 'SERVO INTAKE BAFFLE',
    signalLabel: 'PM OPTICAL BUS',
    topologyNote: 'Dual optical heads share a protected particulate intake path.',
    primarySensorModel: 'Laser nephelometer optical chamber',
    redundantSensorModel: 'Beta attenuation reference chamber',
    signalPathLabel: 'OPTICAL AFE / ADC',
    switchingModuleLabel: 'PM2.5 CROSS-CHECK RELAY',
    activeChannelLabel: 'NEPHELOMETER',
    standbyChannelLabel: 'BAM REFERENCE',
    primaryColor: 0x60a5fa,
    accentColor: 0xf59e0b,
  },
  [IndianScenarioType.BHADLA_SOLAR]: {
    siteLabel: 'BHADLA / RAJASTHAN SOLAR',
    sensorAssembly: 'Irradiance + thermal probe',
    intakeLabel: 'Solar-shielded probe',
    environmentLabel: 'HEAT / SAND EXPOSURE',
    controllerLabel: 'SOLAR FIELD NODE',
    primaryModule: 'IRRADIANCE PYRANOMETER',
    redundantModule: 'THERMAL REFERENCE PROBE',
    actuatorLabel: 'SERVO SUN-SHIELD',
    signalLabel: 'IRRADIANCE / TEMP BUS',
    topologyNote: 'Pyranometer and thermal reference are switched through the field MUX.',
    primarySensorModel: 'ISO 9060 thermopile pyranometer',
    redundantSensorModel: 'Calibrated silicon reference cell',
    signalPathLabel: 'IRRADIANCE AFE / ADC',
    switchingModuleLabel: 'IRRADIANCE PATH SELECTOR',
    activeChannelLabel: 'PYRANOMETER',
    standbyChannelLabel: 'REFERENCE CELL',
    primaryColor: 0xfb923c,
    accentColor: 0xfacc15,
  },
  [IndianScenarioType.PUNJAB_AGRICULTURE]: {
    siteLabel: 'PUNJAB / AGRICULTURE',
    sensorAssembly: 'Soil moisture + environment',
    intakeLabel: 'Silt-protected probe',
    environmentLabel: 'SILT / FLOOD EXPOSURE',
    controllerLabel: 'AGRO FIELD NODE',
    primaryModule: 'SOIL MOISTURE PROBE',
    redundantModule: 'CANOPY CLIMATE PROBE',
    actuatorLabel: 'SERVO PROBE LIFT',
    signalLabel: 'SOIL / CANOPY BUS',
    topologyNote: 'Soil and canopy probes use separate harnesses joined at the field MUX.',
    primarySensorModel: 'FDR capacitance soil probe',
    redundantSensorModel: 'TDT parallel-furrow probe',
    signalPathLabel: 'CAPACITIVE AFE / ADC',
    switchingModuleLabel: 'FIELD PROBE SELECTOR',
    activeChannelLabel: 'FDR PROBE',
    standbyChannelLabel: 'TDT PROBE',
    primaryColor: 0x34d399,
    accentColor: 0x84cc16,
  },
};
