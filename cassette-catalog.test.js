import test from 'node:test';
import assert from 'node:assert/strict';
import {CASSETTES,DECK_DEFAULTS,normalizeDeckSettings,getCassetteParams,cassettePatch} from './cassette-catalog.js';
import {createAppearanceModel,applySettingsOps} from './appearance-model.js';
import {deckPatchOperations} from './cassette-operations.js';
import {setTimeout as delay} from 'node:timers/promises';

test('Dots and original Ocean each register one fixed local tape file',()=>{
  assert.deepEqual(CASSETTES.map(c=>c.id),['dot-field','ocean-surface']);
  for(const tape of CASSETTES)assert.deepEqual(tape.controls,[]);
  assert.equal(CASSETTES[0].source,'tapes/dots.js');
  assert.equal(CASSETTES[1].source,'tapes/ocean.js');
});
test('Ocean selection persists independently without changing Dots or global power',()=>{
  const state=normalizeDeckSettings({enabled:false,cassette:'ocean-surface',cassetteSettings:{'dot-field':{opacity:.1},'ocean-surface':{tint:'#000000'}}});
  assert.equal(state.cassette,'ocean-surface');
  assert.deepEqual(getCassetteParams(state),CASSETTES[1].defaults);
  const patch=cassettePatch(state,'ocean-surface');
  assert.equal(patch.cassetteSettings['dot-field'].opacity,.1);
  assert.deepEqual(patch.cassetteSettings['ocean-surface'],CASSETTES[1].defaults);
  assert.ok(!('enabled' in patch));
});
test('retired ids migrate to Dots but legacy ocean data remains inert and untouched',()=>{
  const old={enabled:false,tint:'#393c3c',brightness:1.54,opacity:.5,waveStrength:1,speed:.55,damping:.74,cassette:'ocean'};
  const migrated=normalizeDeckSettings(old);assert.equal(migrated.cassette,'dot-field');
  for(const [key,value]of Object.entries(old))if(key!=='cassette')assert.equal(migrated[key],value);
  for(const id of ['ocean','contour','ripple','alien']){
    assert.equal(normalizeDeckSettings({cassette:id}).cassette,'dot-field');
    assert.throws(()=>cassettePatch(DECK_DEFAULTS,id,{}),/Unknown/);
  }
});
test('fixed Dots ignores old saved variations and incoming insertion parameters',()=>{
  const state=normalizeDeckSettings({cassetteSettings:{'dot-field':{tint:'#ff0000',strength:0,scale:1.8,opacity:.1},ripple:{strength:1}}});
  assert.deepEqual(getCassetteParams(state),CASSETTES[0].defaults);
  const patch=cassettePatch(state,'dot-field',{strength:0});
  assert.deepEqual(patch.cassetteSettings['dot-field'],CASSETTES[0].defaults);
  assert.ok(!('enabled'in patch));
  assert.ok(!('ripple'in state.cassetteSettings));
});
test('insertion targets only the selected fixed tape, not the other tape or global power',()=>{
  const state=normalizeDeckSettings({enabled:false,cassette:'dot-field',cassetteSettings:{'dot-field':{opacity:.1},'ocean-surface':{}}});
  const patch=cassettePatch(state,'ocean-surface');
  const operations=deckPatchOperations(patch,state);
  assert.deepEqual(operations.map(op=>op.path),[['cassette'],['cassetteSettings','ocean-surface']]);
  const result=applySettingsOps(state,operations);
  assert.equal(result.cassette,'ocean-surface');
  assert.equal(result.enabled,false);
  assert.deepEqual(result.cassetteSettings['dot-field'],state.cassetteSettings['dot-field']);
});
test('normalization handles missing, malformed and unknown settings without arbitrary keys',()=>{
  assert.deepEqual(normalizeDeckSettings(null),normalizeDeckSettings({}));
  assert.ok(!('alien'in normalizeDeckSettings({cassetteSettings:{alien:{}}}).cassetteSettings));
});
test('insert is one atomic path mutation and preserves concurrent power and archived data',async()=>{
  let value=normalizeDeckSettings({});let writes=[];const listeners=new Set();
  const form={getSnapshot:()=>({status:'ready',writable:true,value}),subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},
    async mutate(ops){writes.push(ops);value=applySettingsOps(value,ops);for(const fn of listeners)fn();return true;}};
  const model=createAppearanceModel(form,DECK_DEFAULTS,normalizeDeckSettings,()=> 'failed',deckPatchOperations);
  model.update(cassettePatch(model.getSnapshot().settings,'dot-field',{}));
  value={...value,enabled:false,damping:.93,cassetteSettings:{...value.cassetteSettings,ripple:{strength:1.4}}};
  for(const fn of listeners)fn();await delay(280);
  assert.equal(writes.length,1);assert.deepEqual(writes[0].map(op=>op.path),[['cassette'],['cassetteSettings','dot-field']]);
  assert.equal(value.enabled,false);assert.equal(value.damping,.93);assert.equal(value.cassetteSettings.ripple.strength,1.4);
  assert.deepEqual(getCassetteParams(value),CASSETTES[0].defaults);model.dispose();
});
