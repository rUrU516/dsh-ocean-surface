# Background Tapes — Cassette API v1

Version **0.8.2**, branch `feat/cassette-deck`. Two fixed built-ins: Dots (`dot-field`) and the restored original Ocean Surface (`ocean-surface`). This is our plugin's internal extension contract, **not an official DSH background API or third-party code loader**. Neither tape exposes user/Agent parameter tuning.

## One local source module per tape

| Tape | Local source | Rendering |
| --- | --- | --- |
| Dots / 点阵 | [tapes/dots.js](<../tapes/dots.js>) | Canvas2D, pointer-local dots and violet glow; no resting grid |
| Ocean Surface / 海面水波 | [tapes/ocean.js](<../tapes/ocean.js>) | WebGL, original finite-difference pointer waves and sea-surface shader |

Each module owns its descriptor, fixed preset, normalizer and factory. Ocean's simulation and shader are in that same module; archived root renderers are not imported. The [registry](<../cassette-registry.js>) explicitly imports known tapes; files are not discovered automatically. [Build](<../build.js>) bundles the sources into one [Client artifact](<../client.js>), not independently loaded tape packages.

## What the base supplies to a tape

```js
const effect = createDotsEffect({
  context,       // CanvasRenderingContext2D for renderer:'2d'; WebGLRenderingContext for 'webgl'
  params,        // fixed descriptor defaults, not public editable settings
  dark,          // boolean: active theme
  reducedMotion, // boolean: system reduced-motion preference
});
```

Ocean exposes the same signature as `createOceanEffect`. The base acquires the selected context on a fresh canvas. A tape does not receive DSH context, React, chat content, DOM roots, Settings services or an independent RAF loop. There is no public resize callback/event bus to register; the base calls the lifecycle below.

### Tape descriptor

`id`, `number`, `source`, localized `name/subtitle/mood`, `colors`, `renderer`, `continuous`, `defaults`, `controls: []`.

Optional `contextAttributes` declares native canvas context options; optional `maxResolution` lowers that tape's backing long-edge budget (Ocean: 1100). `continuous` describes the artwork; **the actual `frame()` return value governs scheduling**. Artwork covers are static SVG in the deck, not another effect instance.

### Lifecycle returned by each tape

| Method | Meaning |
| --- | --- |
| `resize(cssWidth, cssHeight)` | CSS-pixel dimensions; the base owns backing resolution |
| `update({ params, dark, reducedMotion })` | Synchronize plain values; does not persist settings |
| `pointer({ x, y, type, time })` | Normalized coordinates `[0,1]`, `move/down/leave`, active seconds |
| `frame(dt, time) → boolean` | Draw one frame; time units are seconds; return whether another frame is needed |
| `dispose()` | Release tape-owned resources; must be idempotent |

Dots stops RAF after interaction settles. Ocean animates ambient swells while visible/focused; reduced motion renders a static surface and ignores pointer forcing. The base pauses both on hidden/blurred windows and on global power-off. A context loss disables that surface; restoration recreates its runtime.

## Base adapter API

The [runtime adapter](<../effect-runtime.js>) resolves the registry and creates a tape:

```js
const runtime = createEffectRuntime({
  canvas, cassette: 'ocean-surface', params,
  dark: true, reducedMotion: false,
  maxResolution: 3200, onError,
});
runtime.resize(cssWidth, cssHeight, devicePixelRatio);
runtime.update({ params, dark, reducedMotion });
runtime.pointer({ x: .5, y: .5, type: 'move', time: 1.2 });
const needsNextFrame = runtime.frame(deltaSeconds, activeSeconds);
runtime.dispose();
```

Renderer branches are generic (`2d`/`webgl`), not tape-id branches. For 2D, the base sets CSS-pixel transforms and clears each frame; WebGL tapes own viewport/clear/draw commands and use native drawing-buffer size. The global backing limits are DPR 2, longest edge 3200 and approximately six million pixels; descriptor limits can reduce this. Preview uses a 1600px long-edge budget before per-tape limits.

The [surface adapter](<../effect-surface.js>) owns canvas DOM, ResizeObserver, RAF (at most 30 draw calls/sec), pointer routing, theme, focus/visibility, reduced motion, cleanup, error/ready callbacks and outer opacity. The [Client entry](<../client-entry.js>) alone owns DSH layout/Settings registration. The composer remains opaque.

## Selection, preview and persistence

The [deck](<../deck-panel.js>) provides an audition selection separate from the active tape. Choosing a card does not save; **Use this tape** writes the fixed preset through [cassettePatch](<../cassette-catalog.js>) and shared [path operations](<../cassette-operations.js>). Global `enabled` is independent; insertion never powers the background on. Read-only, saving and save-failure states remain explicit.

Package name stays `@local/dsh-cursor-ripples`; Settings namespace stays `cursor-ripples`. UI and Agent share Host Settings, not localStorage. Stored shape:

```json
{
  "enabled": true,
  "cassette": "ocean-surface",
  "cassetteSettings": {
    "dot-field": { "...": "Dots fixed preset" },
    "ocean-surface": { "...": "Ocean fixed preset" }
  }
}
```

`getCassetteParams()` always resolves descriptor defaults. Historical variations do not tune the live effect. Top-level pre-deck ocean fields remain inert and are not overwritten during insertion. Unknown retired ids fall back to Dots.

## User / Agent API

`background_tapes`:

| Call | Result |
| --- | --- |
| `{ "action": "list" }` | Available tape ids, localized identity, local source paths and fixed flag |
| `{ "action": "get" }` | Accepted active tape, global power and fixed preset |
| `{ "action": "insert", "cassette": "dot-field" }` | Select Dots; also accepts `ocean-surface`; preserves global power |
| `{ "action": "enable", "enabled": false }` | Change global power without changing the selected tape |

No `update`, `reset`, color/strength editing, filesystem import or arbitrary JavaScript execution API is exposed. The former `ocean_appearance` tool is not restored.

## Scope and verification boundary

The Settings section uses DSH's public slot. Background placement is still a version-specific adapter for DSH `0.2.1-rc.5`, not a stable official background API. No replacement server or DSH core edits are used. See the [verification record](<./verification.md>) for unit/static/live-registration results; these are not live GPU or screenshot verification.
