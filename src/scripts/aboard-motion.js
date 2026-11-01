const clamp = x => Math.max(0, Math.min(1, x));
export const ease = x => { x=clamp(x); return x*x*x*(x*(x*6-15)+10); };

// Reversible choreography: clear the canopy before entering the workshop.
export function createAboardMotion() {
 let position=0, velocity=0, settled=0;
 return {
  step(dt, {progress, open=null, instant=false}) {
   const aboard=Math.abs(progress-1)<.12;
   settled=aboard?settled+dt:0;
   const target=aboard && open!==false && (instant || settled>.12) ? 1 : 0;
   if(instant) { position=target; velocity=0; }
   else {
    const desired=target ? 1/4 : -1/3.5;
    velocity+=(desired-velocity)*(1-Math.exp(-dt*7));
    position=clamp(position+velocity*dt);
    if(position===target) velocity=0;
   }
   return {position, lift:ease(position/.62), camera:ease((position-.36)/.64), target};
  }
 };
}
