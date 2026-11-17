import React from 'react';
import { IndianScenarioType, PhysicalHardwareState, SensorTelemetry } from '../../types';
import { SCENARIO_VISUALS } from './scenarioVisuals';

interface Schematic2DProps {
  hardwareState: PhysicalHardwareState;
  telemetry: SensorTelemetry | null;
  scenario: IndianScenarioType;
}

const wrapSvgText = (value: string, maxChars: number): string[] => {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    if ((line + (line ? ' ' : '') + word).length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line += `${line ? ' ' : ''}${word}`;
    }
  });

  if (line) lines.push(line);
  return lines;
};

const SvgWrappedText: React.FC<{
  value: string;
  x: number;
  y: number;
  maxChars: number;
  lineHeight?: number;
  [key: string]: string | number | undefined;
}> = ({ value, x, y, maxChars, lineHeight = 12, ...props }) => (
  <text x={x} y={y} {...props}>
    {wrapSvgText(value, maxChars).map((line, index) => (
      <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
        {line}
      </tspan>
    ))}
  </text>
);

export const Schematic2D: React.FC<Schematic2DProps> = ({ hardwareState, telemetry, scenario }) => {
  const isCh1 = hardwareState.relayChannel === 1;
  const isStabilizing = hardwareState.vibrationIntensity > 0.05;
  const isSevered = hardwareState.cableIntegrity < 0.5;
  const isDegraded = telemetry?.isSafeDegraded;
  const visual = SCENARIO_VISUALS[scenario];

  return (
    <div className="relative w-full h-full min-h-[360px] bg-slate-950 overflow-hidden border-y border-slate-800 p-4 flex flex-col justify-between select-none">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
        <div className="flex min-w-0 items-start gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="min-w-0 text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
            {visual.siteLabel} · {visual.sensorAssembly} circuit schematic
          </h3>
        </div>
        <div className="flex max-w-full flex-wrap justify-end gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
            Bus Voltage: <strong className="text-slate-200">3.3V DC</strong>
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
            Environment: <strong className="text-amber-300">{visual.environmentLabel}</strong>
          </span>
        </div>
      </div>

      {/* SVG Circuit Blueprint */}
      <svg className="w-full h-full max-h-[300px]" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Signal flow animations */}
          <linearGradient id="wireGradHealthy" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="wireGradFault" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 1. ESP32 MICROCONTROLLER UNIT */}
        <g transform="translate(40, 60)">
          <rect x="0" y="0" width="160" height="200" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="15" y="15" width="130" height="70" rx="4" fill="#0284c7" fillOpacity="0.1" stroke="#0284c7" strokeWidth="1" />
          <text x="80" y="45" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ESP32-WROOM</text>
          <SvgWrappedText x={80} y={62} maxChars={18} lineHeight={11} fill="#94a3b8" fontSize={8} fontFamily="monospace" textAnchor="middle" value={visual.controllerLabel} />

          {/* MCU Pins */}
          <circle cx="160" cy="50" r="5" fill="#38bdf8" />
          <text x="145" y="54" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">GPIO18 (PWM)</text>

          <circle cx="160" cy="110" r="5" fill="#a855f7" />
          <text x="145" y="114" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">GPIO23 (PATH SELECT)</text>

          <circle cx="160" cy="170" r="5" fill="#10b981" />
          <SvgWrappedText x={145} y={168} maxChars={18} lineHeight={11} fill="#64748b" fontSize={8} fontFamily="monospace" textAnchor="end" value={visual.signalPathLabel} />
        </g>

        {/* 2. PWM PATH TO SERVO ACTUATOR */}
        <path
          d="M 200 110 L 320 110 L 320 70 L 400 70"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3"
          strokeDasharray="6,4"
          className="animate-pulse"
        />
        <SvgWrappedText x={260} y={96} maxChars={18} lineHeight={11} fill="#38bdf8" fontSize={8} fontFamily="monospace" value={visual.actuatorLabel} />

        {/* SERVO MOTOR MODULE */}
        <g transform="translate(400, 25)">
          <rect x="0" y="0" width="130" height="90" rx="8" fill="#1e293b" stroke="#0284c7" strokeWidth="1.5" />
          <text x="65" y="24" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">MG996R SERVO</text>
          <SvgWrappedText x={65} y={39} maxChars={18} lineHeight={10} fill="#94a3b8" fontSize={7.5} fontFamily="monospace" textAnchor="middle" value={visual.actuatorLabel} />
          
          {/* Dial indicator */}
          <circle cx="65" cy="65" r="16" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
          <line
            x1="65"
            y1="65"
            x2={65 + 13 * Math.sin((hardwareState.actualServoAngle * Math.PI) / 180)}
            y2={65 - 13 * Math.cos((hardwareState.actualServoAngle * Math.PI) / 180)}
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text x="105" y="70" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
            {Math.round(hardwareState.actualServoAngle)}°
          </text>
        </g>

        {/* 3. RELAY CONTROL SIGNAL */}
        <path
          d="M 200 170 L 340 170"
          fill="none"
          stroke="#a855f7"
          strokeWidth="2.5"
        />
        <SvgWrappedText x={250} y={162} maxChars={24} fill="#c084fc" fontSize={9} fontFamily="monospace" value={`MUX_CTRL / ${visual.signalLabel}`} />

        {/* 4. SOLID-STATE SPDT RELAY / MUX */}
        <g transform="translate(340, 130)">
          <rect x="0" y="0" width="130" height="150" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
          <SvgWrappedText x={65} y={18} maxChars={18} lineHeight={11} fill="#c7d2fe" fontSize={8} fontWeight="bold" fontFamily="monospace" textAnchor="middle" value={visual.switchingModuleLabel} />
          
          {/* Input Common terminal (COM) */}
          <circle cx="15" cy="80" r="5" fill="#10b981" />
          <text x="25" y="84" fill="#a5b4fc" fontSize="9" fontFamily="monospace">COM</text>

          {/* Channel 1 Contact (NC) */}
          <circle cx="115" cy="50" r="5" fill={isCh1 ? '#38bdf8' : '#64748b'} />
          <SvgWrappedText x={105} y={40} maxChars={18} lineHeight={10} fill={isCh1 ? '#38bdf8' : '#64748b'} fontSize={7.5} fontFamily="monospace" textAnchor="end" value={`CH1 · ${visual.activeChannelLabel}`} />

          {/* Channel 2 Contact (NO) */}
          <circle cx="115" cy="110" r="5" fill={!isCh1 ? '#34d399' : '#64748b'} />
          <SvgWrappedText x={105} y={121} maxChars={18} lineHeight={10} fill={!isCh1 ? '#34d399' : '#64748b'} fontSize={7.5} fontFamily="monospace" textAnchor="end" value={`CH2 · ${visual.standbyChannelLabel}`} />

          {/* Animated SPDT Armature blade */}
          <line
            x1="18"
            y1="80"
            x2="112"
            y2={isCh1 ? 52 : 108}
            stroke={isDegraded ? '#f43f5e' : (isCh1 ? '#38bdf8' : '#34d399')}
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#glow)"
            style={{ transition: 'all 0.3s ease-in-out' }}
          />
        </g>

        {/* COM to MCU ADC Bus */}
        <path
          d="M 340 210 L 290 210 L 290 230 L 200 230"
          fill="none"
          stroke={isDegraded ? '#f43f5e' : '#10b981'}
          strokeWidth="3"
        />

        {/* 5. PRIMARY SENSOR MODULE (CH1) */}
        <g transform="translate(600, 30)">
          <rect
            x="0"
            y="0"
            width="170"
            height="100"
            rx="8"
            fill="#0b172b"
            stroke={isCh1 ? (isSevered ? '#f43f5e' : '#0284c7') : '#334155'}
            strokeWidth="2"
          />
          <SvgWrappedText x={85} y={20} maxChars={20} lineHeight={11} fill="#e2e8f0" fontSize={8} fontWeight="bold" fontFamily="monospace" textAnchor="middle" value={visual.primaryModule} />
          <SvgWrappedText x={85} y={40} maxChars={25} lineHeight={11} fill="#64748b" fontSize={7.5} fontFamily="monospace" textAnchor="middle" value={`${visual.primarySensorModel} · ${visual.signalPathLabel}`} />

          {/* Probe Status LED */}
          <circle cx="25" cy="70" r="6" fill={isSevered ? '#f43f5e' : (isCh1 ? '#38bdf8' : '#475569')} />
          <SvgWrappedText x={40} y={74} maxChars={15} fill={isSevered ? '#f43f5e' : '#94a3b8'} fontSize={8} fontFamily="monospace" value={isSevered ? 'CABLE CUT' : (isCh1 ? 'ACTIVE BUS' : 'STANDBY')} />
        </g>

        {/* CH1 Wire Path (severed indicator) */}
        {isSevered ? (
          <g>
            <path d="M 455 180 L 520 180" fill="none" stroke="#f43f5e" strokeWidth="2.5" />
            <path d="M 545 100 L 600 100" fill="none" stroke="#f43f5e" strokeWidth="2.5" />
            <text x="532" y="145" fill="#f43f5e" fontSize="18" fontWeight="bold" textAnchor="middle">⚡ BROKEN</text>
          </g>
        ) : (
          <path
            d="M 455 180 L 540 180 L 540 100 L 600 100"
            fill="none"
            stroke={isCh1 ? '#38bdf8' : '#475569'}
            strokeWidth="2.5"
            strokeDasharray={isCh1 ? 'none' : '4,4'}
          />
        )}

        {/* 6. REDUNDANT SENSOR MODULE (CH2) */}
        <g transform="translate(600, 170)">
          <rect
            x="0"
            y="0"
            width="170"
            height="100"
            rx="8"
            fill="#062e24"
            stroke={!isCh1 ? '#10b981' : '#1e3a34'}
            strokeWidth="2"
          />
          <SvgWrappedText x={85} y={20} maxChars={20} lineHeight={11} fill="#a7f3d0" fontSize={8} fontWeight="bold" fontFamily="monospace" textAnchor="middle" value={visual.redundantModule} />
          <SvgWrappedText x={85} y={40} maxChars={25} lineHeight={11} fill="#6ee7b7" fontSize={7.5} fontFamily="monospace" textAnchor="middle" value={`${visual.redundantSensorModel} · isolated reference`} />

          {/* Probe Status LED */}
          <circle cx="25" cy="70" r="6" fill={!isCh1 ? '#10b981' : '#334155'} />
          <SvgWrappedText x={40} y={74} maxChars={15} fill={!isCh1 ? '#34d399' : '#64748b'} fontSize={8} fontFamily="monospace" value={!isCh1 ? 'ACTIVE BUS' : 'HOT STANDBY'} />
        </g>

        {/* CH2 Wire Path */}
        <path
          d="M 455 240 L 540 240 L 540 220 L 600 220"
          fill="none"
          stroke={!isCh1 ? '#10b981' : '#334155'}
          strokeWidth="2.5"
          strokeDasharray={!isCh1 ? 'none' : '4,4'}
        />

        <SvgWrappedText x={600} y={300} maxChars={38} lineHeight={11} fill="#94a3b8" fontSize={8} fontFamily="monospace" value={visual.topologyNote} />

        {/* STABILIZATION QUARANTINE OVERLAY */}
        {isStabilizing && (
          <g transform="translate(250, 195)">
            <rect x="0" y="0" width="180" height="32" rx="6" fill="#78350f" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="90" y="21" fill="#fde68a" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              SETTLING: DATA QUARANTINE
            </text>
          </g>
        )}

        {/* SAFE DEGRADED TRIPPED CIRCUIT BREAKER */}
        {isDegraded && (
          <g transform="translate(230, 205)">
            <rect x="0" y="0" width="210" height="36" rx="6" fill="#881337" stroke="#f43f5e" strokeWidth="2" />
            <text x="105" y="23" fill="#fecdd3" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              SAFE DEGRADED: ISOLATED
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
