import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  IndianScenarioType,
  PhysicalHardwareState,
  SensorTelemetry,
} from "../../types";
import { SCENARIO_VISUALS } from "./scenarioVisuals";
import { RotateCcw } from "lucide-react";

interface HardwareRig3DProps {
  hardwareState: PhysicalHardwareState;
  telemetry: SensorTelemetry | null;
  scenario: IndianScenarioType;
}

export const HardwareRig3D: React.FC<HardwareRig3DProps> = ({
  hardwareState,
  telemetry,
  scenario,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const gimbalGroupRef = useRef<THREE.Group | null>(null);
  const primaryBeamRef = useRef<THREE.Mesh | null>(null);
  const redundantBeamRef = useRef<THREE.Mesh | null>(null);
  const cableMeshRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const environmentGroupRef = useRef<THREE.Group | null>(null);
  const visual = SCENARIO_VISUALS[scenario];

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: 0.65, phi: 0.55, radius: 8.5 });

  const resetCamera = (theta = 0.65, phi = 0.55, radius = 8.5) => {
    cameraAngle.current = { theta, phi, radius };
    updateCameraPosition();
  };

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngle.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi);
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 0.2, 0);
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050a14);
    const environmentGroup = new THREE.Group();
    environmentGroupRef.current = environmentGroup;
    scene.add(environmentGroup);

    const environmentMaterial = new THREE.MeshStandardMaterial({
      color: visual.accentColor,
      transparent: true,
      opacity: 0.22,
      roughness: 0.9,
    });
    if (scenario === IndianScenarioType.BHADLA_SOLAR) {
      for (let i = -2; i <= 2; i += 1) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(1.7, 0.04, 0.65),
          environmentMaterial,
        );
        panel.position.set(i * 1.8, -2.05, -2.8);
        panel.rotation.x = -0.22;
        environmentGroup.add(panel);
      }
    } else if (scenario === IndianScenarioType.PUNJAB_AGRICULTURE) {
      for (let i = -3; i <= 3; i += 1) {
        const row = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.35, 3.5),
          environmentMaterial,
        );
        row.position.set(i * 0.55, -1.95, -3.5);
        environmentGroup.add(row);
      }
    } else {
      const haze = new THREE.Mesh(
        new THREE.SphereGeometry(5, 24, 12),
        environmentMaterial,
      );
      haze.scale.set(1.8, 0.35, 1);
      haze.position.set(0, 3.5, -5);
      environmentGroup.add(haze);
    }

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.9);
    rimLight.position.set(-6, 5, -6);
    scene.add(rimLight);

    // 4. Ground Grid & Base Stand
    const gridHelper = new THREE.GridHelper(12, 12, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -2.3;
    scene.add(gridHelper);

    // Industrial Mounting Stand Base
    const baseGeo = new THREE.CylinderGeometry(1.3, 1.5, 0.35, 32);
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.8,
    });
    const baseMesh = new THREE.Mesh(baseGeo, darkMetalMat);
    baseMesh.position.y = -2.1;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);

    // Vertical Stand Post
    const poleGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.3, 24);
    const poleMesh = new THREE.Mesh(poleGeo, darkMetalMat);
    poleMesh.position.y = -0.85;
    scene.add(poleMesh);

    // Servo Motor Enclosure (Fixed Body)
    const servoBodyGeo = new THREE.BoxGeometry(1.1, 1.3, 0.85);
    const servoMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.6,
    });
    const servoBody = new THREE.Mesh(servoBodyGeo, servoMat);
    servoBody.position.y = 0.35;
    scene.add(servoBody);

    // Servo Brand Accent plate
    const accentGeo = new THREE.BoxGeometry(0.75, 0.35, 0.87);
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.5,
    });
    const accentMesh = new THREE.Mesh(accentGeo, accentMat);
    accentMesh.position.set(0, 0.55, 0);
    scene.add(accentMesh);

    // Wire Harness running down the pole
    const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.6, 12);
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.7,
    });
    const cableMesh = new THREE.Mesh(cableGeo, cableMat);
    cableMesh.position.set(0.24, -0.75, 0.1);
    scene.add(cableMesh);
    cableMeshRef.current = cableMesh;

    // 5. Rotating Gimbal Arm & Sensor Assembly
    const gimbalGroup = new THREE.Group();
    gimbalGroup.position.set(0, 1.0, 0); // Spindle axis
    scene.add(gimbalGroup);
    gimbalGroupRef.current = gimbalGroup;

    // Servo horn spindle (rotates with gimbal)
    const spindleGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.25, 24);
    const spindleMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.2,
      metalness: 0.9,
    });
    const spindleMesh = new THREE.Mesh(spindleGeo, spindleMat);
    spindleMesh.position.y = 0.1;
    gimbalGroup.add(spindleMesh);

    // Horizontal Gimbal Crossbar
    const armGeo = new THREE.BoxGeometry(2.3, 0.22, 0.45);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.7,
    });
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.position.y = 0.26;
    gimbalGroup.add(armMesh);

    // --- SENSOR 1: Primary Sensor Probe (Left side) ---
    const primSensorGroup = new THREE.Group();
    primSensorGroup.position.set(-0.8, 0.6, 0);
    gimbalGroup.add(primSensorGroup);

    // Primary housing
    const primHousingGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.65, 24);
    const primHousingMat = new THREE.MeshStandardMaterial({
      color:
        scenario === IndianScenarioType.BHADLA_SOLAR
          ? 0x7c2d12
          : scenario === IndianScenarioType.PUNJAB_AGRICULTURE
            ? 0x365314
            : 0x1e3a8a,
      roughness: 0.4,
      metalness: 0.6,
    });
    const primHousing = new THREE.Mesh(primHousingGeo, primHousingMat);
    primSensorGroup.add(primHousing);

    // Primary Intake Aperture
    const primApertureGeo =
      scenario === IndianScenarioType.BHADLA_SOLAR
        ? new THREE.BoxGeometry(0.55, 0.08, 0.35)
        : scenario === IndianScenarioType.PUNJAB_AGRICULTURE
          ? new THREE.CylinderGeometry(0.12, 0.18, 0.45, 12)
          : new THREE.CylinderGeometry(0.18, 0.18, 0.14, 24);
    const primApertureMat = new THREE.MeshStandardMaterial({
      color: visual.primaryColor,
      roughness: 0.2,
      metalness: 0.8,
    });
    const primAperture = new THREE.Mesh(primApertureGeo, primApertureMat);
    primAperture.position.y = 0.36;
    primSensorGroup.add(primAperture);

    // Primary Optical / Sensing Cone Beam
    const beamGeo =
      scenario === IndianScenarioType.BHADLA_SOLAR
        ? new THREE.CylinderGeometry(0.45, 0.65, 1.6, 12, 1, true)
        : scenario === IndianScenarioType.PUNJAB_AGRICULTURE
          ? new THREE.ConeGeometry(0.3, 1.4, 12, 1, true)
          : new THREE.ConeGeometry(0.55, 2.0, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const primBeam = new THREE.Mesh(beamGeo, beamMat);
    primBeam.position.set(0, 1.4, 0);
    primSensorGroup.add(primBeam);
    primaryBeamRef.current = primBeam;

    // --- SENSOR 2: Redundant Secondary Probe (Right side, Shielded Housing) ---
    const redunSensorGroup = new THREE.Group();
    redunSensorGroup.position.set(0.8, 0.6, 0);
    gimbalGroup.add(redunSensorGroup);

    // Redundant housing (Hermetically shielded design)
    const redunHousingGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.65, 24);
    const redunHousingMat = new THREE.MeshStandardMaterial({
      color:
        scenario === IndianScenarioType.BHADLA_SOLAR
          ? 0x713f12
          : scenario === IndianScenarioType.PUNJAB_AGRICULTURE
            ? 0x166534
            : 0x065f46,
      roughness: 0.4,
      metalness: 0.7,
    });
    const redunHousing = new THREE.Mesh(redunHousingGeo, redunHousingMat);
    redunSensorGroup.add(redunHousing);

    // Protective Cowl / Shield Baffle
    const cowlGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 24, 1, true);
    const cowlMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      metalness: 0.5,
    });
    const cowl = new THREE.Mesh(cowlGeo, cowlMat);
    cowl.position.y = 0.36;
    redunSensorGroup.add(cowl);
    primHousing.visible = scenario === IndianScenarioType.DELHI_AQI;
    redunHousing.visible = scenario === IndianScenarioType.DELHI_AQI;
    cowl.visible = scenario === IndianScenarioType.DELHI_AQI;

    // Redundant Sensing Cone Beam
    const redunBeamMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const redunBeam = new THREE.Mesh(beamGeo, redunBeamMat);
    redunBeam.position.set(0, 1.4, 0);
    redunSensorGroup.add(redunBeam);
    redundantBeamRef.current = redunBeam;

    // Each deployment uses a different transducer package. These are deliberately
    // modeled as distinct assemblies rather than relabeling one generic probe.
    primBeam.visible = scenario === IndianScenarioType.DELHI_AQI;
    redunBeam.visible = scenario === IndianScenarioType.DELHI_AQI;
    if (scenario === IndianScenarioType.DELHI_AQI) {
      const inlet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.7, 16),
        new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.7,
          roughness: 0.35,
        }),
      );
      inlet.rotation.z = Math.PI / 2;
      inlet.position.set(0, 0.42, 0.22);
      primSensorGroup.add(inlet);
      const referenceChamber = new THREE.Mesh(
        new THREE.CylinderGeometry(0.29, 0.29, 0.18, 24),
        new THREE.MeshStandardMaterial({
          color: 0x475569,
          metalness: 0.8,
          roughness: 0.3,
        }),
      );
      referenceChamber.rotation.x = Math.PI / 2;
      referenceChamber.position.set(0, 0.42, 0.2);
      redunSensorGroup.add(referenceChamber);
    } else if (scenario === IndianScenarioType.BHADLA_SOLAR) {
      const domeMaterial = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.15,
        roughness: 0.2,
      });
      const pyranometerDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        domeMaterial,
      );
      pyranometerDome.position.set(0, 0.48, 0);
      primSensorGroup.add(pyranometerDome);
      const referenceCell = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.08, 0.28),
        new THREE.MeshStandardMaterial({
          color: 0x172554,
          metalness: 0.5,
          roughness: 0.25,
        }),
      );
      referenceCell.position.set(0, 0.5, 0);
      redunSensorGroup.add(referenceCell);
      const thermalShield = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.45, 16, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0xd4d4d8,
          metalness: 0.8,
          roughness: 0.4,
        }),
      );
      thermalShield.position.set(0, 0.35, 0.12);
      redunSensorGroup.add(thermalShield);
    } else {
      const soilRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 1.05, 12),
        new THREE.MeshStandardMaterial({
          color: 0x64748b,
          metalness: 0.75,
          roughness: 0.4,
        }),
      );
      soilRod.position.set(0, -0.02, 0);
      primSensorGroup.add(soilRod);
      const soilTines = new THREE.Group();
      for (let i = -1; i <= 1; i += 1) {
        const tine = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 0.55, 10),
          new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.8,
            roughness: 0.35,
          }),
        );
        tine.position.set(i * 0.11, -0.05, 0);
        soilTines.add(tine);
      }
      redunSensorGroup.add(soilTines);
    }

    // The harnesses physically leave each sensing head and join the controller bus.
    const harnessMaterial = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.8,
    });
    const primaryHarness = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.8, 0.15, 0),
        new THREE.Vector3(-0.8, -0.65, 0),
        new THREE.Vector3(0, -0.95, 0),
      ]),
      harnessMaterial,
    );
    const redundantHarness = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.8, 0.15, 0),
        new THREE.Vector3(0.8, -0.65, 0),
        new THREE.Vector3(0, -0.95, 0),
      ]),
      harnessMaterial,
    );
    gimbalGroup.add(primaryHarness, redundantHarness);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Mouse Controls
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      cameraAngle.current.theta -= dx * 0.008;
      cameraAngle.current.phi = Math.max(
        0.15,
        Math.min(Math.PI / 2 - 0.05, cameraAngle.current.phi + dy * 0.008),
      );
      updateCameraPosition();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      cameraAngle.current.radius = Math.max(
        5.0,
        Math.min(14, cameraAngle.current.radius + e.deltaY * 0.008),
      );
      updateCameraPosition();
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    dom.addEventListener("wheel", handleWheel);

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current)
        return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      if (rendererRef.current && rendererRef.current.domElement.parentElement) {
        rendererRef.current.domElement.parentElement.removeChild(
          rendererRef.current.domElement,
        );
      }
    };
  }, [scenario, visual.accentColor]);

  // Synchronize 3D scene elements with incoming hardware state and telemetry
  useEffect(() => {
    if (!gimbalGroupRef.current) return;

    // Convert degrees to radians (Y-axis swivel rotation)
    const targetRad = (hardwareState.actualServoAngle * Math.PI) / 180;

    // Apply mechanical vibration jitter during stabilization
    const vib = hardwareState.vibrationIntensity * 0.06;
    const jitterX = (Math.random() - 0.5) * vib;
    const jitterZ = (Math.random() - 0.5) * vib;

    gimbalGroupRef.current.rotation.y = targetRad + jitterX;
    gimbalGroupRef.current.rotation.z = jitterZ;

    // Update Primary & Redundant beam visibility / active colors based on Relay channel & fault
    if (primaryBeamRef.current && redundantBeamRef.current) {
      const isCh1Active = hardwareState.relayChannel === 1;
      const isStabilizing = hardwareState.vibrationIntensity > 0.05;
      const isSafeDegraded = telemetry?.isSafeDegraded;

      const primMat = primaryBeamRef.current
        .material as THREE.MeshBasicMaterial;
      const redunMat = redundantBeamRef.current
        .material as THREE.MeshBasicMaterial;

      if (isSafeDegraded) {
        primMat.color.setHex(0xf43f5e);
        primMat.opacity = 0.15;
        redunMat.color.setHex(0xf43f5e);
        redunMat.opacity = 0.15;
      } else if (isStabilizing) {
        primMat.color.setHex(0xf59e0b);
        primMat.opacity = 0.4;
        redunMat.color.setHex(0xf59e0b);
        redunMat.opacity = 0.2;
      } else if (isCh1Active) {
        primMat.color.setHex(
          telemetry?.activeFault !== "NONE" ? 0xf43f5e : 0x38bdf8,
        );
        primMat.opacity = 0.45;
        redunMat.color.setHex(0x34d399);
        redunMat.opacity = 0.15;
      } else {
        primMat.color.setHex(0x64748b);
        primMat.opacity = 0.1;
        redunMat.color.setHex(0x10b981);
        redunMat.opacity = 0.55;
      }
    }

    if (cableMeshRef.current) {
      const mat = cableMeshRef.current.material as THREE.MeshStandardMaterial;
      if (hardwareState.cableIntegrity < 0.5) {
        mat.color.setHex(0xf43f5e);
      } else {
        mat.color.setHex(0x10b981);
      }
    }
  }, [hardwareState, telemetry]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden border-y border-slate-800">
      {/* 1. NON-OVERLAPPING TOP INSTRUMENTATION BAR */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-10 font-mono text-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {/* Servo Angle */}
          <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="max-w-[18rem] truncate text-slate-400">
              {visual.sensorAssembly}:
            </span>
            <span className="text-cyan-300 font-bold">
              {Math.round(hardwareState.actualServoAngle)}°
            </span>
          </div>

          {/* Active Electrical Channel */}
          <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 flex items-center gap-1.5 shadow-sm">
            <span className="text-slate-400">{visual.controllerLabel}:</span>
            <span
              className={`max-w-[18rem] break-words font-bold ${hardwareState.relayChannel === 1 ? "text-blue-400" : "text-emerald-400"}`}
            >
              Relay Ch{hardwareState.relayChannel} (
              {hardwareState.relayChannel === 1 ? "Primary" : "Redundant"})
            </span>
          </div>
        </div>

        {/* Center Alert Chips (Vibration or Cable Cut) */}
        <div className="flex max-w-full flex-wrap items-center gap-2">
          {hardwareState.vibrationIntensity > 0.05 && (
            <div className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-600/70 text-amber-300 flex items-center gap-1.5 shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="break-words">
                Stabilizing Vibration:{" "}
                {(hardwareState.vibrationIntensity * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {hardwareState.cableIntegrity < 0.5 && (
            <div className="px-2.5 py-1 rounded bg-rose-950/80 border border-rose-600/70 text-rose-300 flex items-center gap-1.5 shadow-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="break-words">
                Ch1 Cable Severed (Open Circuit)
              </span>
            </div>
          )}
        </div>

        {/* Right Hardware Legend */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Primary (A)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Redundant
            (B)
          </span>
        </div>
      </div>

      {/* 2. THREE.JS 3D CANVAS VIEWPORT (100% CLEAN - NO OVERLAPPING BADGES) */}
      <div className="relative flex-1 w-full min-h-[300px]">
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
        <div className="absolute left-3 top-3 border-l border-amber-400/70 bg-slate-950/70 px-2 py-1 font-mono text-[10px] text-amber-300">
          <span className="max-w-[calc(100vw-2rem)] break-words">
            {visual.siteLabel} · {visual.environmentLabel}
          </span>
        </div>

        {/* Bottom-Right Camera Navigation Controls */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1 z-10 text-[11px] font-mono shadow-md backdrop-blur-sm">
          <button
            onClick={() => resetCamera(0.65, 0.55, 8.5)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset to Default Angle"
          >
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            <span>Reset View</span>
          </button>

          <button
            onClick={() => resetCamera(0, 0.05, 8.0)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Top-down View"
          >
            <span>Top</span>
          </button>

          <button
            onClick={() => resetCamera(0, 1.5, 8.0)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Frontal Horizon View"
          >
            <span>Front</span>
          </button>
        </div>

        {/* Bottom-Left Interaction Hint */}
        <div className="absolute bottom-2.5 left-2.5 text-[10px] font-mono text-slate-500 bg-slate-900/70 px-2 py-0.5 rounded border border-slate-800/80 pointer-events-none">
          Click & Drag to Orbit • Scroll to Zoom
        </div>
      </div>
    </div>
  );
};
