# Background Tapes — Cassette API v1

Version **0.8.1**, branch `feat/cassette-deck`. This is an **internal built-in effect contract**, not a third-party code loader. This version contains only **Dots** (`dot-field`), with one finished preset and no user- or Agent-facing parameter controls. Space Membrane, Quiet Contours and Ocean Surface are removed from the registry, UI and runtime. Legacy values may remain inert for compatibility; old implementations are available in Git history.

## Source organization and boundaries

Each cassette belongs in **one local source module**. The sole [Dots module](<../tapes/dots.js>) owns its descriptor, parameter normalizer and runtime factory. The descriptor provides localized identity, artwork metadata and fixed preset values; normalization validates compatible persisted inputs, not a public tuning API.

- [Catalog](<../cassette-catalog.js>): explicit static registration, descriptor lookup and legacy settings compatibility. Only Dots is registered.
- [Runtime adapter](<../effect-runtime.js>): resolves the registered factory and supplies the Canvas2D context and plain inputs. It does not contain per-tape rendering branches or browser scheduling.
- [Surface adapter](<../effect-surface.js>): owns canvas size, ResizeObserver, requestAnimationFrame, pointer filtering, visibility/focus, reduced motion, theme changes and disposal. It stops scheduling once the effect settles.
- [Client entry](<../client-entry.js>): the sole DSH layout adapter and public settings slot registration. Chat text and input never become rendering inputs.
- [Deck](<../deck-panel.js>): one real audition surface, a static tape card, global power and explicit use. No sliders, color editor, tuning draft or reset panel.

[Build](<../build.js>) statically bundles the local modules into a **single [client.js](<../client.js>) artifact**. A tape module is not an independently installed package. There is no runtime directory scan, remote script loader, eval, pasted JavaScript or arbitrary dynamic import. Source modularity does not expand the code trust boundary.

## Runtime lifecycle

The surface uses the existing runtime adapter API:

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

The runtime adapter supplies a Canvas2D context to the registered factory. The effect receives no DSH context, DOM root, global event listener or independent animation loop. Browser resources and scheduling remain in the surface adapter.

Pointer coordinates are normalized `[0,1]`; `type` is `move | down | leave`. The adapter supplies monotonic active time in seconds and clamps delta to avoid background-tab jumps. Effects return `false` after settling; pointer, size, settings or theme changes may wake scheduling again. `dispose` must be idempotent. Resize must not attach global resources. Rendering errors leave the native application usable.

Only one effect canvas renders per surface: the application background and, while settings is open, one audition surface. The tape cover is static SVG, not a second live scene. Audition passes `displayOpacity: 1` to the surface so the stage is not a faint imitation of the chat background. The application background retains the fixed preset's saved opacity.

## Fixed preset and persistence

Package identity remains `@local/dsh-cursor-ripples`; the settings namespace remains `cursor-ripples`. The active descriptor is `dot-field`, and its fixed defaults are authored in the [Dots module](<../tapes/dots.js>). UI callers use those defaults rather than exposing or editing old saved parameter values.

The existing selection and nested storage shape remains:

```json
{
  "cassette": "dot-field",
  "cassetteSettings": {
    "dot-field": { "...": "fixed descriptor defaults" }
  }
}
```

Legacy ocean fields and old tape values are inert compatibility data: they are not listed as cassettes, displayed as controls or passed into removed renderers. Unknown or retired selections resolve to Dots. Compatibility retention does not promise that old effects still run.

Audition never writes shared settings. **Use Dots** writes the selection and fixed preset through the existing `cassettePatch` / Settings path operations; no whole-drawer replacement is needed. The global `enabled` state remains independent and is taken from the latest accepted state, not a stale audition snapshot. Save errors and read-only state are explicit. Neither an audition nor an insertion implicitly turns the background on.

The module exports `DECK_DICTS` and `createDeckPage` remain unchanged. They do not expose a parameter editor or alter the persistence protocol.

## Agent interface

`background_tapes` supports only `list/get/insert/enable`. `list` exposes Dots; insertion selects its fixed preset. No `update`, `reset` or arbitrary parameter input is exposed. The former `ocean_appearance` tool is removed; legacy values remain only as inert Config compatibility data, not an alternate editing API.

## Compatibility and verification

Settings use the public `settings.section` slot. Background placement remains a user-authorized, version-specific adapter for DSH `0.2.1-rc.5`, not a stable official background API. The composer card remains opaque; the effect does not change chat geometry or theme tokens.

This internal API is not a public stability promise for third-party extensions. Future registration would need explicit compatibility, disposal and trust design; a narrow-looking factory signature alone does not make arbitrary JavaScript safe.

See the [verification record](<./verification.md>) for the distinction between this round's checks, historical 0.8.0 results, pending installation and unavailable browser visual verification.
