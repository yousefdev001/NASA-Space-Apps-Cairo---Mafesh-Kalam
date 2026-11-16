import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRunnerTimeScale,
  getLoaderStage,
  shouldBypassLoader,
} from './loaderConfig';

test('shouldBypassLoader honors ?autostart=1 and prefers-reduced-motion', () => {
  assert.equal(shouldBypassLoader('?autostart=1', false), true);
  assert.equal(shouldBypassLoader('?foo=bar&autostart=1', false), true);
  assert.equal(shouldBypassLoader('', true), true);
  assert.equal(shouldBypassLoader('', false), false);
});

test('getLoaderStage progresses cleanly across 0-100 percent', () => {
  assert.equal(getLoaderStage(10).step, 1);
  assert.equal(getLoaderStage(50).step, 2);
  assert.equal(getLoaderStage(80).step, 3);
  assert.equal(getLoaderStage(100).step, 4);
});

test('computeRunnerTimeScale boosts speed gently on scroll velocity within calm bounds', () => {
  assert.equal(computeRunnerTimeScale(0), 1);
  assert.equal(computeRunnerTimeScale(750), 1.5);
  assert.equal(computeRunnerTimeScale(-5000), 1.8);
});

