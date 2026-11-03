import { DOTS_CASSETTE, normalizeDotsParams, createDotsEffect } from './tapes/dots.js';

/** Explicit built-ins only. Each local tape supplies data, normalization and its factory. */
export const CASSETTE_ENTRIES=Object.freeze([
  Object.freeze({descriptor:DOTS_CASSETTE,normalize:normalizeDotsParams,create:createDotsEffect}),
]);
export function getCassetteEntry(id){
  return CASSETTE_ENTRIES.find(entry=>entry.descriptor.id===id)||CASSETTE_ENTRIES[0];
}
