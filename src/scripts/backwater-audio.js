const PREFERENCE = 'hackathoni-water-muted';
const BED_LEVEL = .16;

// One quiet bed and at most two short ripples. Web Audio gain works on iOS,
// where changing HTMLMediaElement.volume does not reliably control loudness.
export function initBackwaterAudio() {
 const button=document.querySelector('#sound-toggle'),label=document.querySelector('#sound-text');
 let enabled=true,context,master,bed,bedBuffer,splashBuffer,loading;
 let unlocked=false,lastSplash=-Infinity;
 const voices=new Set();
 try{enabled=localStorage.getItem(PREFERENCE)!=='true';}catch{}
 const diagnostics=new URLSearchParams(location.search).has('diagnostics')?{effects:0,active:0,bedGain:BED_LEVEL,state:'pending'}:null;
 if(diagnostics)window.__waterAudioDiagnostics=diagnostics;
 function show(state){
  button.dataset.soundState=state;button.setAttribute('aria-pressed',String(enabled));
  button.setAttribute('aria-label',enabled?'Mute water sounds':'Enable water sounds');
  label.textContent=state==='unavailable'?'SOUND UNAVAILABLE':!enabled?'SOUND OFF':state==='pending'?'SOUND READY':'SOUND ON';
  if(diagnostics)diagnostics.state=state;
 }
 function gain(value,duration=.15){
  if(!master)return;
  const now=context.currentTime;master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value,now);master.gain.linearRampToValueAtTime(value,now+duration);
 }
 async function decode(url){
  const response=await fetch(url);if(!response.ok)throw new Error('Water sound unavailable');
  return context.decodeAudioData(await response.arrayBuffer());
 }
 async function start(){
  if(!enabled||!unlocked||document.hidden)return;
  try{
   if(!context){
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext){show('unavailable');return;}
    context=new AudioContext();master=context.createGain();master.gain.value=0;master.connect(context.destination);
   }
   // Resume synchronously from the gesture, before awaiting any downloads.
   const resumed=context.resume();
   if(!loading)loading=Promise.all([decode('/assets/audio/water-bed.m4a'),decode('/assets/audio/water-touch.m4a')]).then(([a,b])=>{bedBuffer=a;splashBuffer=b;}).catch(error=>{loading=null;throw error;});
   await Promise.all([resumed,loading]);
   if(!enabled||document.hidden){gain(0,0);return;}
   if(!bed){
    bed=context.createBufferSource();bed.buffer=bedBuffer;bed.loop=true;
    const quiet=context.createGain();quiet.gain.value=BED_LEVEL;
    const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;
    bed.connect(filter).connect(quiet).connect(master);bed.start();
   }
   gain(1,1.2);show(context.state==='running'?'playing':'pending');
  }catch{show('unavailable');}
 }
 function splash(kind='tap',intensity=1){
  if(!enabled||document.hidden||context?.state!=='running'||!splashBuffer)return;
  const now=context.currentTime,cooldown=kind==='turn'?.32:.45;
  if(now-lastSplash<cooldown||voices.size>=2)return;
  lastSplash=now;
  const source=context.createBufferSource(),envelope=context.createGain();
  source.buffer=splashBuffer;source.playbackRate.value=kind==='navigate'?.85:kind==='turn'?1.06:1.2;
  const volume=(kind==='navigate'?.32:kind==='turn'?.23:.2)*Math.max(.35,Math.min(1,intensity));
  const length=Math.min(.85,splashBuffer.duration/source.playbackRate.value);
  envelope.gain.setValueAtTime(0,now);envelope.gain.linearRampToValueAtTime(volume,now+.045);
  envelope.gain.exponentialRampToValueAtTime(.0001,now+length);
  source.connect(envelope).connect(master);voices.add(source);
  if(diagnostics){diagnostics.effects++;diagnostics.active=voices.size;}
  source.onended=()=>{voices.delete(source);source.disconnect();envelope.disconnect();if(diagnostics)diagnostics.active=voices.size;};
  source.start();source.stop(now+length);
 }
 button.addEventListener('click',()=>{
  enabled=!enabled;unlocked=true;
  try{if(enabled)localStorage.removeItem(PREFERENCE);else localStorage.setItem(PREFERENCE,'true');}catch{}
  if(enabled)start();else{gain(0);for(const voice of voices)voice.stop();show('muted');setTimeout(()=>{if(!enabled)context?.suspend();},180);}
 });
 function unlock(event){
  if(event.target.closest?.('#sound-toggle')||event.ctrlKey||event.altKey||event.metaKey)return;
  unlocked=true;
  if(enabled&&context?.state!=='running')start();
 }
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
 document.addEventListener('touchend',unlock,{capture:true,passive:true});
 document.addEventListener('keydown',unlock,{capture:true});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){gain(0,0);context?.suspend();show(enabled?'paused':'muted');}
  else if(enabled)start();
 });
 show(enabled?'pending':'muted');
 return {splash};
}
