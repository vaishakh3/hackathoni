import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Water} from 'three/addons/objects/Water.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {createEnvironment} from './cinematic-environment.js';
import {createDistantBoat} from './distant-boat.js';
import {createAboardMotion, ease} from './aboard-motion.js';
const mix=THREE.MathUtils.lerp;
const smooth=x=>x*x*(3-2*x);
export async function createLake(){
 const canvas=document.querySelector('#lake');
 performance.mark('voyage-scene-start');
 const diagnostics=new URLSearchParams(location.search).has('diagnostics')?{frames:[],renders:[],totalFrames:0,drawCalls:0,triangles:0,dpr:0}:null;
 if(diagnostics)window.__lakeDiagnostics=diagnostics;
 const mobile=()=>innerWidth<=760;
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 const maxDpr=Math.min(devicePixelRatio,1.5);
 let quality=Math.min(maxDpr,mobile()?1.5:1.25);renderer.setPixelRatio(quality);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
 // Contact shadows are baked into the model; avoid another full scene pass per frame.
 renderer.shadowMap.enabled=false;
 const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x263949,.0008);
 // Fetch the independent scene assets together instead of serializing three downloads.
 const environmentPromise=createEnvironment(scene,renderer);
 const normalsPromise=new THREE.TextureLoader().loadAsync('/assets/waternormals.jpg');
 const boatPromise=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/assets/houseboat.glb?v=friendly-crew-no-bunting-2');
 const [environment,normals,gltf]=await Promise.all([environmentPromise,normalsPromise,boatPromise]);
 scene.environmentIntensity=.55;
 const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,650);
 const hemisphere=new THREE.HemisphereLight(0xb6c9df,0x24170e,.62);scene.add(hemisphere);
 const sun=new THREE.DirectionalLight(0xffbf72,1.8);sun.position.set(-12,8,6);scene.add(sun);
 sun.castShadow=false;sun.shadow.mapSize.setScalar(mobile()?1024:2048);Object.assign(sun.shadow.camera,{left:-11,right:11,top:10,bottom:-10,near:1,far:65});sun.shadow.normalBias=.025;sun.shadow.bias=-.00025;sun.shadow.radius=3;
 const rim=new THREE.DirectionalLight(0xb2c4e1,.7);rim.position.set(4,9,14);scene.add(rim);
 const sunDirection=new THREE.Vector3(-.7,.12,-.6).normalize();
 // Three.js Water: four moving normal-map layers, a planar reflection pass,
 // and view-dependent Fresnel response, tuned to short backwater ripples.
 const ripples=Array.from({length:4},()=>new THREE.Vector4(0,0,-100,0));
 normals.wrapS=normals.wrapT=THREE.RepeatWrapping;
 normals.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const water=new Water(new THREE.PlaneGeometry(1200,1200),{
  textureWidth:mobile()?256:512,textureHeight:mobile()?256:512,
  waterNormals:normals,sunDirection:new THREE.Vector3(-.5,.1,-.9).normalize(),
  sunColor:0xffd5a6,waterColor:0x24433b,distortionScale:1.05,alpha:1,fog:true
 });
 water.rotation.x=-Math.PI/2;water.position.y=-.56;
 water.material.uniforms.size.value=18;
 water.material.uniforms.uRipples={value:ripples};
 water.material.fragmentShader=water.material.fragmentShader
  .replace('uniform float time;', 'uniform float time;\n uniform vec4 uRipples[4];')
  .replace('vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );', `
   vec3 surfaceNormal = normalize(noise.xzy * vec3(.45,1.,.45));
   // Interactions disturb only a small area rather than warping the lake.
   vec2 rippleSlope=vec2(0.);
   for(int i=0;i<4;i++){
    float age=time-uRipples[i].z;vec2 dv=worldPosition.xz-uRipples[i].xy;
    float d=length(dv)+.001;
    if(age>0.&&age<8.){
     float envelope=exp(-abs(d-age*1.45)*3.2)*exp(-age*.65);
     rippleSlope+=dv/d*cos(d*17.-age*24.)*envelope*.085;
    }
   }
   // Fine, non-periodic normals supply capillary detail; these longer waves
   // are subtle slopes, not broad painted light bands.
   surfaceNormal.xz+=rippleSlope;
   surfaceNormal=normalize(surfaceNormal);
  `)
  .replace('sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );',
   'sunLight( surfaceNormal, eyeDirection, 180.0, 1.4, 0.35, diffuseLight, specularLight );')
  .replace('vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );', `
   vec2 reflectionUV=mirrorCoord.xy/mirrorCoord.w+distortion;
   float blur=.0008+min(distance*.000025,.002);
   vec3 reflectionSample=texture2D(mirrorSampler,reflectionUV).rgb*.4;
   reflectionSample+=texture2D(mirrorSampler,reflectionUV+vec2(blur,0.)).rgb*.15;
   reflectionSample+=texture2D(mirrorSampler,reflectionUV-vec2(blur,0.)).rgb*.15;
   reflectionSample+=texture2D(mirrorSampler,reflectionUV+vec2(0.,blur)).rgb*.15;
   reflectionSample+=texture2D(mirrorSampler,reflectionUV-vec2(0.,blur)).rgb*.15;
  `);
 scene.add(water);
 const boatRoot=new THREE.Group();scene.add(boatRoot);
 const boat=gltf.scene;boatRoot.add(boat);const roof=boat.getObjectByName('roof');if(!roof)throw new Error('Missing roof node');const roofBase=roof.position.y;
 boat.traverse(o=>{if(!o.isMesh)return;o.castShadow=false;o.receiveShadow=false;const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{environment.applyToMaterial(m);if(m.map)m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});});
 const second=createDistantBoat();second.scale.setScalar(.44);second.position.set(-38,-.08,-60);second.visible=!mobile();second.rotation.y=.35;scene.add(second);
 second.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;environment.applyToMaterial(o.material);}});
 const tungsten=new Map();boat.traverse(o=>{if(o.isMesh)for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m.name==='18 / glowing tungsten')tungsten.set(m,m.emissiveIntensity);});
 const cabinLights=[];for(const x of [-3,2]){const l=new THREE.PointLight(0xffa34b,25,7,2);l.position.set(x,2.3,.1);boatRoot.add(l);cabinLights.push(l);}
 // A layered, leafy bank gives the boat a quiet, credible place to belong.

 const palettes=[{water:'#0a2528',ambient:.7,sun:3.0,night:0},{water:'#0d252b',ambient:.6,sun:1.4,night:.18},{water:'#07131e',ambient:.21,sun:.18,night:1},{water:'#487a83',ambient:1.15,sun:2.6,night:0},{water:'#487a83',ambient:1.05,sun:2.4,night:0}].map(p=>({...p,water:new THREE.Color(p.water)}));
 const desktopShots=[{p:[4.2,4.1,18.5],t:[.65,2.8,0],f:34,r:-.08},{p:[6.4,8.8,15],t:[.65,2.05,0],f:38,r:-.2},{p:[7.4,5.8,16],t:[1.1,2.9,0],f:37,r:.08},{p:[-6.5,4,18.5],t:[-.5,3.15,0],f:37,r:.15},{p:[15,7,28],t:[4,9.8,0],f:45,r:-.25}];
 const phoneShots=[{p:[16.2,10.8,30],t:[.7,4.3,0],f:51,r:-.14},{p:[17,18,31],t:[.5,4.8,0],f:52,r:-.18},{p:[13,8,27],t:[1,4.1,0],f:51,r:.05},{p:[-18,6.8,26],t:[-.85,4.1,0],f:51,r:.15},{p:[18,9.5,34],t:[.5,6.8,0],f:53,r:-.4}];
 let progress=0,manualRoof=null,inspection=0,still=matchMedia('(prefers-reduced-motion: reduce)').matches,paused=false,raf=0,last=0,time=0,roofY=roofBase,disposed=false,rippleIndex=0;
 let heroYaw=0,heroVelocity=0,boatDragging=false;
 // Loading ends only after a successful first draw, not after asset download.
 let resolveFirstFrame,rejectFirstFrame;
 const ready=new Promise((resolve,reject)=>{resolveFirstFrame=resolve;rejectFirstFrame=reject;});
 const aboardMotion=createAboardMotion();
 let visualProgress=0,dawn=0,lastTheme='',lastRoofPhase='';
 const worldElement=document.querySelector('#world'),roofButton=document.querySelector('#roof-button');
 const duskSunPosition=new THREE.Vector3(-12,8,6),daySunPosition=new THREE.Vector3(16,12,-10);
 const duskSky=new THREE.Color('#b6c9df'),daySky=new THREE.Color('#c6e3f4'),duskGround=new THREE.Color('#24170e'),dayGround=new THREE.Color('#697c55');
 const duskLight=new THREE.Color('#ffbf72'),dayLight=new THREE.Color('#fff0d5'),nightWaterSun=new THREE.Color('#87a4cc');
 const fogNight=new THREE.Color('#112030'),fogDusk=new THREE.Color('#27394c'),fogMorning=new THREE.Color('#adccd6');
 const currentCamera=new THREE.Vector3(),currentTarget=new THREE.Vector3(),targetP=new THREE.Vector3(),targetT=new THREE.Vector3();let first=true;
 let sampleCount=0,slowFrames=0,lastQualityChange=0;
 const shotP=new THREE.Vector3(),shotT=new THREE.Vector3();
 function render(now=performance.now()){
  raf=0;if(disposed||paused)return;const interval=now-last;const elapsed=Math.min(.05,interval/1000||.016);last=now;if(!still)time+=elapsed;
  if(diagnostics){diagnostics.totalFrames++;diagnostics.frames.push(interval);if(diagnostics.frames.length>240)diagnostics.frames.shift();}
  const instant=still||first;
  visualProgress=instant?progress:mix(visualProgress,progress,1-Math.exp(-elapsed*2.8));
  if(Math.abs(visualProgress-progress)<.0001)visualProgress=progress;
  const motion=aboardMotion.step(elapsed,{progress,open:manualRoof,instant:still});
  const roofPhase=motion.position===0?'closed':motion.position===1?'open':motion.lift<.15?'separating':motion.lift<.75?'lifting':motion.lift<1?'clearing':'entering';
  if(roofPhase!==lastRoofPhase){worldElement.dataset.roofPhase=roofPhase;roofButton.setAttribute('aria-busy',String(roofPhase!=='closed'&&roofPhase!=='open'));lastRoofPhase=roofPhase;}
  const i=Math.min(3,Math.floor(visualProgress)),f=smooth(THREE.MathUtils.clamp(visualProgress-i,0,1));
  const A=palettes[i],B=palettes[i+1];
  const shots=mobile()?phoneShots:desktopShots;
  // Chapter one's shot only travels inward after the lifting canopy is clear.
  const aboardShot={
   p:shots[0].p.map((v,j)=>mix(v,shots[1].p[j],motion.camera)),
   t:shots[0].t.map((v,j)=>mix(v,shots[1].t[j],motion.camera)),
   f:mix(shots[0].f,shots[1].f,motion.camera),r:mix(shots[0].r,shots[1].r,motion.camera)
  };
  const a=i===1?aboardShot:shots[i],b=i+1===1?aboardShot:shots[i+1];
  targetP.fromArray(a.p).lerp(shotP.fromArray(b.p),f);targetT.fromArray(a.t).lerp(shotT.fromArray(b.t),f);
  let targetFov=mix(a.f,b.f,f);
  const inspecting=inspection&&Math.abs(progress-1)<.35 ? motion.camera : 0;
  if(inspecting){
   const close=inspection===1?(mobile()?{p:[10,9,18],t:[0,3.0,0],f:51}:{p:[5.8,6.2,10.8],t:[.25,3.0,-.3],f:44}):(mobile()?{p:[7.2,8.0,12.8],t:[.35,2.8,-.1],f:51}:{p:[3.2,5.4,7.8],t:[.35,2.7,0],f:46});
   targetP.lerp(shotP.fromArray(close.p),inspecting);targetT.lerp(shotT.fromArray(close.t),inspecting);targetFov=mix(targetFov,close.f,inspecting);
  }
  if(!mobile()){
   targetFov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(targetFov)/2)*Math.max(mix(1.18,1,inspecting),mix(1.6,1.3,inspecting)/camera.aspect)));
   targetT.y-=(1-inspecting)*THREE.MathUtils.clamp((camera.aspect-1.35)/.25,0,1)*.25;
  }
  const k=still||first?1:1-Math.exp(-elapsed*7);currentCamera.lerp(targetP,k);currentTarget.lerp(targetT,k);camera.position.copy(currentCamera);camera.lookAt(currentTarget);camera.fov=mix(camera.fov,targetFov,k);camera.updateProjectionMatrix();
  // Drag turns the miniature on the water. A released flick loses momentum
  // naturally, and its rotation fades out before the next chapter's camera.
  if(progress>.12){boatDragging=false;heroVelocity=0;}
  if(!boatDragging&&Math.abs(heroVelocity)>.002){
   if(still)heroVelocity=0;
   else {heroYaw+=heroVelocity*elapsed;heroVelocity*=Math.exp(-elapsed*3.4);}
  }
  const heroWeight=1-ease(visualProgress);
  boatRoot.position.set(0,still?0:Math.sin(time*.65)*.045,0);boatRoot.rotation.y=mix(a.r,b.r,f)+heroYaw*heroWeight;boatRoot.rotation.z=still?0:Math.sin(time*.43)*.007;
  // Move geometry all the way beyond the camera frustum. Never hide it mid-lift.
  roofY=roofBase+motion.lift*(mobile()?32:22);roof.position.y=roofY;roof.visible=true;
  const night=mix(A.night,B.night,f);
  const dawnTarget=ease(visualProgress-2);
  dawn=instant?dawnTarget:mix(dawn,dawnTarget,1-Math.exp(-elapsed*1.65));
  if(Math.abs(dawn-dawnTarget)<.0001)dawn=dawnTarget;
  environment.set(night,dawn);
  const theme=dawn.toFixed(3);
  if(theme!==lastTheme){document.body.dataset.daylight=String(dawn>.42);document.body.style.setProperty('--daylight',theme);document.body.style.setProperty('--daylight-percent',(dawn*100).toFixed(2)+'%');lastTheme=theme;}
  scene.fog.color.copy(fogDusk).lerp(fogNight,night).lerp(fogMorning,dawn);scene.fog.density=mix(.0008,.0015,dawn);
  water.material.uniforms.waterColor.value.copy(A.water).lerp(B.water,f);
  water.material.uniforms.time.value=time;
  water.material.uniforms.sunColor.value.copy(duskLight).lerp(nightWaterSun,night).lerp(dayLight,dawn).multiplyScalar(1-night*.7);
  water.material.uniforms.sunDirection.value.copy(sunDirection).lerp(environment.sunDirection,dawn).normalize();
  hemisphere.color.copy(duskSky).lerp(daySky,dawn);hemisphere.groundColor.copy(duskGround).lerp(dayGround,dawn);
  hemisphere.intensity=mix(A.ambient,B.ambient,f);sun.intensity=mix(A.sun,B.sun,f);sun.color.copy(duskLight).lerp(dayLight,dawn);sun.position.copy(duskSunPosition).lerp(daySunPosition,dawn);
  rim.intensity=.8-night*.32+dawn*.3;scene.environmentIntensity=.68-night*.38+dawn*.22;
  tungsten.forEach((strength,m)=>m.emissiveIntensity=strength*(1-dawn*.97));
  cabinLights.forEach(l=>l.intensity=(19+night*9)*(1-motion.lift*.88)*(1-dawn*.94));
  const renderStart=performance.now();
  try{
   renderer.render(scene,camera);
  }catch(error){paused=true;rejectFirstFrame(error);window.dispatchEvent(new Event('lake-unavailable'));return;}
  if(first){performance.mark('voyage-scene-ready');performance.measure('voyage-scene-init','voyage-scene-start','voyage-scene-ready');resolveFirstFrame();}first=false;
  if(diagnostics){diagnostics.renders.push(performance.now()-renderStart);if(diagnostics.renders.length>240)diagnostics.renders.shift();diagnostics.drawCalls=renderer.info.render.calls;diagnostics.triangles=renderer.info.render.triangles;diagnostics.dpr=quality;diagnostics.boatYaw=boatRoot.rotation.y;diagnostics.heroVelocity=heroVelocity;}
  // Reduce pixel work on sustained missed frames, never on a single loading spike.
  if(!still&&interval<250){sampleCount++;if(interval>23)slowFrames++;}
  if(sampleCount>=90){if(slowFrames>20&&quality>.85&&now-lastQualityChange>3000){quality=Math.max(.85,quality-.15);renderer.setPixelRatio(quality);lastQualityChange=now;}sampleCount=0;slowFrames=0;}

  const moving=currentCamera.distanceTo(targetP)>.005||currentTarget.distanceTo(targetT)>.005||Math.abs(motion.position-motion.target)>.001||Math.abs(visualProgress-progress)>.001||Math.abs(dawn-dawnTarget)>.001||(!boatDragging&&!still&&Math.abs(heroVelocity)>.002);
  if(!still||moving)raf=requestAnimationFrame(render);
 }
 function request(){if(!raf&&!paused&&!disposed)raf=requestAnimationFrame(render);}
 function resize(){second.visible=!mobile();renderer.setSize(innerWidth,innerHeight,false);renderer.setPixelRatio(quality);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();first=true;request();}
 // Parallel shader compilation keeps driver setup from freezing navigation.
 camera.position.fromArray((mobile()?phoneShots:desktopShots)[0].p);camera.lookAt(0,2.8,0);
 await renderer.compileAsync(scene,camera);
 window.addEventListener('resize',resize);resize();
 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),hit=new THREE.Vector3(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),.56);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;rejectFirstFrame(new Error('The lake context was lost.'));cancelAnimationFrame(raf);document.querySelector('#world').classList.remove('ready');document.querySelector('#loading-note').textContent='THE QUIET VOYAGE · STILL IMAGE VIEW';document.querySelector('#loading-note').classList.remove('loaded');document.querySelector('#loading-note').removeAttribute('aria-hidden');window.dispatchEvent(new Event('lake-unavailable'));});
 function beginBoatDrag(x,y){
  if(progress>.12||inspection||paused||disposed)return false;
  ndc.set(x/innerWidth*2-1,-y/innerHeight*2+1);ray.setFromCamera(ndc,camera);
  if(!ray.intersectObject(boat,true).length)return false;
  boatDragging=true;heroVelocity=0;return true;
 }
 function dragBoat(dx,milliseconds){
  if(!boatDragging)return;
  const turn=dx*Math.min(.012,7/innerWidth);
  heroYaw+=turn;
  heroVelocity=THREE.MathUtils.clamp(turn/Math.max(.008,milliseconds/1000),-2.5,2.5);
  request();
 }
 function endBoatDrag(cancelled=false){boatDragging=false;if(cancelled||still)heroVelocity=0;request();}
 return {ready,beginBoatDrag,dragBoat,endBoatDrag,setProgress(p,r){progress=Math.min(4,Math.max(0,p));manualRoof=r;request();},setInspection(value){inspection=value;request();},setStill(value){still=value;request();},setPaused(value){paused=value;if(paused){cancelAnimationFrame(raf);raf=0;}else{last=performance.now();request();}},ripple(x,y){if(still)return;ndc.set(x/innerWidth*2-1,-y/innerHeight*2+1);ray.setFromCamera(ndc,camera);if(ray.ray.intersectPlane(plane,hit)&&hit.distanceTo(camera.position)<120){ripples[rippleIndex++%4].set(hit.x,hit.z,time,1);request();}}};
}
