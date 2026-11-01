import * as THREE from 'three';

// The same shore at two times of day, reflected by the real-time water.
// Capture lighting once; blend radiance in materials without a probe swap.
export async function createEnvironment(scene,renderer){
 const loader=new THREE.TextureLoader();
 const [panorama,morning]=await Promise.all([
  loader.loadAsync('/assets/shore-sunset.webp'),loader.loadAsync('/assets/shore-morning.webp')
 ]);
 for(const map of [panorama,morning]){map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
 const uniforms={uMap:{value:panorama},uMorning:{value:morning},uNight:{value:0},uDawn:{value:0}};
 const mat=new THREE.ShaderMaterial({side:THREE.DoubleSide,depthWrite:true,uniforms,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec2 vUv;uniform sampler2D uMap,uMorning;uniform float uNight,uDawn;
  void main(){
   vec3 c=texture2D(uMap,vUv).rgb;
   float l=dot(c,vec3(.2126,.7152,.0722));
   vec3 night=mix(vec3(l)*vec3(.18,.28,.43),c*.18,.35);
   c=mix(c,night,uNight);
   c=mix(c,texture2D(uMorning,vUv).rgb,uDawn);
   gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`
 });
 const verts=[],uv=[],faces=[],steps=128,radius=145,height=64;
 for(let i=0;i<=steps;i++){
  const theta=-1.95+3.9*i/steps;
  // Extend the upper sky with its edge colour, avoiding a visible backdrop rim.
  for(const [y,v] of [[-.57,0],[height-.57,1],[180,1]]){verts.push(Math.sin(theta)*radius,y,-Math.cos(theta)*radius);uv.push(i/steps,v);}
  if(i<steps)for(let j=0;j<2;j++){const n=i*3+j;faces.push(n,n+3,n+1,n+3,n+4,n+1);}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(faces);geo.computeVertexNormals();
 const backdrop=new THREE.Mesh(geo,mat);backdrop.frustumCulled=false;scene.add(backdrop);
 const duskBackground=new THREE.Color('#192d48'),dayBackground=new THREE.Color('#8bc4eb');scene.background=duskBackground.clone();
 const captureScene=new THREE.Scene();captureScene.background=new THREE.Color('#32415a');captureScene.add(backdrop.clone());
 const sunbox=new THREE.Mesh(new THREE.SphereGeometry(15,16,12),new THREE.MeshBasicMaterial({color:new THREE.Color(4,1.5,.4)}));sunbox.position.set(-95,25,-95);captureScene.add(sunbox);
 const pmrem=new THREE.PMREMGenerator(renderer);
 const duskEnvironment=pmrem.fromScene(captureScene,.055,.1,400);
 uniforms.uDawn.value=1;captureScene.background.copy(dayBackground);sunbox.position.set(95,26,-100);sunbox.material.color.setRGB(3.5,2.9,1.9);
 const dayEnvironment=pmrem.fromScene(captureScene,.055,.1,400);
 uniforms.uDawn.value=0;scene.environment=duskEnvironment.texture;
 pmrem.dispose();sunbox.geometry.dispose();sunbox.material.dispose();
 const dayProbe={value:dayEnvironment.texture};
 const applied=new WeakSet();

 // Scene geometry makes the rising sun participate in planar reflection.
 const sunrise=new THREE.Group();sunrise.position.set(95,22,-100);scene.add(sunrise);
 const sunMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color(6,4.2,2.2),transparent:true,opacity:0,depthWrite:false});
 const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(1.35,32,16),sunMaterial);sunrise.add(sunDisc);
 const haloMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uStrength:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(0.,0.,0.,1.);p.xy+=position.xy;gl_Position=projectionMatrix*p;}',
  fragmentShader:'varying vec2 vUv;uniform float uStrength;void main(){float d=length(vUv-.5)*2.;float a=exp(-d*d*8.)*(1.-smoothstep(.5,1.,d));gl_FragColor=vec4(1.,.64,.28,a*.22*uStrength);}'
 });
 const halo=new THREE.Mesh(new THREE.PlaneGeometry(20,20),haloMaterial);sunrise.add(halo);
 const direction=new THREE.Vector3();
 return {
  sunDirection:direction,
  applyToMaterial(material){
   if(!material.isMeshStandardMaterial||applied.has(material))return;applied.add(material);
   const previous=material.onBeforeCompile;
   material.onBeforeCompile=(shader,renderer)=>{
    previous.call(material,shader,renderer);
    shader.uniforms.dayEnvironment=dayProbe;shader.uniforms.environmentDawn=uniforms.uDawn;
    const chunk=THREE.ShaderChunk.envmap_physical_pars_fragment.replaceAll(
     /textureLod\( envMap, ([^;]+) \)/g,
     'mix(textureLod( envMap, $1 ), textureLod( dayEnvironment, $1 ), environmentDawn)'
    );
    shader.fragmentShader=shader.fragmentShader.replace('#include <envmap_physical_pars_fragment>',
     'uniform samplerCube dayEnvironment;\nuniform float environmentDawn;\n'+chunk);
   };
   material.customProgramCacheKey=()=> 'hackathoni-daylight-v1';material.needsUpdate=true;
  },
  set(night,dawn){
   uniforms.uNight.value=night;uniforms.uDawn.value=dawn;
   scene.background.copy(duskBackground).lerp(dayBackground,dawn);
   sunrise.position.y=18+dawn*8;sunrise.visible=dawn>.001;
   sunMaterial.opacity=dawn;haloMaterial.uniforms.uStrength.value=dawn;
   direction.copy(sunrise.position).normalize();
  },
  dispose(){geo.dispose();mat.dispose();panorama.dispose();morning.dispose();duskEnvironment.dispose();dayEnvironment.dispose();sunDisc.geometry.dispose();sunMaterial.dispose();halo.geometry.dispose();haloMaterial.dispose();}
 };
}
