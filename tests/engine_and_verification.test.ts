import { SensorShadowEngine } from '../src/simulation/sensorShadowEngine';
import { IndependentVerificationEngine } from '../src/simulation/verificationEngine';
import { IndianScenarioType, FaultCategory, IDFStep } from '../src/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

console.log('--- STARTING SENSORSHADOW-X ENGINE & VERIFICATION TESTS ---');

// Test 1: Independent Verification Mathematical Consistency & Hard Gates
{
  console.log('\n[TEST 1] Testing Verification Engine & Safety Hard Gates...');
  const verifier = new IndependentVerificationEngine();

  // Test 1A: Healthy Nominal Fresh Samples (should pass)
  const nominalFresh = [215, 218, 216, 219, 214, 217];
  const nominalRedun = [216, 217, 215, 218, 216, 216];
  const resHealthy = verifier.evaluateRecovery(nominalFresh, nominalRedun, IndianScenarioType.DELHI_AQI);
  assert(resHealthy.passed, `Nominal samples must pass verification (V=${resHealthy.totalV} >= ${resHealthy.threshold})`);
  assert(!resHealthy.hardGateViolated, 'Healthy data must not trigger hard gate');
  assert(resHealthy.crossSensorConsistency > 0.8, `C_cross must be high for matching channels (${resHealthy.crossSensorConsistency})`);

  // Test 1B: Disconnected Open-Circuit (Mean near 0 while redundant is nominal)
  const disconnectedFresh = [0.1, 0.2, 0.05, 0.15, 0.08, 0.12];
  const activeRedun = [215, 220, 218, 219, 217, 216];
  const resDisconnect = verifier.evaluateRecovery(disconnectedFresh, activeRedun, IndianScenarioType.DELHI_AQI);
  assert(!resDisconnect.passed, 'Disconnected open-circuit must FAIL verification');
  assert(resDisconnect.hardGateViolated, 'Disconnected open-circuit MUST trigger safety hard gate override');
  assert(resDisconnect.totalV === 0.0, `Total V must be forced to 0.0 on safety gate violation (${resDisconnect.totalV})`);

  // Test 1C: Physical Boundary Violation (e.g. negative or impossibly high)
  const impossibleFresh = [2500, 2600, 2450, 2700, 2550, 2650]; // Delhi max is ~720
  const resImpossible = verifier.evaluateRecovery(impossibleFresh, nominalRedun, IndianScenarioType.DELHI_AQI);
  assert(!resImpossible.passed, 'Out-of-physical-range data must fail verification');
  assert(resImpossible.hardGateViolated, 'Extreme physical boundary violation must trigger hard gate');
}

// Test 2: Closed-Loop 17-Step Deterministic Transition & Persistence Rule
{
  console.log('\n[TEST 2] Testing Persistence Rule & Step 6 Fault Detection...');
  const engine = new SensorShadowEngine(IndianScenarioType.DELHI_AQI);

  // Single anomalous tick should NOT immediately jump to physical reconfiguration (filters transient noise)
  engine.getFaultInjector().setFault(FaultCategory.OBSTRUCTION_SOILING, 1.0);
  const t1 = engine.tick(0.5);
  assert(t1.currentStep === IDFStep.STEP_6_FAULT_DETECTION || t1.currentStep === IDFStep.STEP_2_ACQUISITION,
    'Tick 1: Anomaly detected but must wait for persistence');

  // Persistence rule: after 3 consecutive ticks, it must advance to Diagnosis and Candidates
  engine.tick(0.5);
  engine.tick(0.5);
  const t4 = engine.tick(0.5);
  assert(t4.currentStep >= IDFStep.STEP_7_FAULT_DIAGNOSIS,
    `Tick 4: Sustained anomaly must advance state machine (Current Step: ${t4.currentStep})`);
}

// Test 3: History Memory & Candidate Exclusion
{
  console.log('\n[TEST 3] Testing Recovery History Memory & Exclusion...');
  const engine = new SensorShadowEngine(IndianScenarioType.DELHI_AQI);

  // Inject disconnection (cable cut)
  engine.getFaultInjector().setFault(FaultCategory.DISCONNECTION, 1.0);

  // Run simulation ticks through full closed-loop cycle
  for (let i = 0; i < 35; i++) {
    engine.tick(0.5);
  }

  const history = engine.getRecoveryHistory();
  assert(history.length > 0, `Engine must have recorded recovery attempts in history (Count: ${history.length})`);
  
  // The first mechanical candidate for disconnection should have failed and been rejected
  const rejectedRecord = history.find(h => h.faultCategory === FaultCategory.DISCONNECTION && h.outcome === 'REJECTED_FAILED');
  assert(rejectedRecord !== undefined, 'First candidate (mechanical attempt for cable cut) must be recorded as REJECTED_FAILED');

  // Check if second candidate (Relay MUX channel 2 switch) was attempted and succeeded
  const successRecord = history.find(h => h.faultCategory === FaultCategory.DISCONNECTION && h.outcome === 'SUCCESS');
  assert(successRecord !== undefined, 'Second candidate (electrical relay MUX switch) must be executed and recorded as SUCCESS');
  console.log('Recovery History Audit Log verified: system autonomously learned from failed mechanical action and engaged MUX switch!');
}

// Test 4: Catastrophic Failure, Safe Degraded Mode & Technician Field Dispatch Work Order
{
  console.log('\n[TEST 4] Testing Catastrophic Failure & Technician Work Order Dispatch...');
  const engine = new SensorShadowEngine(IndianScenarioType.DELHI_AQI);

  // Trigger catastrophic unrecoverable fault
  engine.triggerCatastrophicUnrecoverableFault();
  const telem = engine.tick(0.5);

  assert(engine.isDegraded(), 'Engine must enter Safe Degraded Mode');
  assert(telem.isSafeDegraded, 'Telemetry must flag isSafeDegraded');
  assert(telem.status === 'SAFE_DEGRADED', 'Status must be SAFE_DEGRADED');

  const workOrder = engine.getActiveWorkOrder();
  assert(workOrder !== null, 'Technician Work Order must be generated');
  assert(workOrder?.severity === 'CRITICAL_DISPATCH', 'Work order severity must be CRITICAL_DISPATCH');
  assert(workOrder?.status === 'PENDING_DISPATCH', 'Work order initial status must be PENDING_DISPATCH');

  // Technician acknowledges dispatch
  engine.acknowledgeWorkOrder();
  assert(engine.getActiveWorkOrder()?.acknowledged === true, 'Work order must be acknowledged');
  assert(engine.getActiveWorkOrder()?.status === 'CREW_EN_ROUTE', 'Status must be CREW_EN_ROUTE');

  // Technician resolves and repairs hardware
  engine.resolveWorkOrderTechnicianRepaired();
  assert(engine.getActiveWorkOrder() === null, 'Work order must be cleared upon repair');
  assert(!engine.isDegraded(), 'System must return to healthy operational monitoring');
  console.log('Technician Field Dispatch and Repair cycle verified successfully!');
}

// Test 5: Every site-specific fault must reach a verified recovery configuration
{
  console.log('\n[TEST 5] Testing all site/fault recovery paths and physical state updates...');
  const expectedState: Record<FaultCategory, { servo?: number; relay?: 1 | 2 }> = {
    [FaultCategory.OBSTRUCTION_SOILING]: { servo: 90 },
    [FaultCategory.DRIFT]: { servo: 45 },
    [FaultCategory.ABNORMAL_ORIENTATION]: { servo: 90 },
    [FaultCategory.DISCONNECTION]: { relay: 2 },
    [FaultCategory.NONE]: {},
    [FaultCategory.DEGRADED_ELEMENT]: { relay: 2 },
  };

  for (const scenario of Object.values(IndianScenarioType)) {
    for (const fault of [
      FaultCategory.OBSTRUCTION_SOILING,
      FaultCategory.DRIFT,
      FaultCategory.ABNORMAL_ORIENTATION,
      FaultCategory.DISCONNECTION,
    ]) {
      const engine = new SensorShadowEngine(scenario);
      engine.getFaultInjector().setFault(fault, 1.0);
      let telemetry = engine.tick(0.5);

      for (let i = 0; i < 160; i += 1) {
        const recovered = engine.getRecoveryHistory().some(
          (record) => record.faultCategory === fault && record.outcome === 'SUCCESS',
        );
        if (recovered) break;
        telemetry = engine.tick(0.5);
      }

      const recovered = engine.getRecoveryHistory().some(
        (record) => record.faultCategory === fault && record.outcome === 'SUCCESS',
      );
      assert(recovered, `${scenario}/${fault} must reach verified recovery (step ${telemetry.currentStep})`);

      const hardware = engine.getHardwareState();
      const expected = expectedState[fault];
      if (expected.servo !== undefined) {
        assert(hardware.servoAngle === expected.servo, `${scenario}/${fault} must update servo angle to ${expected.servo}°`);
      }
      if (expected.relay !== undefined) {
        assert(hardware.relayChannel === expected.relay, `${scenario}/${fault} must switch relay to channel ${expected.relay}`);
      }
    }
  }
}

console.log('\n🎉 ALL SENSORSHADOW-X SIMULATION TESTS PASSED SUCCESSFULLY!\n');
