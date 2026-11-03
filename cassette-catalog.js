import { APPEARANCE_DEFAULTS, normalizeAppearance } from './appearance.js';
import { CASSETTE_ENTRIES, getCassetteEntry } from './cassette-registry.js';

export const CASSETTE_API_VERSION=1;
export const CASSETTES=Object.freeze(CASSETTE_ENTRIES.map(entry=>entry.descriptor));
export function getCassette(id){return getCassetteEntry(id).descriptor;}
export function normalizeCassetteParams(id,input={}){return getCassetteEntry(id).normalize(input);}
// Top-level legacy values remain inert; each tape uses its own fixed descriptor defaults.
export const DECK_DEFAULTS=Object.freeze({...APPEARANCE_DEFAULTS,cassette:'dot-field',cassetteSettings:{}});
export function normalizeDeckSettings(input={}){
  const source=input&&typeof input==='object'?input:{};
  const cassette=getCassette(source.cassette).id;
  const cassetteSettings={};
  for(const tape of CASSETTES){
    const saved=source.cassetteSettings?.[tape.id];
    if(saved&&typeof saved==='object')cassetteSettings[tape.id]=normalizeCassetteParams(tape.id,saved);
  }
  return {...normalizeAppearance(source),cassette,cassetteSettings};
}
export function getCassetteParams(settings,id=settings.cassette){
  // A tape is an authored preset, never a form-driven variation of it.
  return {...getCassette(id).defaults};
}
export function cassettePatch(settings,id,params){
  if(!CASSETTES.some(item=>item.id===id))throw new Error(`Unknown cassette: ${id}`);
  return {cassette:id,cassetteSettings:{...settings.cassetteSettings,[id]:{...getCassette(id).defaults}}};
}
