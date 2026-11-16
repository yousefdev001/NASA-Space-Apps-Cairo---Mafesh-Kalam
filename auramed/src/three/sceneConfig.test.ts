import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampCameraZoom,
  computeExplodedOffsets,
  getCameraPreset,
  SUBSYSTEM_INFO,
} from './sceneConfig';

test('getCameraPreset returns matching preset including Crew Capsule', () => {
  const astro = getCameraPreset('astronaut');
  assert.equal(astro.id, 'astronaut');
  assert.equal(astro.defaultExplode, 0);

  const capsule = getCameraPreset('capsule');
  assert.equal(capsule.id, 'capsule');
  assert.equal(capsule.label, 'Crew Capsule');

  const exploded = getCameraPreset('exploded');
  assert.equal(exploded.defaultExplode, 1);
  assert.equal(exploded.position.length, 3);
});

test('clampCameraZoom constrains zoom distance within safe bounds', () => {
  assert.equal(clampCameraZoom(1.2), 2.6);
  assert.equal(clampCameraZoom(6.45), 6.45);
  assert.equal(clampCameraZoom(24), 16);
});

test('computeExplodedOffsets clamps input between 0 and 1 and separates parts cleanly', () => {
  const collapsed = computeExplodedOffsets(-0.5);
  assert.deepEqual(collapsed, {
    helmetY: 0,
    visorZ: 0,
    chestZ: 0,
    plssZ: 0,
    leftArmX: 0,
    rightArmX: 0,
  });

  const full = computeExplodedOffsets(1.5);
  assert.ok(full.helmetY > 0.5);
  assert.ok(full.visorZ > 0.4);
  assert.ok(full.chestZ > 0.3);
  assert.ok(full.plssZ < -0.5);
  assert.equal(full.leftArmX, -full.rightArmX);
});

test('SUBSYSTEM_INFO defines metadata for all interactive 3D targets', () => {
  assert.ok(SUBSYSTEM_INFO.helmet.title.includes('VISOR'));
  assert.ok(SUBSYSTEM_INFO['chest-ecg'].code.includes('DCM'));
  assert.ok(SUBSYSTEM_INFO.plss.metric.includes('KPA'));
  assert.ok(SUBSYSTEM_INFO.spacecraft.title.includes('HABITAT'));
  assert.ok(SUBSYSTEM_INFO.capsule.title.includes('VEHICLE'));
});
