import {initBackwaterAudio} from './backwater-audio.js';
const track=document.querySelector('#voyage');
const guide=document.querySelector('#field-guide');
const stops=[...document.querySelectorAll('.stop')];
const reduceQuery=matchMedia('(prefers-reduced-motion: reduce)');
let index=0,progress=0,world=null,still=reduceQuery.matches,manualRoof=null,inspection=0;
function inspect(mode){inspection=mode;document.body.dataset.inspection=String(mode);document.querySelectorAll('[data-inspect]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.inspect===mode)));document.querySelector('#inspection-title').textContent=mode===1?'Good company.':'Every idea starts somewhere.';document.querySelector('#inspection-description').textContent=mode===1?'Different ideas. A shared night.':'A blank file, a warm cup, and time to follow a thought.';world?.setInspection(mode);if(mode){manualRoof=true;}update();}
const labels=['THE JETTY / LATE AFTERNOON','ABOARD / THE FLOATING WORKSHOP','MIDNIGHT / ONE MORE COMMIT','FIRST LIGHT / A NEW DAY','YOUR PLACE / THE NEXT MOVE'];
function go(next){const n=Math.max(0,Math.min(4,next));track.scrollTo({left:n*track.clientWidth,behavior:still?'instant':'smooth'});}
const routeProgress=document.querySelector('#route-progress');
const progressbar=document.querySelector('.route-line');
const chapterNumber=document.querySelector('#chapter-number');
const sceneLabel=document.querySelector('#scene-label');
const previousButton=document.querySelector('#previous-stop'),nextButton=document.querySelector('#next-stop');
const routeButtons=[...document.querySelectorAll('.route [data-go]')];
const roofButton=document.querySelector('#roof-button');
let displayedIndex=-1,roofState=null,scrollFrame=0;
let dragPointer=null,dragX=0,dragTime=0;
function endDrag(cancelled=false){
 if(dragPointer===null)return;
 const pointer=dragPointer;dragPointer=null;world?.endBoatDrag(cancelled);document.body.classList.remove('boat-dragging');
 if(track.hasPointerCapture(pointer))track.releasePointerCapture(pointer);
}
function update(){
 progress=Math.max(0,Math.min(4,track.scrollLeft/track.clientWidth));
 const next=Math.round(progress);
 routeProgress.style.transform=`scaleX(${progress/4})`;
 progressbar.setAttribute('aria-valuenow',String(Math.round(progress/4*100)));
 if(next!==index){endDrag(true);index=next;manualRoof=null;inspection=0;document.body.dataset.inspection='0';world?.setInspection(0);document.querySelectorAll('[data-inspect]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.inspect===0)));}
 if(displayedIndex!==index){
  displayedIndex=index;document.body.dataset.stop=String(index);
  chapterNumber.textContent=String(index+1).padStart(2,'0');sceneLabel.textContent=labels[index];
  previousButton.disabled=index===0;nextButton.disabled=index===4;
  routeButtons.forEach(button=>{if(+button.dataset.go===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  stops.forEach((stop,i)=>{stop.inert=i!==index;});
 }
 const open=manualRoof??index===1;
 if(open!==roofState){roofState=open;roofButton.setAttribute('aria-pressed',String(open));document.querySelector('#roof-label').textContent=open?'Lower it':'Peek inside';roofButton.setAttribute('aria-label',open?'Lower the canopy':'Lift the canopy');}
 world?.setProgress(progress,manualRoof);
}
track.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;update();});},{passive:true});
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();go(+button.dataset.go);}));
document.querySelector('#boarding-reveal').addEventListener('click',()=>{const section=document.querySelector('#boarding');section.scrollTo({top:section.scrollHeight,behavior:still?'instant':'smooth'});});
document.querySelector('#previous-stop').addEventListener('click',()=>go(index-1));document.querySelector('#next-stop').addEventListener('click',()=>go(index+1));
let wheelSum=0,lastWheel=0;
track.addEventListener('wheel',event=>{if(Math.abs(event.deltaX)>Math.abs(event.deltaY))return;if(event.target.closest('.ticket')||(innerWidth<=760&&event.target.closest('.boarding')))return;event.preventDefault();const now=performance.now();if(now-lastWheel<700)return;wheelSum+=event.deltaY;if(Math.abs(wheelSum)>35){go(index+(wheelSum>0?1:-1));wheelSum=0;lastWheel=now;}},{passive:false});
window.addEventListener('keydown',event=>{if(guide.open||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,summary,select'))return;if(event.key==='ArrowRight'){event.preventDefault();go(index+1);}if(event.key==='ArrowLeft'){event.preventDefault();go(index-1);}if(event.key==='Home'){event.preventDefault();go(0);}if(event.key==='End'){event.preventDefault();go(4);}});
window.addEventListener('resize',()=>{track.scrollTo({left:index*track.clientWidth,behavior:'instant'});update();});
document.querySelectorAll('.guide-open').forEach(button=>button.addEventListener('click',()=>{guide.showModal();world?.setPaused(true);}));
function closeGuide(){guide.close();world?.setPaused(false);}
document.querySelector('#guide-close').addEventListener('click',closeGuide);document.querySelector('#guide-return').addEventListener('click',closeGuide);guide.addEventListener('close',()=>world?.setPaused(false));
guide.addEventListener('click',e=>{if(e.target!==guide)return;const r=guide.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeGuide();});
document.querySelector('#roof-button').addEventListener('click',()=>{manualRoof=!(manualRoof??true);update();});
document.querySelectorAll('[data-inspect]').forEach(button=>button.addEventListener('click',()=>inspect(+button.dataset.inspect)));
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&inspection&&!guide.open){inspect(0);document.querySelector('[data-inspect="0"]').focus({preventScroll:true});}});
reduceQuery.addEventListener('change',e=>{still=e.matches;world?.setStill(still);});
initBackwaterAudio();
document.addEventListener('visibilitychange',()=>world?.setPaused(document.hidden||guide.open));
track.addEventListener('pointerdown',e=>{
 if(e.target.closest('button,a,.ticket,.chapter-copy')||e.button!==0)return;
 if(e.pointerType==='mouse'&&index===0&&world?.beginBoatDrag(e.clientX,e.clientY)){
  e.preventDefault();dragPointer=e.pointerId;dragX=e.clientX;dragTime=performance.now();track.setPointerCapture(e.pointerId);document.body.classList.add('boat-dragging');
 }else world?.ripple(e.clientX,e.clientY);
});
track.addEventListener('pointermove',e=>{
 if(e.pointerId!==dragPointer)return;
 const now=performance.now();world?.dragBoat(e.clientX-dragX,now-dragTime);dragX=e.clientX;dragTime=now;e.preventDefault();
});
track.addEventListener('pointerup',e=>{if(e.pointerId===dragPointer)endDrag(performance.now()-dragTime>100);});
track.addEventListener('pointercancel',()=>endDrag(true));
track.addEventListener('lostpointercapture',()=>endDrag(true));
window.addEventListener('blur',()=>endDrag(true));
update();
function activateStillView(){
 inspect(0);world=null;document.body.classList.add('scene-unavailable');document.body.dataset.daylight='false';document.body.style.setProperty('--daylight','0');document.body.style.setProperty('--daylight-percent','0%');
 const scene=document.querySelector('#world');
 scene.classList.remove('ready');
 // The still image is an error fallback, never part of normal scene startup.
 if(!scene.querySelector('.world-fallback'))scene.append(document.querySelector('#still-scene').content.cloneNode(true));
 const note=document.querySelector('#loading-note');note.classList.add('loaded');note.setAttribute('aria-hidden','true');
 document.querySelector('#roof-button').hidden=true;document.querySelector('.workshop-views').hidden=true;
}
window.addEventListener('lake-unavailable',activateStillView);
if(new URLSearchParams(location.search).get('view')==='still')activateStillView();
else {
 // Start loading the live scene immediately; reveal it after its first draw.
 import('./lake.js').then(async({createLake})=>{
 const lake=await createLake();world=lake;
 lake.setProgress(progress,manualRoof);lake.setInspection(inspection);lake.setStill(still);lake.setPaused(guide.open||document.hidden);
 await lake.ready;
 // A context failure may have activated the fallback while the frame was pending.
 if(world!==lake)return;
 document.querySelector('#world').classList.add('ready');
 document.querySelector('#loading-note').classList.add('loaded');
 document.querySelector('#loading-note').setAttribute('aria-hidden','true');
 document.querySelector('.workshop-views').hidden=false;
}).catch(error=>{console.warn('The still-image voyage is active.',error);activateStillView();});
}
