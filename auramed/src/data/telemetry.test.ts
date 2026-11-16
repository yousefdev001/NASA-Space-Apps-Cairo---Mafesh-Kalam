import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCrewTelemetry,
  createMissionTicketId,
  generateEcgWaveformPath,
  validateDeploymentRequest,
} from './telemetry';

test('computeCrewTelemetry returns NOMINAL state for baseline orbit', () => {
  const result = computeCrewTelemetry('vance', 'NOMINAL');
  assert.equal(result.crew.name, 'ELENA VANCE');
  assert.equal(result.status, 'NOMINAL');
  assert.equal(result.suitPressureKpa, 101.3);
  assert.equal(result.heartRateBpm, 68);
});

test('computeCrewTelemetry switches to ELEVATED on EVA spacewalk with 29.6 kPa suit loop', () => {
  const result = computeCrewTelemetry('chen', 'EVA');
  assert.equal(result.status, 'ELEVATED');
  assert.equal(result.suitPressureKpa, 29.6);
  assert.ok(result.heartRateBpm > 90);
});

test('computeCrewTelemetry triggers CRITICAL on solar alert radiation flux', () => {
  const result = computeCrewTelemetry('patel', 'SOLAR_ALERT');
  assert.equal(result.status, 'CRITICAL');
  assert.ok(result.radiationMsvHr >= 0.45);
  assert.ok(result.spo2Percent < 95.5);
});

test('generateEcgWaveformPath builds valid SVG path commands within bounds', () => {
  const path = generateEcgWaveformPath(72, 0.25, 600, 160, 80);
  assert.ok(path.startsWith('M0,'));
  const segments = path.split(' ');
  assert.equal(segments.length, 81);
  assert.ok(segments[segments.length - 1].startsWith('L600,'));
});

test('validateDeploymentRequest rejects empty and invalid inputs', () => {
  const invalid = validateDeploymentRequest({
    fullName: 'A',
    email: 'not-an-email',
    organization: '',
    missionScope: 'LEO Crew Telemetry',
  });
  assert.ok(invalid.fullName);
  assert.ok(invalid.email);
  assert.ok(invalid.organization);

  const valid = validateDeploymentRequest({
    fullName: 'Dr. Hannah Cho',
    email: 'h.cho@orbital-ops.org',
    organization: 'Orbital Flight Medicine',
    missionScope: 'EVA Suit Diagnostics',
  });
  assert.deepEqual(valid, {});
});

test('createMissionTicketId produces deterministic AM-prefixed ticket codes', () => {
  const ticketA = createMissionTicketId('h.cho@orbital-ops.org', 'Orbital Flight Medicine');
  const ticketB = createMissionTicketId('  H.CHO@ORBITAL-OPS.ORG ', 'orbital flight medicine');
  assert.equal(ticketA, ticketB);
  assert.match(ticketA, /^AM-[A-Z0-9]{6}$/);
});
