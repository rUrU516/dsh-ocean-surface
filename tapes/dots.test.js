import dotsTest from 'node:test';
import dotsAssert from 'node:assert/strict';
import {
  DOTS_CASSETTE, normalizeDotsParams, dotsSample,
  dotsCreateInteraction, dotsPointer, dotsAdvanceInteraction, createDotsEffect,
} from './dots.js';

const dotsParams = normalizeDotsParams();
const dotsSize = { width: 522, height: 550, dark: true };
const dotsCursor = { x: .5, y: .5, amount: 1 };
const dotsCenter = { x: 261, y: 275 };
const dotsAt = (distance, options = {}) => dotsSample(dotsCenter.x + distance, dotsCenter.y,
  { ...dotsSize, cursor: dotsCursor, ...options });
const dotsClose = (actual, expected, tolerance = 1e-9) => dotsAssert.ok(Math.abs(actual - expected) <= tolerance,
  `${actual} should be within ${tolerance} of ${expected}`);
const dotsSettle = (state, params = dotsParams, reducedMotion = false) => {
  let frames = 0;
  while (dotsAdvanceInteraction(state, 1 / 60, params, reducedMotion)) {
    dotsAssert.ok(++frames < 240, 'interaction must stop scheduling within four seconds');
  }
  return frames;
};

dotsTest('the complete tape is Host-importable, immutable, localized and a fixed Dots preset', () => {
  dotsAssert.equal(DOTS_CASSETTE.id, 'dot-field');
  dotsAssert.equal(DOTS_CASSETTE.number, '01');
  dotsAssert.equal(DOTS_CASSETTE.source, 'tapes/dots.js');
  dotsAssert.deepEqual(DOTS_CASSETTE.name, { zh: 'Dots', en: 'Dots' });
  dotsAssert.deepEqual(DOTS_CASSETTE.colors, ['#6656c7', '#af7ba9']);
  dotsAssert.equal(DOTS_CASSETTE.renderer, '2d');
  dotsAssert.equal(DOTS_CASSETTE.continuous, false);
  dotsAssert.deepEqual(DOTS_CASSETTE.controls, []);
  dotsAssert.deepEqual(dotsParams, { tint: '#9071c1', opacity: .38, strength: 1, scale: 1, speed: .45 });
  dotsAssert.ok(Object.isFrozen(DOTS_CASSETTE));
  dotsAssert.ok(Object.isFrozen(DOTS_CASSETTE.defaults));
  dotsAssert.ok(DOTS_CASSETTE.subtitle.zh && DOTS_CASSETTE.subtitle.en && DOTS_CASSETTE.mood.zh && DOTS_CASSETTE.mood.en);
});

dotsTest('normalization clamps all original bounds and does not coerce invalid input', () => {
  dotsAssert.deepEqual(normalizeDotsParams(null), dotsParams);
  dotsAssert.deepEqual(normalizeDotsParams({ tint: '#AABBCC', opacity: 9, strength: 9, scale: 9, speed: 9, unknown: 8 }),
    { tint: '#aabbcc', opacity: .65, strength: 1.5, scale: 1.8, speed: 1.5 });
  dotsAssert.deepEqual(normalizeDotsParams({ opacity: -1, strength: -1, scale: -1, speed: -1 }),
    { tint: '#9071c1', opacity: 0, strength: 0, scale: .6, speed: 0 });
  dotsAssert.deepEqual(normalizeDotsParams({ tint: 'red', opacity: NaN, strength: Infinity, scale: '1', speed: null }), dotsParams);
});

dotsTest('quiet base dots are .9px on an 18 CSSpx grid, independent of backing size', () => {
  const sample = dotsSample(9, 9, dotsSize);
  dotsClose(sample.radius, .9);
  dotsClose(sample.spacing, 18);
  dotsClose(sample.alpha, .5);
  dotsClose(sample.dilation, 1);
  dotsAssert.equal(sample.coreAlpha, 0);
  dotsAssert.ok(sample.halos.every(halo => halo.alpha === 0));
  dotsClose(dotsSample(9, 9, { ...dotsSize, dark: false }).alpha, .42);
  dotsClose(dotsSample(9, 9, { ...dotsSize, params: { scale: 1.5 } }).spacing, 27);
});

dotsTest('default spatial palette is a smooth blue-violet→rose-violet gradient, never parity-based', () => {
  const first = dotsSample(0, 0, dotsSize);
  const last = dotsSample(522, 550, dotsSize);
  dotsAssert.deepEqual(first.baseRgb, [102, 86, 199]);
  dotsAssert.deepEqual(last.baseRgb, [175, 123, 169]);
  const row = [0, 18, 36, 54].map(x => dotsSample(x, 90, dotsSize));
  const column = [0, 18, 36, 54].map(y => dotsSample(90, y, dotsSize));
  for (const samples of [row, column]) {
    for (let index = 1; index < samples.length; index++) {
      dotsAssert.ok(samples[index].baseRgb[0] > samples[index - 1].baseRgb[0]);
      dotsAssert.ok(samples[index].baseRgb[2] < samples[index - 1].baseRgb[2]);
    }
    dotsClose(samples[1].baseRgb[0] - samples[0].baseRgb[0], samples[2].baseRgb[0] - samples[1].baseRgb[0]);
  }
  const custom = dotsSample(0, 0, { ...dotsSize, params: { tint: '#8070b0' } });
  dotsAssert.ok(custom.baseRgb[0] < first.baseRgb[0], 'tint changes the whole palette');
  const customFar = dotsSample(522, 550, { ...dotsSize, params: { tint: '#8070b0' } });
  dotsAssert.ok(customFar.baseRgb[0] > custom.baseRgb[0], 'custom tint retains spatial variation');
});

dotsTest('160px compact lens enlarges the center to ~28px gaps and 2.5px luminous dots', () => {
  const center = dotsAt(0);
  const neighbor = dotsAt(18);
  dotsClose(center.radius, 2.5);
  dotsClose(center.alpha, .95);
  dotsClose(center.dilation, 28 / 18);
  dotsClose(neighbor.x - center.x, 28, .4);
  dotsAssert.ok(center.halos[0].radius > center.halos[1].radius);
  dotsAssert.ok(center.halos.every(halo => halo.alpha > 0));
  dotsAssert.ok(center.coreRgb.every(channel => channel > 220), 'dark core is pale lavender');
  const light = dotsAt(0, { dark: false });
  dotsAssert.ok(light.coreRgb.every(channel => channel < 150), 'light theme uses a deep violet, not white');
});

dotsTest('radius, glow, brightness and displacement fade continuously to a quiet finite boundary', () => {
  const distances = [0, 30, 60, 90, 120, 145, 159, 160, 170];
  const samples = distances.map(distance => dotsAt(distance));
  for (let index = 1; index < samples.length; index++) {
    dotsAssert.ok(samples[index].radius <= samples[index - 1].radius);
    dotsAssert.ok(samples[index].alpha <= samples[index - 1].alpha);
    dotsAssert.ok(samples[index].halos[0].alpha <= samples[index - 1].halos[0].alpha);
  }
  const edge = dotsAt(160);
  dotsClose(edge.x, dotsCenter.x + 160);
  dotsClose(edge.radius, .9);
  dotsClose(edge.alpha, .5);
  dotsClose(edge.halos[0].alpha, 0);
  const inner = dotsAt(159.99);
  dotsAssert.ok(Math.abs(inner.x - (dotsCenter.x + 159.99)) < 1e-8);
  dotsAssert.ok(Math.abs(inner.radius - edge.radius) < 1e-10);
  for (const distance of [0, 10, 80, 159, 160, 400]) {
    const sample = dotsAt(distance);
    dotsAssert.ok([sample.x, sample.y, sample.radius, sample.alpha].every(Number.isFinite));
  }
});

dotsTest('bounded radial map never folds even at maximum strength and at every scale', () => {
  for (const scale of [.6, 1, 1.8]) {
    let previous = dotsAt(0, { params: { strength: 1.5, scale } }).x;
    for (let distance = .25; distance <= 200; distance += .25) {
      const current = dotsAt(distance, { params: { strength: 1.5, scale } }).x;
      dotsAssert.ok(current > previous, `radial order must be preserved at ${distance}`);
      dotsAssert.ok((current - previous) / .25 > .45, 'radial derivative stays safely positive');
      previous = current;
    }
  }
  const right = dotsAt(65);
  const left = dotsAt(-65);
  dotsClose(right.x - dotsCenter.x, dotsCenter.x - left.x);
});

dotsTest('strength zero removes lens, glow, enlargement and all additional scheduling', () => {
  const sample = dotsAt(0, { params: { strength: 0 } });
  dotsClose(sample.radius, .9);
  dotsClose(sample.alpha, .5);
  dotsClose(sample.dilation, 1);
  dotsAssert.equal(sample.coreAlpha, 0);
  dotsAssert.ok(sample.halos.every(halo => halo.alpha === 0));
  const state = dotsCreateInteraction();
  dotsPointer(state, { x: .5, y: .5, type: 'move' }, dotsParams);
  dotsAdvanceInteraction(state, .05, dotsParams);
  dotsAssert.equal(dotsAdvanceInteraction(state, .05, normalizeDotsParams({ strength: 0 })), false);
  dotsAssert.equal(state.cursor.amount, 0);
  dotsAssert.equal(state.pointer, null);
});

dotsTest('opacity belongs to the outer surface, not the tape samples', () => {
  const transparent = dotsAt(0, { params: { opacity: 0 } });
  const preview = dotsAt(0, { params: { opacity: .65 } });
  dotsAssert.deepEqual(transparent, preview);
});

dotsTest('first entry starts at the actual pointer and eases only its amount', () => {
  const state = dotsCreateInteraction();
  dotsPointer(state, { x: .92, y: .08, type: 'move', time: 5 }, dotsParams);
  dotsAssert.equal(state.cursor.x, .92);
  dotsAssert.equal(state.cursor.y, .08);
  dotsAssert.equal(state.cursor.amount, 0);
  dotsAssert.equal(dotsAdvanceInteraction(state, 1 / 60, dotsParams), true);
  dotsAssert.ok(state.cursor.amount > 0 && state.cursor.amount < 1);
  dotsAssert.equal(state.cursor.x, .92);
  dotsAssert.equal(state.cursor.y, .08);
});

dotsTest('stationary interaction stops RAF, later movement wakes and reaches the new position', () => {
  const state = dotsCreateInteraction();
  dotsPointer(state, { x: .2, y: .3, type: 'move' }, dotsParams);
  dotsAssert.ok(dotsSettle(state) > 0);
  dotsAssert.equal(state.cursor.amount, 1);
  dotsAssert.equal(dotsAdvanceInteraction(state, 1 / 60, dotsParams), false);
  dotsPointer(state, { x: .8, y: .7, type: 'move' }, dotsParams);
  dotsAssert.equal(dotsAdvanceInteraction(state, 1 / 60, dotsParams), true);
  dotsAssert.ok(state.cursor.x > .2 && state.cursor.x < .8);
  dotsSettle(state);
  dotsAssert.deepEqual(state.cursor, { x: .8, y: .7, amount: 1 });
  dotsAssert.equal(dotsAdvanceInteraction(state, 10, dotsParams), false);
});

dotsTest('leave settles and re-entry does not drift from an old point or canvas center', () => {
  const state = dotsCreateInteraction();
  dotsPointer(state, { x: .1, y: .1, type: 'move' }, dotsParams);
  dotsSettle(state);
  dotsPointer(state, { type: 'leave' }, dotsParams);
  dotsAssert.ok(dotsSettle(state) > 0);
  dotsAssert.equal(state.cursor.amount, 0);
  dotsAssert.equal(state.pointer, null);
  dotsPointer(state, { x: .95, y: .9, type: 'down' }, dotsParams);
  dotsAssert.deepEqual(state.cursor, { x: .95, y: .9, amount: 0 });
  dotsSettle(state);
  dotsAssert.deepEqual(state.cursor, { x: .95, y: .9, amount: 1 });
});

dotsTest('reduced motion clears existing interaction immediately and rejects new pointers', () => {
  const state = dotsCreateInteraction();
  dotsPointer(state, { x: .1, y: .9, type: 'move' }, dotsParams);
  dotsSettle(state);
  dotsAssert.equal(dotsAdvanceInteraction(state, .1, dotsParams, true), false);
  dotsAssert.equal(state.cursor.amount, 0);
  dotsAssert.equal(state.pointer, null);
  dotsPointer(state, { x: .6, y: .4, type: 'move' }, dotsParams, true);
  dotsAssert.equal(state.pointer, null);
  dotsAssert.equal(dotsAdvanceInteraction(state, .1, dotsParams, false), false);
});

dotsTest('invalid pointers and invalid frame deltas cannot poison state', () => {
  const state = dotsCreateInteraction();
  for (const point of [null, {}, { x: NaN, y: .2, type: 'move' }, { x: -1, y: .4, type: 'move' },
    { x: .5, y: Infinity, type: 'move' }, { x: .5, y: .5, type: 'scroll' }]) dotsPointer(state, point, dotsParams);
  dotsAssert.equal(state.pointer, null);
  dotsPointer(state, { x: .4, y: .6, type: 'move' }, dotsParams);
  for (const dt of [NaN, Infinity, -1, 0]) dotsAdvanceInteraction(state, dt, dotsParams);
  dotsAssert.deepEqual(state.cursor, { x: .4, y: .6, amount: 0 });
  dotsAssert.ok(dotsSettle(state) > 0);
});

dotsTest('speed zero remains interactive but never introduces ambient animation', () => {
  const state = dotsCreateInteraction();
  const params = normalizeDotsParams({ speed: 0 });
  dotsAssert.equal(dotsAdvanceInteraction(state, 1 / 60, params), false);
  dotsPointer(state, { x: .7, y: .2, type: 'move' }, params);
  dotsAssert.ok(dotsSettle(state, params) > 0);
  dotsAssert.equal(dotsAdvanceInteraction(state, 1 / 60, params), false);
});

dotsTest('factory works without browser resources and merges partial updates before idempotent disposal', () => {
  // No fake Canvas or DOM: a resource-less instance tests the actual adapter's
  // scheduling and update contract; rendering mathematics is covered above.
  const effect = createDotsEffect({ params: { strength: .8 }, dark: true });
  effect.resize(522, 550);
  dotsAssert.equal(effect.frame(1 / 60, 0), false);
  effect.pointer({ x: .8, y: .2, type: 'move' });
  dotsAssert.equal(effect.frame(1 / 60, .1), true);
  effect.update({ params: { tint: '#7060c0' } });
  dotsAssert.equal(effect.frame(1 / 60, .2), true, 'tint-only patch must preserve active strength');
  effect.update({ params: { strength: 0 } });
  dotsAssert.equal(effect.frame(1 / 60, .3), false);
  effect.update({ params: { strength: 1 }, reducedMotion: true });
  effect.pointer({ x: .1, y: .2, type: 'move' });
  dotsAssert.equal(effect.frame(1 / 60, .4), false);
  effect.update({ reducedMotion: false });
  dotsAssert.equal(effect.frame(1 / 60, .5), false);
  effect.pointer({ x: .9, y: .8, type: 'move' });
  dotsAssert.equal(effect.frame(1 / 60, .6), true);
  effect.dispose();
  effect.dispose();
  effect.resize(400, 400);
  effect.update({ params: { strength: 1.5 } });
  effect.pointer({ x: .5, y: .5, type: 'move' });
  dotsAssert.equal(effect.frame(1 / 60, .7), false);
});
