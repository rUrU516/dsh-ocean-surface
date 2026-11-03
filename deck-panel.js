import { CASSETTES, getCassetteParams, cassettePatch } from './cassette-catalog.js';

/** Flat dictionaries: register these in the same locale namespace as the deck page. */
export const DECK_DICTS = {
  en: {
    'deck.locale': 'en', 'deck.title': 'Dots Background',
    'deck.tagline': 'Blue-violet to pink. A little light, a little gravity.',
    'deck.background': 'Background', 'deck.enable': 'Turn background on', 'deck.disable': 'Turn background off',
    'deck.preview': 'Audition', 'deck.previewOnly': 'Preview only', 'deck.playing': 'Now playing', 'deck.inserted': 'Ready to play',
    'deck.insert': 'Use Dots', 'deck.previewLabel': 'Interactive preview of the fixed Dots background',
    'deck.touch': 'Move your pointer. Watch the dots grow.',
    'deck.previewError': 'The preview could not be rendered. Your saved background has not been changed.',
    'deck.offHint': 'Your background is off. You can audition Dots here; using it will not turn the background on.',
    'deck.auditionHint': 'One finished preset. Audition here, then use it as your background.',
    'deck.playingHint': 'Dots is your current background. No tuning needed.',
    'deck.drawer': 'The tape drawer', 'deck.drawerHint': 'One tape. Dense dots, a wide lens, a soft glow.',
    'deck.choose': 'Audition Dots', 'deck.fixed': 'A finished preset · no controls to adjust',
    'deck.loading': 'Loading Dots…', 'deck.saving': 'Saving…', 'deck.saved': 'Saved',
    'deck.readOnly': 'Read-only. You can audition Dots, but cannot save changes.',
    'deck.saveError': 'Dots could not be saved. You can try again.',
  },
  zh: {
    'deck.locale': 'zh', 'deck.title': 'Dots 点阵背景',
    'deck.tagline': '蓝紫到粉紫，一点柔光，一点引力。',
    'deck.background': '背景', 'deck.enable': '开启背景', 'deck.disable': '关闭背景',
    'deck.preview': '试听中', 'deck.previewOnly': '仅预览', 'deck.playing': '正在播放', 'deck.inserted': '已就绪',
    'deck.insert': '使用 Dots', 'deck.previewLabel': 'Dots 固定背景效果的可交互预览',
    'deck.touch': '划过这里，看点阵轻轻放大。',
    'deck.previewError': '暂时无法渲染预览，已保存的背景没有改变。',
    'deck.offHint': '背景已关闭。这里仍可试听；使用 Dots 不会自动开启背景。',
    'deck.auditionHint': '效果已调好，先在这里试听，喜欢就用作背景。',
    'deck.playingHint': 'Dots 就是你当前的背景，无需再调参数。',
    'deck.drawer': '磁带抽屉', 'deck.drawerHint': '只留这一盘：密集点阵、宽幅透镜与柔光。',
    'deck.choose': '试听 Dots', 'deck.fixed': '效果已调好 · 无需设置参数',
    'deck.loading': '正在读取 Dots…', 'deck.saving': '正在保存…', 'deck.saved': '已保存',
    'deck.readOnly': '当前设置只读：可以试听 Dots，暂时不能保存。',
    'deck.saveError': '未能保存 Dots，可以再次尝试。',
  },
};

const signature = params => JSON.stringify(Object.keys(params).filter(key => key !== 'enabled').sort().map(key => [key, params[key]]));

/** Original static cassette art: gradient dots, lens magnification and soft light. */
function createTapeArtwork(React) {
  const h = React.createElement;
  return function TapeArtwork({ tape }) {
    const id = `dots-${React.useId().replace(/[^a-z0-9_-]/gi, '')}`;
    const dots = Array.from({ length: 264 }, (_, i) => {
      const x = 66 + (i % 24) * 6.7, y = 15 + Math.floor(i / 24) * 6;
      const dx = x - 155, dy = y - 46, distance = Math.hypot(dx, dy * 1.35);
      const lens = Math.max(0, 1 - distance / 66) ** 2;
      return h('circle', { key: i, cx: x + dx * lens * .48, cy: y + dy * lens * .48,
        r: .64 + lens * 1.6, opacity: .42 + lens * .58 });
    });
    return h('svg', { className: 'tape-deck-art', viewBox: '0 0 240 148', fill: 'none', 'aria-hidden': true, focusable: false },
      h('defs', null,
        h('linearGradient', { id: `${id}-tone`, x1: 65, y1: 25, x2: 225, y2: 70, gradientUnits: 'userSpaceOnUse' },
          h('stop', { stopColor: '#777dff' }), h('stop', { offset: .5, stopColor: '#b38cf4' }), h('stop', { offset: 1, stopColor: '#f1a7da' })),
        h('filter', { id: `${id}-glow`, x: '-30%', y: '-50%', width: '160%', height: '200%' }, h('feGaussianBlur', { stdDeviation: 2.2 }))),
      h('path', { d: 'M14 3h212a11 11 0 0 1 11 11v116a11 11 0 0 1-11 11h-53l-6 4H73l-6-4H14a11 11 0 0 1-11-11V14A11 11 0 0 1 14 3Z', fill: '#202039', stroke: '#b19ad7', strokeOpacity: .32 }),
      h('rect', { x: 10, y: 10, width: 220, height: 74, rx: 5, fill: '#28243f' }),
      h('svg', { x: 11, y: 11, width: 218, height: 72, viewBox: '11 11 218 72', overflow: 'hidden' },
        h('g', { fill: `url(#${id}-tone)`, filter: `url(#${id}-glow)`, opacity: .7 }, ...dots),
        h('g', { fill: `url(#${id}-tone)` }, ...dots)),
      h('path', { d: 'M19 19h35M19 22h21', stroke: '#dbc6e6', strokeWidth: .65, opacity: .55 }),
      h('text', { x: 19, y: 58, fill: '#dbc6e6', fontSize: 28, fontWeight: 300, fontFamily: 'ui-monospace, monospace', letterSpacing: '-2' }, tape.number),
      h('text', { x: 20, y: 73, fill: '#b19ad7', fontSize: 6, fontFamily: 'ui-monospace, monospace', letterSpacing: 1 }, 'DOTS'),
      h('rect', { x: 28, y: 90, width: 184, height: 33, rx: 16.5, fill: '#151523', stroke: '#b19ad7', strokeWidth: .55, strokeOpacity: .3 }),
      h('path', { d: 'M76 92h88M76 121h88', stroke: '#dbc6e6', strokeWidth: .55, opacity: .22 }),
      ...[76, 164].map(cx => h('g', { key: cx },
        h('circle', { cx, cy: 106.5, r: 14.5, fill: '#28243f', stroke: '#b19ad7', strokeWidth: .75, strokeOpacity: .55 }),
        h('circle', { cx, cy: 106.5, r: 9, fill: '#202039', stroke: '#dbc6e6', strokeWidth: 2.5, strokeOpacity: .68 }),
        ...Array.from({ length: 6 }, (_, i) => h('path', { key: i, d: `M${cx} 96v4`, stroke: '#202039', strokeWidth: 2.5, transform: `rotate(${i * 60} ${cx} 106.5)` })),
        h('circle', { cx, cy: 106.5, r: 3.1, fill: '#151523' }))),
      h('path', { d: 'M111 102h18v9h-18z', fill: '#28243f', stroke: '#b19ad7', strokeWidth: .5, strokeOpacity: .3 }),
      h('path', { d: 'm87 141 6-12h54l6 12', stroke: '#b19ad7', strokeWidth: .65, opacity: .32 }),
      ...[[15, 91], [225, 91], [15, 131], [225, 131]].map(([cx, cy]) => h('circle', { key: `${cx}-${cy}`, cx, cy, r: 2, stroke: '#b19ad7', strokeWidth: .6, opacity: .4 })));
  };
}

const DECK_CSS = `
.tape-deck{width:100%;min-width:0;color:var(--dsw-alias-label-primary);font:inherit;container-type:inline-size;line-height:1.5}
.tape-deck *,.tape-deck *::before,.tape-deck *::after{box-sizing:border-box}
.tape-deck h2,.tape-deck h3,.tape-deck p{margin:0}
.tape-deck button{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tape-deck button:disabled{opacity:.5;cursor:not-allowed}
.tape-deck button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:4px}
.tape-deck-header{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:2px 2px 23px}
.tape-deck-brand{display:flex;gap:12px;align-items:center;min-width:0}
.tape-deck-mark{width:34px;height:34px;flex:none;color:var(--dsw-alias-label-secondary)}
.tape-deck-title{font-size:24px;font-weight:530;letter-spacing:-.045em;line-height:1.3}
.tape-deck-tagline{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:5px!important}
.tape-deck-power{display:flex;align-items:center;gap:9px;background:none;border:0;color:var(--dsw-alias-label-secondary);padding:8px 0 8px 8px;font-size:11px!important;flex:none}
.tape-deck-switch{display:block;width:29px;height:17px;padding:3px;border-radius:20px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2)}
.tape-deck-switch::after{content:'';display:block;width:9px;height:9px;border-radius:50%;background:var(--dsw-alias-label-secondary)}
.tape-deck-power[aria-checked=true] .tape-deck-switch{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,var(--dsw-alias-bg-base))}
.tape-deck-power[aria-checked=true] .tape-deck-switch::after{transform:translateX(12px);background:var(--dsw-alias-brand-primary)}
.tape-deck-player{border:1px solid var(--dsw-alias-border-l1);border-radius:20px;overflow:hidden;background:var(--dsw-alias-bg-base)}
.tape-deck-stage{position:relative;isolation:isolate;height:clamp(270px,38vh,370px);overflow:hidden}
.tape-deck-surface{position:absolute;inset:0}
.tape-deck-stage-top{position:absolute;z-index:1;top:17px;left:19px;right:19px;display:flex;align-items:center;justify-content:space-between;gap:10px;pointer-events:none}
.tape-deck-badges{display:flex;flex-wrap:wrap;gap:6px}
.tape-deck-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:20px;background:color-mix(in srgb,var(--dsw-alias-bg-overlay) 88%,transparent);font-size:10px;color:var(--dsw-alias-label-secondary)}
.tape-deck-badge[data-preview=true]{color:var(--dsw-alias-brand-primary)}
.tape-deck-serial{font:10px ui-monospace,monospace;color:var(--dsw-alias-label-secondary);padding:3px 5px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 65%,transparent);border-radius:4px}
.tape-deck-stage-caption{position:absolute;inset:auto 0 0;z-index:1;pointer-events:none;padding:42px 22px 20px;background:linear-gradient(transparent,color-mix(in srgb,var(--dsw-alias-bg-base) 92%,transparent))}
.tape-deck-mood{font-size:9px;letter-spacing:.13em;color:var(--dsw-alias-label-secondary);margin-bottom:7px!important}
.tape-deck-current-title{font-size:23px;font-weight:500;letter-spacing:-.035em;line-height:1.3}
.tape-deck-current-subtitle{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:6px!important;max-width:52ch}
.tape-deck-touch{position:absolute;top:40%;left:18px;right:18px;text-align:center;pointer-events:none;font-size:10px;color:var(--dsw-alias-label-secondary);opacity:.7}
.tape-deck-transport{display:flex;align-items:center;gap:20px;padding:16px 21px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.tape-deck-transport-copy{flex:1;min-width:0}
.tape-deck-status{font-size:11px;color:var(--dsw-alias-label-secondary)}
.tape-deck-action-hint{margin-top:4px!important;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.65;max-width:60ch}
.tape-deck-insert{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:39px;border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 42%,var(--dsw-alias-border-l2));background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);border-radius:10px;padding:8px 16px;font-size:12px!important;font-weight:550;white-space:nowrap}
.tape-deck-insert:not(:disabled):hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 20%,var(--dsw-alias-bg-layer-1))}
.tape-deck-insert svg{width:14px;height:14px}
.tape-deck-drawer{position:relative;margin-top:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:20px;background:var(--dsw-alias-bg-layer-1);padding:25px 20px 17px}
.tape-deck-drawer::before{content:'';position:absolute;top:9px;left:calc(50% - 16px);width:32px;height:3px;border-radius:4px;background:var(--dsw-alias-border-l2)}
.tape-deck-drawer-title{font-size:14px;font-weight:550;letter-spacing:-.02em}
.tape-deck-drawer-subtitle{font-size:11px;color:var(--dsw-alias-label-secondary);margin:4px 0 19px!important}
.tape-deck-grid{display:grid;grid-template-columns:minmax(0,1fr);width:100%;max-width:340px;margin:0 auto}
.tape-deck-card{display:block;text-align:left;min-width:0;width:100%;padding:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:13px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.tape-deck-card:not(:disabled):hover{border-color:var(--dsw-alias-brand-primary)}
.tape-deck-card[aria-pressed=true]{border-color:var(--dsw-alias-brand-primary)}
.tape-deck-art{display:block;width:100%;height:auto;filter:drop-shadow(0 3px 3px color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent))}
.tape-deck-card-copy{display:flex;align-items:baseline;justify-content:space-between;gap:7px;margin:12px 3px 2px}
.tape-deck-card-name{font-size:13px;font-weight:550;line-height:1.4}
.tape-deck-card-number{font:10px ui-monospace,monospace;color:var(--dsw-alias-label-secondary)}
.tape-deck-card-mood{display:block;margin:5px 3px 2px;color:var(--dsw-alias-label-secondary);font-size:10px;letter-spacing:.035em}
.tape-deck-drawer-note{margin-top:15px!important;font-size:10px;text-align:center;color:var(--dsw-alias-label-secondary)}
.tape-deck-notice{margin:10px 2px 0!important;color:var(--dsw-alias-label-secondary);font-size:11px;overflow-wrap:anywhere}
.tape-deck-error{color:var(--dsw-alias-state-error-primary)}
@container(max-width:500px){.tape-deck-header{gap:12px}.tape-deck-brand{gap:9px}.tape-deck-mark{width:27px;height:27px}.tape-deck-title{font-size:22px}.tape-deck-tagline{font-size:11px}.tape-deck-power-label{display:none}.tape-deck-drawer{padding:25px 14px 15px}}
@container(max-width:359px){.tape-deck-header{align-items:flex-start}.tape-deck-mark{width:22px;height:22px;margin-top:3px}.tape-deck-title{font-size:20px}.tape-deck-tagline{font-size:10px;max-width:22ch}.tape-deck-stage{height:280px}.tape-deck-stage-top{left:13px;right:13px}.tape-deck-stage-caption{padding:42px 16px 17px}.tape-deck-current-subtitle{font-size:11px}.tape-deck-transport{align-items:stretch;flex-direction:column;gap:11px;padding:14px 16px}.tape-deck-insert{width:100%}}
`;

/** One real Surface, a fixed preset, and explicit application without parameter controls. */
export function createDeckPage({ React, ctx, model, t, Surface }) {
  const h = React.createElement, Artwork = createTapeArtwork(React);
  const text = key => t(`deck.${key}`);
  const subscribeLocale = listener => ctx.locale.subscribe(listener), getLocale = () => ctx.locale.getSnapshot();
  const tape = CASSETTES[0], params = tape.defaults;
  const icon = kind => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5,
    strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false, className: kind === 'mark' ? 'tape-deck-mark' : undefined },
    kind === 'mark' ? h(React.Fragment, null, h('rect', { x: 2.5, y: 5, width: 19, height: 14, rx: 3 }),
      h('circle', { cx: 8, cy: 12, r: 2.5 }), h('circle', { cx: 16, cy: 12, r: 2.5 }), h('path', { d: 'M8 9.5h8M8 14.5h8' }))
      : h('path', { d: kind === 'check' ? 'm5 12 4 4L19 6' : 'M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4' }));
  return function DeckPage() {
    const snapshot = React.useSyncExternalStore(model.subscribe, model.getSnapshot, model.getSnapshot);
    React.useSyncExternalStore(subscribeLocale, getLocale, getLocale);
    const lang = text('locale') === 'zh' ? 'zh' : 'en', settings = snapshot.settings;
    const [audition, setAudition] = React.useState(false), [pending, setPending] = React.useState(false);
    const [localError, setLocalError] = React.useState(''), [previewError, setPreviewError] = React.useState(false);
    const id = React.useId();
    const applied = settings.cassette === tape.id && signature(getCassetteParams(settings, tape.id)) === signature(params);
    const preview = audition || !applied, busy = pending || snapshot.saving;
    const saveDisabled = !snapshot.loaded || !snapshot.writable || busy;
    const error = snapshot.error || localError;
    const canInsert = !saveDisabled && (preview || !!error);
    React.useEffect(() => {
      if (!pending || snapshot.saving) return;
      setPending(false);
      if (!snapshot.error && applied) setAudition(false);
    }, [pending, snapshot.saving, snapshot.error, applied]);
    function insert() {
      const latest = model.getSnapshot();
      if (!canInsert || !latest.loaded || !latest.writable || latest.saving) return;
      setPending(true); setLocalError('');
      try { model.update(cassettePatch(latest.settings, tape.id, params)); }
      catch (error) { setPending(false); setLocalError(error instanceof Error ? error.message : String(error)); }
    }
    const status = !snapshot.loaded ? 'loading' : busy ? 'saving' : !snapshot.writable ? 'readOnly' : error ? 'saveError' : preview ? 'preview' : 'saved';
    const state = preview ? 'preview' : settings.enabled ? 'playing' : 'inserted';
    return h('section', { 'data-background-deck': true, className: 'tape-deck', 'aria-labelledby': `${id}-title`, 'aria-busy': !snapshot.loaded || busy },
      h('style', null, DECK_CSS),
      h('header', { className: 'tape-deck-header' },
        h('div', { className: 'tape-deck-brand' }, icon('mark'), h('div', null,
          h('h2', { id: `${id}-title`, className: 'tape-deck-title' }, text('title')), h('p', { className: 'tape-deck-tagline' }, text('tagline')))),
        h('button', { type: 'button', className: 'tape-deck-power', role: 'switch', 'aria-checked': !!settings.enabled,
          'aria-label': text(settings.enabled ? 'disable' : 'enable'), disabled: saveDisabled,
          onClick: () => { const latest = model.getSnapshot(); if (latest.loaded && latest.writable && !latest.saving) model.update({ enabled: !latest.settings.enabled }); } },
          h('span', { className: 'tape-deck-power-label' }, text('background')), h('span', { className: 'tape-deck-switch', 'aria-hidden': true }))),
      h('div', { className: 'tape-deck-player' },
        h('div', { className: 'tape-deck-stage', role: 'group', 'aria-label': text('previewLabel') },
          h('div', { className: 'tape-deck-surface' }, snapshot.loaded ? h(Surface, { key: tape.id, cassette: tape.id, params,
            enabled: true, preview: true, displayOpacity: 1, onError: () => setPreviewError(true), onReady: () => setPreviewError(false) }) : null),
          h('div', { className: 'tape-deck-stage-top' }, h('div', { className: 'tape-deck-badges' },
            h('span', { className: 'tape-deck-badge', 'data-preview': preview }, text(snapshot.loaded ? state : 'loading')),
            !settings.enabled ? h('span', { className: 'tape-deck-badge' }, text('previewOnly')) : null),
            h('span', { className: 'tape-deck-serial', 'aria-hidden': true }, '01 / 01')),
          snapshot.loaded && !previewError ? h('p', { className: 'tape-deck-touch' }, text('touch')) : null,
          h('div', { className: 'tape-deck-stage-caption' }, h('p', { className: 'tape-deck-mood' }, tape.mood[lang]),
            h('h3', { className: 'tape-deck-current-title' }, tape.name[lang]), h('p', { className: 'tape-deck-current-subtitle' }, tape.subtitle[lang]))),
        h('div', { className: 'tape-deck-transport' }, h('div', { className: 'tape-deck-transport-copy' },
          h('p', { className: 'tape-deck-status', role: 'status', 'aria-live': 'polite' }, text(status)),
          h('p', { id: `${id}-apply-hint`, className: 'tape-deck-action-hint' }, text(!settings.enabled ? 'offHint' : preview ? 'auditionHint' : 'playingHint'))),
          h('button', { type: 'button', className: 'tape-deck-insert', disabled: !canInsert, onClick: insert, 'aria-describedby': `${id}-apply-hint` },
            icon(!preview && !error ? 'check' : 'insert'), text(busy ? 'saving' : !preview && !error ? state : 'insert')))),
      previewError ? h('p', { className: 'tape-deck-notice', role: 'status' }, text('previewError')) : null,
      error ? h('div', { className: 'tape-deck-notice tape-deck-error', role: 'alert' }, h('p', null, text('saveError')), h('p', null, String(error))) : null,
      h('section', { className: 'tape-deck-drawer', 'aria-labelledby': `${id}-drawer` },
        h('h3', { id: `${id}-drawer`, className: 'tape-deck-drawer-title' }, text('drawer')),
        h('p', { className: 'tape-deck-drawer-subtitle' }, text('drawerHint')),
        h('div', { className: 'tape-deck-grid' }, h('button', { type: 'button', className: 'tape-deck-card', 'aria-pressed': preview,
          'aria-label': text('choose'), disabled: !snapshot.loaded || busy, onClick: () => setAudition(true) }, h(Artwork, { tape }),
          h('span', { className: 'tape-deck-card-copy' }, h('span', { className: 'tape-deck-card-name' }, tape.name[lang]),
            h('span', { className: 'tape-deck-card-number', 'aria-hidden': true }, tape.number)), h('span', { className: 'tape-deck-card-mood' }, tape.mood[lang]))),
        h('p', { className: 'tape-deck-drawer-note' }, text('fixed'))));
  };
}
