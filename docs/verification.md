# 0.8.1 verification record — Dots only

Date: 2026-11-03 (Asia/Shanghai). Branch: `feat/cassette-deck`. This work does not change `main` or a formal Release.

## Scope of this round

- Only Dots (`dot-field`) remains in the catalog, UI and runtime.
- Dots targets a dense blue-violet → pink-violet dot field, a broad magnifying lens and soft glow. This is an implementation direction, **not a claim of completed screenshot matching**.
- The effect is a fixed preset. No user or Agent tuning, color editor, sliders or reset API remains.
- One local tape module owns descriptor, normalizer and factory; runtime adaptation and browser scheduling remain separate. The final browser distribution remains one Client artifact, not runtime directory scanning or independent tape packages.
- The deck retains one real audition surface, global power, a static original Dots SVG cover and explicit use. The audition passes `displayOpacity: 1`; the application background uses the fixed saved preset.
- Retired effects do not run. Old values are inert Config compatibility data; `ocean_appearance` is removed.

## Current-round checks

### Deck / bilingual metadata

- `node --check deck-panel.js`: passed.
- Imported `DECK_DICTS` / `createDeckPage`: exported factory exists; **26 English and Chinese deck keys match**, and each directly referenced deck key is present in both dictionaries.
- Parsed both locale metadata files: `title` / `description` key parity passed; both descriptions identify only Dots.
- Static assertions: one `Surface` creation, explicit `displayOpacity: 1`, no tuning/range/color controls and no retired artwork branches or four-tape copy.
- `git diff --check`: passed at the end of this UI/documentation pass.

These are source and language checks, not evidence of actual browser rendering.

### Build, automated tests and resources

- `node build.js`, `node --check client.js`, `node --check index.js`: passed.
- `node --test *.test.js tapes/*.test.js`: **49/49 passed**. These include 16 Dots geometry/palette/idle/reduced-motion checks, 6 generic resource/size lifecycle checks, 5 fixed-cassette/configuration checks, and 22 retained legacy regressions. Legacy tests do not mean legacy renderers are active.
- Explicit manifest resources exist; English/Chinese deck key parity passed. The generated artifact contains the v081 fixed-Dots adapter and no ocean renderer, WaterField class, ripple/contour draw routines or retired ocean tool.
- Settings source contains one Surface and no range/color/tuning controls. Appearance is authored in the local tape defaults, not read from old customized parameters.

### Real DSH installation and inspection

- The linked bundle inventory reports version **0.8.1** from the independent project directory. Disabled/re-enabled through `plugin_manager`; both operations returned `application: applied`, `warnings: []`.
- Live Config inspection confirms the new defaults. Legacy numeric fields remain for inert compatibility only; the plugin opts out of auto-generated parameter forms.
- Live Client registration **`local-background-tapes-adapter-v081-dots-fixed` is active**.
- Real `background_tapes list` returns only Dots, `source: tapes/dots.js`, `fixed: true`; get/insert report the authored preset. Insertion and a same-value enable operation were accepted without changing global power (enabled true).
- The running tool exposes only `list/get/insert/enable`; parameter update/reset and the retired ocean tool were removed from registration.
- Current-process cached Client path was synchronized with the built artifact before reactivation; no profile composition was edited by hand.

## Historical context — 0.8.0, not this round

The previous four-tape implementation recorded **46 tests passed** and an applied installation of 0.8.0. Its tests covered ocean numerics, appearance saving, cassette memory and atomic writes, effect mathematics and resource handling. Those results apply to that old source state only; they do not prove that the Dots-only fixed-preset rewrite builds, passes its tests or is installed.

The old review also found and fixed whole-drawer replacement, accidental power overwrite, failure-marker recovery, preview event isolation and disposal-time pending writes. These are useful regression concerns, not newly executed 0.8.1 checks. The old ocean migration/default behavior and four-effect tool exercises are no longer current product behavior.

## Verification limitations

No browser-control tool is available in this pass. We have not visually verified current GUI layout at narrow widths, light/dark contrast, SVG appearance, the rendered dot density/gradient/glow, pointer-lens experience, keyboard focus or browser resource recovery. Active slots, syntax checks and unit tests do not establish these results. No substitute web server, mock React/DOM/Canvas renderer, personal browser inspection, authentication bypass or screenshot dependency is used as visual evidence.

The background-layout adapter is version-specific to DSH `0.2.1-rc.5`, not an officially stable background extension point. The settings section and configuration APIs are public extension points.
