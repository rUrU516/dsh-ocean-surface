import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceEffectState, createEffectRuntime, createEffectState, effectSize,
  lensOffset, oceanPointerTrail, rippleDisplacement, updateEffectPointer,
} from './effect-runtime.js';
import { getCassette, normalizeCassetteParams } from './cassette-catalog.js';

const paramsFor = (id, patch = {}) => normalizeCassetteParams(id, patch);
const close = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≉ ${expected}`);

test('backing resolution is bounded while CSS coordinates are preserved', () => {
  const size = effectSize(2200, 1100, 3);
  assert.deepEqual(size, { width: 2200, height: 1100, pixelWidth: 1100, pixelHeight: 550, scaleX: .5, scaleY: .5 });
  const small = effectSize(200, 100, 3);
  assert.equal(small.pixelWidth, 300);
  assert.equal(small.pixelHeight, 150);
  const preview = effectSize(1200, 800, 2, 600);
  assert.equal(preview.width, 1200);
  assert.equal(preview.pixelWidth, 600);
  assert.equal(preview.pixelHeight, 400);
  assert.equal(effectSize(4000, 2000, 2, 10000).pixelWidth, 1100);
});

test('zero/nonfinite size suspends; thin and fractional sizes remain valid', () => {
  for (const [w, h] of [[0, 400], [-20, 10], [NaN, 50], [50, Infinity]]) {
    assert.equal(effectSize(w, h).pixelWidth, 0);
    assert.equal(effectSize(w, h).pixelHeight, 0);
  }
  const thin = effectSize(1e-3, 4000, NaN);
  assert.equal(thin.pixelWidth, 1);
  assert.equal(thin.pixelHeight, 1100);
  assert.ok(thin.scaleX > 0 && thin.scaleY > 0);
  for (const width of [1, 20.3, 733.5, 1100, 10000]) {
    for (const height of [1, 127.3, 960, 13000]) {
      const size = effectSize(width, height, 4);
      assert.ok(Math.max(size.pixelWidth, size.pixelHeight) <= 1100);
      close(size.scaleX * size.width, size.pixelWidth);
      close(size.scaleY * size.height, size.pixelHeight);
    }
  }
});

test('compact lens has a fixed center, smooth seam, symmetric bounded displacement', () => {
  assert.deepEqual(lensOffset(10, 10, 10, 10, 100, 1), [0, 0]);
  assert.deepEqual(lensOffset(120, 10, 10, 10, 100, 1), [0, 0]);
  assert.deepEqual(lensOffset(1, 1, 0, 0, 0, 1), [0, 0]);
  const a = lensOffset(40, 20, 0, 0, 100, .7);
  const b = lensOffset(-40, -20, 0, 0, 100, .7);
  close(a[0], -b[0]);
  close(a[1], -b[1]);
  assert.ok(Math.hypot(...a) < 100 * .7);
  assert.ok(Math.hypot(...lensOffset(99.99, 0, 0, 0, 100, 1)) < 1e-8);
  assert.deepEqual(lensOffset(40, 20, 0, 0, 100, 0), [0, 0]);
});

test('ripple wave is compact in time, bounded, zero for disabled motion', () => {
  for (const age of [-1, 2, 3]) assert.equal(rippleDisplacement(100, age, .65, 1), 0);
  assert.equal(rippleDisplacement(100, .5, 0, 1), 0);
  assert.equal(rippleDisplacement(100, .5, .65, 0), 0);
  for (let age = 0; age < 2; age += .03) {
    for (let distance = 0; distance < 600; distance += 7) {
      const offset = rippleDisplacement(distance, age, 1.5, 1.5);
      assert.ok(Number.isFinite(offset));
      assert.ok(Math.abs(offset) <= 13.5);
    }
  }
});

test('dot-field idles immediately then settles both held pointer and leave', () => {
  const state = createEffectState('dot-field');
  const params = paramsFor('dot-field');
  assert.equal(advanceEffectState(state, 1 / 60, params), false);
  updateEffectPointer(state, { x: .8, y: .3, type: 'move', time: 1 }, params, false, 1000, 600);
  assert.equal(advanceEffectState(state, 1 / 60, params), true);
  let frames = 0;
  while (advanceEffectState(state, 1 / 60, params) && frames++ < 300) { /* pure state */ }
  assert.ok(frames < 100);
  assert.equal(state.cursor.amount, 1);
  assert.equal(state.cursor.x, .8);
  assert.equal(advanceEffectState(state, 1 / 60, params), false);
  updateEffectPointer(state, { type: 'leave' }, params, false, 1000, 600);
  frames = 0;
  while (advanceEffectState(state, 1 / 60, params) && frames++ < 300) { /* pure state */ }
  assert.ok(frames < 100);
  assert.equal(state.cursor.amount, 0);
});

test('ripple trigger throttles movement, accepts clicks, limits history, ends after two seconds', () => {
  const state = createEffectState('ripple');
  const params = paramsFor('ripple');
  assert.equal(advanceEffectState(state, .1, params), false);
  updateEffectPointer(state, { x: .2, y: .2, type: 'move', time: 0 }, params, false, 1000, 600);
  updateEffectPointer(state, { x: .5, y: .5, type: 'move', time: .01 }, params, false, 1000, 600);
  assert.equal(state.rings.length, 1);
  updateEffectPointer(state, { x: .2, y: .2, type: 'move', time: .2 }, params, false, 1000, 600);
  assert.equal(state.rings.length, 1, 'stationary pointer does not emit waves');
  for (let i = 0; i < 12; i++) updateEffectPointer(state, { x: .5, y: .5, type: 'down', time: .2 + i * .01 }, params, false, 1000, 600);
  assert.equal(state.rings.length, 8);
  assert.equal(advanceEffectState(state, 1.99, params), true);
  assert.equal(advanceEffectState(state, .01, params), false);
  assert.equal(state.rings.length, 0);
});

test('ripple age is real seconds, independent of speed; zero speed does not keep a tail alive', () => {
  for (const speed of [.2, .65, 1.5]) {
    const state = createEffectState('ripple');
    const params = paramsFor('ripple', { speed });
    updateEffectPointer(state, { x: .5, y: .5, type: 'down' }, params, false, 400, 300);
    for (let frame = 0; frame < 119; frame++) assert.equal(advanceEffectState(state, 1 / 60, params), true);
    assert.equal(advanceEffectState(state, 1 / 60, params), false);
  }
  const state = createEffectState('ripple');
  updateEffectPointer(state, { x: .5, y: .5, type: 'down' }, paramsFor('ripple'), false, 400, 300);
  assert.equal(advanceEffectState(state, .01, paramsFor('ripple', { speed: 0 })), false);
});

test('contour is continuous except speed zero or reduced motion, with stable speed integration', () => {
  const state = createEffectState('contour');
  assert.equal(advanceEffectState(state, .05, paramsFor('contour', { speed: .3 })), true);
  close(state.phase, .015);
  assert.equal(advanceEffectState(state, .05, paramsFor('contour', { speed: 1.2 })), true);
  close(state.phase, .075);
  assert.equal(advanceEffectState(state, .05, paramsFor('contour', { speed: 0 })), false);
  close(state.phase, .075);
  assert.equal(advanceEffectState(state, .05, paramsFor('contour'), true), false);
  close(state.phase, .075);
});

test('reduced motion suppresses interaction and clears all pending motion in every cassette', () => {
  for (const id of ['dot-field', 'ripple', 'contour', 'ocean']) {
    const state = createEffectState(id);
    const params = paramsFor(id);
    updateEffectPointer(state, { x: .8, y: .2, type: 'down' }, params, false, 900, 600);
    advanceEffectState(state, .02, params);
    const phase = state.phase;
    assert.equal(advanceEffectState(state, 1, params, true), false);
    assert.equal(state.cursor.amount, 0);
    assert.equal(state.rings.length, 0);
    assert.equal(state.pointer, null);
    assert.equal(state.accumulator, 0);
    assert.equal(state.ticks, 0);
    assert.equal(state.phase, phase);
    updateEffectPointer(state, { x: .2, y: .8, type: 'down' }, params, true, 900, 600);
    assert.equal(state.pointer, null);
  }
});

test('ocean fixed ticks match 60Hz at 30/60/120fps and preserve phase over speed changes', () => {
  for (const fps of [30, 60, 120]) {
    const state = createEffectState('ocean');
    let ticks = 0;
    for (let frame = 0; frame < fps; frame++) {
      assert.equal(advanceEffectState(state, 1 / fps, paramsFor('ocean')), true);
      ticks += state.ticks;
    }
    assert.equal(ticks, 60);
    close(state.phase, 1);
    close(state.accumulator, 0);
    advanceEffectState(state, .05, paramsFor('ocean', { speed: .5 }));
    close(state.phase, 1.025);
    assert.equal(advanceEffectState(state, .05, paramsFor('ocean', { speed: 0 })), false);
    close(state.phase, 1.025);
  }
});

test('ocean catches up at most .08 seconds, sanitizes elapsed values, and freezes speed zero', () => {
  const state = createEffectState('ocean');
  const params = paramsFor('ocean', { speed: 2 });
  advanceEffectState(state, 100, params);
  assert.equal(state.ticks, 9);
  close(state.phase, .16);
  for (const dt of [-1, NaN, Infinity]) {
    advanceEffectState(state, dt, params);
    assert.equal(state.ticks, 0);
    close(state.phase, .16);
  }
  assert.equal(advanceEffectState(state, .1, paramsFor('ocean', { speed: 0 })), false);
  assert.equal(state.accumulator, 0);
});

test('ocean pointer trail preserves old movement sampling, radius and click strengths', () => {
  const previous = { x: .1, y: .2, time: 1 };
  const point = { x: .17, y: .2, time: 1.02 };
  assert.equal(oceanPointerTrail(previous, { ...point, time: 1.01 }, 1000, 600, 320, 192, false), null);
  const samples = oceanPointerTrail(previous, point, 1000, 600, 320, 192, false);
  assert.equal(samples.length, 10);
  close(samples.at(-1).x, point.x * 320);
  close(samples.at(-1).y, point.y * 192);
  close(samples[0].radius, 14 * .32);
  assert.equal(samples[0].strength, .17);
  assert.equal(oceanPointerTrail(previous, { ...point, time: 1.2 }, 1000, 600, 320, 192, false).length, 1);
  const click = oceanPointerTrail(previous, point, 1000, 600, 320, 192, true);
  assert.equal(click.length, 1);
  close(click[0].radius, 24 * .32);
  assert.equal(click[0].strength, .65);
  assert.equal(oceanPointerTrail(previous, { x: 1, y: 1, time: 1.02 }, 1000, 600, 320, 192, false).length, 20);
});

test('invalid pointer data is ignored rather than poisoning animation state', () => {
  const state = createEffectState('dot-field');
  const params = paramsFor('dot-field');
  for (const point of [null, {}, { x: NaN, y: .5, type: 'move' }, { x: -.1, y: .5, type: 'down' }, { x: .5, y: 1.1, type: 'move' }, { x: .5, y: .5, type: 'cancel' }]) {
    updateEffectPointer(state, point, params, false, 1000, 600);
    assert.equal(state.pointer, null);
  }
});

// Lifecycle checks below use no DOM, Canvas mock, React mock, or fake rendering.
// They deliberately exercise unsized/missing-resource and terminal-state paths only.
test('runtime is lazy and an unsized runtime requires no browser resources', () => {
  const errors = [];
  for (const cassette of ['dot-field', 'ripple', 'contour', 'ocean', getCassette('dot-field')]) {
    const runtime = createEffectRuntime({ cassette, onError: error => errors.push(error) });
    assert.equal(runtime.frame(.016, 0), false);
    runtime.resize(0, 0);
    runtime.update({ params: { strength: .8 }, dark: true, reducedMotion: true });
    runtime.pointer({ x: .5, y: .5, type: 'down', time: 1 });
    assert.equal(runtime.frame(.016, 1), false);
    runtime.dispose();
    runtime.dispose();
  }
  assert.deepEqual(errors, []);
});

test('missing canvas reports once and permanently stops; onError may dispose synchronously', () => {
  let errors = 0;
  let runtime;
  runtime = createEffectRuntime({ cassette: 'dot-field', onError(error) {
    errors++;
    assert.ok(error instanceof Error);
    runtime.dispose();
  } });
  runtime.resize(800, 600);
  assert.equal(errors, 1);
  runtime.resize(800, 600);
  runtime.update({ params: { strength: .5 } });
  runtime.pointer({ x: .5, y: .5, type: 'down' });
  assert.equal(runtime.frame(.016, 1), false);
  runtime.dispose();
  assert.equal(errors, 1);
});

test('throwing error reporter is contained and failure is terminal', () => {
  let reports = 0;
  const runtime = createEffectRuntime({ cassette: 'ocean', onError() { reports++; throw new Error('reporter failure'); } });
  assert.doesNotThrow(() => runtime.resize(800, 600));
  assert.equal(runtime.frame(.1, 1), false);
  assert.doesNotThrow(() => runtime.resize(800, 600));
  assert.equal(reports, 1);
  assert.doesNotThrow(() => runtime.dispose());
});

test('dispose before initialization makes every API a no-op and is idempotent', () => {
  const runtime = createEffectRuntime({ cassette: 'ripple', onError() { assert.fail('disposed runtime must not acquire resources'); } });
  runtime.dispose();
  for (let i = 0; i < 3; i++) {
    runtime.resize(900, 600, 2);
    runtime.update({ params: { speed: 1.5 } });
    runtime.pointer({ x: .5, y: .5, type: 'down' });
    assert.equal(runtime.frame(.08, i), false);
    runtime.dispose();
  }
});
