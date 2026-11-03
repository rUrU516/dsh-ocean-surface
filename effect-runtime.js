import { getCassetteEntry } from './cassette-registry.js';

/** Backing resolution is bounded; effect coordinates stay in CSS pixels. */
export function effectSize(width,height,dpr=1,maxResolution=1100){
  width=Number.isFinite(width)?Math.max(0,width):0;
  height=Number.isFinite(height)?Math.max(0,height):0;
  if(!width||!height)return {width,height,pixelWidth:0,pixelHeight:0,scaleX:0,scaleY:0};
  const limit=Number.isFinite(maxResolution)?Math.max(1,Math.min(1100,maxResolution)):1100;
  const ratio=Math.min(Number.isFinite(dpr)&&dpr>0?dpr:1,1.5,limit/Math.max(width,height));
  const pixelWidth=Math.max(1,Math.round(width*ratio)),pixelHeight=Math.max(1,Math.round(height*ratio));
  return {width,height,pixelWidth,pixelHeight,scaleX:pixelWidth/width,scaleY:pixelHeight/height};
}

/** No tape-id branches: the registry provides a self-contained local factory. */
export function createEffectRuntime({canvas,cassette,params,dark=false,reducedMotion=false,onError,maxResolution=1100}={}){
  const entry=getCassetteEntry(typeof cassette==='string'?cassette:cassette?.id);
  let settings=entry.normalize(params),size=effectSize(0,0),context=null,effect=null;
  let disposed=false,failed=false,reported=false;
  function report(reason){
    if(reported)return;reported=true;
    try{onError?.(reason instanceof Error?reason:new Error(String(reason)));}catch{/* Error reporting cannot break disposal. */}
  }
  function release(){const active=effect;effect=null;context=null;canvas=null;active?.dispose();}
  function fail(error){failed=true;report(error);try{release();}catch(reason){report(reason);}}
  function ensure(){
    if(effect)return;
    if(!canvas||typeof canvas.getContext!=='function')throw new Error('An effect runtime requires a canvas with getContext().');
    context=canvas.getContext('2d',{alpha:true});
    if(!context)throw new Error('Canvas2D unavailable.');
    effect=entry.create({context,params:settings,dark,reducedMotion});
    effect.resize(size.width,size.height);
  }
  return {
    resize(width,height,dpr=1){
      if(disposed||failed)return;
      size=effectSize(width,height,dpr,maxResolution);
      if(!size.pixelWidth||!size.pixelHeight)return;
      try{
        if(!canvas)throw new Error('An effect runtime requires a canvas.');
        if(canvas.width!==size.pixelWidth)canvas.width=size.pixelWidth;
        if(canvas.height!==size.pixelHeight)canvas.height=size.pixelHeight;
        ensure();effect.resize(size.width,size.height);
      }catch(error){fail(error);}
    },
    update(patch={}){
      if(disposed||failed||!patch||typeof patch!=='object')return;
      if(patch.params&&typeof patch.params==='object')settings=entry.normalize({...settings,...patch.params});
      if(typeof patch.dark==='boolean')dark=patch.dark;
      if(typeof patch.reducedMotion==='boolean')reducedMotion=patch.reducedMotion;
      try{effect?.update({params:settings,dark,reducedMotion});}catch(error){fail(error);}
    },
    pointer(point){if(disposed||failed)return;try{effect?.pointer(point);}catch(error){fail(error);}},
    frame(dt,time){
      if(disposed||failed||!size.pixelWidth||!size.pixelHeight)return false;
      try{
        ensure();context.setTransform(size.scaleX,0,0,size.scaleY,0,0);context.clearRect(0,0,size.width,size.height);
        return effect.frame(dt,time);
      }catch(error){fail(error);return false;}
    },
    dispose(){if(disposed)return;disposed=true;try{release();}catch(error){report(error);}},
  };
}
