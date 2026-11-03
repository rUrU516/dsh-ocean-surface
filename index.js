import z from '@deepseek-ai/schemastery';
import { APPEARANCE_DEFAULTS } from './appearance.js';
import { CASSETTES, DECK_DEFAULTS, normalizeDeckSettings, getCassetteParams, cassettePatch } from './cassette-catalog.js';
import { deckPatchOperations } from './cassette-operations.js';

export const inject=['settings','tools'];
export const Config=z.object({
  enabled:z.boolean().default(true).volatile(),
  // Inert legacy fields preserve an old installation's data; no retired renderer is loaded.
  tint:z.string().pattern(/^#[\da-fA-F]{6}$/).default(APPEARANCE_DEFAULTS.tint).volatile(),
  brightness:z.number().min(.5).max(2).default(1.12).volatile(),
  opacity:z.number().min(0).max(.5).default(.16).volatile(),
  waveStrength:z.number().min(0).max(2).default(1).volatile(),
  damping:z.number().min(0).max(1).default(.15).volatile(),
  speed:z.number().min(0).max(2).default(1).volatile(),
  cassette:z.string().default('dot-field').volatile(),
  cassetteSettings:z.dict(z.object({
    tint:z.string().default('#9071c1'),opacity:z.number().min(0).max(1).default(.85),
    strength:z.number().min(0).max(1.5).default(1),scale:z.number().min(.6).max(1.8).default(1),
    speed:z.number().min(0).max(1.5).default(.45),
  })).default({}).volatile(),
});
export function apply(ctx,config){
  ctx.effect(()=>ctx.settings.configure({auto:false}));
  ctx.inject(['clientModules'],web=>{web.clientModules.rebuilt('@local/dsh-cursor-ripples');});
  const read=()=>normalizeDeckSettings(Object.fromEntries(Object.keys(DECK_DEFAULTS).map(key=>[key,config[key].get()])));
  const write=patch=>ctx.settings.mutate('cursor-ripples',deckPatchOperations(patch,read()));
  ctx.tools.register({
    name:'background_tapes',description:'List fixed background tapes, read the active tape, insert a tape or turn the background on/off. Tape appearance is authored in its local file, not adjustable in Settings.',
    parameters:{type:'object',properties:{
      action:{type:'string',enum:['list','get','insert','enable']},
      cassette:{type:'string',enum:CASSETTES.map(item=>item.id),description:'Required for insert.'},
      enabled:{type:'boolean',description:'Required for enable.'},
    },required:['action'],additionalProperties:false},
    output:{schema:{type:'string'},render:(_args,value)=>[{type:'text',text:value}]},
    async execute(args){
      if(args.action==='list')return JSON.stringify({apiVersion:1,tapes:CASSETTES.map(({id,name,subtitle,source})=>({id,name,description:subtitle,source,fixed:true}))});
      const state=read();
      if(args.action==='enable'){
        if(typeof args.enabled!=='boolean')throw new Error('enable requires enabled');
        await write({enabled:args.enabled});
      }else if(args.action==='insert'){
        const descriptor=CASSETTES.find(item=>item.id===args.cassette);
        if(!descriptor)throw new Error('insert requires an available cassette id');
        await write(cassettePatch(state,descriptor.id,descriptor.defaults));
      }else if(args.action!=='get')throw new Error(`Unsupported action: ${args.action}`);
      const accepted=read();
      return JSON.stringify({saved:true,active:accepted.cassette,enabled:accepted.enabled,fixed:true,params:getCassetteParams(accepted)});
    },
  });
}
