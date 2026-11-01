import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAboardMotion} from '../src/scripts/aboard-motion.js';

function advance(motion,seconds,options={},fps=60){
 let frame;for(let i=0;i<seconds*fps;i++)frame=motion.step(1/fps,{progress:1,...options});return frame;
}
test('the roof clears before the inward camera move and remains open',()=>{
 const motion=createAboardMotion();let previous=0;
 for(let i=0;i<300;i++){
  const frame=motion.step(1/60,{progress:1});
  assert.ok(frame.position>=previous);previous=frame.position;
  if(frame.lift<.65)assert.equal(frame.camera,0);
  if(frame.camera>.25)assert.ok(frame.lift>.99);
 }
 assert.deepEqual(advance(motion,1),{position:1,lift:1,camera:1,target:1});
});
test('manual reversal is continuous and eventually seats the roof',()=>{
 const motion=createAboardMotion();const before=advance(motion,2.2);
 const after=motion.step(1/60,{progress:1,open:false});
 assert.ok(Math.abs(after.lift-before.lift)<.02);
 assert.deepEqual(advance(motion,5,{open:false}),{position:0,lift:0,camera:0,target:0});
});
test('jumping past Aboard does not lift the roof',()=>{
 const motion=createAboardMotion();let frame;
 for(let i=0;i<60;i++)frame=motion.step(1/60,{progress:i/60*4});
 assert.equal(frame.position,0);
});
test('leaving during lift and returning replays without a snap',()=>{
 const motion=createAboardMotion();advance(motion,2);
 assert.equal(advance(motion,5,{progress:2}).position,0);
 assert.equal(advance(motion,5).position,1);
});
test('30 and 60 fps keep the choreography in step',()=>{
 const a=advance(createAboardMotion(),2.5,{},30),b=advance(createAboardMotion(),2.5,{},60);
 assert.ok(Math.abs(a.position-b.position)<.012);assert.ok(Math.abs(a.camera-b.camera)<.025);
});
test('reduced motion immediately reaches the requested composition',()=>{
 const motion=createAboardMotion();
 assert.deepEqual(motion.step(.016,{progress:1,instant:true}),{position:1,lift:1,camera:1,target:1});
 assert.deepEqual(motion.step(.016,{progress:1,open:false,instant:true}),{position:0,lift:0,camera:0,target:0});
});
