import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { createAppearanceModel, applySettingsOps } from './appearance-model.js';
import { DECK_DEFAULTS, normalizeDeckSettings, cassettePatch } from './cassette-catalog.js';
import { deckPatchOperations } from './cassette-operations.js';

// The actual shared persistence model against a bounded in-memory Settings contract.
// No React, DOM, pointer, CSS or browser behavior is emulated here.
function settingsFixture({ writable = true, fail = false } = {}) {
  let value = normalizeDeckSettings({ enabled: false, cassette: 'dot-field' });
  let calls = 0;
  const listeners = new Set();
  const form = {
    getSnapshot: () => ({ status: 'ready', writable, value }),
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    async mutate(ops) {
      calls++;
      await delay(15);
      if (fail) return false;
      value = applySettingsOps(value, ops);
      for (const listener of listeners) listener();
      return true;
    },
  };
  const model = createAppearanceModel(form, DECK_DEFAULTS, normalizeDeckSettings, () => 'save refused', deckPatchOperations);
  return { model, value: () => value, calls: () => calls };
}

test('insertion is explicitly saving during optimistic selection, not accepted playback', async () => {
  const fixture = settingsFixture();
  try {
    const { model } = fixture;
    model.update(cassettePatch(model.getSnapshot().settings, 'ocean-surface'));
    assert.equal(model.getSnapshot().settings.cassette, 'ocean-surface');
    assert.equal(model.getSnapshot().saving, true);
    assert.equal(fixture.value().cassette, 'dot-field');
    await delay(290);
    assert.equal(model.getSnapshot().saving, false);
    assert.equal(model.getSnapshot().error, '');
    assert.equal(fixture.value().cassette, 'ocean-surface');
    assert.equal(fixture.value().enabled, false);
    assert.equal(fixture.calls(), 1);
  } finally { fixture.model.dispose(); }
});

test('refused insertion rolls optimistic selection back and preserves background power', async () => {
  const fixture = settingsFixture({ fail: true });
  try {
    fixture.model.update(cassettePatch(fixture.model.getSnapshot().settings, 'ocean-surface'));
    await delay(290);
    const snapshot = fixture.model.getSnapshot();
    assert.equal(snapshot.saving, false);
    assert.equal(snapshot.settings.cassette, 'dot-field');
    assert.equal(snapshot.error, 'save refused');
    assert.equal(fixture.value().enabled, false);
  } finally { fixture.model.dispose(); }
});

test('read-only insertion does not queue or mutate settings', async () => {
  const fixture = settingsFixture({ writable: false });
  try {
    fixture.model.update(cassettePatch(fixture.model.getSnapshot().settings, 'ocean-surface'));
    await delay(260);
    assert.equal(fixture.calls(), 0);
    assert.equal(fixture.model.getSnapshot().saving, false);
    assert.equal(fixture.model.getSnapshot().settings.cassette, 'dot-field');
  } finally { fixture.model.dispose(); }
});
