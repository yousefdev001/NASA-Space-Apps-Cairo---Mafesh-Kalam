import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HAND_DRAWN_TOKENS,
  WOBBLY_RADII,
  getWobblyBorderStyle,
  resolveNextTheme,
} from './handDrawnTokens';

test('HAND_DRAWN_TOKENS includes required light paper and current dark colors', () => {
  assert.equal(HAND_DRAWN_TOKENS.light.background, '#fdfbf7');
  assert.equal(HAND_DRAWN_TOKENS.light.foreground, '#2d2d2d');
  assert.equal(HAND_DRAWN_TOKENS.light.muted, '#e5e0d8');
  assert.equal(HAND_DRAWN_TOKENS.light.accent, '#ff4d4d');
  assert.equal(HAND_DRAWN_TOKENS.light.secondaryAccent, '#2d5da1');
  assert.equal(HAND_DRAWN_TOKENS.light.postIt, '#fff9c4');

  assert.equal(HAND_DRAWN_TOKENS.dark.background, '#000000');
  assert.equal(HAND_DRAWN_TOKENS.dark.accent, '#ff4d00');
  assert.equal(HAND_DRAWN_TOKENS.dark.foreground, '#ffffff');
});

test('WOBBLY_RADII provides multi-axis organic border-radius strings', () => {
  assert.ok(WOBBLY_RADII.wobbly.includes('/'));
  assert.ok(WOBBLY_RADII.wobblyMd.includes('/'));
  assert.deepEqual(getWobblyBorderStyle('wobblyMd'), {
    borderRadius: WOBBLY_RADII.wobblyMd,
  });
});

test('resolveNextTheme toggles between light and dark cleanly', () => {
  assert.equal(resolveNextTheme('light'), 'dark');
  assert.equal(resolveNextTheme('dark'), 'light');
});
