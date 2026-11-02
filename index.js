import z from '@deepseek-ai/schemastery';
import { APPEARANCE_DEFAULTS, normalizeAppearance } from './appearance.js';
import { CASSETTES, DECK_DEFAULTS, normalizeDeckSettings, getCassetteParams, cassettePatch } from './cassette-catalog.js';
import { deckPatchOperations } from './cassette-operations.js';

export const inject = ['settings', 'tools'];
export const Config = z.object({
  enabled: z.boolean().default(true).volatile(),
  tint: z.string().pattern(/^#[\da-fA-F]{6}$/).default(APPEARANCE_DEFAULTS.tint).volatile(),
  brightness: z.number().min(.5).max(2).default(1.12).volatile(),
  opacity: z.number().min(0).max(.5).default(.16).volatile(),
  waveStrength: z.number().min(0).max(2).default(1).volatile(),
  damping: z.number().min(0).max(1).default(.15).volatile(),
  speed: z.number().min(0).max(2).default(1).volatile(),
  cassette: z.string().default('ocean').volatile(),
  cassetteSettings: z.dict(z.object({
    tint:z.string().default('#8b91d4'), opacity:z.number().min(0).max(.65).default(.3),
    strength:z.number().min(0).max(1.5).default(.6), scale:z.number().min(.6).max(1.8).default(1),
    speed:z.number().min(0).max(1.5).default(.5),
  })).default({}).volatile(),
});

export function apply(ctx, config) {
  ctx.effect(() => ctx.settings.configure({ auto: false }));
  ctx.inject(['clientModules'], web => { web.clientModules.rebuilt('@local/dsh-cursor-ripples'); });
  const read = () => normalizeDeckSettings(Object.fromEntries(Object.keys(DECK_DEFAULTS).map(key=>[key,config[key].get()])));
  const write = patch => ctx.settings.mutate('cursor-ripples',deckPatchOperations(patch,read()));
  const numeric={type:'number'};
  const color={type:'string',pattern:'^#[0-9a-fA-F]{6}$'};
  const output={schema:{type:'string'},render:(_args,value)=>[{type:'text',text:value}]};
  ctx.tools.register({
    name:'background_tapes',
    description:'List background tapes, inspect the active tape and saved parameters, insert a tape, adjust its parameters, reset one tape or turn the background on/off. Settings are shared with the Background Tapes drawer.',
    parameters:{type:'object',properties:{
      action:{type:'string',enum:['list','get','insert','update','reset','enable']},
      cassette:{type:'string',enum:CASSETTES.map(item=>item.id),description:'Tape id; insert requires it. Other tape actions default to the active tape.'},
      enabled:{type:'boolean',description:'Required for enable.'},
      params:{type:'object',description:'Tape parameters. list returns the supported ranges. Omitted values keep their saved values.',properties:{
        tint:color,opacity:{...numeric,minimum:0,maximum:.65},strength:{...numeric,minimum:0,maximum:1.5},
        scale:{...numeric,minimum:.6,maximum:1.8},speed:{...numeric,minimum:0,maximum:2},
        brightness:{...numeric,minimum:.5,maximum:2},waveStrength:{...numeric,minimum:0,maximum:2},damping:{...numeric,minimum:0,maximum:1},
      },additionalProperties:false},
    },required:['action'],additionalProperties:false},output,
    async execute(args){
      if(args.action==='list')return JSON.stringify({apiVersion:1,tapes:CASSETTES.map(({id,name,subtitle,controls,defaults})=>({id,name,description:subtitle,controls,defaults}))});
      const state=read(),id=args.cassette||state.cassette;
      if(args.action==='insert'&&!args.cassette)throw new Error('insert requires cassette');
      if(args.action==='enable'){
        if(typeof args.enabled!=='boolean')throw new Error('enable requires enabled');
        await write({enabled:args.enabled});
      }else if(['insert','update','reset'].includes(args.action)){
        const descriptor=CASSETTES.find(item=>item.id===id);
        if(!descriptor)throw new Error(`Unknown cassette: ${id}`);
        const values=args.action==='reset'?descriptor.defaults:{...getCassetteParams(state,id),...args.params};
        const patch=cassettePatch(state,id,values);
        // Adjusting a saved, inactive tape does not insert it implicitly.
        if(args.action!=='insert')delete patch.cassette;
        await write(patch);
      }
      const accepted=read();
      return JSON.stringify({saved:true,active:accepted.cassette,enabled:accepted.enabled,params:getCassetteParams(accepted,id),settings:accepted});
    },
  });
  // Backwards-compatible ocean tool: it never changes which tape is inserted.
  ctx.tools.register({
    name:'ocean_appearance',description:'Read or adjust the saved Ocean Surface tape. Does not switch the active background tape; use background_tapes to insert tapes.',
    parameters:{type:'object',properties:{action:{type:'string',enum:['get','update','reset']},enabled:{type:'boolean'},tint:color,
      brightness:{...numeric,minimum:.5,maximum:2},opacity:{...numeric,minimum:0,maximum:.5},
      waveStrength:{...numeric,minimum:0,maximum:2},speed:{...numeric,minimum:0,maximum:2},damping:{...numeric,minimum:0,maximum:1}},required:['action'],additionalProperties:false},output,
    async execute(args){
      if(args.action!=='get'){
        const patch=args.action==='reset'?{...APPEARANCE_DEFAULTS}:Object.fromEntries(Object.keys(APPEARANCE_DEFAULTS).filter(key=>args[key]!==undefined).map(key=>[key,args[key]]));
        await write(patch);
      }
      return JSON.stringify({saved:true,settings:normalizeAppearance(read())});
    },
  });
}
