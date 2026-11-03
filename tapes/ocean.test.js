import oceanTest from 'node:test';
import oceanAssert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  OCEAN_CASSETTE, normalizeOceanParams, OceanWaterField,
  oceanCreateState, oceanAdvance, oceanPointer, createOceanEffect,
} from './ocean.js';

const oceanClose = (actual, expected, tolerance = 1e-10) => oceanAssert.ok(
  Math.abs(actual - expected) <= tolerance, `${actual} should be within ${tolerance} of ${expected}`);
const oceanPeak = field => {
  let peak = 0;
  for (const value of field.current) {
    oceanAssert.ok(Number.isFinite(value), 'water heights remain finite');
    peak = Math.max(peak, Math.abs(value));
  }
  return peak;
};

oceanTest('Host-importable ocean cassette is localized, fixed, immutable and bounded', () => {
  oceanAssert.equal(OCEAN_CASSETTE.id, 'ocean-surface');
  oceanAssert.equal(OCEAN_CASSETTE.number, '02');
  oceanAssert.equal(OCEAN_CASSETTE.source, 'tapes/ocean.js');
  oceanAssert.deepEqual(OCEAN_CASSETTE.name, { zh: '海面水波', en: 'Ocean Surface' });
  oceanAssert.equal(OCEAN_CASSETTE.renderer, 'webgl');
  oceanAssert.equal(OCEAN_CASSETTE.continuous, true);
  oceanAssert.equal(OCEAN_CASSETTE.maxResolution, 1100);
  oceanAssert.deepEqual(OCEAN_CASSETTE.contextAttributes, {
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: 'low-power', preserveDrawingBuffer: false,
  });
  oceanAssert.deepEqual(OCEAN_CASSETTE.controls, []);
  oceanAssert.deepEqual(OCEAN_CASSETTE.defaults, {
    tint: '#ffffff', brightness: 1.57, opacity: .5, waveStrength: 2, speed: .45, damping: .74,
  });
  for (const value of [OCEAN_CASSETTE, OCEAN_CASSETTE.defaults, OCEAN_CASSETTE.contextAttributes,
    OCEAN_CASSETTE.controls, OCEAN_CASSETTE.name, OCEAN_CASSETTE.colors]) oceanAssert.ok(Object.isFrozen(value));
  oceanAssert.ok(OCEAN_CASSETTE.subtitle.zh && OCEAN_CASSETTE.subtitle.en &&
    OCEAN_CASSETTE.mood.zh && OCEAN_CASSETTE.mood.en);
});

oceanTest('normalization always selects the accepted preset without an external tuning channel', () => {
  for (const input of [undefined, null, false, 'ocean', {},
    { tint: '#000000', brightness: 0, opacity: 0, waveStrength: 0, speed: 0, damping: 0 },
    { tint: 'bad', opacity: NaN, speed: Infinity, strength: 99, scale: 99 }]) {
    oceanAssert.deepEqual(normalizeOceanParams(input), OCEAN_CASSETTE.defaults);
  }
  const normalized = normalizeOceanParams();
  normalized.speed = 9;
  oceanAssert.equal(normalizeOceanParams().speed, .45, 'normalization returns a fresh value, not mutable defaults');
});

oceanTest('the copied shaders are exactly the original ocean artwork, not a replacement ring effect', async () => {
  const source = await readFile(new URL('./ocean.js', import.meta.url), 'utf8');
  // SHA256 of the original ocean-renderer.js shader strings, including whitespace.
  // Golden values avoid requiring those retired modules in this cassette's tests.
  const originalHashes = {
    vertex: '3769c9b5c37bd19d1ef5fdd3edd850ece729475726330c40951cba3bef5e27c1',
    fragment: '246435aa0c8f183eae24d147135ae22f68beed32647b56cd77f6b42c59fc387a',
  };
  for (const stage of ['vertex', 'fragment']) {
    const pattern = new RegExp(`const ${stage} = compile\\(gl\\.[A-Z_]+, (\`[\\s\\S]*?\`)\\);`);
    const shader = source.match(pattern)?.[1];
    oceanAssert.ok(shader, `${stage} shader exists`);
    oceanAssert.equal(createHash('sha256').update(shader).digest('hex'), originalHashes[stage],
      `${stage} shader must remain verbatim`);
  }
  oceanAssert.doesNotMatch(source, /^import\s/m, 'one module owns the complete implementation');
  oceanAssert.doesNotMatch(source, /\b(?:document|window|requestAnimationFrame|cancelAnimationFrame)\b/,
    'the tape owns no browser scheduling or DOM');
});

oceanTest('simulation validates sizes, disturbances, damping and normal output buffers', () => {
  for (const args of [[0, 2], [2, -1], [2.5, 3], [NaN, 3], [3, Infinity]]) {
    oceanAssert.throws(() => new OceanWaterField(...args), RangeError);
  }
  const field = new OceanWaterField(9, 7);
  for (const args of [[NaN, 3, 2, 1], [3, Infinity, 2, 1], [3, 3, 0, 1], [3, 3, Infinity, 1], [3, 3, 2, NaN]]) {
    oceanAssert.throws(() => field.disturb(...args), RangeError);
  }
  for (const damping of [-.1, 1.1, Infinity, NaN, '0.2', null]) {
    oceanAssert.throws(() => field.step(damping), RangeError);
  }
  oceanAssert.throws(() => field.writeNormals(new Uint8Array(9 * 7 * 4 - 1)), RangeError);
  oceanAssert.throws(() => field.writeNormals(new Float32Array(9 * 7 * 4)), TypeError);
  oceanAssert.equal(oceanPeak(field), 0);
});

oceanTest('the embedded simulation reproduces every original height and normal byte', () => {
  const embedded = new OceanWaterField(47, 39);
  const heights = createHash('sha256');
  const normals = createHash('sha256');
  for (let tick = 0; tick < 360; tick++) {
    if (tick < 140 && tick % 7 === 0) {
      embedded.disturb(23 + Math.sin(tick * .1) * 18, 19 + Math.cos(tick * .2) * 11,
        3.2, tick % 2 ? -.4 : .65);
    }
    embedded.step(.74);
    // Explicit little-endian bytes make this original WaterField golden portable.
    const bytes = new Uint8Array(embedded.current.length * 4);
    const view = new DataView(bytes.buffer);
    for (let index = 0; index < embedded.current.length; index++) {
      view.setFloat32(index * 4, embedded.current[index], true);
    }
    heights.update(bytes);
    normals.update(embedded.writeNormals(new Uint8Array(47 * 39 * 4)));
  }
  oceanAssert.equal(heights.digest('hex'), '8bc443beceb8449d48e075daf42649cb59d85e8448ccdbe0b3e2010274356e7e');
  oceanAssert.equal(normals.digest('hex'), '3bd41657e229e517b8d8ac4b60f02b32d4d1b96a48b6474c5654e10e0d35aeb5');
});

oceanTest('flat water stays zero and uses the original signed slope encoding', () => {
  for (const [width, height] of [[1, 1], [1, 7], [7, 1], [17, 13]]) {
    const field = new OceanWaterField(width, height);
    for (let tick = 0; tick < 120; tick++) field.step(.74);
    oceanAssert.equal(oceanPeak(field), 0);
    const pixels = field.writeNormals(new Uint8Array(width * height * 4));
    for (let index = 0; index < pixels.length; index += 4) {
      oceanAssert.deepEqual([...pixels.subarray(index, index + 4)], [128, 128, 128, 255]);
    }
  }
  const plane = new OceanWaterField(3, 3);
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) plane.current[y * 3 + x] = .1 * (x - 1) - .05 * (y - 1);
  }
  oceanAssert.deepEqual([...plane.writeNormals(new Uint8Array(36)).subarray(16, 20)], [159, 112, 128, 255]);
});

oceanTest('pointer waves propagate, stay finite under forcing, and decay at accepted damping', () => {
  const field = new OceanWaterField(47, 39);
  field.disturb(23, 19, 2, .65);
  const remote = 19 * 47 + 28;
  let remotePeak = 0;
  for (let tick = 0; tick < 35; tick++) {
    field.step(.74);
    remotePeak = Math.max(remotePeak, Math.abs(field.current[remote]));
  }
  oceanAssert.ok(remotePeak > .001, 'a disturbance propagates outside its initial support');
  for (let tick = 0; tick < 600; tick++) {
    field.disturb(23 + Math.sin(tick * .1) * 14, 19, 3, tick % 2 ? 1e100 : -1e100);
    field.step(.74);
    oceanAssert.ok(oceanPeak(field) <= 1);
  }
  for (let tick = 0; tick < 1200; tick++) field.step(.74);
  oceanAssert.ok(oceanPeak(field) < 1e-5);
});

oceanTest('state keeps original 320-cell geometry for landscape, portrait and narrow surfaces', () => {
  for (const [width, height, columns, rows] of [[1000, 500, 320, 160], [500, 1000, 160, 320], [1000, 1, 320, 32]]) {
    const state = oceanCreateState(width, height);
    oceanAssert.equal(state.field.width, columns);
    oceanAssert.equal(state.field.height, rows);
    oceanAssert.equal(state.pointer, null);
    oceanAssert.equal(state.time, 0);
  }
  for (const args of [[0, 1], [1, -1], [NaN, 4], [3, Infinity]]) {
    oceanAssert.throws(() => oceanCreateState(...args), RangeError);
  }
});

oceanTest('active time advances ambient swell even with a flat field and bounds suspension debt', () => {
  const normal = oceanCreateState(1000, 500);
  const split = oceanCreateState(1000, 500);
  oceanAssert.equal(oceanAdvance(normal, 1 / 30), true);
  oceanAdvance(split, 1 / 60);
  oceanAdvance(split, 1 / 60);
  oceanClose(normal.time, .45 / 30);
  oceanClose(normal.time, split.time);
  oceanClose(normal.accumulator, split.accumulator);
  oceanAssert.equal(oceanPeak(normal.field), 0, 'ambient movement belongs to the original shader, not injected rings');
  const capped = oceanCreateState(1000, 500);
  const reference = oceanCreateState(1000, 500);
  for (const state of [capped, reference]) oceanPointer(state, { type: 'down', x: .3, y: .6 });
  oceanAdvance(capped, 10000);
  oceanAdvance(reference, .08);
  oceanClose(capped.time, .036);
  oceanAssert.deepEqual(capped.field.current, reference.field.current);
  oceanAssert.ok(capped.accumulator >= 0 && capped.accumulator < 1 / 60);
  for (const dt of [NaN, Infinity, -1, 0]) oceanAdvance(capped, dt);
  oceanClose(capped.time, .036);
});

oceanTest('reduced motion freezes the complete frame, discards pointer state and pauses active time', () => {
  const state = oceanCreateState(1000, 500);
  oceanPointer(state, { type: 'down', x: .2, y: .8, time: 1 });
  oceanAdvance(state, 1 / 30);
  const heights = state.field.current.slice();
  const normals = state.field.writeNormals(new Uint8Array(state.field.width * state.field.height * 4));
  const time = state.time;
  for (let frame = 0; frame < 5; frame++) {
    oceanAssert.equal(oceanAdvance(state, 1000, true), false);
    oceanAssert.equal(oceanPointer(state, { type: 'down', x: .9, y: .1, time: frame + 2 }, true), false);
  }
  oceanAssert.equal(state.time, time);
  oceanAssert.equal(state.accumulator, 0);
  oceanAssert.equal(state.pointer, null);
  oceanAssert.deepEqual(state.field.current, heights);
  oceanAssert.deepEqual(state.field.writeNormals(new Uint8Array(normals.length)), normals);
  oceanAssert.equal(oceanAdvance(state, 1 / 60), true);
  oceanClose(state.time, time + .45 / 60);
});

oceanTest('first pointer and re-entry disturb only the actual position, never the center or old visit', () => {
  const state = oceanCreateState(1000, 500);
  oceanAssert.equal(oceanPointer(state, { type: 'move', x: .9, y: .1, time: 1 }), true);
  oceanAssert.equal(state.field.current[80 * 320 + 160], 0, 'no initial center-to-pointer trail');
  const before = state.field.current.slice();
  oceanAssert.equal(oceanPointer(state, { type: 'leave' }), false);
  oceanAssert.equal(state.pointer, null);
  oceanPointer(state, { type: 'move', x: .1, y: .9, time: 1.05 });
  const fresh = oceanCreateState(1000, 500);
  oceanPointer(fresh, { type: 'move', x: .1, y: .9, time: 1.05 });
  for (let index = 0; index < before.length; index++) {
    oceanClose(state.field.current[index] - before[index], fresh.field.current[index], 1e-7);
  }
});

oceanTest('pointer interpolation uses CSS distance and original wake amplitude/radius', () => {
  const state = oceanCreateState(1000, 500);
  const expected = oceanCreateState(1000, 500);
  oceanPointer(state, { type: 'move', x: .1, y: .2, time: 1 });
  oceanPointer(state, { type: 'move', x: .128, y: .2, time: 1.03 });
  const scale = expected.field.width / 1000;
  expected.field.disturb(100 * scale, 100 * scale, 14 * scale, .17);
  // A 28 CSS-pixel move is four original ~7px wake samples, not one giant ring.
  for (const x of [107, 114, 121, 128]) expected.field.disturb(x * scale, 100 * scale, 14 * scale, .17);
  oceanAssert.deepEqual(state.field.current, expected.field.current);
  const before = state.field.current.slice();
  oceanAssert.equal(oceanPointer(state, { type: 'move', x: .13, y: .2, time: 1.031 }), false);
  oceanAssert.deepEqual(state.field.current, before, 'move input is throttled at 16ms');
  oceanAssert.equal(oceanPointer(state, { type: 'down', x: .13, y: .2, time: 1.031 }), true,
    'click is never lost to move throttling');
});

oceanTest('long jumps, stale events and backwards timestamps do not draw connecting trails', () => {
  for (const point of [
    { type: 'move', x: .8, y: .8, time: 1.03 },
    { type: 'move', x: .2, y: .1, time: 2 },
    { type: 'move', x: .2, y: .1, time: .5 },
    { type: 'enter', x: .2, y: .1, time: 1.03 },
  ]) {
    const state = oceanCreateState(1000, 500);
    const fresh = oceanCreateState(1000, 500);
    oceanPointer(state, { type: 'move', x: .1, y: .1, time: 1 });
    const before = state.field.current.slice();
    oceanPointer(state, point);
    oceanPointer(fresh, point);
    for (let index = 0; index < before.length; index++) {
      oceanClose(state.field.current[index] - before[index], fresh.field.current[index], 1e-7);
    }
  }
});

oceanTest('malformed normalized input never poisons the simulation or retains an old visit', () => {
  const state = oceanCreateState(1000, 500);
  for (const point of [null, {}, { type: 'move', x: NaN, y: .2 }, { type: 'move', x: -1, y: .4 },
    { type: 'down', x: .5, y: Infinity }, { type: 'scroll', x: .5, y: .5 }]) {
    oceanAssert.equal(oceanPointer(state, point), false);
    oceanAssert.equal(state.pointer, null);
  }
  oceanAssert.equal(oceanPeak(state.field), 0);
  oceanPointer(state, { type: 'move', x: .2, y: .3 });
  oceanPointer(state, { type: 'move', x: .21, y: .3 });
  oceanAssert.ok(oceanPeak(state.field) > 0, 'untimestamped valid input remains supported');
  oceanAdvance(state, .08);
  oceanAssert.ok(oceanPeak(state.field) <= 1);
});

oceanTest('factory needs no context until the first frame with a valid CSS size', () => {
  // No GL/DOM mock: a genuinely resource-less factory exercises lazy lifecycle.
  const effect = createOceanEffect();
  oceanAssert.equal(effect.frame(1 / 60, 0), false);
  for (const size of [[0, 200], [200, 0], [-1, 200], [NaN, 200], [200, Infinity]]) {
    effect.resize(...size);
    effect.update({ params: { speed: 0 }, dark: true, reducedMotion: true });
    effect.pointer({ type: 'down', x: .5, y: .5 });
    oceanAssert.equal(effect.frame(1 / 60, 0), false);
  }
  effect.resize(1000, 500);
  effect.update({ dark: false, reducedMotion: false });
  effect.pointer({ type: 'move', x: .9, y: .1 });
  oceanAssert.throws(() => effect.frame(1 / 60, 0), /requires a WebGLRenderingContext/);
  oceanAssert.equal(effect.frame(1 / 60, 1), false, 'a reported GL failure cannot schedule forever');
  effect.dispose();
  effect.dispose();
  effect.resize(100, 100);
  effect.update({ reducedMotion: false });
  effect.pointer({ type: 'down', x: .5, y: .5 });
  oceanAssert.equal(effect.frame(1 / 60, 2), false);
});

oceanTest('disposal before first frame is idempotent and never allocates browser resources', () => {
  const effect = createOceanEffect({ reducedMotion: true });
  effect.resize(1000, 500);
  effect.dispose();
  effect.dispose();
  effect.update(null);
  effect.pointer({ type: 'down', x: .5, y: .5 });
  oceanAssert.equal(effect.frame(10, 10000), false);
});
