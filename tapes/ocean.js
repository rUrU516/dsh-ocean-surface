// Original ocean artwork, self-contained and safe to import on the Host.
// The surface owns context creation, canvas size, opacity, events and scheduling.
export const OCEAN_CASSETTE = Object.freeze({
  id: 'ocean-surface', number: '02', source: 'tapes/ocean.js',
  name: Object.freeze({ zh: '海面水波', en: 'Ocean Surface' }),
  subtitle: Object.freeze({ zh: '流光海面，指尖泛波', en: 'Rolling light, a gentle pointer wake' }),
  mood: Object.freeze({ zh: '旧日海面的起伏与微光', en: 'The original sea, its swells and shimmer' }),
  colors: Object.freeze(['#4896a6', '#b9e7e9']),
  renderer: 'webgl', continuous: true, maxResolution: 1100,
  contextAttributes: Object.freeze({
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: 'low-power', preserveDrawingBuffer: false,
  }),
  defaults: Object.freeze({
    tint: '#ffffff', brightness: 1.57, opacity: .5, waveStrength: 2, speed: .45, damping: .74,
  }),
  controls: Object.freeze([]),
});

/** A fixed cassette: legacy or arbitrary tuning values cannot change its artwork. */
export function normalizeOceanParams(input) {
  return { ...OCEAN_CASSETTE.defaults };
}

const oceanWaveCoefficient = .28;
const oceanInteriorRetention = .985;
const oceanEdgeLoss = .18;
const oceanSlopeScale = 2.5;
const oceanTick = 1 / 60;
const oceanMaxTicks = 4;
const oceanFinite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const oceanClampHeight = value => Math.max(-1, Math.min(1, value));
const oceanEncodeSigned = value => Math.round((oceanClampHeight(value) * .5 + .5) * 255);

/**
 * The original finite-difference water field. Unit grid spacing, fixed 60Hz tick,
 * absorbing edges, cosine disturbances and signed RGBA8 slopes are unchanged.
 * No browser or GL resources are used by this class or the state helpers below.
 */
export class OceanWaterField {
  #previous;
  #next;
  #retention;

  constructor(width, height) {
    if (!Number.isSafeInteger(width) || width < 1 ||
        !Number.isSafeInteger(height) || height < 1 || !Number.isSafeInteger(width * height)) {
      throw new RangeError('OceanWaterField dimensions must be positive safe integers');
    }
    this.width = width;
    this.height = height;
    // step() rotates arrays; read current again after each tick.
    this.current = new Float32Array(width * height);
    this.#previous = new Float32Array(width * height);
    this.#next = new Float32Array(width * height);
    this.#retention = new Float32Array(width * height);
    const spongeWidth = Math.min(8, Math.max(1, Math.min(width, height) / 4));
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.min(x, y, width - 1 - x, height - 1 - y);
        const edge = Math.max(0, 1 - distance / spongeWidth);
        this.#retention[y * width + x] = oceanInteriorRetention * (1 - oceanEdgeLoss * edge * edge);
      }
    }
  }

  /** Fractional grid coordinates, radius in grid cells, dimensionless strength. */
  disturb(x, y, radius, strength) {
    if (!Number.isFinite(x) || !Number.isFinite(y) ||
        !Number.isFinite(radius) || radius <= 0 || !Number.isFinite(strength)) {
      throw new RangeError('disturb requires finite coordinates/strength and a positive finite radius');
    }
    const amplitude = oceanClampHeight(strength);
    if (amplitude === 0) return;
    const { width, height, current } = this;
    const minX = Math.max(0, Math.ceil(x - radius));
    const maxX = Math.min(width - 1, Math.floor(x + radius));
    const minY = Math.max(0, Math.ceil(y - radius));
    const maxY = Math.min(height - 1, Math.floor(y + radius));
    for (let row = minY; row <= maxY; row++) {
      for (let col = minX; col <= maxX; col++) {
        const distance = Math.hypot((col - x) / radius, (row - y) / radius);
        if (distance >= 1) continue;
        const index = row * width + col;
        const weight = .5 * (1 + Math.cos(Math.PI * distance));
        const before = current[index];
        current[index] = oceanClampHeight(before + amplitude * weight);
        // Apply the same accepted displacement to avoid artificial velocity.
        this.#previous[index] = oceanClampHeight(this.#previous[index] + (current[index] - before));
      }
    }
  }

  /** Courant coefficient .28 < the 2D stability limit .5; retain the old recurrence. */
  step(damping = .15) {
    if (!Number.isFinite(damping) || damping < 0 || damping > 1) {
      throw new RangeError('damping must be a finite number between 0 and 1');
    }
    const retentionScale = (1 - .1 * damping) / oceanInteriorRetention;
    const { width, height, current } = this;
    const previous = this.#previous;
    const next = this.#next;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const center = current[index];
        const left = x > 0 ? current[index - 1] : 0;
        const right = x + 1 < width ? current[index + 1] : 0;
        const up = y > 0 ? current[index - width] : 0;
        const down = y + 1 < height ? current[index + width] : 0;
        const laplacian = left + right + up + down - 4 * center;
        next[index] = oceanClampHeight((this.#retention[index] * retentionScale) *
          (2 * center - previous[index] + oceanWaveCoefficient * laplacian));
      }
    }
    this.#previous = current;
    this.current = next;
    this.#next = previous;
  }

  /** R/G = signed 2.5x central slopes, B = height, A = 255; flat = 128,128,128,255. */
  writeNormals(target) {
    if (!(target instanceof Uint8Array)) throw new TypeError('writeNormals requires a Uint8Array');
    if (target.length !== this.width * this.height * 4) {
      throw new RangeError('writeNormals buffer length must equal width * height * 4');
    }
    const { width, height, current } = this;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const left = current[y * width + Math.max(0, x - 1)];
        const right = current[y * width + Math.min(width - 1, x + 1)];
        const up = current[Math.max(0, y - 1) * width + x];
        const down = current[Math.min(height - 1, y + 1) * width + x];
        const offset = index * 4;
        target[offset] = oceanEncodeSigned((right - left) * .5 * oceanSlopeScale);
        target[offset + 1] = oceanEncodeSigned((down - up) * .5 * oceanSlopeScale);
        target[offset + 2] = oceanEncodeSigned(current[index]);
        target[offset + 3] = 255;
      }
    }
    return target;
  }
}

/** Original background grid: 320 cells on the long edge, at least 32 on either edge. */
export function oceanCreateState(width, height) {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new RangeError('Ocean state requires a positive finite CSS size');
  }
  const cellSize = Math.max(width, height) / 320;
  return {
    width, height, time: 0, accumulator: 0, pointer: null,
    field: new OceanWaterField(Math.max(32, Math.round(width / cellSize)),
      Math.max(32, Math.round(height / cellSize))),
  };
}

/** Active dt is seconds. Drop suspension debt, run at most four fixed ticks/frame. */
export function oceanAdvance(state, dt, reducedMotion = false) {
  if (reducedMotion) {
    state.accumulator = 0;
    state.pointer = null;
    return false;
  }
  const elapsed = Math.min(.08, Math.max(0, oceanFinite(dt))) * OCEAN_CASSETTE.defaults.speed;
  state.time += elapsed;
  state.accumulator += elapsed;
  let ticks = 0;
  while (state.accumulator >= oceanTick && ticks < oceanMaxTicks) {
    state.field.step(OCEAN_CASSETTE.defaults.damping);
    state.accumulator -= oceanTick;
    ticks++;
  }
  // Defensive bound if a caller reuses a state with accumulated external debt.
  if (state.accumulator >= oceanTick) state.accumulator %= oceanTick;
  // The original shader has ambient swell even when the pointer field is flat.
  return true;
}

/** Normalized pointer, CSS-distance interpolation, and no trail on entry/re-entry. */
export function oceanPointer(state, point, reducedMotion = false) {
  if (reducedMotion || point?.type === 'leave') { state.pointer = null; return false; }
  if (!point || !['move', 'down', 'enter'].includes(point.type) ||
      !Number.isFinite(point.x) || !Number.isFinite(point.y) ||
      point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
    state.pointer = null;
    return false;
  }
  const click = point.type === 'down';
  const next = { x: point.x * state.width, y: point.y * state.height,
    time: Number.isFinite(point.time) ? point.time : null };
  const last = state.pointer;
  const age = last && next.time !== null && last.time !== null ? next.time - last.time : null;
  if (!click && point.type !== 'enter' && age !== null && age >= 0 && age < .016) return false;
  const distance = last ? Math.hypot(next.x - last.x, next.y - last.y) : 0;
  // A long jump or stale/backwards timestamp is a fresh entry, not a line across
  // the sea. Distances are CSS pixels, never normalized units or backing pixels.
  const previous = last && point.type !== 'enter' && distance <= 140 &&
    (age === null || (age >= 0 && age < .12)) ? last : next;
  const steps = click ? 1 : Math.max(1, Math.min(20,
    Math.ceil(Math.hypot(next.x - previous.x, next.y - previous.y) / 7)));
  const { field } = state;
  const scale = field.width / state.width;
  for (let step = 1; step <= steps; step++) {
    const amount = step / steps;
    field.disturb((previous.x + (next.x - previous.x) * amount) * scale,
      (previous.y + (next.y - previous.y) * amount) * field.height / state.height,
      Math.max(1.8, (click ? 24 : 14) * scale), click ? .65 : .17);
  }
  state.pointer = next;
  return true;
}

function oceanCheckGL(gl, operation) {
  if (gl.isContextLost()) throw new Error('Ocean Surface WebGL context lost.');
  const error = gl.getError();
  if (error !== gl.NO_ERROR) throw new Error(`Ocean Surface ${operation}: WebGL error 0x${error.toString(16)}.`);
}

/** The original ocean-renderer shaders, with the original tint baseline #4896a6. */
function oceanCreateRenderer(gl, field) {
  const resources = { shaders: [], program: null, buffer: null, texture: null };
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    if (resources.texture) gl.deleteTexture(resources.texture);
    if (resources.buffer) gl.deleteBuffer(resources.buffer);
    if (resources.program) gl.deleteProgram(resources.program);
    for (const shader of resources.shaders) gl.deleteShader(shader);
    resources.texture = resources.buffer = resources.program = null;
    resources.shaders.length = 0;
  }
  function compile(type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Ocean Surface could not allocate a shader.');
    resources.shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`Ocean background shader: ${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
  }
  try {
    oceanCheckGL(gl, 'initialization');
    const vertex = compile(gl.VERTEX_SHADER, `
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `);
    const fragment = compile(gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D water;
      uniform float aspect;
      uniform float time;
      uniform float darkMode;
      uniform vec3 tintMultiplier;
      uniform float brightness;
      uniform float waveStrength;
      varying vec2 uv;
      float swell(vec2 p) {
        return sin(p.x * 2.7 + p.y * 1.9 - time * .47) * .34
          + sin(p.x * -3.6 + p.y * 5.1 - time * .63) * .18
          + sin(p.x * 9.5 + p.y * 6.3 - time * .91) * .075
          + sin(p.x * -17.0 + p.y * 12.0 + time * .73) * .032;
      }
      void main() {
        vec2 p = vec2(uv.x * aspect, uv.y) * 5.0;
        float e = .025;
        float h = swell(p);
        vec2 slope = vec2(swell(p + vec2(e, 0.0)) - h,
                          swell(p + vec2(0.0, e)) - h) / e;
        vec2 wake = (texture2D(water, vec2(uv.x, 1.0 - uv.y)).rg * 255.0 - 128.0) / 127.0;
        wake.y = -wake.y;
        vec3 n = normalize(vec3((-slope * .21 - wake * 4.2) * waveStrength, 1.0));
        vec3 reflected = reflect(vec3(0.0, 0.0, -1.0), n);
        vec3 sun = normalize(vec3(-.33, .47, 1.0));
        float gloss = pow(max(dot(reflected, sun), 0.0), 48.0);
        float broad = pow(max(dot(reflected, sun), 0.0), 6.0);
        vec2 q = p + n.xy * .8;
        float caustic = sin(q.x * 13.0 + sin(q.y * 8.0 + time * .3))
                       * sin(q.y * 11.0 - sin(q.x * 7.0 - time * .27));
        caustic = pow(max(0.0, 1.0 - abs(caustic)), 14.0);
        float trough = clamp(.5 + (h * .28 + slope.x * .055) * waveStrength, .12, .85);
        vec3 deep = mix(vec3(.10, .34, .43), vec3(.055, .09, .11), darkMode);
        vec3 shallow = mix(vec3(.32, .68, .72), vec3(.10, .22, .25), darkMode);
        vec3 color = mix(deep, shallow, trough);
        color += broad * vec3(.05, .10, .11);
        color += gloss * vec3(.18, .23, .23);
        color += caustic * vec3(.03, .08, .08);
        // Small exposure lift only; leave wave contrast, alpha and component layers unchanged.
        gl_FragColor = vec4(clamp(color * tintMultiplier * brightness + vec3(0.012), 0.0, 1.0), 1.0);
      }
    `);
    const program = gl.createProgram();
    if (!program) throw new Error('Ocean Surface could not allocate a program.');
    resources.program = program;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Ocean background shader link: ${gl.getProgramInfoLog(program)}`);
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error('Ocean Surface could not allocate a vertex buffer.');
    resources.buffer = buffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    if (position < 0) throw new Error('Ocean Surface position attribute unavailable.');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    if (!texture) throw new Error('Ocean Surface could not allocate a water texture.');
    resources.texture = texture;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, field.width, field.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const uniform = name => {
      const location = gl.getUniformLocation(program, name);
      if (location === null) throw new Error(`Ocean Surface ${name} uniform unavailable.`);
      return location;
    };
    gl.uniform1i(uniform('water'), 0);
    const timeLocation = uniform('time');
    const aspectLocation = uniform('aspect');
    const darkLocation = uniform('darkMode');
    const tintLocation = uniform('tintMultiplier');
    const brightnessLocation = uniform('brightness');
    const waveLocation = uniform('waveStrength');
    const pixels = new Uint8Array(field.width * field.height * 4);
    oceanCheckGL(gl, 'allocation');
    return {
      draw(time, dark, settings) {
        oceanCheckGL(gl, 'draw');
        field.writeNormals(pixels);
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // The caller, not the tape, controls backing size and its resolution cap.
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, field.width, field.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        gl.uniform1f(timeLocation, time);
        gl.uniform1f(aspectLocation, gl.drawingBufferWidth / gl.drawingBufferHeight);
        gl.uniform1f(darkLocation, dark ? 1 : 0);
        // White tint / original #4896a6 baseline, not a white multiplier of 1.
        gl.uniform3f(tintLocation, 255 / 72, 255 / 150, 255 / 166);
        gl.uniform1f(brightnessLocation, settings.brightness);
        gl.uniform1f(waveLocation, settings.waveStrength);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        oceanCheckGL(gl, 'draw');
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

/**
 * context is a WebGLRenderingContext, never a canvas or DSH context. Allocation
 * is deferred until frame() with a valid CSS/backing size; resize/update/pointer
 * never acquire a context. dt/time are seconds. The shader uses a private active
 * clock so pauses/reduced motion do not jump to the caller's elapsed time.
 * frame returns true for ambient swell, false while reduced/invalid/disposed.
 * GL loss/allocation/draw failures throw once and terminate this instance; the
 * caller reports the error, disposes it, and may create a fresh one on recovery.
 */
export function createOceanEffect({ context, params, dark = false, reducedMotion = false } = {}) {
  let settings = normalizeOceanParams(params);
  let width = 0;
  let height = 0;
  let state = null;
  let renderer = null;
  let disposed = false;
  let failed = false;
  function release() {
    renderer?.dispose();
    renderer = null;
    state = null;
  }
  return {
    resize(cssWidth, cssHeight) {
      if (disposed || failed) return;
      const nextWidth = Math.max(0, oceanFinite(cssWidth));
      const nextHeight = Math.max(0, oceanFinite(cssHeight));
      if (state && (width !== nextWidth || height !== nextHeight)) state.pointer = null;
      width = nextWidth;
      height = nextHeight;
    },
    update(patch = {}) {
      if (disposed || failed || !patch || typeof patch !== 'object') return;
      if ('params' in patch) settings = normalizeOceanParams(patch.params);
      if (typeof patch.dark === 'boolean') dark = patch.dark;
      if (typeof patch.reducedMotion === 'boolean') reducedMotion = patch.reducedMotion;
      if (reducedMotion && state) {
        state.pointer = null;
        state.accumulator = 0;
      }
    },
    pointer(point) {
      // Do not queue pre-allocation coordinates, old visits, or disabled input.
      if (!disposed && !failed && state && state.width === width && state.height === height) {
        oceanPointer(state, point, reducedMotion);
      }
    },
    frame(dt, time) {
      if (disposed || failed || width <= 0 || height <= 0) return false;
      try {
        if (!context) throw new Error('Ocean Surface requires a WebGLRenderingContext.');
        if (context.isContextLost()) throw new Error('Ocean Surface WebGL context lost.');
        if (context.drawingBufferWidth <= 0 || context.drawingBufferHeight <= 0) return false;
        if (!state || state.width !== width || state.height !== height) {
          release();
          state = oceanCreateState(width, height);
          renderer = oceanCreateRenderer(context, state.field);
        }
        const needsNext = oceanAdvance(state, dt, reducedMotion);
        renderer.draw(state.time, dark, settings);
        return needsNext;
      } catch (error) {
        failed = true;
        release();
        throw error;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      release();
      context = null;
    },
  };
}
