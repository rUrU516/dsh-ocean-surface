import { DECK_DEFAULTS, normalizeDeckSettings, getCassetteParams } from './cassette-catalog.js';
import { createAppearanceModel } from './appearance-model.js';
import { deckPatchOperations } from './cassette-operations.js';
import { createEffectSurface } from './effect-surface.js';
import { createDeckPage, DECK_DICTS } from './deck-panel.js';

// The only DSH-specific compatibility seam. Effects never receive these selectors.
const FRAME='.PIRFFq_frame';
const SCOPE='.PIRFFq_frame:has(> [data-local-ocean-background="081"])';
const backgroundCSS=`
${SCOPE}{isolation:isolate;background:var(--dsw-alias-bg-base)!important}
${SCOPE}>.PIRFFq_sidebarCol,${SCOPE}>.PIRFFq_centerCol,${SCOPE}>.PIRFFq_rightbarCol,${SCOPE}>.PIRFFq_bottomRow{position:relative;z-index:1}
${SCOPE}>.PIRFFq_centerCol,${SCOPE}>.PIRFFq_centerCol .kiGsTW_root,${SCOPE} .kiGsTW_body,${SCOPE} .kiGsTW_scrollBody,${SCOPE} .kiGsTW_header,${SCOPE} .tnXGgG_column[data-chat-flow]{background:transparent!important;box-shadow:none!important}
${SCOPE}>.PIRFFq_sidebarCol,${SCOPE}>.PIRFFq_bottomRow{background:color-mix(in srgb,var(--dsw-alias-bg-base) 15%,transparent)!important}
/* The writing surface always wins over decorative content. Do not touch native scrims/geometry. */
${SCOPE} [data-composer-card]{background:var(--dsw-alias-bg-layer-1)!important}
${SCOPE} .kiGsTW_viewArea:not(:has([data-chat-flow])),${SCOPE}>.PIRFFq_rightbarCol{background:var(--dsw-alias-bg-base)}
${SCOPE}>[data-shell-overlay],${SCOPE}>[data-shell-leading]{z-index:50}
`;
window.__ModuleLoader__.load({
  id:'@local/dsh-cursor-ripples',
  factory(require){
    const React=require('react'),{createPortal}=require('react-dom'),h=React.createElement;
    return {inject:['slots','theme','locale','configForms'],apply(ctx){
      const namespace='local-background-tapes-v1';
      for(const [lang,dict]of Object.entries(DECK_DICTS))ctx.effect(()=>ctx.locale.register(namespace,lang,dict));
      const t=ctx.locale.bind(namespace);
      const form=ctx.configForms.get('cursor-ripples');
      const model=createAppearanceModel(form,DECK_DEFAULTS,normalizeDeckSettings,()=>t('deck.saveError'),deckPatchOperations);
      ctx.effect(()=>()=>model.dispose());
      const Surface=createEffectSurface(React,ctx);
      const Page=createDeckPage({React,ctx,model,t,Surface});
      ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'local-ocean-appearance',order:30,label:()=>t('deck.title')},Page));
      function Background(){
        const marker=React.useRef(null),[target,setTarget]=React.useState(null),[failed,setFailed]=React.useState(false);
        const {settings}=React.useSyncExternalStore(model.subscribe,model.getSnapshot,model.getSnapshot);
        const cassette=settings.cassette;
        React.useEffect(()=>setFailed(false),[cassette]);
        React.useLayoutEffect(()=>{
          const candidate=marker.current?.closest(FRAME);
          if(!candidate||!candidate.querySelector(':scope > .PIRFFq_centerCol')){console.warn('[Background Tapes] Unsupported DSH frame; leaving native UI intact.');return;}
          setTarget(candidate);
        },[]);
        return h(React.Fragment,null,
          h('span',{hidden:true,ref:marker,'data-ocean-adapter':'0.8.1'}),
          target?createPortal(h('div',{'data-local-ocean-background':settings.enabled&&!failed?'081':undefined,
            'aria-hidden':true,style:{position:'absolute',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}},
            h('style',null,backgroundCSS),
            h(Surface,{key:cassette,cassette,params:getCassetteParams(settings),enabled:settings.enabled,preview:false,onError:()=>setFailed(true),onReady:()=>setFailed(false)})),target):null);
      }
      ctx.slots.inject('shell.overlay',()=>ctx.slots.register({name:'shell.overlay',id:'local-background-tapes-adapter-v081-dots-fixed',order:-100},Background));
    }};
  },
});
