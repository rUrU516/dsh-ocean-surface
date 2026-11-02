# 0.8.0 verification record

Date: 2026-11-03 (Asia/Shanghai). Branch: `feat/cassette-deck`.

## Automated

- Generated the self-contained Client with `node build.js`.
- Checked Client and Host JavaScript syntax.
- **46 tests passed**: original ocean numerical stability/damping, appearance saving/error/read-only, cassette migration/independent memory/atomic writes, concurrent unrelated tape and power preservation, effect mathematics, idle scheduling, reduced motion, capped simulation steps, size budgets, disposal and failure containment.
- Checked exported resource paths, original SVG XML/size, English and Chinese metadata, bilingual deck strings/control coverage, and whitespace errors.
- No React/DOM/Canvas mock was used as evidence of visual success.

## Independent review and fixes

A read-only second-agent review found and prompted fixes for:

1. Whole-drawer replacement could delete a concurrent unrelated tape change. Both callers now use the same nested path operation builder; regression tests preserve a remote ripple edit during pending dot-field insertion.
2. Ocean insertion could overwrite a concurrent global power change. Tape insertion now omits global enable entirely.
3. WebGL recovery did not clear parent failure markers. A first successful post-recovery frame now clears background and preview failure state.
4. The preview root lacked its own event-isolation marker. It now declares it; moving into blocked UI sends pointer leave so a lens is not left behind.
5. Model disposal during an in-flight mutation could drop trailing edits. A final queued batch is attempted after the in-flight batch settles.

The browser-specific recovery fixes are code-reviewed, not GPU-event-tested in a browser.

## Real DSH runtime

- Installed independent project directory through `plugin_manager`, version `0.8.0`, application `applied`, activation warnings empty. pnpm emits its general warning about peer dependencies on linked packages; the live Host schema and both tools activate successfully.
- Live Config inspection exposes all legacy ocean fields plus additive cassette/cassetteSettings with validated nested numeric bounds.
- Live Client Slots show the v080 background adapter active and the original settings section registration present. A later r2 identifier identifies the reviewed build.
- Exercised real `background_tapes`: list, get, insert, update an inactive tape, reset an inactive tape, enable false/true. Writes returned accepted state, the active tape was not implicitly changed by inactive edits, and previous tape memories survived.
- Disabled/re-enabled the plugin and read accepted state again to verify persistence across plugin lifecycle.

The current demonstration tape is **Dot Field at its defaults**, enabled. This is an intentional switch for the new experience, not an accidental migration default. Legacy installations still migrate to ocean unless explicitly switched.

At first real read in this verification pass, the saved ocean was `tint #ffffff`, brightness `1.57`, opacity `0.5`, waveStrength `2`, speed `0.45`, damping `0.74`, enabled true. These differed from an earlier conversation snapshot; the live settings were treated as authoritative and preserved, not rolled back to stale values.

## Limitations

No browser-control tool is available. We have not visually verified actual layout at 240px, light/dark contrast, rendered SVG appearance, GPU output, keyboard focus or context-loss recovery in the current GUI. Active slots and passing unit tests do not establish those results. No replacement web server, browser profile inspection, authentication bypass or screenshot dependency was used.

The DSH background-layout adapter is version-specific to `0.2.1-rc.5`, not an officially stable background extension point. The settings section and configuration APIs are public extension points.
