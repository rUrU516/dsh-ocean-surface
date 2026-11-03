import test from 'node:test';
import assert from 'node:assert/strict';
import { createEffectRuntime, effectSize } from './effect-runtime.js';
import { getCassette } from './cassette-catalog.js';

test('backing resolution bounded while CSS coordinates stay intact',()=>{
  assert.deepEqual(effectSize(2200,1100,3),{width:2200,height:1100,pixelWidth:3200,pixelHeight:1600,scaleX:3200/2200,scaleY:1600/1100});
  assert.equal(effectSize(200,100,3).pixelWidth,400);
  assert.equal(effectSize(1440,900,2).pixelWidth,2880);
  assert.equal(effectSize(900,600,2,1600).pixelWidth,1600);
  assert.equal(effectSize(1200,800,2,600).pixelWidth,600);
  assert.equal(effectSize(4000,2000,2,10000).pixelWidth,3200);
});
test('invalid or zero dimensions do not allocate, thin dimensions stay valid',()=>{
  for(const [w,h]of [[0,400],[-20,10],[NaN,50],[50,Infinity]])assert.equal(effectSize(w,h).pixelWidth,0);
  assert.equal(effectSize(.001,4000,NaN).pixelWidth,1);
  for(const w of [1,20.3,733.5,1100,10000])for(const h of [1,127.3,960,13000])assert.ok(Math.max(effectSize(w,h,4).pixelWidth,effectSize(w,h,4).pixelHeight)<=3200);
});
test('runtime lazy before sizing and accepts descriptor without browser resources',()=>{
  const errors=[];
  for(const cassette of ['dot-field',getCassette('dot-field')]){
    const runtime=createEffectRuntime({cassette,onError:e=>errors.push(e)});
    assert.equal(runtime.frame(.016,0),false);runtime.resize(0,0);
    runtime.update({params:{strength:.8},dark:true,reducedMotion:true});runtime.pointer({x:.5,y:.5,type:'down'});
    assert.equal(runtime.frame(.016,1),false);runtime.dispose();runtime.dispose();
  }
  assert.deepEqual(errors,[]);
});
test('missing resource reports once even with synchronous disposal in reporter',()=>{
  let errors=0,runtime;
  runtime=createEffectRuntime({cassette:'dot-field',onError(error){errors++;assert.ok(error instanceof Error);runtime.dispose();}});
  runtime.resize(800,600);runtime.resize(800,600);runtime.update({dark:true});runtime.pointer({type:'leave'});
  assert.equal(runtime.frame(.016,1),false);runtime.dispose();assert.equal(errors,1);
});
test('throwing error reporter cannot break cleanup',()=>{
  let reports=0;const runtime=createEffectRuntime({onError(){reports++;throw new Error('reporter failure');}});
  assert.doesNotThrow(()=>runtime.resize(800,600));assert.equal(runtime.frame(.1,1),false);
  assert.doesNotThrow(()=>runtime.dispose());assert.equal(reports,1);
});
test('dispose before initialization makes all API calls no-ops',()=>{
  const runtime=createEffectRuntime({onError(){assert.fail('disposed runtime cannot allocate');}});runtime.dispose();
  for(let i=0;i<3;i++){runtime.resize(900,600,2);runtime.update({params:{strength:1}});runtime.pointer({x:.5,y:.5,type:'move'});assert.equal(runtime.frame(.08,i),false);runtime.dispose();}
});
