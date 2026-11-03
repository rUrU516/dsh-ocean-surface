import { createEffectRuntime } from './effect-runtime.js';

/** The only browser adapter: cassettes receive pixels and values, never DSH or DOM events. */
export function createEffectSurface(React, ctx) {
  const h=React.createElement;
  return function EffectSurface({cassette,params,enabled=true,preview=false,displayOpacity,onError,onReady}) {
    const canvasRef=React.useRef(null), current=React.useRef({params,enabled,onError});
    const wake=React.useRef(()=>{});
    const [failure,setFailure]=React.useState('');
    current.current={params,enabled,onError,onReady};
    React.useEffect(()=>{wake.current();},[params,enabled]);
    React.useEffect(()=>{
      const canvas=canvasRef.current;
      let runtime=null,raf=0,last=0,time=0,disposed=false,failed=false,ready=false;
      let visible=!document.hidden,focused=document.hasFocus();
      const motion=matchMedia('(prefers-reduced-motion: reduce)');
      const dark=()=>ctx.theme.getTheme().active.colorScheme==='dark';
      function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
      function fail(reason){failed=true;stop();runtime?.dispose();runtime=null;const message=reason instanceof Error?reason.message:String(reason||'Rendering unavailable');setFailure(message);current.current.onError?.(message);}
      function draw(now){
        raf=0;
        if(disposed||!runtime||!current.current.enabled||!visible||!focused)return;
        if(last && now-last<1000/30-1){raf=requestAnimationFrame(draw);return;}
        const dt=last?Math.min(.08,(now-last)/1000):1/30;
        last=now;time+=motion.matches?0:dt;
        try{
          runtime.update({params:current.current.params,dark:dark(),reducedMotion:motion.matches});
          const again=runtime.frame(dt,time);
          if(failed)return;
          if(!ready){ready=true;current.current.onReady?.();}
          if(again&&!motion.matches)raf=requestAnimationFrame(draw);else last=0;
        }catch(error){fail(error);}
      }
      function start(){if(!disposed&&!failed&&!raf&&runtime&&current.current.enabled&&visible&&focused)raf=requestAnimationFrame(draw);}
      function resize(){
        if(disposed||failed)return;
        const box=canvas.getBoundingClientRect();
        if(box.width<1||box.height<1)return;
        try{runtime?.resize(box.width,box.height,Math.min(window.devicePixelRatio||1,2));start();}catch(error){fail(error);}
      }
      function refresh(){stop();if(!current.current.enabled)return;start();}
      function pointer(event){
        if(!runtime||failed||!current.current.enabled||motion.matches||!visible||!focused)return;
        if(!preview && event.target instanceof Element && event.target.closest('[data-composer-card], [data-shell-overlay], [data-background-deck]')){leave();return;}
        const rect=canvas.getBoundingClientRect();
        const x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
        if(x<0||x>1||y<0||y>1){runtime.pointer({x:0,y:0,type:'leave',time});start();return;}
        runtime.pointer({x,y,type:event.type==='pointerdown'?'down':'move',time});start();
      }
      function leave(){runtime?.pointer({x:0,y:0,type:'leave',time});start();}
      function visibility(){visible=!document.hidden;if(visible)start();else stop();}
      function blur(){focused=false;leave();stop();}
      function focus(){focused=true;start();}
      function lost(event){event.preventDefault();fail(new Error('Graphics context lost'));}
      function restored(){if(disposed)return;failed=false;mount();}
      function mount(){
        ready=false;
        stop();runtime?.dispose();runtime=null;time=0;
        if(disposed)return;
        try{
          runtime=createEffectRuntime({canvas,cassette,params:current.current.params,dark:dark(),reducedMotion:motion.matches,maxResolution:preview?1600:3200,onError:fail});
          if(failed){runtime?.dispose();runtime=null;return;}
          setFailure('');resize();
        }catch(error){fail(error);}
      }
      const pointerTarget=preview?canvas:window;
      const observer=new ResizeObserver(resize);
      observer.observe(canvas);
      pointerTarget.addEventListener('pointermove',pointer,{passive:true});
      pointerTarget.addEventListener('pointerdown',pointer,{passive:true});
      if(preview)canvas.addEventListener('pointerleave',leave,{passive:true});
      else document.documentElement.addEventListener('pointerleave',leave,{passive:true});
      document.addEventListener('visibilitychange',visibility);
      window.addEventListener('blur',blur);window.addEventListener('focus',focus);
      motion.addEventListener('change',refresh);
      canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
      const offTheme=ctx.on('theme/change',refresh);
      wake.current=refresh;
      mount();
      return ()=>{
        disposed=true;wake.current=()=>{};stop();runtime?.dispose();runtime=null;observer.disconnect();offTheme();
        pointerTarget.removeEventListener('pointermove',pointer);pointerTarget.removeEventListener('pointerdown',pointer);
        if(preview)canvas.removeEventListener('pointerleave',leave);
        else document.documentElement.removeEventListener('pointerleave',leave);
        document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',blur);window.removeEventListener('focus',focus);
        motion.removeEventListener('change',refresh);canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);
      };
    },[cassette,preview]);
    return h('div',{style:{position:'relative',width:'100%',height:'100%',overflow:'hidden'},'data-effect-surface':cassette},
      h('canvas',{key:cassette,ref:canvasRef,'aria-hidden':true,style:{display:'block',width:'100%',height:'100%',opacity:enabled&&!failure?(displayOpacity??params.opacity):0,pointerEvents:preview?'auto':'none'}}),
      preview&&failure?h('p',{role:'status',style:{position:'absolute',bottom:12,left:16,right:16,fontSize:11,color:'var(--dsw-alias-label-secondary)'}},ctx.locale.getSnapshot().active?.startsWith('zh')?'背景预览暂不可用，请重新打开设置或刷新页面。':'Background preview is unavailable. Reopen settings or refresh the page.'):null);
  };
}
