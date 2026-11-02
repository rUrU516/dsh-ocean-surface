import { CASSETTES, getCassette, getCassetteParams, cassettePatch } from './cassette-catalog.js';

/** Flat dictionaries: register these in the same locale namespace as the deck page. */
export const DECK_DICTS = {
  en: {
    'deck.locale': 'en',
    'deck.title': 'Background Tapes',
    'deck.tagline': 'A small collection of quieter spaces.',
    'deck.background': 'Background',
    'deck.enable': 'Turn background on',
    'deck.disable': 'Turn background off',
    'deck.on': 'On',
    'deck.off': 'Off',
    'deck.preview': 'Audition',
    'deck.previewOnly': 'Preview only',
    'deck.playing': 'Now playing',
    'deck.inserted': 'Inserted',
    'deck.paused': 'Background off',
    'deck.unsaved': 'Unapplied changes',
    'deck.insert': 'Insert tape',
    'deck.apply': 'Insert tape',
    'deck.previewLabel': 'Interactive preview of the selected background tape',
    'deck.touch': 'Move your pointer. Take a moment.',
    'deck.previewError': 'This preview could not be rendered. You can still choose a tape and save its settings.',
    'deck.offHint': 'Your background is off. This is a preview; inserting a tape will not turn it on.',
    'deck.draftHint': 'Only this preview has changed. Insert the tape to use these settings.',
    'deck.auditionHint': 'Just an audition. Your background stays as it is until you insert this tape.',
    'deck.playingHint': 'This tape is your current background.',
    'deck.tune': 'Fine-tune',
    'deck.tuneHint': 'Open one control at a time. Every adjustment stays in this preview.',
    'deck.close': 'Close control',
    'deck.reset': 'Reset this tape',
    'deck.resetHint': 'Restore the selected tape’s default settings in this preview only.',
    'deck.resetNotice': 'Defaults restored in the preview. Insert the tape to apply them.',
    'deck.drawer': 'The tape drawer',
    'deck.drawerHint': 'Four little atmospheres. Pick one to try.',
    'deck.choose': 'Audition tape',
    'deck.chooseHint': 'Selecting another tape discards unapplied adjustments, not your saved background.',
    'deck.discarded': 'Previous preview adjustments were discarded. Your saved background has not changed.',
    'deck.remote': 'Saved settings changed elsewhere. Your unapplied preview has been kept; inserting will apply it over the latest settings.',
    'deck.loading': 'Loading your tapes…',
    'deck.saving': 'Saving…',
    'deck.saved': 'Saved',
    'deck.readOnly': 'Read-only. You can audition tapes, but cannot save changes.',
    'deck.saveError': 'The tape could not be saved. Your preview has been kept so you can try again.',
    'deck.tint': 'Tone',
    'deck.tintHint': 'A color for this atmosphere. Enter a six-digit hex color.',
    'deck.tintInvalid': 'Use a six-digit hex color, such as #8b91d4.',
    'deck.brightness': 'Light',
    'deck.brightnessHint': 'From a softer glow to a brighter surface.',
    'deck.brightnessLow': 'Soft',
    'deck.brightnessHigh': 'Bright',
    'deck.opacity': 'Presence',
    'deck.opacityHint': 'A quiet trace or a more visible texture. Text stays solid.',
    'deck.opacityLow': 'Subtle',
    'deck.opacityHigh': 'Vivid',
    'deck.strength': 'Response',
    'deck.strengthHint': 'How strongly the surface responds to your pointer.',
    'deck.strengthLow': 'Gentle',
    'deck.strengthHigh': 'Expressive',
    'deck.scale': 'Spacing',
    'deck.scaleHint': 'Give the pattern a little more or less room.',
    'deck.scaleLow': 'Close',
    'deck.scaleHigh': 'Open',
    'deck.waveStrength': 'Waves',
    'deck.waveStrengthHint': 'From a smooth sea to more sculpted waves.',
    'deck.waveStrengthLow': 'Smooth',
    'deck.waveStrengthHigh': 'Rolling',
    'deck.speed': 'Pace',
    'deck.speedHint': 'Slow the motion down, or let it move a little faster.',
    'deck.speedLow': 'Slow',
    'deck.speedHigh': 'Swift',
    'deck.damping': 'Settling',
    'deck.dampingHint': 'How quickly pointer ripples fade. The natural ocean swell keeps flowing.',
    'deck.dampingLow': 'Lingering',
    'deck.dampingHigh': 'Quick to calm',
  },
  zh: {
    'deck.locale': 'zh',
    'deck.title': '背景磁带',
    'deck.tagline': '收藏几种安静，给日常换个背景。',
    'deck.background': '背景',
    'deck.enable': '开启背景',
    'deck.disable': '关闭背景',
    'deck.on': '开',
    'deck.off': '关',
    'deck.preview': '试听中',
    'deck.previewOnly': '仅预览',
    'deck.playing': '正在播放',
    'deck.inserted': '已插入',
    'deck.paused': '背景已关闭',
    'deck.unsaved': '有未应用的调整',
    'deck.insert': '插入使用',
    'deck.apply': '插入使用',
    'deck.previewLabel': '当前所选背景磁带的可交互预览',
    'deck.touch': '划过这里，停留片刻。',
    'deck.previewError': '暂时无法渲染预览，仍可选择磁带、调整并保存设置。',
    'deck.offHint': '背景已关闭。这里仍可试听，插入磁带不会自动开启背景。',
    'deck.draftHint': '调整只在这里试听，点击「插入使用」后才会应用。',
    'deck.auditionHint': '先试听一下。插入之前，不会改变你正在使用的背景。',
    'deck.playingHint': '这盘磁带，就是你当前的背景。',
    'deck.tune': '细调',
    'deck.tuneHint': '一次打开一项，调整仅作用于当前试听。',
    'deck.close': '收起调节',
    'deck.reset': '重置这盘',
    'deck.resetHint': '仅将当前磁带的试听参数恢复默认，插入后才保存。',
    'deck.resetNotice': '试听已恢复默认；点击「插入使用」后才会应用。',
    'deck.drawer': '磁带抽屉',
    'deck.drawerHint': '四种氛围，挑一盘听听。',
    'deck.choose': '试听磁带',
    'deck.chooseHint': '换一盘会丢弃未应用的试听调整，不会改变已保存的背景。',
    'deck.discarded': '上一盘未应用的试听调整已丢弃，已保存的背景没有改变。',
    'deck.remote': '设置已在其他地方更新。你的未应用试听已保留；插入时会基于最新设置应用。',
    'deck.loading': '正在读取磁带…',
    'deck.saving': '正在保存…',
    'deck.saved': '已保存',
    'deck.readOnly': '当前设置只读：可以试听，暂时不能保存。',
    'deck.saveError': '未能保存这盘磁带。试听调整已保留，可以再次插入。',
    'deck.tint': '色调',
    'deck.tintHint': '为这片氛围选一种色调，输入六位十六进制颜色。',
    'deck.tintInvalid': '请输入六位十六进制颜色，例如 #8b91d4。',
    'deck.brightness': '光线',
    'deck.brightnessHint': '柔和一点，或让水面明亮一些。',
    'deck.brightnessLow': '柔和',
    'deck.brightnessHigh': '明亮',
    'deck.opacity': '浓淡',
    'deck.opacityHint': '若隐若现，或更有存在感；不改变文字透明度。',
    'deck.opacityLow': '淡淡的',
    'deck.opacityHigh': '更明显',
    'deck.strength': '回应',
    'deck.strengthHint': '让表面对指尖的回应轻一点，或更鲜明。',
    'deck.strengthLow': '轻柔',
    'deck.strengthHigh': '鲜明',
    'deck.scale': '间距',
    'deck.scaleHint': '让图案紧凑一些，或留出更多呼吸的空间。',
    'deck.scaleLow': '紧凑',
    'deck.scaleHigh': '舒展',
    'deck.waveStrength': '浪高',
    'deck.waveStrengthHint': '从平滑的水面，到更有层次的波峰。',
    'deck.waveStrengthLow': '平静',
    'deck.waveStrengthHigh': '起伏',
    'deck.speed': '节奏',
    'deck.speedHint': '慢慢漂流，或流动得轻快一些。',
    'deck.speedLow': '缓慢',
    'deck.speedHigh': '轻快',
    'deck.damping': '余波',
    'deck.dampingHint': '调节指尖涟漪多久平息；自然涌浪仍会继续。',
    'deck.dampingLow': '余韵悠长',
    'deck.dampingHigh': '更快平息',
  },
};

// An ocean's global enabled flag is deliberately not part of an audition draft.
function deckParams(settings, id) {
  const { enabled: _enabled, ...params } = getCassetteParams(settings, id);
  return params;
}
function signature(params) {
  return JSON.stringify(Object.keys(params).sort().map(key => [key, params[key]]));
}
const validTint = value => /^#[\da-f]{6}$/i.test(value);

/** Original printed cassette artwork. Literal colors are confined to this SVG. */
function createTapeArtwork(React) {
  const h = React.createElement;
  return function TapeArtwork({ tape }) {
    const palettes = {
      'dot-field': ['#1c2036', '#272a46', '#8785c5', '#c4a1c8'],
      ripple: ['#172a31', '#20383e', '#6f9fa5', '#abc1bc'],
      contour: ['#2b2924', '#39342b', '#b3a17a', '#d5c8a5'],
      ocean: ['#192b35', '#213d4a', '#659ba9', '#a3bec9'],
    };
    const [body, ink, accent, paper] = palettes[tape.id] || palettes.ocean;
    let pattern;
    if (tape.id === 'dot-field') {
      pattern = Array.from({ length: 117 }, (_, i) => {
        const col = i % 13, row = Math.floor(i / 13);
        const x = 70 + col * 12, y = 13 + row * 8;
        const d = Math.hypot(x - 159, (y - 49) * 1.5);
        const bend = Math.max(0, 1 - d / 69);
        return h('circle', { key: i, cx: x + bend * (x - 159) * .26,
          cy: y + bend * (y - 49) * .5, r: .65 + bend * .6, fill: paper, opacity: .24 + bend * .56 });
      });
      pattern.push(h('ellipse', { key: 'orbit', cx: 159, cy: 48, rx: 40, ry: 30,
        fill: 'none', stroke: accent, strokeWidth: .7, opacity: .5, transform: 'rotate(-22 159 48)' }));
    } else if (tape.id === 'ripple') {
      pattern = Array.from({ length: 10 }, (_, i) => h('ellipse', { key: i,
        cx: 153, cy: 46, rx: 7 + i * 9, ry: 4 + i * 5.1, fill: 'none',
        stroke: i % 3 === 0 ? paper : accent, strokeWidth: i === 0 ? 1.2 : .6, opacity: .8 - i * .055 }));
      pattern.push(h('path', { key: 'axis', d: 'M153 15V79M88 46h130', stroke: paper, strokeWidth: .5, opacity: .16 }));
    } else if (tape.id === 'contour') {
      pattern = Array.from({ length: 15 }, (_, i) => h('path', { key: i,
        d: `M65 ${-15 + i * 7} C100 ${34 + i * 2.5},122 ${-9 + i * 5},148 ${15 + i * 4} S188 ${74 + i * 3},232 ${31 + i * 4.5}`,
        fill: 'none', stroke: i % 4 === 0 ? paper : accent, strokeWidth: i % 4 === 0 ? .85 : .55, opacity: .72 }));
    } else {
      pattern = Array.from({ length: 13 }, (_, i) => h('path', { key: i,
        d: `M65 ${20 + i * 4.7} Q92 ${8 + i * 6},122 ${23 + i * 4.1} T179 ${18 + i * 4.8} T239 ${25 + i * 4.5}`,
        fill: 'none', stroke: i % 4 === 0 ? paper : accent, strokeWidth: i % 4 === 0 ? 1.3 : .6, opacity: .63 }));
    }
    return h('svg', { className: 'tape-deck-art', viewBox: '0 0 240 148', fill: 'none', 'aria-hidden': true, focusable: false },
      h('path', { d: 'M14 3h212a11 11 0 0 1 11 11v116a11 11 0 0 1-11 11h-53l-6 4H73l-6-4H14a11 11 0 0 1-11-11V14A11 11 0 0 1 14 3Z', fill: body, stroke: accent, strokeOpacity: .3 }),
      h('rect', { x: 10, y: 10, width: 220, height: 74, rx: 5, fill: ink }),
      h('svg', { x: 11, y: 11, width: 218, height: 72, viewBox: '11 11 218 72', overflow: 'hidden' }, ...pattern),
      h('path', { d: 'M19 19h35M19 22h21', stroke: paper, strokeWidth: .65, opacity: .55 }),
      h('text', { x: 19, y: 58, fill: paper, fontSize: 28, fontWeight: 300, fontFamily: 'ui-monospace, monospace', letterSpacing: '-2' }, tape.number),
      h('path', { d: 'M20 70h5m3 0h2m3 0h6m3 0h2m3 0h4', stroke: accent, strokeWidth: 2, opacity: .75 }),
      h('rect', { x: 28, y: 90, width: 184, height: 33, rx: 16.5, fill: '#10171e', stroke: accent, strokeWidth: .55, strokeOpacity: .3 }),
      h('path', { d: 'M76 92h88M76 121h88', stroke: paper, strokeWidth: .55, opacity: .22 }),
      ...[76, 164].map(cx => h('g', { key: cx },
        h('circle', { cx, cy: 106.5, r: 14.5, fill: ink, stroke: accent, strokeWidth: .75, strokeOpacity: .55 }),
        h('circle', { cx, cy: 106.5, r: 9, fill: body, stroke: paper, strokeWidth: 2.5, strokeOpacity: .68 }),
        ...Array.from({ length: 6 }, (_, i) => h('path', { key: i, d: `M${cx} 96v4`, stroke: body, strokeWidth: 2.5, transform: `rotate(${i * 60} ${cx} 106.5)` })),
        h('circle', { cx, cy: 106.5, r: 3.1, fill: '#10171e' }))),
      h('path', { d: 'M111 102h18v9h-18z', fill: ink, stroke: accent, strokeWidth: .5, strokeOpacity: .3 }),
      h('path', { d: 'm87 141 6-12h54l6 12', stroke: accent, strokeWidth: .65, opacity: .32 }),
      ...[[15, 91], [225, 91], [15, 131], [225, 131]].map(([cx, cy]) => h('g', { key: `${cx}-${cy}`, opacity: .4 },
        h('circle', { cx, cy, r: 2, stroke: accent, strokeWidth: .6 }),
        h('path', { d: `M${cx - 1} ${cy}h2`, stroke: accent, strokeWidth: .5 }))),
      h('text', { x: 20, y: 113, fill: paper, fontSize: 6, fontFamily: 'ui-monospace, monospace', opacity: .65 }, 'A'));
  };
}

const DECK_CSS = `
.tape-deck{width:100%;min-width:0;color:var(--dsw-alias-label-primary);font:inherit;container-type:inline-size;line-height:1.5}
.tape-deck *,.tape-deck *::before,.tape-deck *::after{box-sizing:border-box}
.tape-deck h2,.tape-deck h3,.tape-deck p{margin:0}
.tape-deck button,.tape-deck input{font:inherit}
.tape-deck button{cursor:pointer;-webkit-tap-highlight-color:transparent}
.tape-deck button:disabled,.tape-deck input:disabled{opacity:.45;cursor:not-allowed}
.tape-deck button:focus-visible,.tape-deck input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:4px}
.tape-deck-header{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:2px 2px 23px}
.tape-deck-brand{display:flex;gap:12px;align-items:center;min-width:0}
.tape-deck-mark{width:34px;height:34px;flex:none;color:var(--dsw-alias-label-secondary)}
.tape-deck-title{font-size:24px;font-weight:530;letter-spacing:-.045em;line-height:1.3}
.tape-deck-tagline{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:5px!important}
.tape-deck-power{display:flex;align-items:center;gap:9px;background:none;border:0;color:var(--dsw-alias-label-secondary);padding:8px 0 8px 8px;font-size:11px!important;flex:none}
.tape-deck-switch{display:block;width:29px;height:17px;padding:3px;border-radius:20px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);transition:background .15s}
.tape-deck-switch::after{content:'';display:block;width:9px;height:9px;border-radius:50%;background:var(--dsw-alias-label-secondary);transition:transform .15s}
.tape-deck-power[aria-checked=true] .tape-deck-switch{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,var(--dsw-alias-bg-base))}
.tape-deck-power[aria-checked=true] .tape-deck-switch::after{transform:translateX(12px);background:var(--dsw-alias-brand-primary)}
.tape-deck-player{border:1px solid var(--dsw-alias-border-l1);border-radius:20px;overflow:hidden;background:var(--dsw-alias-bg-base)}
.tape-deck-stage{position:relative;isolation:isolate;height:clamp(238px,34vh,340px);overflow:hidden}
.tape-deck-surface{position:absolute;inset:0}
.tape-deck-stage-top{position:absolute;z-index:1;top:17px;left:19px;right:19px;display:flex;align-items:center;justify-content:space-between;gap:10px;pointer-events:none}
.tape-deck-badges{display:flex;flex-wrap:wrap;gap:6px}
.tape-deck-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:20px;background:color-mix(in srgb,var(--dsw-alias-bg-overlay) 88%,transparent);font-size:10px;line-height:1.4;color:var(--dsw-alias-label-secondary)}
.tape-deck-badge[data-kind=preview]{color:var(--dsw-alias-brand-primary);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 28%,var(--dsw-alias-border-l1))}
.tape-deck-badge[data-kind=playing]::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--dsw-alias-state-success-primary)}
.tape-deck-serial{font:10px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--dsw-alias-label-secondary);white-space:nowrap;padding:3px 5px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 65%,transparent);border-radius:4px}
.tape-deck-stage-caption{position:absolute;inset:auto 0 0;z-index:1;pointer-events:none;padding:42px 22px 20px;background:linear-gradient(transparent,color-mix(in srgb,var(--dsw-alias-bg-base) 92%,transparent))}
.tape-deck-mood{font-size:9px;letter-spacing:.13em;color:var(--dsw-alias-label-secondary);margin-bottom:7px!important}
.tape-deck-current-title{font-size:23px;font-weight:500;letter-spacing:-.035em;line-height:1.3}
.tape-deck-current-subtitle{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:6px!important;max-width:52ch}
.tape-deck-touch{position:absolute;top:40%;left:18px;right:18px;text-align:center;pointer-events:none;font-size:10px;letter-spacing:.025em;color:var(--dsw-alias-label-secondary);opacity:.7}
.tape-deck-transport{position:relative;z-index:2;display:flex;align-items:center;gap:20px;padding:16px 21px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.tape-deck-transport-copy{flex:1;min-width:0}
.tape-deck-status{font-size:11px;color:var(--dsw-alias-label-secondary)}
.tape-deck-status[data-unsaved=true]{color:var(--dsw-alias-brand-primary)}
.tape-deck-action-hint{margin-top:4px!important;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.65;max-width:60ch}
.tape-deck-insert{display:inline-flex;justify-content:center;align-items:center;gap:9px;min-height:39px;border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 42%,var(--dsw-alias-border-l2));background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);border-radius:10px;padding:8px 16px;font-size:12px!important;font-weight:550;white-space:nowrap;transition:background .15s,border-color .15s}
.tape-deck-insert:not(:disabled):hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 20%,var(--dsw-alias-bg-layer-1));border-color:var(--dsw-alias-brand-primary)}
.tape-deck-insert:disabled{opacity:.6}
.tape-deck-insert svg{width:14px;height:14px;flex:none}
.tape-deck-tuning{padding:15px 2px 22px}
.tape-deck-tune-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.tape-deck-tune-label{font-size:10px;letter-spacing:.035em;color:var(--dsw-alias-label-secondary);margin-right:3px}
.tape-deck-knob{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:30px;padding:5px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-base);font-size:11px!important;transition:border-color .15s,color .15s}
.tape-deck-knob:hover,.tape-deck-knob[aria-expanded=true]{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1)}
.tape-deck-knob[aria-expanded=true]{border-color:var(--dsw-alias-brand-primary)}
.tape-deck-knob-dot{width:11px;height:11px;display:block;border:1px solid currentColor;border-radius:50%;position:relative;opacity:.75}
.tape-deck-knob-dot::after{content:'';position:absolute;left:4px;top:1px;width:1px;height:4px;background:currentColor;transform:rotate(30deg);transform-origin:bottom}
.tape-deck-reset{margin-left:auto;min-height:30px;border:0;padding:5px 3px 5px 9px;background:none;color:var(--dsw-alias-label-secondary);font-size:10px!important;text-decoration:underline;text-decoration-color:var(--dsw-alias-border-l2);text-underline-offset:4px}
.tape-deck-control{width:min(100%,390px);margin-top:10px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-overlay);padding:14px 16px;box-shadow:0 8px 24px color-mix(in srgb,var(--dsw-alias-label-primary) 4%,transparent);animation:tape-deck-reveal .12s ease-out}
.tape-deck-control-heading{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.tape-deck-control-heading label{font-size:12px;font-weight:550;flex:1}
.tape-deck-value{font:10px ui-monospace,SFMono-Regular,Consolas,monospace;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary)}
.tape-deck-close{display:grid;place-items:center;width:26px;height:26px;border:0;background:none;color:var(--dsw-alias-label-secondary);padding:4px;border-radius:6px}
.tape-deck-close:hover{background:var(--dsw-alias-bg-layer-2)}
.tape-deck-close svg{width:13px;height:13px}
.tape-deck-control-hint{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.6;margin-bottom:11px!important}
.tape-deck-range{display:block;width:100%;min-width:0;height:26px;appearance:none;-webkit-appearance:none;cursor:pointer;background:none;margin:0;padding:0;accent-color:var(--dsw-alias-brand-primary)}
.tape-deck-range::-webkit-slider-runnable-track{height:3px;border-radius:4px;background:linear-gradient(to right,var(--dsw-alias-brand-primary) var(--deck-progress),var(--dsw-alias-border-l2) var(--deck-progress))}
.tape-deck-range::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:13px;height:13px;margin-top:-5px;border-radius:50%;border:2px solid var(--dsw-alias-bg-overlay);background:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}
.tape-deck-range::-moz-range-track{height:3px;border-radius:4px;background:var(--dsw-alias-border-l2)}
.tape-deck-range::-moz-range-progress{height:3px;border-radius:4px;background:var(--dsw-alias-brand-primary)}
.tape-deck-range::-moz-range-thumb{width:10px;height:10px;border-radius:50%;border:2px solid var(--dsw-alias-bg-overlay);background:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}
.tape-deck-range-ends{display:flex;justify-content:space-between;gap:10px;color:var(--dsw-alias-label-secondary);font-size:10px}
.tape-deck-hex{display:block;width:100%;max-width:170px;min-height:34px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:7px;padding:6px 10px;font:12px ui-monospace,SFMono-Regular,Consolas,monospace!important}
.tape-deck-hex[aria-invalid=true]{border-color:var(--dsw-alias-state-error-primary)}
.tape-deck-drawer{position:relative;border:1px solid var(--dsw-alias-border-l1);border-radius:20px;background:var(--dsw-alias-bg-layer-1);padding:25px 20px 17px;box-shadow:inset 0 5px 12px color-mix(in srgb,var(--dsw-alias-label-primary) 2%,transparent)}
.tape-deck-drawer::before{content:'';position:absolute;top:9px;left:calc(50% - 16px);width:32px;height:3px;border-radius:4px;background:var(--dsw-alias-border-l2)}
.tape-deck-drawer-heading{display:flex;align-items:baseline;gap:10px;margin-bottom:4px}
.tape-deck-drawer-title{font-size:14px;font-weight:550;letter-spacing:-.02em}
.tape-deck-count{font:10px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--dsw-alias-label-secondary)}
.tape-deck-drawer-subtitle{font-size:11px;color:var(--dsw-alias-label-secondary);margin-bottom:19px!important}
.tape-deck-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.tape-deck-card{display:block;text-align:left;min-width:0;width:100%;padding:10px 10px 11px;border:1px solid var(--dsw-alias-border-l1);border-radius:13px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);transition:transform .15s,border-color .15s,box-shadow .15s}
.tape-deck-card:not(:disabled):hover{transform:translateY(-2px);border-color:var(--dsw-alias-border-l2);box-shadow:0 5px 14px color-mix(in srgb,var(--dsw-alias-label-primary) 4%,transparent)}
.tape-deck-card[aria-pressed=true]{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent)}
.tape-deck-art{display:block;width:100%;height:auto;filter:drop-shadow(0 3px 3px color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent))}
.tape-deck-card-copy{display:flex;align-items:baseline;gap:7px;margin:10px 3px 2px}
.tape-deck-card-name{font-size:12px;font-weight:550;flex:1;min-width:0;line-height:1.4}
.tape-deck-card-number{font:9px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--dsw-alias-label-secondary)}
.tape-deck-card-meta{display:flex;justify-content:space-between;align-items:center;gap:6px;min-height:21px;margin:4px 3px 0;color:var(--dsw-alias-label-secondary);font-size:9px;line-height:1.5}
.tape-deck-card-mood{overflow-wrap:anywhere;letter-spacing:.035em}
.tape-deck-card-state{display:inline-flex;align-items:center;gap:4px;flex:none;color:var(--dsw-alias-label-secondary)}
.tape-deck-card-state[data-preview=true]{color:var(--dsw-alias-brand-primary)}
.tape-deck-card-state[data-playing=true]::before{content:'';width:3px;height:3px;background:var(--dsw-alias-state-success-primary);border-radius:50%}
.tape-deck-drawer-note{margin-top:15px!important;font-size:10px;color:var(--dsw-alias-label-secondary);line-height:1.7}
.tape-deck-notice{margin:10px 2px 0!important;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.7;overflow-wrap:anywhere}
.tape-deck-error{color:var(--dsw-alias-state-error-primary)}
@keyframes tape-deck-reveal{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:none}}
@container(min-width:940px){.tape-deck-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@container(max-width:500px){.tape-deck-header{gap:12px}.tape-deck-brand{gap:9px}.tape-deck-mark{width:27px;height:27px}.tape-deck-title{font-size:22px}.tape-deck-tagline{font-size:11px}.tape-deck-power-label{display:none}.tape-deck-transport{padding:14px 16px;gap:12px}.tape-deck-action-hint{font-size:10px}.tape-deck-insert{padding:8px 12px}.tape-deck-drawer{padding:25px 14px 15px}.tape-deck-grid{gap:10px}.tape-deck-card{padding:7px}.tape-deck-card-name{font-size:11px}.tape-deck-card-meta{display:block}.tape-deck-card-state{min-height:15px}.tape-deck-card-copy{margin-top:8px}}
@container(max-width:359px){.tape-deck-header{align-items:flex-start;padding-bottom:17px}.tape-deck-brand{gap:8px}.tape-deck-mark{width:22px;height:22px;margin-top:3px}.tape-deck-title{font-size:21px}.tape-deck-tagline{font-size:10px;max-width:22ch}.tape-deck-power{padding-top:5px}.tape-deck-stage{height:250px}.tape-deck-stage-top{left:13px;right:13px;top:13px}.tape-deck-stage-caption{padding:42px 16px 17px}.tape-deck-current-title{font-size:21px}.tape-deck-current-subtitle{font-size:11px}.tape-deck-transport{align-items:stretch;flex-direction:column;gap:11px}.tape-deck-insert{width:100%}.tape-deck-grid{grid-template-columns:minmax(0,1fr)}.tape-deck-card{padding:10px}.tape-deck-card-name{font-size:13px}.tape-deck-card-meta{display:flex}.tape-deck-tune-label{width:100%;margin-bottom:2px}.tape-deck-reset{margin-left:0;padding-left:3px}.tape-deck-knob{padding:5px 8px}.tape-deck-serial{font-size:9px}}
@media(prefers-reduced-motion:reduce){.tape-deck *,.tape-deck *::before,.tape-deck *::after{animation:none!important;transition:none!important}.tape-deck-card:not(:disabled):hover{transform:none}}
`;

/** One real Surface, local audition state, and an explicit single-patch commit. */
export function createDeckPage({ React, ctx, model, t, Surface }) {
  const h = React.createElement;
  const Artwork = createTapeArtwork(React);
  const text = key => t(`deck.${key}`);
  const subscribeLocale = listener => ctx.locale.subscribe(listener);
  const getLocale = () => ctx.locale.getSnapshot();
  const icon = (kind, props = {}) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false, ...props },
    kind === 'mark' ? h(React.Fragment, null,
      h('rect', { x: 2.5, y: 5, width: 19, height: 14, rx: 3 }),
      h('circle', { cx: 8, cy: 12, r: 2.5 }), h('circle', { cx: 16, cy: 12, r: 2.5 }),
      h('path', { d: 'M8 9.5h8M8 14.5h8M8 19l1.5-3h5l1.5 3' }))
      : h('path', { d: kind === 'close' ? 'm7 7 10 10M17 7 7 17' : kind === 'check' ? 'm5 12 4 4L19 6' : 'M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4' }));

  return function DeckPage() {
    const snapshot = React.useSyncExternalStore(model.subscribe, model.getSnapshot, model.getSnapshot);
    React.useSyncExternalStore(subscribeLocale, getLocale, getLocale);
    const lang = text('locale') === 'zh' ? 'zh' : 'en';
    const settings = snapshot.settings;
    // A null draft follows remote settings. Once edited, it is never replaced by a remote update.
    const [editor, setEditor] = React.useState({ id: null, draft: null, base: null });
    const [active, setActive] = React.useState(null);
    const [colorText, setColorText] = React.useState('');
    const [notice, setNotice] = React.useState('');
    const [localError, setLocalError] = React.useState('');
    const [previewError, setPreviewError] = React.useState(null);
    const [pending, setPending] = React.useState(null);
    const controlInput = React.useRef(null);
    const controlButtons = React.useRef({});
    const id = React.useId();
    const selected = getCassette(editor.id || settings.cassette);
    const persisted = React.useMemo(() => deckParams(settings, selected.id), [settings, selected.id]);
    const params = editor.draft || persisted;
    const persistedSignature = signature(persisted);
    const draftSignature = signature(params);
    const dirty = draftSignature !== persistedSignature;
    const isCurrent = selected.id === settings.cassette;
    const audition = !isCurrent || dirty;
    const remoteConflict = editor.draft && editor.base !== persistedSignature && dirty;
    const editDisabled = !snapshot.loaded || snapshot.saving;
    const saveDisabled = !snapshot.loaded || !snapshot.writable || snapshot.saving;
    const invalidColor = active === 'tint' && !validTint(colorText);
    const control = selected.controls.find(([key]) => key === active);
    const controls = [['tint'], ...selected.controls];
    const changePending = !!pending || snapshot.saving;
    const canInsert = !saveDisabled && !invalidColor && (!isCurrent || dirty || !!snapshot.error || !!localError);
    const hasPreviewError = previewError === selected.id;
    const onSurfaceError = React.useCallback(() => setPreviewError(selected.id), [selected.id]);

    React.useEffect(() => { setActive(null); }, [selected.id]);
    React.useEffect(() => {
      if (active) controlInput.current?.focus({ preventScroll: true });
    }, [active]);
    // A failed optimistic save must retain the preview for retry. Clear it only after acknowledgement.
    // Dependencies are stable primitives (plus the finite pending transaction), not new params objects.
    React.useEffect(() => {
      if (!pending || snapshot.saving) return;
      setPending(null);
      if (!snapshot.error && settings.cassette === pending.id && persistedSignature === pending.signature) {
        setEditor(previous => previous.id === pending.id && previous.draft && signature(previous.draft) === pending.signature
          ? { id: previous.id, draft: null, base: null } : previous);
      }
    }, [pending, snapshot.saving, snapshot.error, settings.cassette, persistedSignature]);

    function closeControl(returnFocus = false) {
      setActive(null);
      if (returnFocus) controlButtons.current[active]?.focus({ preventScroll: true });
    }
    function updateDraft(patch) {
      setEditor({ id: selected.id, draft: { ...params, ...patch }, base: editor.base || persistedSignature });
      setNotice('');
      setLocalError('');
    }
    function choose(tape) {
      if (editDisabled || tape.id === selected.id) return;
      setNotice(dirty ? 'discarded' : '');
      setEditor({ id: tape.id, draft: null, base: null });
      setActive(null);
      setLocalError('');
      setPreviewError(null);
    }
    function insert() {
      const latest = model.getSnapshot();
      if (!canInsert || !latest.loaded || !latest.writable || latest.saving) return;
      setEditor({ id: selected.id, draft: { ...params }, base: persistedSignature });
      setPending({ id: selected.id, signature: draftSignature });
      setNotice('');
      setLocalError('');
      try {
        // Preserve unrelated cassettes and the current global power state from the latest snapshot.
        model.update(cassettePatch(latest.settings, selected.id, params));
      } catch (error) {
        setPending(null);
        setLocalError(error instanceof Error ? error.message : String(error));
      }
    }
    const badge = audition ? 'preview' : settings.enabled ? 'playing' : 'paused';
    const actionHint = !settings.enabled ? 'offHint' : dirty ? 'draftHint' : !isCurrent ? 'auditionHint' : 'playingHint';
    const status = !snapshot.loaded ? 'loading' : changePending ? 'saving' : !snapshot.writable ? 'readOnly'
      : snapshot.error || localError ? 'saveError' : dirty ? 'unsaved' : audition ? 'preview' : 'saved';
    const controlId = `${id}-control`;
    return h('section', { 'data-background-deck':true, className: 'tape-deck', 'aria-labelledby': `${id}-title`, 'aria-busy': !snapshot.loaded || snapshot.saving,
      onKeyDown: event => { if (event.key === 'Escape' && active) { event.preventDefault(); event.stopPropagation(); closeControl(true); } },
      onBlur: event => { if (active && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setActive(null); } },
      h('style', null, DECK_CSS),
      h('header', { className: 'tape-deck-header' },
        h('div', { className: 'tape-deck-brand' }, icon('mark', { className: 'tape-deck-mark' }),
          h('div', null, h('h2', { id: `${id}-title`, className: 'tape-deck-title' }, text('title')),
            h('p', { className: 'tape-deck-tagline' }, text('tagline')))),
        h('button', { type: 'button', className: 'tape-deck-power', role: 'switch', 'aria-checked': !!settings.enabled,
          'aria-label': text(settings.enabled ? 'disable' : 'enable'), title: text(settings.enabled ? 'disable' : 'enable'), disabled: saveDisabled,
          onClick: () => { const latest = model.getSnapshot(); if (latest.loaded && latest.writable && !latest.saving) model.update({ enabled: !latest.settings.enabled }); } },
          h('span', { className: 'tape-deck-power-label' }, text('background')),
          h('span', { className: 'tape-deck-switch', 'aria-hidden': true }))),
      h('div', { className: 'tape-deck-player' },
        h('div', { className: 'tape-deck-stage', role: 'group', 'aria-label': text('previewLabel') },
          h('div', { className: 'tape-deck-surface' }, snapshot.loaded
            ? h(Surface, { key: selected.id, cassette: selected.id, params, enabled: true, preview: true, onError: onSurfaceError, onReady: () => setPreviewError(null) }) : null),
          h('div', { className: 'tape-deck-stage-top' },
            h('div', { className: 'tape-deck-badges' },
              h('span', { className: 'tape-deck-badge', 'data-kind': audition ? 'preview' : settings.enabled ? 'playing' : 'paused' }, text(snapshot.loaded ? badge : 'loading')),
              !settings.enabled ? h('span', { className: 'tape-deck-badge' }, text('previewOnly')) : null),
            h('span', { className: 'tape-deck-serial', 'aria-hidden': true }, `${selected.number} / ${String(CASSETTES.length).padStart(2, '0')}`)),
          !hasPreviewError && snapshot.loaded ? h('p', { className: 'tape-deck-touch' }, text('touch')) : null,
          h('div', { className: 'tape-deck-stage-caption' },
            h('p', { className: 'tape-deck-mood' }, selected.mood[lang]),
            h('h3', { className: 'tape-deck-current-title' }, selected.name[lang]),
            h('p', { className: 'tape-deck-current-subtitle' }, selected.subtitle[lang]))),
        h('div', { className: 'tape-deck-transport' },
          h('div', { className: 'tape-deck-transport-copy' },
            h('p', { className: 'tape-deck-status', role: 'status', 'aria-live': 'polite', 'data-unsaved': dirty && !changePending }, text(status)),
            h('p', { id: `${id}-apply-hint`, className: 'tape-deck-action-hint' }, text(actionHint))),
          h('button', { type: 'button', className: 'tape-deck-insert', disabled: !canInsert, onClick: insert, 'aria-describedby': `${id}-apply-hint` },
            icon(isCurrent && !dirty && !snapshot.error && !localError ? 'check' : 'insert'),
            text(changePending ? 'saving' : isCurrent && !dirty && !snapshot.error && !localError ? settings.enabled ? 'playing' : 'inserted' : 'insert')))),
      h('div', { className: 'tape-deck-tuning', role: 'group', 'aria-label': text('tune'), title: text('tuneHint') },
        h('div', { className: 'tape-deck-tune-row' },
          h('span', { className: 'tape-deck-tune-label' }, text('tune')),
          ...controls.map(([key]) => h('button', { key, ref: node => { controlButtons.current[key] = node; }, type: 'button', className: 'tape-deck-knob',
            'aria-expanded': active === key, 'aria-controls': active === key ? controlId : undefined, 'aria-label': text(key), disabled: editDisabled,
            onClick: () => { if (active === key) closeControl(); else { if (key === 'tint') setColorText(params.tint); setActive(key); } } },
            h('span', { className: 'tape-deck-knob-dot', 'aria-hidden': true }), text(key))),
          h('button', { type: 'button', className: 'tape-deck-reset', disabled: editDisabled, title: text('resetHint'),
            onClick: () => { const { enabled: _enabled, ...defaults } = selected.defaults; setEditor({ id: selected.id, draft: { ...defaults }, base: persistedSignature }); setActive(null); setNotice('resetNotice'); setLocalError(''); } }, text('reset'))),
        active ? h('div', { key: active, id: controlId, className: 'tape-deck-control', role: 'group', 'aria-labelledby': `${id}-control-label` },
          h('div', { className: 'tape-deck-control-heading' },
            h('label', { id: `${id}-control-label`, htmlFor: `${id}-input` }, text(active)),
            active !== 'tint' ? h('output', { className: 'tape-deck-value', htmlFor: `${id}-input` }, Number(params[active]).toFixed(2)) : null,
            h('button', { type: 'button', className: 'tape-deck-close', 'aria-label': text('close'), title: text('close'), onClick: () => closeControl(true) }, icon('close'))),
          h('p', { id: `${id}-control-hint`, className: 'tape-deck-control-hint' }, text(`${active}Hint`)),
          active === 'tint' ? h(React.Fragment, null,
            h('input', { ref: controlInput, id: `${id}-input`, type: 'text', className: 'tape-deck-hex', value: colorText,
              spellCheck: false, autoComplete: 'off', maxLength: 7, 'aria-invalid': invalidColor, 'aria-describedby': `${id}-control-hint${invalidColor ? ` ${id}-color-error` : ''}`, disabled: editDisabled,
              onChange: event => { const value = event.target.value; setColorText(value); if (validTint(value)) updateDraft({ tint: value.toLowerCase() }); } }),
            invalidColor ? h('p', { id: `${id}-color-error`, className: 'tape-deck-notice tape-deck-error', role: 'status' }, text('tintInvalid')) : null)
            : control ? h(React.Fragment, null,
              h('input', { ref: controlInput, id: `${id}-input`, type: 'range', className: 'tape-deck-range', min: control[1], max: control[2], step: control[3], value: params[active],
                'aria-valuetext': Number(params[active]).toFixed(2), 'aria-describedby': `${id}-control-hint`, disabled: editDisabled,
                style: { '--deck-progress': `${Math.max(0, Math.min(100, (params[active] - control[1]) / (control[2] - control[1]) * 100))}%` },
                onChange: event => updateDraft({ [active]: Number(event.target.value) }) }),
              h('div', { className: 'tape-deck-range-ends', 'aria-hidden': true }, h('span', null, text(`${active}Low`)), h('span', null, text(`${active}High`)))) : null) : null),
      hasPreviewError ? h('p', { className: 'tape-deck-notice', role: 'status' }, text('previewError')) : null,
      snapshot.error || localError ? h('div', { className: 'tape-deck-notice tape-deck-error', role: 'alert' },
        h('p', null, text('saveError')), h('p', null, String(snapshot.error || localError))) : null,
      remoteConflict ? h('p', { className: 'tape-deck-notice', role: 'status' }, text('remote')) : null,
      notice ? h('p', { className: 'tape-deck-notice', role: 'status' }, text(notice)) : null,
      h('section', { className: 'tape-deck-drawer', 'aria-labelledby': `${id}-drawer` },
        h('div', { className: 'tape-deck-drawer-heading' },
          h('h3', { id: `${id}-drawer`, className: 'tape-deck-drawer-title' }, text('drawer')),
          h('span', { className: 'tape-deck-count', 'aria-hidden': true }, String(CASSETTES.length).padStart(2, '0'))),
        h('p', { className: 'tape-deck-drawer-subtitle' }, text('drawerHint')),
        h('div', { className: 'tape-deck-grid' }, ...CASSETTES.map(tape => {
          const selectedCard = tape.id === selected.id;
          const installedCard = tape.id === settings.cassette;
          const previewCard = selectedCard && audition;
          const cardState = previewCard ? 'preview' : installedCard ? settings.enabled ? 'playing' : 'inserted' : null;
          return h('button', { key: tape.id, type: 'button', className: 'tape-deck-card', 'aria-pressed': selectedCard, disabled: editDisabled,
            'aria-label': `${text('choose')} ${tape.number} · ${tape.name[lang]}${cardState ? ` · ${text(cardState)}` : ''}`, onClick: () => choose(tape) },
            h(Artwork, { tape }),
            h('span', { className: 'tape-deck-card-copy' },
              h('span', { className: 'tape-deck-card-name' }, tape.name[lang]), h('span', { className: 'tape-deck-card-number', 'aria-hidden': true }, tape.number)),
            h('span', { className: 'tape-deck-card-meta' }, h('span', { className: 'tape-deck-card-mood' }, tape.mood[lang]),
              h('span', { className: 'tape-deck-card-state', 'data-preview': previewCard, 'data-playing': installedCard && settings.enabled && !previewCard }, cardState ? text(cardState) : '\u00a0')));
        })),
        h('p', { className: 'tape-deck-drawer-note' }, text('chooseHint'))));
  };
}
