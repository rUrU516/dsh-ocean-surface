import { getCassette, normalizeCassetteParams } from './cassette-catalog.js';
import { WaterField } from './water-field.js';
import { createOceanRenderer } from './ocean-renderer.js';

const TAU = Math.PI * 2;
const STEP = 1 / 60;
const RIPPLE_LIFETIME = 2;
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** CSS coordinates remain unchanged; only the backing store is resolution limited. */
export function effectSize(width, height, dpr = 1, maxResolution = 1100) {
  width = Math.max(0, finite(width));
  height = Math.max(0, finite(height));
  if (!width || !height) return { width, height, pixelWidth: 0, pixelHeight: 0, scaleX: 0, scaleY: 0 };
  const limit = clamp(finite(maxResolution, 1100), 1, 1100);
  const ratio = Math.min(Number.isFinite(dpr) && dpr > 0 ? dpr : 1, 1.5, limit / Math.max(width, height));
  const pixelWidth = Math.max(1, Math.round(width * ratio));
  const pixelHeight = Math.max(1, Math.round(height * ratio));
  return { width, height, pixelWidth, pixelHeight, scaleX: pixelWidth / width, scaleY: pixelHeight / height };
}

/** Compact, smooth radial lens. Zero outside its support, including at the seam. */
export function lensOffset(x, y, px, py, radius, strength) {
  if (!(radius > 0)) return [0, 0];
  const dx = x - px;
  const dy = y - py;
  const q = Math.hypot(dx, dy) / radius;
  if (q >= 1) return [0, 0];
  const weight = (1 - q * q) ** 3 * strength * .32;
  return [dx * weight, dy * weight];
}

/** Bounded radial displacement; age is real seconds, not speed-scaled time. */
export function rippleDisplacement(distance, age, speed, strength) {
  if (age < 0 || age >= RIPPLE_LIFETIME || speed <= 0) return 0;
  const radius = age * (100 + 100 * speed);
  const band = (distance - radius) / 22;
  return Math.sin(band * 2) * Math.exp(-band * band) * (1 - age / RIPPLE_LIFETIME) ** 2 * 9 * strength;
}

/** The original pointer trail: 16ms throttle, 120ms continuity, 7 CSS px sampling. */
export function oceanPointerTrail(previous, point, width, height, fieldWidth, fieldHeight, click) {
  if (!click && previous && point.time - previous.time >= 0 && point.time - previous.time < .016) return null;
  const from = previous && point.time >= previous.time && point.time - previous.time < .12 ? previous : point;
  const dx = (point.x - from.x) * width;
  const dy = (point.y - from.y) * height;
  const count = click ? 1 : clamp(Math.ceil(Math.hypot(dx, dy) / 7), 1, 20);
  const scale = fieldWidth / width;
  const samples = [];
  for (let index = 1; index <= count; index++) {
    const t = index / count;
    samples.push({
      x: (from.x + (point.x - from.x) * t) * fieldWidth,
      y: (from.y + (point.y - from.y) * t) * fieldHeight,
      radius: Math.max(1.8, (click ? 24 : 14) * scale),
      strength: click ? .65 : .17,
    });
  }
  return samples;
}

/** CPU-only animation state; exported to test scheduling without a fake canvas. */
export function createEffectState(id) {
  return { id, phase: 0, time: 0, accumulator: 0, ticks: 0, pointer: null,
    cursor: { x: .5, y: .5, amount: 0 }, rings: [], lastRipple: null };
}

export function updateEffectPointer(state, point, params, reducedMotion, width, height) {
  if (point?.type === 'leave') {
    state.pointer = null;
    state.lastRipple = null;
    return;
  }
  if (!point || !['move', 'down'].includes(point.type) || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
  if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1 || reducedMotion) return;
  const next = { x: point.x, y: point.y, time: finite(point.time, state.time) };
  state.pointer = next;
  if (state.id !== 'ripple' || params.speed <= 0 || params.strength <= 0) return;
  const previous = state.lastRipple;
  const elapsed = previous ? next.time - previous.time : Infinity;
  const distance = previous ? Math.hypot((next.x - previous.x) * width, (next.y - previous.y) * height) : Infinity;
  if (point.type !== 'down' && elapsed >= 0 && (elapsed < .08 || distance < 8)) return;
  state.rings.push({ x: next.x, y: next.y, age: 0, strength: point.type === 'down' ? 1 : .45 });
  if (state.rings.length > 8) state.rings.shift();
  state.lastRipple = next;
}

/** Advances state only; ticks tells the ocean adapter exactly how many 60Hz steps to run. */
export function advanceEffectState(state, dt, params, reducedMotion = false) {
  dt = Math.max(0, finite(dt));
  state.ticks = 0;
  if (reducedMotion) {
    state.accumulator = 0;
    state.cursor.amount = 0;
    state.pointer = null;
    state.rings.length = 0;
    state.lastRipple = null;
    return false;
  }
  if (state.id === 'ocean') {
    if (params.speed <= 0) { state.accumulator = 0; return false; }
    // Preserve the old adapter's .08s catch-up cap and fixed 60Hz damping law.
    const elapsed = Math.min(dt, .08) * params.speed;
    state.phase += elapsed;
    state.accumulator += elapsed;
    state.ticks = Math.floor((state.accumulator + 1e-12) / STEP);
    state.accumulator = Math.max(0, state.accumulator - state.ticks * STEP);
    return true;
  }
  if (state.id === 'ripple') {
    if (params.speed <= 0 || params.strength <= 0) state.rings.length = 0;
    for (const ring of state.rings) ring.age += dt;
    state.rings = state.rings.filter(ring => ring.age < RIPPLE_LIFETIME - 1e-9);
    return state.rings.length > 0;
  }
  const cursor = state.cursor;
  const target = state.pointer;
  const amount = target && params.strength > 0 ? 1 : 0;
  // A stationary pointer settles completely: dot-field must not keep an idle RAF alive.
  const ease = 1 - Math.exp(-dt * 11);
  cursor.amount += (amount - cursor.amount) * ease;
  if (target) {
    cursor.x += (target.x - cursor.x) * ease;
    cursor.y += (target.y - cursor.y) * ease;
  }
  const near = Math.abs(cursor.amount - amount) < .001 && (!target || Math.hypot(cursor.x - target.x, cursor.y - target.y) < .0001);
  if (near || (state.id === 'contour' && params.speed <= 0)) {
    cursor.amount = amount;
    if (target) { cursor.x = target.x; cursor.y = target.y; }
  }
  if (state.id === 'contour') {
    state.phase += Math.min(dt, .08) * params.speed;
    return params.speed > 0;
  }
  return !near;
}

function color(tint, dark, alpha, blue = false) {
  const rgb = [1, 3, 5].map(offset => parseInt(tint.slice(offset, offset + 2), 16));
  // A restrained blue/violet variation of the chosen tint, not an opaque backdrop.
  if (blue) { rgb[0] *= .82; rgb[1] *= 1.02; rgb[2] *= 1.1; }
  const lift = dark ? 1.12 : .8;
  return `rgba(${rgb.map(value => Math.round(clamp(value * lift, 0, 255))).join(',')},${alpha})`;
}

function drawDots(ctx, size, state, params, dark) {
  const { width, height } = size;
  const gap = 25 * params.scale;
  const radius = Math.max(80, Math.min(width, height) * .24);
  const px = state.cursor.x * width;
  const py = state.cursor.y * height;
  for (let group = 0; group < 2; group++) {
    ctx.fillStyle = color(params.tint, dark, dark ? .72 : .6, group === 1);
    ctx.beginPath();
    for (let row = 0, y = gap / 2; y < height; row++, y += gap) {
      for (let col = 0, x = gap / 2; x < width; col++, x += gap) {
        if ((row + col) % 2 !== group) continue;
        const [dx, dy] = lensOffset(x, y, px, py, radius, state.cursor.amount * params.strength);
        const r = .85 * Math.min(params.scale, 1.3);
        ctx.moveTo(x + dx + r, y + dy);
        ctx.arc(x + dx, y + dy, r, 0, TAU);
      }
    }
    ctx.fill();
  }
}

function ripplePoint(x, y, size, state, params) {
  let dx = 0;
  let dy = 0;
  for (const ring of state.rings) {
    const rx = x - ring.x * size.width;
    const ry = y - ring.y * size.height;
    const distance = Math.hypot(rx, ry);
    if (distance < .001) continue;
    const offset = rippleDisplacement(distance, ring.age, params.speed, params.strength * ring.strength);
    dx += rx / distance * offset;
    dy += ry / distance * offset;
  }
  return [x + dx, y + dy];
}

function drawRipple(ctx, size, state, params, dark) {
  const { width, height } = size;
  const gap = 42 * params.scale;
  ctx.strokeStyle = color(params.tint, dark, dark ? .24 : .18);
  ctx.lineWidth = .6;
  ctx.beginPath();
  for (let x = gap / 2; x < width; x += gap) {
    for (let y = 0; y <= height + 8; y += 8) {
      const p = ripplePoint(x, Math.min(y, height), size, state, params);
      if (y === 0) ctx.moveTo(...p); else ctx.lineTo(...p);
    }
  }
  for (let y = gap / 2; y < height; y += gap) {
    for (let x = 0; x <= width + 8; x += 8) {
      const p = ripplePoint(Math.min(x, width), y, size, state, params);
      if (x === 0) ctx.moveTo(...p); else ctx.lineTo(...p);
    }
  }
  ctx.stroke();
  for (const ring of state.rings) {
    const alpha = .34 * params.strength * ring.strength * (1 - ring.age / RIPPLE_LIFETIME) ** 2;
    ctx.strokeStyle = color(params.tint, dark, alpha);
    ctx.lineWidth = .75;
    ctx.beginPath();
    ctx.arc(ring.x * width, ring.y * height, ring.age * (100 + 100 * params.speed), 0, TAU);
    ctx.stroke();
  }
}

function drawContours(ctx, size, state, params, dark) {
  const { width, height } = size;
  const base = Math.min(width, height);
  const phase = state.phase * .16;
  const px = state.cursor.x * width;
  const py = state.cursor.y * height;
  ctx.strokeStyle = color(params.tint, dark, dark ? .42 : .34);
  ctx.lineWidth = .7;
  ctx.beginPath();
  // Seven irregular level loops: small slow deformations, no texture or noise library.
  for (let line = 0; line < 7; line++) {
    const radius = base * (.16 + line * .105) * params.scale;
    for (let index = 0; index <= 128; index++) {
      const angle = index / 128 * TAU;
      const shape = 1 + .075 * Math.sin(angle * 3 + phase + line * .17)
        + .045 * Math.cos(angle * 5 - phase * .7);
      const x = width * .49 + Math.cos(angle) * radius * shape * 1.35;
      const y = height * .54 + Math.sin(angle) * radius * shape * .78;
      const [dx, dy] = lensOffset(x, y, px, py, Math.max(100, base * .38), params.strength * state.cursor.amount);
      if (!index) ctx.moveTo(x + dx, y + dy); else ctx.lineTo(x + dx, y + dy);
    }
  }
  ctx.stroke();
}

/**
 * One canvas, one context type, no events/RAF/DOM/DSH. Call resize with CSS pixels,
 * then frame with dt/time in seconds. Wake the external scheduler after every
 * resize/update/pointer; false means idle, not disposed. params updates are patches.
 * cassette is an id or catalog descriptor and is immutable for this runtime.
 * CSS sizing, opacity, visibility, context loss and canvas replacement belong outside.
 */
export function createEffectRuntime({ canvas, cassette, params, dark = false, reducedMotion = false, onError, maxResolution = 1100 } = {}) {
  const descriptor = getCassette(typeof cassette === 'string' ? cassette : cassette?.id);
  let settings = normalizeCassetteParams(descriptor.id, params && typeof params === 'object' ? params : {});
  const state = createEffectState(descriptor.id);
  let size = effectSize(0, 0);
  let ctx = null;
  let field = null;
  let renderer = null;
  let lastOceanPointer = null;
  let disposed = false;
  let failed = false;
  let reported = false;
  let dirty = true;

  function report(error) {
    if (reported) return;
    reported = true;
    try { if (typeof onError === 'function') onError(error instanceof Error ? error : new Error(String(error))); } catch { /* Reporting cannot break cleanup. */ }
  }
  function release() {
    const current = renderer;
    renderer = null;
    field = null;
    ctx = null;
    lastOceanPointer = null;
    canvas = null;
    state.rings.length = 0;
    state.pointer = null;
    if (current) current.dispose();
  }
  function fail(error) {
    failed = true;
    report(error);
    try { release(); } catch (cleanupError) { report(cleanupError); }
  }
  function ensureResources() {
    if (ctx || renderer) return;
    if (!canvas || typeof canvas.getContext !== 'function') throw new Error('An effect runtime requires a canvas with getContext().');
    if (descriptor.id === 'ocean') {
      const cell = Math.max(size.width, size.height) / 320;
      field = new WaterField(Math.max(32, Math.round(size.width / cell)), Math.max(32, Math.round(size.height / cell)));
      renderer = createOceanRenderer(canvas, field);
    } else {
      ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) throw new Error('Canvas2D unavailable; background artwork disabled.');
    }
  }
  return {
    resize(width, height, dpr = 1) {
      if (disposed || failed) return;
      const nextSize = effectSize(width, height, dpr, maxResolution);
      const geometryChanged = size.width !== nextSize.width || size.height !== nextSize.height;
      size = nextSize;
      dirty = true;
      lastOceanPointer = null;
      state.lastRipple = null;
      if (!size.pixelWidth || !size.pixelHeight) return;
      try {
        if (!canvas) throw new Error('An effect runtime requires a canvas.');
        if (renderer && geometryChanged) {
          // Rebuild size-dependent simulation/GL resources on the SAME canvas/context.
          const previous = renderer;
          renderer = null;
          field = null;
          state.accumulator = 0;
          previous.dispose();
        }
        if (canvas.width !== size.pixelWidth) canvas.width = size.pixelWidth;
        if (canvas.height !== size.pixelHeight) canvas.height = size.pixelHeight;
        ensureResources();
      } catch (error) { fail(error); }
    },
    update(patch = {}) {
      if (disposed || failed || !patch || typeof patch !== 'object') return;
      let changed = false;
      if (patch.params && typeof patch.params === 'object') {
        const next = normalizeCassetteParams(descriptor.id, { ...settings, ...patch.params });
        changed = Object.keys(next).some(key => next[key] !== settings[key]);
        settings = next;
      }
      if (typeof patch.dark === 'boolean' && dark !== patch.dark) { dark = patch.dark; changed = true; }
      if (typeof patch.reducedMotion === 'boolean' && reducedMotion !== patch.reducedMotion) { reducedMotion = patch.reducedMotion; changed = true; }
      if (reducedMotion || settings.speed <= 0) {
        state.accumulator = 0;
        lastOceanPointer = null;
      }
      dirty ||= changed;
    },
    pointer(point) {
      if (disposed || failed || !size.pixelWidth || !size.pixelHeight) return;
      try {
        updateEffectPointer(state, point, settings, reducedMotion, size.width, size.height);
        if (point?.type === 'leave') { lastOceanPointer = null; dirty = true; return; }
        if (descriptor.id === 'ocean') {
          if (!field || reducedMotion || settings.speed <= 0 || !point || !['move', 'down'].includes(point.type)
              || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
          const next = { x: point.x, y: point.y, time: finite(point.time, state.time) };
          const samples = oceanPointerTrail(lastOceanPointer, next, size.width, size.height, field.width, field.height, point.type === 'down');
          if (!samples) return;
          for (const sample of samples) field.disturb(sample.x, sample.y, sample.radius, sample.strength);
          lastOceanPointer = next;
        }
        dirty = true;
      } catch (error) { fail(error); }
    },
    frame(dt, time) {
      if (disposed || failed || !size.pixelWidth || !size.pixelHeight) return false;
      try {
        state.time = finite(time, state.time);
        const needsFrame = advanceEffectState(state, dt, settings, reducedMotion);
        ensureResources();
        if (renderer) {
          for (let tick = 0; tick < state.ticks; tick++) field.step(settings.damping);
          if (dirty || needsFrame || state.ticks) renderer.draw(state.phase, dark, settings);
        } else {
          // Always draw the final resting state once, including the last ripple frame.
          ctx.setTransform(size.scaleX, 0, 0, size.scaleY, 0, 0);
          ctx.clearRect(0, 0, size.width, size.height);
          if (descriptor.id === 'dot-field') drawDots(ctx, size, state, settings, dark);
          else if (descriptor.id === 'ripple') drawRipple(ctx, size, state, settings, dark);
          else drawContours(ctx, size, state, settings, dark);
        }
        dirty = false;
        return needsFrame;
      } catch (error) { fail(error); return false; }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      try { release(); } catch (error) { report(error); }
    },
  };
}
