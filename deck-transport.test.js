import test from 'node:test';
import assert from 'node:assert/strict';
import { deckPointInRect, deckDragDistance, deckInsertionPlan } from './deck-transport.js';

test('drop target uses current viewport coordinates and inclusive edges', () => {
  const rect = { left: 100, top: 50, width: 200, height: 80 };
  for (const [x,y] of [[100,50],[300,130],[210,80]]) assert.equal(deckPointInRect(x,y,rect),true);
  for (const [x,y] of [[99,50],[301,130],[210,49],[210,131]]) assert.equal(deckPointInRect(x,y,rect),false);
});
test('invalid or collapsed targets reject without accidental insertion', () => {
  for (const rect of [null,{}, {left:0,top:0,width:0,height:10},{left:0,top:NaN,width:10,height:10}])
    assert.equal(deckPointInRect(1,1,rect),false);
  assert.equal(deckPointInRect(Infinity,1,{left:0,top:0,width:10,height:10}),false);
});
test('gesture distance distinguishes clicks from real drags in CSS pixels', () => {
  assert.equal(deckDragDistance({x:10,y:10},{x:13,y:14}),5);
  assert.equal(deckDragDistance({x:10,y:10},{x:16,y:10}),6);
  assert.equal(deckDragDistance(null,{x:0,y:0}),0);
  assert.equal(deckDragDistance({x:NaN,y:0},{x:0,y:0}),0);
});
test('insertion travel aligns measured cassette and slot centers', () => {
  const plan=deckInsertionPlan({left:10,top:200,width:200,height:120},{left:60,top:20,width:100,height:30});
  assert.deepEqual(plan,{dx:0,dy:-225,scale:.5,duration:650});
});
test('reduced motion removes travel time and invalid measurements never animate', () => {
  const rect={left:0,top:0,width:100,height:20};
  assert.equal(deckInsertionPlan(rect,rect,true).duration,0);
  assert.deepEqual(deckInsertionPlan(null,rect),{dx:0,dy:0,scale:1,duration:0});
  assert.equal(deckInsertionPlan(rect,{...rect,width:10000}).scale,1.4);
});
