/** Optimistic preview with serialized atomic path mutations; unrelated remote fields are preserved. */
export function applySettingsOps(value, ops) {
  const result=structuredClone(value||{});
  for(const {path,value:next} of ops){
    let parent=result;
    for(const key of path.slice(0,-1)){
      if(!parent[key]||typeof parent[key]!=='object')parent[key]={};
      parent=parent[key];
    }
    parent[path.at(-1)]=structuredClone(next);
  }
  return result;
}
export function createAppearanceModel(form, initial, normalize, failureMessage, toOperations) {
  let settings=normalize(initial),pending=new Map(),timer=null,writing=false,disposed=false,error='',snapshot;
  const listeners=new Set();
  const operations=patch=>Object.entries(patch).map(([key,value])=>({op:'set',path:[key],value}));
  function publish(){
    const state=form.getSnapshot();
    snapshot={settings,saving:writing||pending.size>0,error,writable:state.writable,loaded:state.status!=='loading'};
    for(const listener of listeners)listener();
  }
  function accepted(){return form.getSnapshot().value||initial;}
  function accept(){
    if(!writing&&form.getSnapshot().status==='ready')settings=normalize(applySettingsOps(accepted(),[...pending.values()]));
    publish();
  }
  async function flush(){
    timer=null;
    if(disposed||writing||!pending.size)return;
    const batch=[...pending.values()];pending=new Map();writing=true;publish();
    try{
      const ok=await form.mutate(batch);
      if(!ok)throw new Error(failureMessage());
      error='';
    }catch(reason){error=reason instanceof Error?reason.message:String(reason);}
    finally{
      writing=false;
      if(disposed){
        if(pending.size){const trailing=[...pending.values()];pending.clear();try{await form.mutate(trailing);}catch{ /* No subscriber remains to report unload failures. */ }}
        return;
      }
      settings=normalize(applySettingsOps(accepted(),[...pending.values()]));
      if(pending.size)timer=setTimeout(flush,120);
      publish();
    }
  }
  const unsubscribe=form.subscribe(accept);accept();
  return {
    getSnapshot:()=>snapshot,
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
    update(patch){
      if(disposed||!form.getSnapshot().writable||form.getSnapshot().status!=='ready')return;
      const next=normalize({...settings,...patch});
      const ops=toOperations?toOperations(patch,settings):operations(Object.fromEntries(Object.keys(patch).filter(key=>key in next).map(key=>[key,next[key]])));
      for(const op of ops)pending.set(JSON.stringify(op.path),op);
      settings=normalize(applySettingsOps(settings,ops));error='';
      if(timer)clearTimeout(timer);timer=setTimeout(flush,220);publish();
    },
    reset(){this.update(initial);},
    dispose(){
      if(timer)clearTimeout(timer);
      if(!writing&&pending.size)void flush();
      disposed=true;unsubscribe();listeners.clear();
    },
  };
}
