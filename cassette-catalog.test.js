import test from 'node:test';
import assert from 'node:assert/strict';
import { CASSETTES, DECK_DEFAULTS, normalizeDeckSettings, getCassetteParams, cassettePatch, normalizeCassetteParams } from './cassette-catalog.js';
import { createAppearanceModel, applySettingsOps } from './appearance-model.js';
import { deckPatchOperations } from './cassette-operations.js';
import { setTimeout as delay } from 'node:timers/promises';

test('legacy ocean settings migrate without changing their appearance',()=>{
  const old={enabled:true,tint:'#393c3c',brightness:1.54,opacity:.5,waveStrength:1,speed:.55,damping:.74};
  const migrated=normalizeDeckSettings(old);
  assert.equal(migrated.cassette,'ocean');
  for(const [key,value] of Object.entries(old))assert.equal(migrated[key],value);
  assert.deepEqual(getCassetteParams(migrated),old);
});
test('all built-in tapes have versioned finite data and independent controls',()=>{
  assert.equal(new Set(CASSETTES.map(c=>c.id)).size,4);
  for(const item of CASSETTES){
    assert.ok(item.name.zh&&item.name.en&&item.subtitle.zh&&item.subtitle.en);
    const params=getCassetteParams(DECK_DEFAULTS,item.id);
    for(const [key,min,max,step] of item.controls){assert.ok(params[key]>=min&&params[key]<=max);assert.ok(step>0);}
  }
});
test('insert and per-tape edits preserve all other tapes and the original ocean',()=>{
  const old=normalizeDeckSettings({tint:'#393c3c',damping:.74});
  const dot=normalizeDeckSettings({...old,...cassettePatch(old,'dot-field',{strength:1.1,tint:'#aabbcc'})});
  const ripple=normalizeDeckSettings({...dot,...cassettePatch(dot,'ripple',{opacity:.22})});
  assert.equal(ripple.cassette,'ripple');assert.equal(ripple.tint,old.tint);assert.equal(ripple.damping,.74);
  assert.equal(getCassetteParams(ripple,'dot-field').strength,1.1);
  const restored=normalizeDeckSettings({...ripple,...cassettePatch(ripple,'ocean',getCassetteParams(ripple,'ocean'))});
  assert.deepEqual(getCassetteParams(restored),getCassetteParams(old));
  assert.equal(getCassetteParams(restored,'dot-field').tint,'#aabbcc');
});
test('unknown tape ids and malformed values cannot escape the catalog',()=>{
  assert.equal(normalizeDeckSettings({cassette:'alien'}).cassette,'ocean');
  assert.deepEqual(normalizeDeckSettings(null),normalizeDeckSettings({}));
  assert.throws(()=>cassettePatch(DECK_DEFAULTS,'alien',{}),/Unknown/);
  const params=normalizeCassetteParams('dot-field',{strength:Infinity,scale:500,opacity:-1,tint:'red',speed:NaN});
  assert.equal(params.scale,1.8);assert.equal(params.opacity,0);assert.equal(params.strength,.65);
  assert.ok(!('alien' in normalizeDeckSettings({cassetteSettings:{alien:{}}}).cassetteSettings));
});
test('tape selection and its parameters are one atomic persisted mutation',async()=>{
  let value=normalizeDeckSettings({});let writes=[];const listeners=new Set();
  const form={getSnapshot:()=>({status:'ready',writable:true,value}),subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},
    async mutate(ops){writes.push(ops);value=applySettingsOps(value,ops);for(const fn of listeners)fn();return true;}};
  const model=createAppearanceModel(form,DECK_DEFAULTS,normalizeDeckSettings,()=> 'failed',deckPatchOperations);
  model.update(cassettePatch(model.getSnapshot().settings,'dot-field',{strength:.8}));
  assert.equal(model.getSnapshot().settings.cassette,'dot-field');
  await delay(280);
  assert.equal(writes.length,1);assert.deepEqual(writes[0].map(op=>op.path[0]).sort(),['cassette','cassetteSettings']);
  assert.equal(getCassetteParams(model.getSnapshot().settings).strength,.8);model.dispose();
});
test('pending insertion preserves a concurrent unrelated tape and global power write',async()=>{
  let value=normalizeDeckSettings({});const listeners=new Set();let writes=[];
  const form={getSnapshot:()=>({status:'ready',writable:true,value}),subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},
    async mutate(ops){writes.push(ops);value=applySettingsOps(value,ops);for(const fn of listeners)fn();return true;}};
  const model=createAppearanceModel(form,DECK_DEFAULTS,normalizeDeckSettings,()=> 'failed',deckPatchOperations);
  model.update(cassettePatch(model.getSnapshot().settings,'dot-field',{strength:1.2}));
  value=normalizeDeckSettings({...value,enabled:false,cassetteSettings:{ripple:{strength:1.4}}});
  for(const fn of listeners)fn();
  await delay(280);
  assert.equal(writes.length,1);
  assert.deepEqual(writes[0].map(op=>op.path),[['cassette'],['cassetteSettings','dot-field']]);
  assert.equal(getCassetteParams(value,'ripple').strength,1.4);
  assert.equal(getCassetteParams(value,'dot-field').strength,1.2);
  assert.equal(value.enabled,false);model.dispose();
});
test('ocean insertion cannot overwrite the global enable switch',()=>{
  const state=normalizeDeckSettings({enabled:false});
  const patch=cassettePatch(state,'ocean',{...getCassetteParams(state,'ocean'),enabled:true});
  assert.ok(!('enabled' in patch));
  assert.equal(normalizeDeckSettings({...state,...patch}).enabled,false);
});

