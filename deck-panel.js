import { CASSETTES, getCassetteParams, cassettePatch } from './cassette-catalog.js';
import { deckPointInRect, deckDragDistance, deckInsertionPlan } from './deck-transport.js';

/** Flat dictionaries: register these in the same locale namespace as the deck page. */
export const DECK_DICTS = {
  en: {
    'deck.locale': 'en', 'deck.title': 'Background Tapes',
    'deck.tagline': 'Small rituals. A different atmosphere.',
    'deck.background': 'Background', 'deck.enable': 'Turn background on', 'deck.disable': 'Turn background off',
    'deck.preview': 'Audition', 'deck.previewOnly': 'Preview only', 'deck.playing': 'Now playing', 'deck.inserted': 'Ready to play',
    'deck.insert': 'Insert {name}', 'deck.previewLabel': 'Interactive preview of the fixed {name} background',
    'deck.touch': 'Move your pointer. Let the background respond.',
    'deck.previewError': 'The preview could not be rendered. Your saved background has not been changed.',
    'deck.offHint': 'Your background is off. Inserting a tape will not turn it on.',
    'deck.auditionHint': 'Just an audition. Insert this tape to change your background.',
    'deck.playingHint': '{name} is in the deck. Everything is already tuned.',
    'deck.drawer': 'The tape drawer', 'deck.drawerHint': 'Pick up a tape. Make room for a different mood.',
    'deck.choose': 'Audition {name}', 'deck.fixed': 'Two authored tapes · no tuning required',
    'deck.loading': 'Loading tapes…', 'deck.saving': 'Saving tape…', 'deck.saved': 'Tape saved',
    'deck.readOnly': 'Read-only. You can audition tapes, but cannot save changes.',
    'deck.saveError': 'The tape could not be saved. Your previous preview has been restored. Please try again.',
    'deck.player': 'Background tape player', 'deck.slotLabel': 'Tape insertion slot. Drop a tape here to insert it.',
    'deck.slotIdle': 'Drop a tape into the deck', 'deck.slotReady': 'Release to insert',
    'deck.slotBusy': 'Loading the deck', 'deck.slotCaption': 'TAPE DECK / BACKGROUND PLAYER',
    'deck.dragHint': 'Drag a tape into the slot, or audition it and press Insert.',
    'deck.dragAria': 'Enter or Space to audition. Use the Insert button to load the tape without dragging.',
    'deck.dragging': 'Tape lifted. Drag it into the slot, or release outside to return it.',
    'deck.returned': 'Tape returned to the drawer. Your background has not changed.',
    'deck.inserting': 'Inserting {name}…', 'deck.accepted': '{name} is in the deck.',
    'deck.current': 'In the deck', 'deck.selected': 'Auditioning', 'deck.collection': 'COLLECTION / 01—02',
    'deck.handle': 'PULL TO DISCOVER', 'deck.insertShort': 'Insert',
  },
  zh: {
    'deck.locale': 'zh', 'deck.title': '背景磁带',
    'deck.tagline': '一点小仪式，换一种氛围。',
    'deck.background': '背景', 'deck.enable': '开启背景', 'deck.disable': '关闭背景',
    'deck.preview': '试听中', 'deck.previewOnly': '仅预览', 'deck.playing': '正在播放', 'deck.inserted': '已就绪',
    'deck.insert': '插入 {name}', 'deck.previewLabel': '{name} 固定背景效果的可交互预览',
    'deck.touch': '划过这里，让背景轻轻回应。',
    'deck.previewError': '暂时无法渲染预览，已保存的背景没有改变。',
    'deck.offHint': '背景已关闭。插入磁带不会自动开启背景。',
    'deck.auditionHint': '现在只是试听。插入这盘磁带，才会更换你的背景。',
    'deck.playingHint': '{name} 已在卡座中，一切都已经调好。',
    'deck.drawer': '磁带抽屉', 'deck.drawerHint': '拿起一盘磁带，给另一种心情留点位置。',
    'deck.choose': '试听 {name}', 'deck.fixed': '两盘精心制作的磁带 · 无需调参',
    'deck.loading': '正在读取磁带…', 'deck.saving': '正在保存磁带…', 'deck.saved': '磁带已保存',
    'deck.readOnly': '当前设置只读：可以试听磁带，暂时不能保存。',
    'deck.saveError': '未能保存磁带，已恢复此前的预览。请再试一次。',
    'deck.player': '背景磁带播放器', 'deck.slotLabel': '磁带插槽：将磁带拖放到这里即可插入。',
    'deck.slotIdle': '把磁带放入卡座', 'deck.slotReady': '松手，插入磁带',
    'deck.slotBusy': '正在装入卡座', 'deck.slotCaption': '磁带卡座 / 背景播放器',
    'deck.dragHint': '把磁带拖进插槽，或先试听，再按「插入」。',
    'deck.dragAria': '按回车或空格试听；也可以使用「插入」按钮，无需拖拽。',
    'deck.dragging': '磁带已拿起。拖进插槽，或在外面松手放回。',
    'deck.returned': '磁带已放回抽屉，背景没有改变。',
    'deck.inserting': '正在插入 {name}…', 'deck.accepted': '{name} 已装入卡座。',
    'deck.current': '已在卡座中', 'deck.selected': '正在试听', 'deck.collection': '磁带收藏 / 01—02',
    'deck.handle': '拉开，发现另一种氛围', 'deck.insertShort': '插入',
  },
};

const signature = params => JSON.stringify(Object.keys(params).filter(key => key !== 'enabled').sort().map(key => [key, params[key]]));

/** Original static SVG covers: a glowing dot lens and flowing aqua wave paths. */
function createTapeArtwork(React) {
  const h = React.createElement;
  return function TapeArtwork({ tape }) {
    const id = `tape-${React.useId().replace(/[^a-z0-9_-]/gi, '')}`, water = tape.id === 'ocean-surface';
    const palette = water
      ? { shell: '#153332', label: '#1a4241', edge: '#83cec5', ink: '#c1f1e8', well: '#102625', tones: ['#4daaaa', '#83d7ca', '#d1f7e8'] }
      : { shell: '#202039', label: '#28243f', edge: '#b19ad7', ink: '#dbc6e6', well: '#151523', tones: ['#777dff', '#b38cf4', '#f1a7da'] };
    const pattern = water ? Array.from({ length: 9 }, (_, i) => {
      const y = 14 + i * 8;
      return h('path', { key: i, d: `M62 ${y}C88 ${y - 18} 112 ${y + 18} 140 ${y}S192 ${y - 18} 232 ${y}`,
        stroke: `url(#${id}-tone)`, strokeWidth: i % 3 === 0 ? 1.5 : .8, opacity: .4 + (i % 3) * .2 });
    }) : Array.from({ length: 264 }, (_, i) => {
      const x = 66 + (i % 24) * 6.7, y = 15 + Math.floor(i / 24) * 6;
      const dx = x - 155, dy = y - 46, distance = Math.hypot(dx, dy * 1.35);
      const lens = Math.max(0, 1 - distance / 66) ** 2;
      return h('circle', { key: i, cx: x + dx * lens * .48, cy: y + dy * lens * .48,
        r: .64 + lens * 1.6, opacity: .42 + lens * .58 });
    });
    return h('svg', { className: 'tape-deck-art', viewBox: '0 0 240 148', fill: 'none', 'aria-hidden': true, focusable: false },
      h('defs', null,
        h('linearGradient', { id: `${id}-tone`, x1: 65, y1: 25, x2: 225, y2: 70, gradientUnits: 'userSpaceOnUse' },
          h('stop', { stopColor: palette.tones[0] }), h('stop', { offset: .5, stopColor: palette.tones[1] }), h('stop', { offset: 1, stopColor: palette.tones[2] })),
        h('filter', { id: `${id}-glow`, x: '-30%', y: '-50%', width: '160%', height: '200%' }, h('feGaussianBlur', { stdDeviation: 2.2 }))),
      h('path', { d: 'M14 3h212a11 11 0 0 1 11 11v116a11 11 0 0 1-11 11h-53l-6 4H73l-6-4H14a11 11 0 0 1-11-11V14A11 11 0 0 1 14 3Z', fill: palette.shell, stroke: palette.edge, strokeOpacity: .32 }),
      h('rect', { x: 10, y: 10, width: 220, height: 74, rx: 5, fill: palette.label }),
      h('svg', { x: 11, y: 11, width: 218, height: 72, viewBox: '11 11 218 72', overflow: 'hidden' },
        h('g', { fill: water ? 'none' : `url(#${id}-tone)`, filter: `url(#${id}-glow)`, opacity: .7 }, ...pattern),
        h('g', { fill: water ? 'none' : `url(#${id}-tone)` }, ...pattern)),
      h('path', { d: 'M19 19h35M19 22h21', stroke: palette.ink, strokeWidth: .65, opacity: .55 }),
      h('text', { x: 19, y: 58, fill: palette.ink, fontSize: 28, fontWeight: 300, fontFamily: 'ui-monospace, monospace', letterSpacing: '-2' }, tape.number),
      h('text', { x: 20, y: 73, fill: palette.edge, fontSize: 6, fontFamily: 'ui-monospace, monospace', letterSpacing: 1 }, water ? 'OCEAN' : 'DOTS'),
      h('rect', { x: 28, y: 90, width: 184, height: 33, rx: 16.5, fill: palette.well, stroke: palette.edge, strokeWidth: .55, strokeOpacity: .3 }),
      h('path', { d: 'M76 92h88M76 121h88', stroke: palette.ink, strokeWidth: .55, opacity: .22 }),
      ...[76, 164].map(cx => h('g', { key: cx },
        h('circle', { cx, cy: 106.5, r: 14.5, fill: palette.label, stroke: palette.edge, strokeWidth: .75, strokeOpacity: .55 }),
        h('circle', { cx, cy: 106.5, r: 9, fill: palette.shell, stroke: palette.ink, strokeWidth: 2.5, strokeOpacity: .68 }),
        ...Array.from({ length: 6 }, (_, i) => h('path', { key: i, d: `M${cx} 96v4`, stroke: palette.shell, strokeWidth: 2.5, transform: `rotate(${i * 60} ${cx} 106.5)` })),
        h('circle', { cx, cy: 106.5, r: 3.1, fill: palette.well }))),
      h('path', { d: 'M111 102h18v9h-18z', fill: palette.label, stroke: palette.edge, strokeWidth: .5, strokeOpacity: .3 }),
      h('path', { d: 'm87 141 6-12h54l6 12', stroke: palette.edge, strokeWidth: .65, opacity: .32 }),
      ...[[15, 91], [225, 91], [15, 131], [225, 131]].map(([cx, cy]) => h('circle', { key: `${cx}-${cy}`, cx, cy, r: 2, stroke: palette.edge, strokeWidth: .6, opacity: .4 })));
  };
}

const DECK_CSS = `
.tape-deck{width:100%;min-width:0;color:var(--dsw-alias-label-primary);font:inherit;line-height:1.5}
.tape-deck *,.tape-deck *::before,.tape-deck *::after{box-sizing:border-box}
.tape-deck h2,.tape-deck h3,.tape-deck p{margin:0}
.tape-deck button{font:inherit;-webkit-tap-highlight-color:transparent}
.tape-deck button:disabled{cursor:not-allowed}
.tape-deck button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:5px}
.tape-deck .tape-deck-layout{min-width:0;container-type:inline-size}
.tape-deck .tape-deck-header{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:2px 2px 24px}
.tape-deck .tape-deck-brand{display:flex;gap:12px;align-items:center;min-width:0}
.tape-deck .tape-deck-mark{width:35px;height:35px;flex:none;color:var(--dsw-alias-label-secondary)}
.tape-deck .tape-deck-title{font-size:25px;font-weight:550;letter-spacing:-.045em;line-height:1.25}
.tape-deck .tape-deck-tagline{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:5px}
.tape-deck .tape-deck-power{display:flex;align-items:center;gap:9px;background:none;border:0;color:var(--dsw-alias-label-secondary);padding:8px 0 8px 8px;font-size:11px;flex:none;cursor:pointer}
.tape-deck .tape-deck-power:disabled{opacity:.45}
.tape-deck .tape-deck-switch{display:block;width:29px;height:17px;padding:3px;border-radius:20px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2)}
.tape-deck .tape-deck-switch::after{content:'';display:block;width:9px;height:9px;border-radius:50%;background:var(--dsw-alias-label-secondary);transition:transform .2s}
.tape-deck .tape-deck-power[aria-checked=true] .tape-deck-switch{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,var(--dsw-alias-bg-base))}
.tape-deck .tape-deck-power[aria-checked=true] .tape-deck-switch::after{transform:translateX(12px);background:var(--dsw-alias-brand-primary)}
.tape-deck .tape-deck-player{position:relative;border:1px solid var(--dsw-alias-border-l2);border-radius:22px;padding:8px;background:linear-gradient(145deg,var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1) 35%,var(--dsw-alias-bg-base));box-shadow:0 2px 1px color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent),0 14px 36px -25px color-mix(in srgb,var(--dsw-alias-label-primary) 32%,transparent),inset 0 1px 0 var(--dsw-alias-bg-overlay)}
.tape-deck .tape-deck-stage{position:relative;isolation:isolate;height:clamp(190px,27vh,245px);overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:15px;background:var(--dsw-alias-bg-base)}
.tape-deck .tape-deck-surface{position:absolute;inset:0}
.tape-deck .tape-deck-stage-top{position:absolute;z-index:1;top:16px;left:17px;right:17px;display:flex;align-items:center;justify-content:space-between;gap:10px;pointer-events:none}
.tape-deck .tape-deck-badges{display:flex;flex-wrap:wrap;gap:6px}
.tape-deck .tape-deck-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:20px;background:color-mix(in srgb,var(--dsw-alias-bg-overlay) 88%,transparent);font-size:10px;color:var(--dsw-alias-label-secondary)}
.tape-deck .tape-deck-badge[data-preview=true]{color:var(--dsw-alias-brand-primary)}
.tape-deck .tape-deck-serial{font:9px ui-monospace,monospace;color:var(--dsw-alias-label-secondary);padding:4px 6px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 72%,transparent);border-radius:4px;letter-spacing:.08em}
.tape-deck .tape-deck-stage-caption{position:absolute;inset:auto 0 0;z-index:1;pointer-events:none;padding:42px 20px 20px;background:linear-gradient(transparent,color-mix(in srgb,var(--dsw-alias-bg-base) 94%,transparent))}
.tape-deck .tape-deck-mood{font-size:9px;letter-spacing:.15em;color:var(--dsw-alias-label-secondary);margin-bottom:7px}
.tape-deck .tape-deck-current-title{font-size:24px;font-weight:500;letter-spacing:-.035em;line-height:1.3}
.tape-deck .tape-deck-current-subtitle{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:6px;max-width:52ch}
.tape-deck .tape-deck-touch{position:absolute;top:40%;left:18px;right:18px;text-align:center;pointer-events:none;font-size:10px;color:var(--dsw-alias-label-secondary);opacity:.7}
.tape-deck .tape-deck-hardware{padding:17px 12px 9px;min-width:0}
.tape-deck .tape-deck-hardware-line{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 7px;font:8px ui-monospace,monospace;letter-spacing:.16em;color:var(--dsw-alias-label-secondary)}
.tape-deck .tape-deck-led{display:inline-block;width:5px;height:5px;flex:none;margin-right:7px;border-radius:50%;background:var(--dsw-alias-label-secondary)}
.tape-deck .tape-deck-led[data-on=true]{background:var(--dsw-alias-brand-primary);box-shadow:0 0 8px color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent)}
.tape-deck .tape-deck-slot{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:11px;min-height:111px;margin:11px 0 0;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:linear-gradient(180deg,var(--dsw-alias-bg-base),var(--dsw-alias-bg-layer-1));box-shadow:inset 0 3px 7px color-mix(in srgb,var(--dsw-alias-label-primary) 9%,transparent),inset 0 -1px 0 var(--dsw-alias-bg-overlay);transition:border-color .18s,box-shadow .18s}
.tape-deck .tape-deck-slot[data-drag=true]{border-style:dashed;border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 50%,var(--dsw-alias-border-l2))}
.tape-deck .tape-deck-slot[data-ready=true]{border-style:solid;border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 3px 10px color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent),0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent)}
.tape-deck .tape-deck-slot-mouth{position:relative;width:min(77%,340px);height:30px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);box-shadow:inset 0 9px 9px -3px color-mix(in srgb,var(--dsw-alias-label-primary) 33%,transparent),inset 3px 0 6px color-mix(in srgb,var(--dsw-alias-label-primary) 18%,transparent),0 1px 0 var(--dsw-alias-bg-overlay);perspective:500px}
.tape-deck .tape-deck-slot-mouth::after{content:'';position:absolute;z-index:2;inset:auto -4px -5px;height:9px;border:1px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-bg-overlay);border-radius:2px 2px 5px 5px;background:linear-gradient(var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1));box-shadow:0 3px 4px color-mix(in srgb,var(--dsw-alias-label-primary) 9%,transparent)}
.tape-deck .tape-deck-spine{position:absolute;left:9%;right:9%;bottom:3px;height:13px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:3px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:7px ui-monospace,monospace;letter-spacing:.08em;overflow:hidden;white-space:nowrap;box-shadow:0 -3px 5px color-mix(in srgb,var(--dsw-alias-label-primary) 12%,transparent)}
.tape-deck .tape-deck-slot-prompt{font-size:10px;color:var(--dsw-alias-label-secondary);text-align:center;padding:0 10px}
.tape-deck .tape-deck-slot[data-ready=true] .tape-deck-slot-prompt{color:var(--dsw-alias-brand-primary)}
.tape-deck .tape-deck-transport{display:flex;align-items:center;gap:20px;padding:16px 6px 3px}
.tape-deck .tape-deck-transport-copy{flex:1;min-width:0}
.tape-deck .tape-deck-status{font-size:11px;color:var(--dsw-alias-label-secondary)}
.tape-deck .tape-deck-action-hint{margin-top:4px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.65;max-width:60ch}
.tape-deck .tape-deck-insert{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:39px;border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,var(--dsw-alias-border-l2));background:linear-gradient(var(--dsw-alias-bg-overlay),var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);border-radius:9px;padding:8px 14px;font-size:12px;font-weight:550;cursor:pointer;box-shadow:0 2px 0 var(--dsw-alias-border-l2),inset 0 1px 0 var(--dsw-alias-bg-overlay);transition:transform .15s,background .15s;white-space:normal;text-align:center;overflow-wrap:anywhere}
.tape-deck .tape-deck-insert:not(:disabled):hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,var(--dsw-alias-bg-overlay));transform:translateY(-1px)}
.tape-deck .tape-deck-insert:not(:disabled):active{transform:translateY(2px);box-shadow:none}
.tape-deck .tape-deck-insert:disabled{opacity:.45}
.tape-deck .tape-deck-insert svg{width:14px;height:14px;flex:none}
.tape-deck .tape-deck-drawer{position:relative;margin-top:28px;padding:21px 23px 0;border:1px solid var(--dsw-alias-border-l2);border-radius:17px 17px 13px 13px;background:linear-gradient(180deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-base));box-shadow:0 13px 20px -20px color-mix(in srgb,var(--dsw-alias-label-primary) 70%,transparent),inset 0 1px 0 var(--dsw-alias-bg-overlay)}
.tape-deck .tape-deck-drawer-heading{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.tape-deck .tape-deck-drawer-title{font-size:15px;font-weight:550;letter-spacing:-.025em}
.tape-deck .tape-deck-collection{font:8px ui-monospace,monospace;letter-spacing:.12em;color:var(--dsw-alias-label-secondary)}
.tape-deck .tape-deck-drawer-subtitle{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:4px}
.tape-deck .tape-deck-drawer-perspective{position:relative;perspective:1000px;padding:11px 11px 0;margin:15px -10px 0}
.tape-deck .tape-deck-drawer-tray{position:relative;transform:rotateX(9deg);transform-origin:center bottom;transform-style:preserve-3d;border:1px solid var(--dsw-alias-border-l2);border-radius:9px 9px 4px 4px;padding:29px 20px 28px;background:repeating-linear-gradient(90deg,transparent 0 7px,color-mix(in srgb,var(--dsw-alias-label-primary) 2%,transparent) 7px 8px),var(--dsw-alias-bg-base);box-shadow:inset 0 19px 20px -13px color-mix(in srgb,var(--dsw-alias-label-primary) 26%,transparent),inset 12px 0 12px -12px color-mix(in srgb,var(--dsw-alias-label-primary) 25%,transparent),inset -12px 0 12px -12px color-mix(in srgb,var(--dsw-alias-label-primary) 25%,transparent)}
.tape-deck .tape-deck-drawer-tray::before,.tape-deck .tape-deck-drawer-tray::after{content:'';position:absolute;top:0;bottom:0;width:12px;border:1px solid var(--dsw-alias-border-l2);background:linear-gradient(90deg,var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1));pointer-events:none}
.tape-deck .tape-deck-drawer-tray::before{left:-7px;transform:skewY(-27deg);transform-origin:right top;border-radius:4px 0 0 2px;box-shadow:3px 0 6px color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent)}
.tape-deck .tape-deck-drawer-tray::after{right:-7px;transform:skewY(27deg);transform-origin:left top;border-radius:0 4px 2px 0;box-shadow:-3px 0 6px color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent)}
.tape-deck .tape-deck-grid{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;width:100%;max-width:650px;margin:0 auto;transform-style:preserve-3d}
.tape-deck .tape-deck-card{position:relative;min-width:0;transform-style:preserve-3d}
.tape-deck .tape-deck-card-button{display:block;position:relative;min-width:0;width:100%;border:0;padding:0;background:none;color:var(--dsw-alias-label-primary);text-align:left;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
.tape-deck .tape-deck-card-button:active{cursor:grabbing}
.tape-deck .tape-deck-card-button:disabled{cursor:not-allowed}
.tape-deck .tape-deck-cassette{position:relative;display:block;isolation:isolate;transform:translateY(0) rotateZ(-2deg) rotateX(-5deg);transform-origin:center 80%;transition:transform .23s,opacity .18s;filter:drop-shadow(0 9px 6px color-mix(in srgb,var(--dsw-alias-label-primary) 19%,transparent))}
.tape-deck .tape-deck-card:nth-child(2) .tape-deck-cassette{transform:translateY(0) rotateZ(2deg) rotateX(-5deg)}
.tape-deck .tape-deck-cassette::before{content:'';position:absolute;z-index:-1;inset:6px 2px -6px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px 9px 11px 11px;background:linear-gradient(180deg,var(--dsw-alias-bg-layer-2) 75%,color-mix(in srgb,var(--dsw-alias-label-primary) 30%,var(--dsw-alias-bg-base)));box-shadow:0 1px 0 var(--dsw-alias-border-l2),0 3px 0 color-mix(in srgb,var(--dsw-alias-label-primary) 20%,var(--dsw-alias-bg-base))}
.tape-deck .tape-deck-cassette::after{content:'';position:absolute;inset:3px 4px 6px;border-radius:8px;background:linear-gradient(135deg,color-mix(in srgb,var(--dsw-alias-bg-overlay) 16%,transparent),transparent 35% 70%,color-mix(in srgb,var(--dsw-alias-bg-overlay) 5%,transparent));pointer-events:none}
.tape-deck .tape-deck-card-button:not(:disabled):hover .tape-deck-cassette,.tape-deck .tape-deck-card-button:focus-visible .tape-deck-cassette{transform:translateY(-7px) rotateZ(0) rotateX(0)}
.tape-deck .tape-deck-card[data-lifted=true] .tape-deck-cassette{opacity:.18;transform:translateY(2px) rotateZ(0)}
.tape-deck .tape-deck-card-button[aria-pressed=true] .tape-deck-card-name{color:var(--dsw-alias-brand-primary)}
.tape-deck .tape-deck-art{display:block;width:100%;height:auto;pointer-events:none}
.tape-deck .tape-deck-grip{position:absolute;left:calc(50% - 14px);bottom:5%;width:28px;height:3px;border-top:1px solid color-mix(in srgb,var(--dsw-alias-bg-overlay) 36%,transparent);border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-bg-overlay) 24%,transparent);opacity:.55}
.tape-deck .tape-deck-card-copy{display:flex;align-items:baseline;justify-content:space-between;gap:7px;margin:19px 1px 0}
.tape-deck .tape-deck-card-name{min-width:0;overflow-wrap:anywhere;font-size:13px;font-weight:550;line-height:1.4}
.tape-deck .tape-deck-card-number{font:9px ui-monospace,monospace;color:var(--dsw-alias-label-secondary)}
.tape-deck .tape-deck-card-mood{display:block;margin:5px 1px 0;color:var(--dsw-alias-label-secondary);font-size:9px;letter-spacing:.04em}
.tape-deck .tape-deck-card-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:28px;margin-top:9px;border-top:1px solid var(--dsw-alias-border-l1);padding-top:8px}
.tape-deck .tape-deck-card-state{font-size:9px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
.tape-deck .tape-deck-card-state[data-current=true]::before{content:'';display:inline-block;width:4px;height:4px;margin-right:5px;vertical-align:middle;border-radius:50%;background:var(--dsw-alias-brand-primary)}
.tape-deck .tape-deck-card-insert{flex:none;border:0;background:none;padding:3px 0 3px 6px;color:var(--dsw-alias-label-secondary);font-size:10px;cursor:pointer;text-decoration:underline;text-decoration-color:var(--dsw-alias-border-l2);text-underline-offset:3px}
.tape-deck .tape-deck-card-insert:not(:disabled):hover{color:var(--dsw-alias-brand-primary)}
.tape-deck .tape-deck-card-insert:disabled{opacity:.4}
.tape-deck .tape-deck-drawer-lip{position:relative;margin:0 -23px;padding:13px 15px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:4px 4px 12px 12px;background:linear-gradient(180deg,var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1));box-shadow:0 -5px 9px color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent),inset 0 1px 0 var(--dsw-alias-bg-overlay);text-align:center}
.tape-deck .tape-deck-drawer-handle{display:block;position:relative;width:78px;height:13px;margin:0 auto 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:4px;background:var(--dsw-alias-bg-base);box-shadow:inset 0 3px 4px color-mix(in srgb,var(--dsw-alias-label-primary) 20%,transparent),0 1px 0 var(--dsw-alias-bg-overlay)}
.tape-deck .tape-deck-drawer-handle::after{content:'';position:absolute;inset:4px 8px -1px;border:1px solid var(--dsw-alias-border-l2);border-radius:3px;background:linear-gradient(var(--dsw-alias-bg-overlay),var(--dsw-alias-bg-layer-2));box-shadow:0 2px 2px color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent)}
.tape-deck .tape-deck-drawer-engraving{font:7px ui-monospace,monospace;letter-spacing:.16em;color:var(--dsw-alias-label-secondary)}
.tape-deck .tape-deck-drawer-note{padding:14px 0 0;text-align:center;font-size:10px;color:var(--dsw-alias-label-secondary)}
.tape-deck .tape-deck-note-detail{display:block;margin-top:4px;font-size:9px;opacity:.75}
.tape-deck .tape-deck-notice{margin:11px 2px 0;color:var(--dsw-alias-label-secondary);font-size:11px;overflow-wrap:anywhere}
.tape-deck .tape-deck-error{color:var(--dsw-alias-state-error-primary)}
.tape-deck .tape-deck-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
/* Root siblings stay outside the query container; the owned origin compensates a transformed host ancestor. */
.tape-deck .tape-deck-fixed-origin{position:fixed;left:0;top:0;width:1px;height:1px;pointer-events:none;visibility:hidden}
.tape-deck .tape-deck-ghost{position:fixed;z-index:1000;pointer-events:none!important;user-select:none;perspective:700px;transform-origin:center;will-change:transform;filter:drop-shadow(0 18px 12px color-mix(in srgb,var(--dsw-alias-label-primary) 24%,transparent))}
.tape-deck .tape-deck-ghost .tape-deck-cassette{transform:rotate(-5deg);transition:none;filter:none}
.tape-deck .tape-deck-ghost[data-ready=true] .tape-deck-cassette{transform:rotate(0deg)}
.tape-deck .tape-deck-ghost[data-phase=inserting]{animation:tape-deck-insertion 650ms cubic-bezier(.25,.65,.25,1) both}
.tape-deck .tape-deck-ghost[data-phase=returning]{animation:tape-deck-return 190ms cubic-bezier(.2,.7,.25,1) both}
@keyframes tape-deck-insertion{0%{transform:translate3d(0,0,0) rotateX(0);opacity:1;clip-path:inset(-20% -20% -30%)}45%{transform:translate3d(var(--deck-dx),calc(var(--deck-dy) - 25px),0) rotateX(30deg) scale(var(--deck-scale));opacity:1;clip-path:inset(-20% -20% -30%)}70%{transform:translate3d(var(--deck-dx),calc(var(--deck-dy) - 6px),0) rotateX(63deg) scale(var(--deck-scale));opacity:1;clip-path:inset(-20% -20% 0)}100%{transform:translate3d(var(--deck-dx),calc(var(--deck-dy) + 23px),0) rotateX(76deg) scale(var(--deck-scale));opacity:0;clip-path:inset(-20% -20% 100%)}}
@keyframes tape-deck-return{to{transform:translate3d(var(--deck-dx),var(--deck-dy),0) scale(var(--deck-scale));opacity:0}}
@container(max-width:500px){.tape-deck .tape-deck-header{gap:12px}.tape-deck .tape-deck-brand{gap:9px}.tape-deck .tape-deck-mark{width:28px;height:28px}.tape-deck .tape-deck-title{font-size:23px}.tape-deck .tape-deck-tagline{font-size:11px}.tape-deck .tape-deck-power-label{display:none}.tape-deck .tape-deck-drawer{padding:19px 17px 0}.tape-deck .tape-deck-drawer-lip{margin:0 -17px}.tape-deck .tape-deck-drawer-tray{padding:24px 14px}.tape-deck .tape-deck-grid{gap:19px}.tape-deck .tape-deck-collection{font-size:7px}.tape-deck .tape-deck-hardware{padding:15px 7px 7px}}
@container(max-width:419px){.tape-deck .tape-deck-grid{grid-template-columns:minmax(0,1fr);max-width:245px;gap:27px}.tape-deck .tape-deck-drawer-tray{padding:27px 22px}.tape-deck .tape-deck-drawer-perspective{perspective:1500px}.tape-deck .tape-deck-transport{align-items:stretch;flex-direction:column;gap:12px;padding:15px 5px 4px}.tape-deck .tape-deck-insert{width:100%}.tape-deck .tape-deck-collection{display:none}}
@container(max-width:359px){.tape-deck .tape-deck-header{align-items:flex-start}.tape-deck .tape-deck-mark{width:22px;height:22px;margin-top:3px}.tape-deck .tape-deck-title{font-size:20px}.tape-deck .tape-deck-tagline{font-size:10px;max-width:23ch}.tape-deck .tape-deck-stage{height:190px}.tape-deck .tape-deck-stage-top{left:11px;right:11px}.tape-deck .tape-deck-stage-caption{padding:40px 14px 16px}.tape-deck .tape-deck-current-subtitle{font-size:11px}.tape-deck .tape-deck-hardware-line{font-size:7px;letter-spacing:.06em}.tape-deck .tape-deck-drawer{padding:18px 13px 0}.tape-deck .tape-deck-drawer-lip{margin:0 -13px}.tape-deck .tape-deck-drawer-tray{padding:23px 14px}.tape-deck .tape-deck-spine{font-size:6px;padding:0 5px}}
@media(prefers-reduced-motion:reduce){.tape-deck *,.tape-deck *::before,.tape-deck *::after{animation:none!important;transition:none!important}.tape-deck .tape-deck-drawer-tray{transform:none}}
`;

/** A single isolated audition Surface. Pointer travel is local; only insertion commits settings. */
export function createDeckPage({ React, ctx, model, t, Surface }) {
  const h = React.createElement, Artwork = createTapeArtwork(React);
  const text = (key, name) => String(t(`deck.${key}`)).replace('{name}', name ?? '');
  const subscribeLocale = listener => ctx.locale.subscribe(listener), getLocale = () => ctx.locale.getSnapshot();
  const icon = kind => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5,
    strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false, className: kind === 'mark' ? 'tape-deck-mark' : undefined },
    kind === 'mark' ? h(React.Fragment, null, h('rect', { x: 2.5, y: 5, width: 19, height: 14, rx: 3 }),
      h('circle', { cx: 8, cy: 12, r: 2.5 }), h('circle', { cx: 16, cy: 12, r: 2.5 }), h('path', { d: 'M8 9.5h8M8 14.5h8' }))
      : h('path', { d: kind === 'check' ? 'm5 12 4 4L19 6' : 'M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4' }));
  const cassetteBody = (tape, ref) => h('span', { className: 'tape-deck-cassette', ref }, h(Artwork, { tape }),
    h('span', { className: 'tape-deck-grip', 'aria-hidden': true }));

  return function DeckPage() {
    const snapshot = React.useSyncExternalStore(model.subscribe, model.getSnapshot, model.getSnapshot);
    React.useSyncExternalStore(subscribeLocale, getLocale, getLocale);
    const lang = text('locale') === 'zh' ? 'zh' : 'en', settings = snapshot.settings;
    const [selectedId, setSelectedId] = React.useState(() => settings.cassette);
    const [audition, setAudition] = React.useState(false);
    const [pending, setPending] = React.useState(null);
    const [confirmedId, setConfirmedId] = React.useState(() => settings.cassette);
    const [dragId, setDragId] = React.useState(null), [ready, setReady] = React.useState(false);
    const [ghost, setGhost] = React.useState(null), [announcement, setAnnouncement] = React.useState(null);
    const [localError, setLocalError] = React.useState(''), [previewError, setPreviewError] = React.useState(false);
    const [dismissedError, setDismissedError] = React.useState('');
    const rootRef = React.useRef(null), slotRef = React.useRef(null), mouthRef = React.useRef(null), originRef = React.useRef(null);
    const bodyRefs = React.useRef(new Map()), dragRef = React.useRef(null), ghostRef = React.useRef(null);
    const pendingRef = React.useRef(null), mountedRef = React.useRef(false), timersRef = React.useRef(new Set());
    const returnTimerRef = React.useRef(null), handlersRef = React.useRef(null), suppressClickRef = React.useRef(null);
    const previewRef = React.useRef(null), id = React.useId();
    previewRef.current = { selectedId, audition };
    const tape = CASSETTES.find(item => item.id === (audition ? selectedId : settings.cassette)) || CASSETTES[0];
    const params = tape.defaults, name = tape.name[lang];
    const applied = settings.cassette === tape.id && signature(getCassetteParams(settings, tape.id)) === signature(params);
    const preview = audition || !applied || !!pending;
    const busy = !!pending || snapshot.saving, saveDisabled = !snapshot.loaded || !snapshot.writable || busy;
    const error = localError || (snapshot.error !== dismissedError ? snapshot.error : '');
    const canInsert = !saveDisabled && (preview || !!error);
    const currentTape = CASSETTES.find(item => item.id === confirmedId) || CASSETTES[0];

    function reducedMotion() {
      return !!rootRef.current?.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    }
    function later(callback, duration) {
      const timer = setTimeout(() => {
        timersRef.current.delete(timer);
        if (mountedRef.current) callback();
      }, duration);
      timersRef.current.add(timer);
      return timer;
    }
    function clearTimer(timer) {
      if (timer == null) return;
      clearTimeout(timer); timersRef.current.delete(timer);
    }
    function putGhost(value) { ghostRef.current = value; setGhost(value); }
    function releaseCapture(drag) {
      try { if (drag?.element.hasPointerCapture(drag.pointerId)) drag.element.releasePointerCapture(drag.pointerId); }
      catch { /* The browser may already have released a cancelled pointer. */ }
    }
    function clearDrag() {
      const drag = dragRef.current;
      dragRef.current = null; // Clear first: releasePointerCapture can synchronously dispatch lostcapture.
      releaseCapture(drag);
      setDragId(null); setReady(false);
      return drag;
    }
    function suppressDragClick(drag) {
      if (drag?.started) suppressClickRef.current = { id: drag.id, until: Date.now() + 900 };
    }
    function ghostAt(drag, point) {
      const view = rootRef.current?.ownerDocument.defaultView;
      const viewportWidth = view?.innerWidth || drag.rect.width + 24;
      const viewportHeight = view?.innerHeight || drag.rect.height + 24;
      const width = Math.max(1, Math.min(drag.rect.width, 240, viewportWidth - 24, (viewportHeight - 24) * 240 / 148));
      const height = width * 148 / 240;
      return { id: drag.id, phase: 'dragging', width, height,
        left: Math.max(8, Math.min(viewportWidth - width - 8, point.x - width * drag.anchorX)),
        top: Math.max(8, Math.min(viewportHeight - height - 8, point.y - height * drag.anchorY)) };
    }
    function returnTape(drag, animate = true) {
      suppressDragClick(drag);
      clearTimer(returnTimerRef.current); returnTimerRef.current = null;
      const from = ghostRef.current, target = bodyRefs.current.get(drag?.id)?.getBoundingClientRect();
      if (animate && drag?.started && from && target && !reducedMotion()) {
        const plan = deckInsertionPlan(from, target);
        putGhost({ ...from, phase: 'returning', ...plan });
        returnTimerRef.current = later(() => { putGhost(null); returnTimerRef.current = null; }, 190);
      } else putGhost(null);
      if (drag?.started) setAnnouncement({ key: 'returned' });
    }
    function cancelDrag(animate = true) {
      const drag = clearDrag();
      if (drag) returnTape(drag, animate);
    }
    function cancelInsertion() {
      const transaction = pendingRef.current;
      if (!transaction || transaction.committed) return;
      clearTimer(transaction.timer); pendingRef.current = null; setPending(null);
      returnTape({ id: transaction.id, started: true }, true);
    }
    function failInsertion(transaction, reason) {
      if (!mountedRef.current || pendingRef.current !== transaction) return;
      clearTimer(transaction.timer); pendingRef.current = null; setPending(null); putGhost(null);
      setSelectedId(transaction.before.selectedId); setAudition(transaction.before.audition);
      setLocalError(reason || text('saveError')); setDismissedError(model.getSnapshot().error);
      setAnnouncement({ key: 'saveError' });
    }
    function commitInsertion(transaction) {
      if (!mountedRef.current || pendingRef.current !== transaction) return;
      const latest = model.getSnapshot();
      // Rebase at commit time, not pointerdown/drop time. No enabled or tuning patch is added.
      if (!latest.loaded || !latest.writable || latest.saving) {
        failInsertion(transaction, text(!latest.loaded ? 'loading' : !latest.writable ? 'readOnly' : 'saving'));
        return;
      }
      transaction.committed = true;
      setPending({ id: transaction.id, phase: 'saving' }); putGhost(null);
      setSelectedId(transaction.id); setAudition(true); setPreviewError(false);
      try {
        model.update(cassettePatch(latest.settings, transaction.id));
        const after = model.getSnapshot();
        // update publishes saving synchronously, before its debounce. The optimistic id is not acceptance.
        transaction.sawSaving = after.saving;
        if (!after.saving) failInsertion(transaction, after.error || text('saveError'));
      } catch (reason) {
        failInsertion(transaction, reason instanceof Error ? reason.message : String(reason));
      }
    }
    function startInsertion(nextId, fromRect) {
      const latest = model.getSnapshot();
      if (!mountedRef.current || pendingRef.current || dragRef.current || !latest.loaded || !latest.writable || latest.saving) return false;
      if (!CASSETTES.some(item => item.id === nextId)) return false;
      const source = fromRect || bodyRefs.current.get(nextId)?.getBoundingClientRect();
      const target = mouthRef.current?.getBoundingClientRect();
      const plan = deckInsertionPlan(source, target, reducedMotion());
      const transaction = { id: nextId, before: { ...previewRef.current }, committed: false, sawSaving: false, timer: null };
      pendingRef.current = transaction; // Synchronous lock prevents repeated clicks/drops before React rerenders.
      clearTimer(returnTimerRef.current); returnTimerRef.current = null;
      setPending({ id: nextId, phase: 'inserting' }); setLocalError(''); setDismissedError(latest.error);
      setAnnouncement({ key: 'inserting', id: nextId }); setReady(false);
      if (plan.duration && source && target) {
        // Bound even keyboard travel to the viewport. Do not clone a huge responsive card.
        const view = rootRef.current.ownerDocument.defaultView;
        const width = Math.max(1, Math.min(source.width, 240, (view?.innerWidth || 264) - 24, ((view?.innerHeight || 400) - 24) * 240 / 148));
        const bounded = { left: source.left + (source.width - width) / 2, top: source.top + (source.height - width * 148 / 240) / 2, width, height: width * 148 / 240 };
        putGhost({ id: nextId, phase: 'inserting', ...bounded, ...deckInsertionPlan(bounded, target) });
        transaction.timer = later(() => commitInsertion(transaction), plan.duration);
      } else commitInsertion(transaction);
      return true;
    }
    function choose(nextId, event) {
      const suppressed = suppressClickRef.current;
      if (event?.detail !== 0 && suppressed?.id === nextId && Date.now() < suppressed.until) {
        event?.preventDefault(); suppressClickRef.current = null; return;
      }
      const latest = model.getSnapshot();
      if (!latest.loaded || pendingRef.current || latest.saving || dragRef.current?.started) return;
      setSelectedId(nextId); setAudition(true); setAnnouncement(null);
      setLocalError(''); setPreviewError(false); setDismissedError(latest.error);
    }
    function pointerDown(event, nextId) {
      const latest = model.getSnapshot();
      if (event.isPrimary === false || event.button !== 0 || dragRef.current || pendingRef.current || !latest.loaded || latest.saving) return;
      if (![event.clientX, event.clientY].every(Number.isFinite)) return;
      const rect = bodyRefs.current.get(nextId)?.getBoundingClientRect();
      if (!rect?.width || !rect.height) return;
      clearTimer(returnTimerRef.current); returnTimerRef.current = null; putGhost(null);
      const start = { x: event.clientX, y: event.clientY };
      dragRef.current = { id: nextId, pointerId: event.pointerId, element: event.currentTarget, rect, start, current: start, started: false,
        anchorX: Math.max(0, Math.min(1, (start.x - rect.left) / rect.width)), anchorY: Math.max(0, Math.min(1, (start.y - rect.top) / rect.height)) };
      try { event.currentTarget.setPointerCapture(event.pointerId); }
      catch { /* Window pointer listeners remain the fallback when capture is unavailable. */ }
      // No audition or setting write here: a press can still become a drag or cancellation.
    }
    function pointerMove(event) {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId || ![event.clientX, event.clientY].every(Number.isFinite)) return;
      drag.current = { x: event.clientX, y: event.clientY };
      if (!drag.started && deckDragDistance(drag.start, drag.current) < 8) return;
      if (!drag.started) { drag.started = true; setDragId(drag.id); suppressDragClick(drag); setAnnouncement({ key: 'dragging' }); }
      if (event.cancelable) event.preventDefault();
      const latest = model.getSnapshot();
      const over = latest.loaded && latest.writable && !latest.saving && !pendingRef.current
        && deckPointInRect(event.clientX, event.clientY, slotRef.current?.getBoundingClientRect());
      if (drag.ready !== over) { drag.ready = over; setReady(over); setAnnouncement({ key: over ? 'slotReady' : 'dragging' }); }
      putGhost({ ...ghostAt(drag, drag.current), ready: over });
    }
    function pointerUp(event) {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (!drag.started) { clearDrag(); return; } // The ensuing button click auditions, including keyboard equivalents.
      if (event.cancelable) event.preventDefault();
      suppressDragClick(drag);
      // Always remeasure on release. Scroll/resize also cancel, so stale slot geometry cannot accept a drop.
      const validPoint = [event.clientX, event.clientY].every(Number.isFinite);
      const inside = validPoint && deckPointInRect(event.clientX, event.clientY, slotRef.current?.getBoundingClientRect());
      const from = validPoint ? ghostAt(drag, { x: event.clientX, y: event.clientY }) : ghostRef.current;
      clearDrag();
      if (!inside || !startInsertion(drag.id, from)) returnTape(drag);
    }
    function pointerCancel(event) {
      if (dragRef.current?.pointerId === event.pointerId) cancelDrag();
    }
    function power() {
      const latest = model.getSnapshot();
      if (pendingRef.current || dragRef.current || !latest.loaded || !latest.writable || latest.saving) return;
      setLocalError(''); setDismissedError(latest.error); setAnnouncement(null);
      try { model.update({ enabled: !latest.settings.enabled }); }
      catch (reason) { setLocalError(reason instanceof Error ? reason.message : String(reason)); }
    }
    handlersRef.current = { pointerMove, pointerUp, pointerCancel, cancelDrag, cancelInsertion };

    React.useEffect(() => {
      mountedRef.current = true;
      const view = rootRef.current.ownerDocument.defaultView;
      const move = event => handlersRef.current.pointerMove(event);
      const up = event => handlersRef.current.pointerUp(event);
      const cancel = event => handlersRef.current.pointerCancel(event);
      const geometryChanged = () => { handlersRef.current.cancelDrag(false); handlersRef.current.cancelInsertion(); };
      const blur = () => { handlersRef.current.cancelDrag(false); handlersRef.current.cancelInsertion(); };
      const key = event => {
        if (event.key !== 'Escape') return;
        if (dragRef.current || (pendingRef.current && !pendingRef.current.committed)) {
          event.preventDefault(); handlersRef.current.cancelDrag(); handlersRef.current.cancelInsertion();
        }
      };
      view.addEventListener('pointermove', move, { passive: false });
      view.addEventListener('pointerup', up, { passive: false });
      view.addEventListener('pointercancel', cancel);
      view.addEventListener('keydown', key);
      view.addEventListener('blur', blur);
      view.addEventListener('scroll', geometryChanged, true);
      view.addEventListener('resize', geometryChanged);
      view.visualViewport?.addEventListener('resize', geometryChanged);
      view.visualViewport?.addEventListener('scroll', geometryChanged);
      return () => {
        mountedRef.current = false;
        const drag = dragRef.current; dragRef.current = null; releaseCapture(drag);
        pendingRef.current = null; ghostRef.current = null;
        for (const timer of timersRef.current) clearTimeout(timer);
        timersRef.current.clear(); returnTimerRef.current = null;
        view.removeEventListener('pointermove', move);
        view.removeEventListener('pointerup', up);
        view.removeEventListener('pointercancel', cancel);
        view.removeEventListener('keydown', key);
        view.removeEventListener('blur', blur);
        view.removeEventListener('scroll', geometryChanged, true);
        view.removeEventListener('resize', geometryChanged);
        view.visualViewport?.removeEventListener('resize', geometryChanged);
        view.visualViewport?.removeEventListener('scroll', geometryChanged);
      };
    }, []);
    React.useEffect(() => {
      const transaction = pendingRef.current;
      if (transaction?.committed) {
        if (snapshot.saving) transaction.sawSaving = true;
        else if (transaction.sawSaving) {
          if (!snapshot.error && snapshot.loaded && snapshot.settings.cassette === transaction.id) {
            pendingRef.current = null; setPending(null); setConfirmedId(transaction.id);
            setSelectedId(transaction.id); setAudition(false); setLocalError(''); setDismissedError('');
            setAnnouncement({ key: 'accepted', id: transaction.id });
          } else failInsertion(transaction, snapshot.error || text('saveError'));
        }
      }
      if (snapshot.loaded && !snapshot.saving) setConfirmedId(snapshot.settings.cassette);
      if (dragRef.current && (!snapshot.loaded || snapshot.saving)) cancelDrag(false);
    }, [snapshot]);
    React.useEffect(() => { setPreviewError(false); }, [tape.id]);

    const status = !snapshot.loaded ? 'loading' : pending?.phase === 'inserting' ? 'inserting' : busy ? 'saving'
      : !snapshot.writable ? 'readOnly' : error ? 'saveError' : preview ? 'preview' : 'saved';
    const state = preview ? 'preview' : settings.enabled ? 'playing' : 'inserted';
    const announcementName = CASSETTES.find(item => item.id === announcement?.id)?.name[lang];
    const insertionName = CASSETTES.find(item => item.id === pending?.id)?.name[lang] || name;
    const ghostTape = CASSETTES.find(item => item.id === ghost?.id);
    const fixedOrigin = ghost ? originRef.current?.getBoundingClientRect() : null;
    const fixedScaleX = fixedOrigin?.width || 1, fixedScaleY = fixedOrigin?.height || 1;
    return h('section', { ref: rootRef, 'data-background-deck': true, className: 'tape-deck', 'aria-labelledby': `${id}-title`, 'aria-busy': !snapshot.loaded || busy },
      h('style', null, DECK_CSS),
      h('div', { className: 'tape-deck-layout' },
        h('header', { className: 'tape-deck-header' },
          h('div', { className: 'tape-deck-brand' }, icon('mark'), h('div', null,
            h('h2', { id: `${id}-title`, className: 'tape-deck-title' }, text('title')), h('p', { className: 'tape-deck-tagline' }, text('tagline')))),
          h('button', { type: 'button', className: 'tape-deck-power', role: 'switch', 'aria-checked': !!settings.enabled,
            'aria-label': text(settings.enabled ? 'disable' : 'enable'), disabled: saveDisabled, onClick: power },
            h('span', { className: 'tape-deck-power-label' }, text('background')), h('span', { className: 'tape-deck-switch', 'aria-hidden': true }))),
        h('section', { className: 'tape-deck-player', 'aria-label': text('player') },
          h('div', { className: 'tape-deck-stage', role: 'group', 'aria-label': text('previewLabel', name) },
            h('div', { className: 'tape-deck-surface' }, snapshot.loaded ? h(Surface, { key: tape.id, cassette: tape.id, params,
              enabled: true, preview: true, displayOpacity: 1, onError: () => setPreviewError(true), onReady: () => setPreviewError(false) }) : null),
            h('div', { className: 'tape-deck-stage-top' }, h('div', { className: 'tape-deck-badges' },
              h('span', { className: 'tape-deck-badge', 'data-preview': preview }, text(snapshot.loaded ? busy ? status : state : 'loading', insertionName)),
              !settings.enabled ? h('span', { className: 'tape-deck-badge' }, text('previewOnly')) : null),
              h('span', { className: 'tape-deck-serial', 'aria-hidden': true }, `${tape.number} / ${String(CASSETTES.length).padStart(2, '0')}`)),
            snapshot.loaded && !previewError ? h('p', { className: 'tape-deck-touch' }, text('touch')) : null,
            h('div', { className: 'tape-deck-stage-caption' }, h('p', { className: 'tape-deck-mood' }, tape.mood[lang]),
              h('h3', { className: 'tape-deck-current-title' }, name), h('p', { className: 'tape-deck-current-subtitle' }, tape.subtitle[lang]))),
          h('div', { className: 'tape-deck-hardware' },
            h('div', { className: 'tape-deck-hardware-line', 'aria-hidden': true }, h('span', null, text('slotCaption')),
              h('span', null, h('span', { className: 'tape-deck-led', 'data-on': !!settings.enabled && !busy }), currentTape.number)),
            h('div', { ref: slotRef, className: 'tape-deck-slot', 'data-drag': !!dragId, 'data-ready': ready,
              role: 'group', 'aria-label': text('slotLabel'), 'aria-describedby': `${id}-slot-prompt` },
              h('div', { ref: mouthRef, className: 'tape-deck-slot-mouth', 'aria-hidden': true },
                h('span', { className: 'tape-deck-spine' }, h('span', null, currentTape.name[lang]), h('span', null, currentTape.number))),
              h('p', { id: `${id}-slot-prompt`, className: 'tape-deck-slot-prompt' }, text(!snapshot.loaded ? 'loading' : busy ? 'slotBusy' : !snapshot.writable ? 'readOnly' : ready ? 'slotReady' : 'slotIdle'))),
            h('div', { className: 'tape-deck-transport' }, h('div', { className: 'tape-deck-transport-copy' },
              h('p', { className: 'tape-deck-status', role: 'status', 'aria-live': 'polite' }, text(status, insertionName)),
              h('p', { id: `${id}-apply-hint`, className: 'tape-deck-action-hint' }, text(!settings.enabled ? 'offHint' : preview ? 'auditionHint' : 'playingHint', name))),
              h('button', { type: 'button', className: 'tape-deck-insert', disabled: !canInsert,
                onClick: () => startInsertion(tape.id), 'aria-describedby': `${id}-apply-hint` },
                icon(!preview && !error ? 'check' : 'insert'), text(pending?.phase === 'inserting' ? 'inserting' : busy ? 'saving' : !preview && !error ? state : 'insert', pending ? insertionName : name))))),
        previewError ? h('p', { className: 'tape-deck-notice', role: 'status' }, text('previewError')) : null,
        error ? h('div', { className: 'tape-deck-notice tape-deck-error', role: 'alert' }, h('p', null, text('saveError')),
          error !== text('saveError') ? h('p', null, String(error)) : null) : null,
        h('section', { className: 'tape-deck-drawer', 'aria-labelledby': `${id}-drawer` },
          h('div', { className: 'tape-deck-drawer-heading' }, h('h3', { id: `${id}-drawer`, className: 'tape-deck-drawer-title' }, text('drawer')),
            h('span', { className: 'tape-deck-collection', 'aria-hidden': true }, text('collection'))),
          h('p', { className: 'tape-deck-drawer-subtitle' }, text('drawerHint')),
          h('div', { className: 'tape-deck-drawer-perspective' }, h('div', { className: 'tape-deck-drawer-tray' },
            h('div', { className: 'tape-deck-grid' }, ...CASSETTES.map(item => h('article', { key: item.id, className: 'tape-deck-card',
              'data-lifted': dragId === item.id || pending?.phase === 'inserting' && pending.id === item.id },
              h('button', { type: 'button', className: 'tape-deck-card-button', 'aria-pressed': tape.id === item.id,
                'aria-label': text('choose', item.name[lang]), 'aria-describedby': `${id}-drag-keyboard`, disabled: !snapshot.loaded || busy,
                onPointerDown: event => pointerDown(event, item.id), onLostPointerCapture: pointerCancel,
                onClick: event => choose(item.id, event), onDragStart: event => event.preventDefault() },
                cassetteBody(item, node => { if (node) bodyRefs.current.set(item.id, node); else bodyRefs.current.delete(item.id); }),
                h('span', { className: 'tape-deck-card-copy' }, h('span', { className: 'tape-deck-card-name' }, item.name[lang]),
                  h('span', { className: 'tape-deck-card-number', 'aria-hidden': true }, item.number)),
                h('span', { className: 'tape-deck-card-mood' }, item.mood[lang])),
              h('div', { className: 'tape-deck-card-footer' },
                h('span', { className: 'tape-deck-card-state', 'data-current': confirmedId === item.id },
                  confirmedId === item.id ? text('current') : audition && tape.id === item.id ? text('selected') : '—'),
                h('button', { type: 'button', className: 'tape-deck-card-insert', disabled: saveDisabled,
                  'aria-label': text('insert', item.name[lang]), onClick: () => startInsertion(item.id) }, text('insertShort')))))))),
          h('div', { className: 'tape-deck-drawer-lip', 'aria-hidden': true }, h('span', { className: 'tape-deck-drawer-handle' }),
            h('span', { className: 'tape-deck-drawer-engraving' }, text('handle')))),
        h('p', { className: 'tape-deck-drawer-note' }, text('dragHint'), h('span', { className: 'tape-deck-note-detail' }, text('fixed'))),
        h('p', { id: `${id}-drag-keyboard`, className: 'tape-deck-sr' }, text('dragAria')),
        h('p', { className: 'tape-deck-sr', role: 'status', 'aria-live': 'polite', 'aria-atomic': true }, announcement ? text(announcement.key, announcementName) : '')),
      h('span', { ref: originRef, className: 'tape-deck-fixed-origin', 'aria-hidden': true }),
      ghost && ghostTape ? h('div', { className: 'tape-deck-ghost', 'data-phase': ghost.phase, 'data-ready': !!ghost.ready, 'aria-hidden': true,
        style: { left: (ghost.left - (fixedOrigin?.left || 0)) / fixedScaleX, top: (ghost.top - (fixedOrigin?.top || 0)) / fixedScaleY,
          width: ghost.width / fixedScaleX, height: ghost.height / fixedScaleY,
          '--deck-dx': `${(ghost.dx || 0) / fixedScaleX}px`, '--deck-dy': `${(ghost.dy || 0) / fixedScaleY}px`, '--deck-scale': ghost.scale || 1 } }, cassetteBody(ghostTape)) : null);
  };
}
