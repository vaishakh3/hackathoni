const track=document.querySelector('#voyage');
const guide=document.querySelector('#field-guide');
const stops=[...document.querySelectorAll('.stop')];
const reduceQuery=matchMedia('(prefers-reduced-motion: reduce)');
let index=0,progress=0,world=null,still=reduceQuery.matches,manualRoof=null,inspection=0;
function inspect(mode){inspection=mode;document.body.dataset.inspection=String(mode);document.querySelectorAll('[data-inspect]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.inspect===mode)));document.querySelector('#inspection-title').textContent=mode===1?'Good company.':'Every idea starts somewhere.';document.querySelector('#inspection-description').textContent=mode===1?'Different ideas. A shared night.':'A blank file, a warm cup, and time to follow a thought.';world?.setInspection(mode);if(mode){manualRoof=true;document.querySelector('#hotspot-note').hidden=true;document.querySelectorAll('.hotspot').forEach(b=>b.setAttribute('aria-expanded','false'));}update();}
const labels=['THE JETTY / LATE AFTERNOON','ABOARD / THE FLOATING WORKSHOP','MIDNIGHT / ONE MORE COMMIT','FIRST LIGHT / A NEW DAY','YOUR PLACE / THE NEXT MOVE'];
function go(next){const n=Math.max(0,Math.min(4,next));track.scrollTo({left:n*track.clientWidth,behavior:still?'instant':'smooth'});}
function update(){progress=track.scrollLeft/track.clientWidth;const next=Math.max(0,Math.min(4,Math.round(progress)));
 document.querySelector('#route-progress').style.width=(progress/4*100)+'%';
 if(next!==index){index=next;manualRoof=null;inspection=0;document.body.dataset.inspection='0';world?.setInspection(0);document.querySelectorAll('[data-inspect]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.inspect===0)));document.querySelector('#hotspot-note').hidden=true;document.querySelectorAll('.hotspot').forEach(b=>b.setAttribute('aria-expanded','false'));}
 document.body.dataset.stop=String(index);
 document.querySelector('#chapter-number').textContent=String(index+1).padStart(2,'0');
 document.querySelector('#scene-label').textContent=labels[index];
 document.querySelector('#previous-stop').disabled=index===0;document.querySelector('#next-stop').disabled=index===4;
 document.querySelectorAll('.route [data-go]').forEach(button=>{if(+button.dataset.go===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
 stops.forEach((stop,i)=>{stop.inert=i!==index;});
 const roof=document.querySelector('#roof-button');const open=manualRoof??index===1;roof.setAttribute('aria-pressed',String(open));roof.innerHTML=open?'<span>Lower the roof</span><span class="arrow-circle">↙</span>':'<span>Peek inside</span><span class="arrow-circle">↗</span>';
 world?.setProgress(progress,manualRoof);
}
track.addEventListener('scroll',update,{passive:true});
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();go(+button.dataset.go);}));
document.querySelector('#previous-stop').addEventListener('click',()=>go(index-1));document.querySelector('#next-stop').addEventListener('click',()=>go(index+1));
let wheelSum=0,lastWheel=0;
track.addEventListener('wheel',event=>{if(Math.abs(event.deltaX)>Math.abs(event.deltaY))return;if(event.target.closest('.ticket'))return;event.preventDefault();const now=performance.now();if(now-lastWheel<700)return;wheelSum+=event.deltaY;if(Math.abs(wheelSum)>35){go(index+(wheelSum>0?1:-1));wheelSum=0;lastWheel=now;}},{passive:false});
window.addEventListener('keydown',event=>{if(guide.open||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,summary,select'))return;if(event.key==='ArrowRight'){event.preventDefault();go(index+1);}if(event.key==='ArrowLeft'){event.preventDefault();go(index-1);}if(event.key==='Home'){event.preventDefault();go(0);}if(event.key==='End'){event.preventDefault();go(4);}});
window.addEventListener('resize',()=>{track.scrollTo({left:index*track.clientWidth,behavior:'instant'});update();});
document.querySelectorAll('.guide-open').forEach(button=>button.addEventListener('click',()=>{guide.showModal();world?.setPaused(true);}));
function closeGuide(){guide.close();world?.setPaused(false);}
document.querySelector('#guide-close').addEventListener('click',closeGuide);document.querySelector('#guide-return').addEventListener('click',closeGuide);guide.addEventListener('close',()=>world?.setPaused(false));
guide.addEventListener('click',e=>{if(e.target!==guide)return;const r=guide.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeGuide();});
document.querySelector('#roof-button').addEventListener('click',()=>{manualRoof=!(manualRoof??true);update();});
document.querySelectorAll('[data-inspect]').forEach(button=>button.addEventListener('click',()=>inspect(+button.dataset.inspect)));
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&inspection&&!guide.open){inspect(0);document.querySelector('[data-inspect="0"]').focus({preventScroll:true});}});
const details={table:{label:'THE BUILD TABLE',title:'Your own rabbit hole.',description:'A solo format means your project is yours. The miniature shows a shared workshop; the actual workspace and facilities will be confirmed in the field guide.'},boat:{label:'THŌNI / തോണി',title:'A different current.',description:'Thoni is Malayalam for boat. Hackathoni brings the hackathon onto two houseboats on the Alappuzha backwaters. The model is an artist’s concept.'}};
document.querySelectorAll('.hotspot').forEach(button=>button.addEventListener('click',()=>{const data=details[button.dataset.hotspot];document.querySelector('#hotspot-label').textContent=data.label;document.querySelector('#hotspot-title').textContent=data.title;document.querySelector('#hotspot-description').textContent=data.description;document.querySelector('#hotspot-note').hidden=false;document.querySelector('#hotspot-note').focus({preventScroll:true});document.querySelectorAll('.hotspot').forEach(b=>b.setAttribute('aria-expanded',String(b===button)));}));
document.querySelector('#hotspot-close').addEventListener('click',()=>{document.querySelector('#hotspot-note').hidden=true;document.querySelectorAll('.hotspot').forEach(b=>b.setAttribute('aria-expanded','false'));});
function syncMotion(){document.querySelector('#motion-toggle').setAttribute('aria-pressed',String(still));document.querySelector('#motion-text').textContent=still?'LET IT DRIFT':'STILL WATER';world?.setStill(still);}
document.querySelector('#motion-toggle').addEventListener('click',()=>{still=!still;syncMotion();});reduceQuery.addEventListener('change',e=>{still=e.matches;syncMotion();});
let audio=null,audioOn=false;
document.querySelector('#sound-toggle').addEventListener('click',async()=>{try{if(!audio){const context=new AudioContext();const gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);const buffer=context.createBuffer(1,context.sampleRate*5,context.sampleRate);const data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*3.5;}const source=context.createBufferSource();source.buffer=buffer;source.loop=true;const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=380;const flow=context.createGain();flow.gain.value=.6;source.connect(filter).connect(flow).connect(gain);source.start();const lfo=context.createOscillator();lfo.frequency.value=.17;const wave=context.createGain();wave.gain.value=.15;lfo.connect(wave).connect(flow.gain);lfo.start();audio={context,gain};}audioOn=!audioOn;await audio.context.resume();audio.gain.gain.setTargetAtTime(audioOn?.1:0,audio.context.currentTime,.5);document.querySelector('#sound-toggle').setAttribute('aria-pressed',String(audioOn));document.querySelector('#sound-toggle').setAttribute('aria-label',audioOn?'Disable water ambience':'Enable water ambience');document.querySelector('#sound-text').textContent=audioOn?'SOUND ON':'SOUND OFF';}catch{document.querySelector('#sound-text').textContent='SOUND UNAVAILABLE';}});
document.addEventListener('visibilitychange',()=>{world?.setPaused(document.hidden||guide.open);if(audio&&audioOn){if(document.hidden)audio.context.suspend();else audio.context.resume();}});
track.addEventListener('pointerdown',e=>{if(e.target.closest('button,a,.ticket,.chapter-copy,.hotspot-note'))return;world?.ripple(e.clientX,e.clientY);});
update();syncMotion();
function activateStillView(){
 inspect(0);world=null;document.body.classList.add('scene-unavailable');document.body.style.setProperty('--daylight','0');document.body.style.setProperty('--daylight-percent','0%');
 document.querySelector('#world').classList.remove('ready');
 const note=document.querySelector('#loading-note');note.textContent='THE QUIET VOYAGE · STILL IMAGE VIEW';note.classList.remove('loaded');note.removeAttribute('aria-hidden');
 document.querySelector('#roof-button').hidden=true;document.querySelector('.workshop-views').hidden=true;document.querySelector('#boat-hotspots').hidden=true;
}
window.addEventListener('lake-unavailable',activateStillView);
if(new URLSearchParams(location.search).get('view')==='still')activateStillView();
else import('./lake.js').then(async({createLake})=>{
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
