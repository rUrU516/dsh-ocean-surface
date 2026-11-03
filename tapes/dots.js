// Original Canvas2D artwork. This entire cassette is safe to import on the Host.
// All geometry is in CSS pixels; the caller owns the canvas, transform and clearing.
export const DOTS_CASSETTE = Object.freeze({
  id: 'dot-field', number: '01', source: 'tapes/dots.js',
  name: Object.freeze({ zh: 'Dots', en: 'Dots' }),
  subtitle: Object.freeze({ zh: '静谧点阵，柔光透镜', en: 'Quiet dots, a soft-focus lens' }),
  mood: Object.freeze({ zh: '蓝紫与藕粉之间的一点微光', en: 'A quiet shimmer between violet and rose' }),
  colors: Object.freeze(['#703ae6', '#bc4eda']),
  renderer: '2d', continuous: false,
  defaults: Object.freeze({ tint: '#9071c1', opacity: .85, strength: 1, scale: 1, speed: .45 }),
  // The tape is a fixed art preset, not a settings panel.
  controls: Object.freeze([]),
});

const dotsTau = Math.PI * 2;
const dotsLensRadius = 160;
const dotsDefaultRgb = [144, 113, 193];
const dotsCoolRgb = [112, 58, 230];
const dotsWarmRgb = [188, 78, 218];
const dotsClamp = (value, low, high) => Math.max(low, Math.min(high, value));
const dotsFinite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const dotsMix = (from, to, amount) => from.map((value, index) => value + (to[index] - value) * amount);
const dotsCssRgb = rgb => `rgb(${rgb.map(value => Math.round(value)).join(',')})`;

export function normalizeDotsParams(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const defaults = DOTS_CASSETTE.defaults;
  const bounded = (key, low, high) => dotsClamp(dotsFinite(source[key], defaults[key]), low, high);
  return {
    tint: typeof source.tint === 'string' && /^#[0-9a-f]{6}$/i.test(source.tint) ? source.tint.toLowerCase() : defaults.tint,
    opacity: bounded('opacity', 0, 1), strength: bounded('strength', 0, 1.5),
    scale: bounded('scale', .6, 1.8), speed: bounded('speed', 0, 1.5),
  };
}

function dotsPalette(params, dark) {
  const tint = [1, 3, 5].map(offset => parseInt(params.tint.slice(offset, offset + 2), 16));
  // Tint shifts the entire palette, never replaces its continuous cool→warm change.
  const color = endpoint => endpoint.map((value, index) =>
    dotsClamp((value + tint[index] - dotsDefaultRgb[index]) * (dark ? 1 : .72), 0, 255));
  return { cool: color(dotsCoolRgb), warm: color(dotsWarmRgb),
    // Keep chroma in the bright center; near-white cores washed out the violet.
    core: dark ? dotsMix(tint, [210, 153, 255], .72) : dotsMix(tint, [67, 36, 108], .72),
    halo: dotsMix(tint, dark ? [157, 70, 255] : [100, 61, 151], dark ? .7 : .45) };
}

function dotsSampleNormalized(x, y, width, height, cursor, params, dark, palette) {
  const blend = dotsClamp(.55 * (width > 0 ? x / width : 0) + .45 * (height > 0 ? y / height : 0), 0, 1);
  const baseRgb = dotsMix(palette.cool, palette.warm, blend);
  const amount = dotsClamp(dotsFinite(cursor?.amount), 0, 1) * params.strength;
  const dx = x - dotsClamp(dotsFinite(cursor?.x), 0, 1) * width;
  const dy = y - dotsClamp(dotsFinite(cursor?.y), 0, 1) * height;
  const q = Math.hypot(dx, dy) / dotsLensRadius;
  // Compact C2 boundary: displacement, brightness, size and halos all reach zero
  // smoothly at 160px. For r'=r(1+A(1-q²)^3), min dr'/dr=1-32A/49.
  // A≤5/6 (strength≤1.5), so dr'/dr≥.455: no radial fold even at maximum strength.
  const falloff = q < 1 ? (1 - q * q) ** 3 : 0;
  const influence = amount * falloff;
  const focus = dotsClamp(influence, 0, 1);
  const dilation = 1 + (5 / 9) * influence;
  // Lift resting dots without enlarging the already approved 2.5px lens center.
  const radius = 1.2 * params.scale + 1.3 * params.scale * influence;
  const baseAlpha = dark ? .5 : .42;
  // No resting grid: reveal only the lens, with a smooth edge and exit fade.
  const visibility = Math.min(1, amount) * (q < 1 ? (1 - q * q) ** 2 : 0);
  return {
    x: x + dx * (dilation - 1), y: y + dy * (dilation - 1),
    radius, baseRadius: 1.2 * params.scale, spacing: 18 * params.scale,
    dilation, influence, blend, baseRgb,
    rgb: dotsMix(baseRgb, palette.core, focus),
    visibility, alpha: (baseAlpha + (.95 - baseAlpha) * focus) * visibility,
    coreAlpha: (.95 - baseAlpha) / (1 - baseAlpha * visibility) * focus,
    coreRgb: palette.core, haloRgb: palette.halo,
    // Only two local, soft translucent layers; never shadowBlur per grid point.
    halos: [
      { radius: radius + 12 * focus, alpha: .18 * focus * focus },
      { radius: radius + 4.5 * focus, alpha: .30 * focus * focus },
    ],
  };
}

/**
 * Pure reference sample. x/y are undeformed CSS coordinates; cursor x/y are
 * normalized [0,1], amount is [0,1]. Opacity is deliberately NOT baked into alpha:
 * the outer surface applies global opacity, and previews can use opacity=1.
 */
export function dotsSample(x, y, { width = 0, height = 0, cursor = null, params, dark = false } = {}) {
  const settings = normalizeDotsParams(params);
  return dotsSampleNormalized(dotsFinite(x), dotsFinite(y), Math.max(0, dotsFinite(width)),
    Math.max(0, dotsFinite(height)), cursor, settings, dark, dotsPalette(settings, dark));
}

/** CPU-only interaction state, exported for real scheduling tests without Canvas/DOM mocks. */
export function dotsCreateInteraction() {
  return { pointer: null, cursor: { x: 0, y: 0, amount: 0 } };
}

function dotsClearInteraction(state) {
  state.pointer = null;
  state.cursor.amount = 0;
}

export function dotsPointer(state, point, params, reducedMotion = false) {
  if (reducedMotion || params.strength <= 0) { dotsClearInteraction(state); return; }
  if (point?.type === 'leave') { state.pointer = null; return; }
  if (!point || !['move', 'down', 'enter'].includes(point.type) || !Number.isFinite(point.x)
      || !Number.isFinite(point.y) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
  // First entry and re-entry after a completed exit start AT the pointer, not the
  // canvas center or the previous visit. Only the lens amount eases into view.
  if (!state.pointer && state.cursor.amount === 0) {
    state.cursor.x = point.x;
    state.cursor.y = point.y;
  }
  state.pointer = { x: point.x, y: point.y };
}

export function dotsAdvanceInteraction(state, dt, params, reducedMotion = false) {
  if (reducedMotion || params.strength <= 0) { dotsClearInteraction(state); return false; }
  const target = state.pointer;
  const targetAmount = target ? 1 : 0;
  // Speed controls response only; there is no ambient animation, even at speed>0.
  const ease = 1 - Math.exp(-Math.min(.1, Math.max(0, dotsFinite(dt))) * (10 + 4 * params.speed));
  state.cursor.amount += (targetAmount - state.cursor.amount) * ease;
  if (target) {
    state.cursor.x += (target.x - state.cursor.x) * ease;
    state.cursor.y += (target.y - state.cursor.y) * ease;
  }
  const settled = Math.abs(state.cursor.amount - targetAmount) < .0005 && (!target
    || Math.hypot(state.cursor.x - target.x, state.cursor.y - target.y) < .00001);
  if (settled) {
    state.cursor.amount = targetAmount;
    if (target) { state.cursor.x = target.x; state.cursor.y = target.y; }
  }
  return !settled;
}

/** A single soft pool ties the individual halos together, fading on pointer leave. */
export function dotsGlowPool(cursor, params, dark) {
  const amount = dotsClamp(dotsFinite(cursor?.amount), 0, 1) * dotsClamp(dotsFinite(params?.strength), 0, 1.5);
  return { radius: 180, alpha: (dark ? .055 : .025) * Math.min(1, amount) };
}

function dotsCircle(context, x, y, radius) {
  context.moveTo(x + radius, y);
  context.arc(x, y, radius, 0, dotsTau);
}

function dotsDraw(context, width, height, state, params, dark) {
  if (!context || width <= 0 || height <= 0) return;
  const palette = dotsPalette(params, dark);
  const gap = 18 * params.scale;
  const local = [];
  // Using a real linear gradient preserves spatial color variation across every
  // row/column (no alternating colors, parity groups, randomness or checkerboard).
  const gx = .55 / width;
  const gy = .45 / height;
  const gradientLengthSquared = gx * gx + gy * gy;
  const gradient = context.createLinearGradient(0, 0, gx / gradientLengthSquared, gy / gradientLengthSquared);
  gradient.addColorStop(0, dotsCssRgb(palette.cool));
  gradient.addColorStop(1, dotsCssRgb(palette.warm));
  // Grid phase is fixed in CSS pixels. A resize reveals more grid, never scales it.
  context.save();
  const pool = dotsGlowPool(state.cursor, params, dark);
  if (pool.alpha > .00001) {
    const px = state.cursor.x * width, py = state.cursor.y * height;
    const poolRgb = palette.halo.map(value => Math.round(value)).join(',');
    const glow = context.createRadialGradient(px, py, 0, px, py, pool.radius);
    glow.addColorStop(0, `rgba(${poolRgb},1)`);
    glow.addColorStop(.35, `rgba(${poolRgb},.55)`);
    glow.addColorStop(.72, `rgba(${poolRgb},.14)`);
    glow.addColorStop(1, `rgba(${poolRgb},0)`);
    context.fillStyle = glow;
    context.globalAlpha = pool.alpha;
    context.fillRect(px - pool.radius, py - pool.radius, pool.radius * 2, pool.radius * 2);
  }
  for (let y = gap / 2; y < height; y += gap) {
    for (let x = gap / 2; x < width; x += gap) {
      const dx = x - state.cursor.x * width;
      const dy = y - state.cursor.y * height;
      if (state.cursor.amount > 0 && params.strength > 0 && dx * dx + dy * dy < dotsLensRadius * dotsLensRadius) {
        local.push(dotsSampleNormalized(x, y, width, height, state.cursor, params, dark, palette));
      }
    }
  }
  // Halos go behind every core, in two local-only passes. No opaque background.
  const haloRgb = palette.halo.map(value => Math.round(value)).join(',');
  for (let layer = 0; layer < 2; layer++) {
    for (const sample of local) {
      const halo = sample.halos[layer];
      if (halo.alpha < .00001) continue;
      const glow = context.createRadialGradient(sample.x, sample.y, sample.radius * .3,
        sample.x, sample.y, halo.radius);
      glow.addColorStop(0, `rgba(${haloRgb},1)`);
      glow.addColorStop(.4, `rgba(${haloRgb},.45)`);
      glow.addColorStop(1, `rgba(${haloRgb},0)`);
      context.fillStyle = glow;
      context.globalAlpha = halo.alpha;
      context.beginPath();
      dotsCircle(context, sample.x, sample.y, halo.radius);
      context.fill();
    }
  }
  context.fillStyle = gradient;
  for (const sample of local) {
    context.globalAlpha = (dark ? .5 : .42) * sample.visibility;
    context.beginPath();
    dotsCircle(context, sample.x, sample.y, sample.radius);
    context.fill();
  }
  context.fillStyle = dotsCssRgb(palette.core);
  for (const sample of local) {
    context.globalAlpha = sample.coreAlpha * sample.visibility;
    context.beginPath();
    dotsCircle(context, sample.x, sample.y, sample.radius);
    context.fill();
  }
  context.restore();
}

/**
 * The caller supplies the sole Canvas2D context, CSS size, and normalized pointer.
 * Before every frame it sets backing→CSS transform and clears the surface. This
 * effect owns no DOM, canvas sizing, events, RAF, or global opacity. dt/time are
 * seconds; time is accepted for the common tape contract (no time-driven drift).
 */
export function createDotsEffect({ context, params, dark = false, reducedMotion = false } = {}) {
  let settings = normalizeDotsParams(params);
  let width = 0;
  let height = 0;
  let disposed = false;
  const state = dotsCreateInteraction();
  return {
    resize(nextWidth, nextHeight) {
      if (disposed) return;
      width = Math.max(0, dotsFinite(nextWidth));
      height = Math.max(0, dotsFinite(nextHeight));
    },
    update(patch = {}) {
      if (disposed || !patch || typeof patch !== 'object') return;
      if (patch.params && typeof patch.params === 'object') settings = normalizeDotsParams({ ...settings, ...patch.params });
      if (typeof patch.dark === 'boolean') dark = patch.dark;
      if (typeof patch.reducedMotion === 'boolean') reducedMotion = patch.reducedMotion;
      if (reducedMotion || settings.strength <= 0) dotsClearInteraction(state);
    },
    pointer(point) {
      if (!disposed) dotsPointer(state, point, settings, reducedMotion);
    },
    frame(dt, time) {
      if (disposed || width <= 0 || height <= 0) return false;
      const needsNext = dotsAdvanceInteraction(state, dt, settings, reducedMotion);
      dotsDraw(context, width, height, state, settings, dark);
      return needsNext;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      dotsClearInteraction(state);
      context = null;
    },
  };
}
