import { APPEARANCE_DEFAULTS, normalizeAppearance } from './appearance.js';
import { CASSETTE_ENTRIES, getCassetteEntry } from './cassette-registry.js';

export const CASSETTE_API_VERSION=1;
export const CASSETTES=Object.freeze(CASSETTE_ENTRIES.map(entry=>entry.descriptor));
export function getCassette(id){return getCassetteEntry(id).descriptor;}
export function normalizeCassetteParams(id,input={}){return getCassetteEntry(id).normalize(input);}
// Legacy ocean values remain inert compatibility data; they are never an active tape.
export const DECK_DEFAULTS=Object.freeze({...APPEARANCE_DEFAULTS,cassette:'dot-field',cassetteSettings:{}});
export function normalizeDeckSettings(input={}){
  const source=input&&typeof input==='object'?input:{};
  const saved=source.cassetteSettings?.['dot-field'];
  return {...normalizeAppearance(source),cassette:'dot-field',cassetteSettings:saved&&typeof saved==='object'?{'dot-field':normalizeCassetteParams('dot-field',saved)}:{}};
}
export function getCassetteParams(settings,id=settings.cassette){
  // A tape is an authored preset, never a form-driven variation of it.
  return {...getCassette(id).defaults};
}
export function cassettePatch(settings,id,params){
  if(!CASSETTES.some(item=>item.id===id))throw new Error(`Unknown cassette: ${id}`);
  return {cassette:id,cassetteSettings:{...settings.cassetteSettings,[id]:{...getCassette(id).defaults}}};
}
