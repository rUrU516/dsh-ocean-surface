import { normalizeDeckSettings } from './cassette-catalog.js';

/** One intent, one batch. Nested tape writes never replace the whole drawer. */
export function deckPatchOperations(patch, previous) {
  const next=normalizeDeckSettings({...previous,...patch});
  const ops=[];
  for(const key of Object.keys(patch)){
    if(key==='cassetteSettings'){
      for(const [id,params]of Object.entries(next.cassetteSettings)){
        if(patch.cassette===id || JSON.stringify(params)!==JSON.stringify(previous.cassetteSettings?.[id]))
          ops.push({op:'set',path:['cassetteSettings',id],value:params});
      }
    }else if(key in next)ops.push({op:'set',path:[key],value:next[key]});
  }
  return ops;
}
