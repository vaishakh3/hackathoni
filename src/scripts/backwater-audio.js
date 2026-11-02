const LEVEL = .6;
const PREFERENCE = 'hackathoni-water-muted';

export function initBackwaterAudio() {
 const button = document.querySelector('#sound-toggle');
 const label = document.querySelector('#sound-text');
 const audio = document.createElement('audio');
 audio.id = 'backwater-audio';
 audio.src = '/assets/audio/backwater-lapping.m4a';
 audio.preload = 'none';
 audio.loop = true;
 audio.volume = 0;
 audio.hidden = true;
 audio.setAttribute('aria-hidden', 'true');
 document.body.append(audio);

 let enabled = true, attempt = null, fade = 0;
 try { enabled = localStorage.getItem(PREFERENCE) !== 'true'; } catch { /* Private mode may disable storage. */ }

 function show(state) {
  button.dataset.soundState = state;
  button.setAttribute('aria-pressed', String(enabled));
  button.setAttribute('aria-label', enabled ? 'Mute water ambience' : 'Enable water ambience');
  label.textContent = state === 'unavailable' ? 'SOUND UNAVAILABLE' : !enabled ? 'SOUND OFF' : state === 'pending' ? 'SOUND READY' : 'SOUND ON';
 }
 function fadeTo(level, duration, complete) {
  cancelAnimationFrame(fade);
  const from = audio.volume, start = performance.now();
  function step(now) {
   const t = Math.max(0, Math.min(1, (now - start) / duration));
   audio.volume = from + (level - from) * t;
   if (t < 1) fade = requestAnimationFrame(step);
   else { fade = 0; complete?.(); }
  }
  fade = requestAnimationFrame(step);
 }
 function start() {
  if (!enabled || document.hidden) return;
  if (attempt) return attempt;
  // Native playback follows the browser's autoplay permission. If blocked,
  // the first ordinary pointer/keyboard gesture retries without a prompt.
  cancelAnimationFrame(fade);
  if (!audio.paused) { fadeTo(LEVEL, 650); show('playing'); return; }
  attempt = audio.play().then(() => {
   if (!enabled || document.hidden) { audio.pause(); audio.volume = 0; return; }
   show('playing'); fadeTo(LEVEL, 900);
  }).catch(error => {
   if (!enabled) show('muted');
   else if (error.name === 'NotAllowedError' || error.name === 'AbortError') show('pending');
   else show('unavailable');
  }).finally(() => { attempt = null; });
  return attempt;
 }
 button.addEventListener('click', () => {
  enabled = !enabled;
  try { if (enabled) localStorage.removeItem(PREFERENCE); else localStorage.setItem(PREFERENCE, 'true'); } catch { /* Preference remains effective for this visit. */ }
  if (enabled) { show('pending'); start(); }
  else { show('muted'); fadeTo(0, 200, () => { if (!enabled) audio.pause(); }); }
 });
 function unlock(event) {
  if (event.target.closest?.('#sound-toggle')) return;
  if (event.type === 'keydown' && (event.ctrlKey || event.altKey || event.metaKey)) return;
  if (enabled && audio.paused) start();
 }
 document.addEventListener('pointerdown', unlock, {capture: true, passive: true});
 document.addEventListener('keydown', unlock, {capture: true});
 document.addEventListener('touchend', unlock, {capture: true, passive: true});
 document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(fade); audio.pause(); audio.volume = 0; show(enabled ? 'paused' : 'muted'); }
  else start();
 });
 show(enabled ? 'pending' : 'muted');
 if (enabled) start();
}
