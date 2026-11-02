# Background Tapes — Cassette API v1

This is the **internal built-in effect contract**, not an enabled third-party code loader. No remote scripts, eval, pasted JavaScript or custom tape import is supported in 0.8.0. All four built-ins use the same contract.

## Boundaries

- `cassette-catalog.js`: serializable metadata, localized names, covers, defaults, controls, and normalization.
- `effect-runtime.js`: dispatches the selected effect, accepts only a canvas and plain inputs. No DSH context, DOM queries, global event listeners or animation loops.
- `effect-surface.js`: one browser adapter owns ResizeObserver, pointer filtering, requestAnimationFrame, visibility/focus, reduced motion, theme updates and context loss. It stops when an effect is idle.
- `client-entry.js`: the sole DSH layout adapter and public settings slot registration. Chat text and input never become shader inputs.
- `deck-panel.js`: local audition state; only Insert commits a tape to shared settings.

## Runtime

```js
const effect = createEffectRuntime({
  canvas, cassette: 'dot-field', params,
  dark: true, reducedMotion: false,
  maxResolution: 1100, onError,
});
effect.resize(cssWidth, cssHeight, devicePixelRatio);
effect.update({ params, dark, reducedMotion });
effect.pointer({ x: 0.5, y: 0.5, type: 'move', time: 1.2 });
const needsNextFrame = effect.frame(deltaSeconds, elapsedSeconds);
effect.dispose();
```

Pointer coordinates are normalized `[0,1]`, `type` is `move | down | leave`. The host supplies monotonic active time in seconds and clamps delta to avoid background-tab jumps. Effects return `false` after settling. Pointer/resize/settings/theme changes wake the adapter again. `dispose` must be idempotent. Resizing must not attach new global resources. Rendering errors leave the application on its native surface instead of covering the UI.

Switching tapes remounts the canvas (a WebGL canvas cannot become a Canvas2D canvas). Only one tape renders per surface: the active application background and, while settings is open, one audition surface. Cover art is static SVG, not four independent live canvases.

## Descriptors and settings

Each descriptor defines `id`, `name`, `subtitle`, `mood`, `colors`, `defaults`, `controls`, rendering kind, and idle/continuous behavior. Numeric controls carry `[key,min,max,step]`; input values are validated and normalized by the shared catalog before either caller saves them.

The original package name and settings namespace remain `@local/dsh-cursor-ripples` and `cursor-ripples` to avoid breaking existing installations. The original ocean fields remain at the top level, unchanged. New fields are additive:

```json
{
  "cassette": "dot-field",
  "cassetteSettings": {
    "dot-field": {"tint":"#8b91d4","opacity":0.38,"strength":0.65,"scale":1,"speed":0.45}
  }
}
```

A legacy installation without `cassette` remains on `ocean`; its existing color, strength, speed and damping are preserved. Switching away does not erase them. Each tape remembers its own settings. The global enable switch is independent of tape selection. Auditioning never writes the active tape; Insert writes selection and that tape's values atomically through the same Config form used by Host Settings. Shared `deckPatchOperations` emits `['cassetteSettings', tapeId]` edits, not a stale replacement of the whole drawer, so a concurrent edit to another tape is preserved. Ocean insertion never writes global power.

Agent API: `background_tapes` supports `list/get/insert/update/reset/enable`. `list` gives tape ids, defaults and ranges. `update/reset` of an inactive tape do not insert it. `ocean_appearance` remains as the compatible ocean-only parameter tool.

## Future extension

A future registration API can accept descriptors plus runtime factories without exposing DSH internals. Version compatibility and disposal checks should be enforced at registration. Arbitrary JavaScript is not made safe merely by passing a narrow-looking API; third-party script execution would need a separately designed trust/installation model. No public stability promise is made for this draft API beyond these built-ins.

## Compatibility

Settings use the public `settings.section` slot. Background placement still uses a user-authorized, version-specific adapter for DSH `0.2.1-rc.5`. This is not a claim that DSH provides a stable background API. The composer card stays opaque, and effects do not change chat geometry or app theme tokens.
