# 0.8.2 verification record — Dots + original Ocean

Date: 2026-11-03 (Asia/Shanghai). Branch `feat/cassette-deck`; `main` and formal Release unchanged.

## Composer-side scrim follow-up

The user's real Ocean screenshot showed the full-width black strip beside the opaque composer. Installed DSH `ui-conversation` source identifies `.kiGsTW_composerSeat` as a sticky, full-column vertical gradient reaching `bg-base` at 36px. The adapter now restricts only that background image's paint to `min(100%, var(--dsh-composer-card-max-width))`, centered and non-repeating. It retains the native gradient, opaque card, sticky/z-index, hit areas and all dimensions. No input geometry or global theme token changes. Build, syntax, 70 tests and static paint-only assertions passed; live slot `local-background-tapes-adapter-v082-composer-sides` is active. Before/after tool reads preserve Ocean enabled true and identical fixed settings. Actual side visibility and scroll overlap still require the user screenshot check.

## Delivered scope

- Preserve the latest Dots behavior: only pointer-local dots and glow, no resting grid.
- Restore the original sea-surface shader and finite-difference pointer simulation as the second fixed cassette `ocean-surface`.
- One self-contained source module per tape; generic base supports Canvas2D and WebGL without tape-id renderer branches.
- Two static original SVG covers, one live audition surface, explicit use and independent global power. No parameter UI or Agent tuning API.
- API/source-path documentation updated in the README and Cassette API reference.

## Build and automated checks

- `node build.js`, `node --check client.js`, `node --check index.js`, `node --check deck-panel.js`: passed.
- `node --test *.test.js tapes/*.test.js`: **70/70 passed**.
  - 18 Dots geometry/palette/visibility/interaction checks.
  - 16 Ocean descriptor/simulation/shader/pointer/time/lifecycle checks.
  - 7 catalog/fixed-preset/path-isolation checks.
  - 7 generic size/resource/lifecycle checks.
  - 22 retained legacy regression checks, not evidence old Settings controls run.
- Ocean tests compare both shader strings with the original artwork and compare simulation heights/normal bytes against the original simulation. This establishes implementation continuity, not a live GPU render.
- English/Chinese deck dictionaries each have 26 matching keys. Metadata resources, exports and local source paths exist; the original SVG icon is retained.
- Static checks find exactly one audition Surface, no range/color controls and the v082 Client marker. `git diff --check`: passed.

## Current DSH activation

- Linked bundle inventory: **0.8.2**, source `link:/Users/zhuoru/fiture/dsh-ocean-surface`.
- The built Client artifact was synchronized to the known current-process cached Client path. Reactivation through the plugin manager returned `application: applied`, `warnings: []` for disable and enable.
- Live Client slot **`local-background-tapes-adapter-v082-dots-ocean` is active**.
- Real `background_tapes list` returns both `dot-field` / `tapes/dots.js` and `ocean-surface` / `tapes/ocean.js`, each fixed.
- Real `background_tapes get` after activation remains **Dots, enabled true**, opacity 0.85. No actual tape insertion, global power test, or historical parameter reset was performed; the user's current background was preserved.
- Shared persistence regression tests cover Ocean selection, preservation of Dots values and independent global power, and selected-tape-only nested operations.

## Verification limitations

No browser-control tool is available. Live Ocean WebGL execution, actual preview/card layout, light/dark rendering, pointer feel, keyboard behavior, context recovery and metadata/icon display still require real-page confirmation. Active slot registration, unit tests and copied shader equality do not establish these visual/runtime outcomes.

One delegated worker executed a temporary inline mock-hook check before being instructed to stop; it produced no file and is excluded from all verification claims. No mock-page result is treated as live React/browser evidence. No screenshot script, replacement server, browser-profile/authentication access or rasterizer was used.

Background placement remains a user-authorized, version-specific DSH `0.2.1-rc.5` layout adapter, not an official stable background API. The Settings section and Settings persistence are public extension points.
