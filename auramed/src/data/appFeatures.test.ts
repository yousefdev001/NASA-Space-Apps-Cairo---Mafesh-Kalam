import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_FEATURES, filterAppFeatures } from './appFeatures';

test('APP_FEATURES contains all 6 core AuraMed modules in English', () => {
  assert.equal(APP_FEATURES.length, 6);
  for (const item of APP_FEATURES) {
    assert.ok(item.title.length > 4);
    assert.ok(item.highlights.length >= 3);
  }
});

test('filterAppFeatures filters accurately by category', () => {
  assert.equal(filterAppFeatures('all').length, 6);
  assert.equal(filterAppFeatures('medical').length, 2);
  assert.equal(filterAppFeatures('ai-comms').length, 2);
  assert.equal(filterAppFeatures('resilience').length, 2);
});
