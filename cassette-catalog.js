import { APPEARANCE_DEFAULTS, normalizeAppearance } from './appearance.js';

/** Deck API v1. Descriptors are data only; renderers never receive DSH or a DOM root. */
export const CASSETTE_API_VERSION = 1;
export const CASSETTES = Object.freeze([
  { id:'dot-field', number:'01', name:{zh:'引力点阵',en:'Dot Field'}, subtitle:{zh:'在指尖，轻轻弯曲的空间。',en:'A little gravity, at your fingertips.'},
    mood:{zh:'透镜 · 安静',en:'LENS / QUIET'}, colors:['#7284df','#af83ba'], renderer:'2d', continuous:false,
    defaults:{tint:'#8b91d4',opacity:.38,strength:.65,scale:1,speed:.45},
    controls:[['opacity',0,.65,.01],['strength',0,1.5,.05],['scale',.6,1.8,.05]] },
  { id:'ripple', number:'02', name:{zh:'空间薄膜',en:'Space Membrane'}, subtitle:{zh:'轻触一下，余韵慢慢散开。',en:'Touch the stillness. Watch it settle.'},
    mood:{zh:'涟漪 · 触发',en:'RIPPLE / ON TOUCH'}, colors:['#7ca8ad','#9b9bbd'], renderer:'2d', continuous:false,
    defaults:{tint:'#85a7b1',opacity:.28,strength:.6,scale:1,speed:.65},
    controls:[['opacity',0,.65,.01],['strength',0,1.5,.05],['speed',.2,1.5,.05]] },
  { id:'contour', number:'03', name:{zh:'风的等高线',en:'Quiet Contours'}, subtitle:{zh:'几缕细线，慢于呼吸。',en:'A few fine lines. Slower than a breath.'},
    mood:{zh:'线条 · 缓流',en:'LINES / SLOW DRIFT'}, colors:['#b7a486','#89a5a0'], renderer:'2d', continuous:true,
    defaults:{tint:'#a7a18a',opacity:.2,strength:.45,scale:1,speed:.3},
    controls:[['opacity',0,.65,.01],['strength',0,1.5,.05],['speed',0,1.5,.05]] },
  { id:'ocean', number:'04', name:{zh:'深海来信',en:'Ocean Surface'}, subtitle:{zh:'熟悉的水面，收进一盘磁带。',en:'The original ocean, kept on tape.'},
    mood:{zh:'海面 · 连续',en:'WATER / CONTINUOUS'}, colors:['#4896a6','#577d98'], renderer:'webgl', continuous:true,
    defaults:APPEARANCE_DEFAULTS,
    controls:[['brightness',.5,2,.01],['opacity',0,.5,.01],['waveStrength',0,2,.05],['speed',0,2,.05],['damping',0,1,.01]] },
]);
export function getCassette(id) { return CASSETTES.find(item=>item.id===id) || CASSETTES.find(item=>item.id==='ocean'); }
export function normalizeCassetteParams(id, input = {}) {
  const descriptor = getCassette(id);
  if (descriptor.id==='ocean') return normalizeAppearance(input);
  const result={...descriptor.defaults};
  if (typeof input.tint==='string' && /^#[\da-f]{6}$/i.test(input.tint)) result.tint=input.tint.toLowerCase();
  const ranges={opacity:[0,.65],strength:[0,1.5],scale:[.6,1.8],speed:[0,1.5]};
  for (const [key,[min,max]] of Object.entries(ranges)) if(typeof input[key]==='number' && Number.isFinite(input[key])) result[key]=Math.max(min,Math.min(max,input[key]));
  return result;
}
export const DECK_DEFAULTS=Object.freeze({...APPEARANCE_DEFAULTS,cassette:'ocean',cassetteSettings:{}});
export function normalizeDeckSettings(input={}) {
  const source=input && typeof input==='object'?input:{};
  const cassette=CASSETTES.some(item=>item.id===source.cassette)?source.cassette:'ocean';
  const cassetteSettings={};
  for(const item of CASSETTES) {
    if(item.id==='ocean') continue; // Existing ocean fields stay in their original persisted location.
    const saved=source.cassetteSettings?.[item.id];
    if(saved && typeof saved==='object') cassetteSettings[item.id]=normalizeCassetteParams(item.id,saved);
  }
  return {...normalizeAppearance(source),cassette,cassetteSettings};
}
export function getCassetteParams(settings,id=settings.cassette) {
  return normalizeCassetteParams(id,id==='ocean'?settings:settings.cassetteSettings?.[id]);
}
export function cassettePatch(settings,id,params) {
  if(!CASSETTES.some(item=>item.id===id)) throw new Error(`Unknown cassette: ${id}`);
  const normalized=normalizeCassetteParams(id,params);
  if(id==='ocean'){
    const {enabled,...ocean}=normalized; // Global power is never part of a tape insertion.
    return {cassette:id,...ocean};
  }
  return {cassette:id,cassetteSettings:{...settings.cassetteSettings,[id]:normalized}};
}
