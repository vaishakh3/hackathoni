import * as THREE from 'three';

// Original pinnate coconut fronds: each leaflet has its own curved silhouette.
export function createShore(scene){
 let seed=41;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const positions=[],colors=[],indices=[];
 function leaf(vertices,tint){const n=positions.length/3;for(const p of vertices){positions.push(...p);colors.push(tint*.41,tint*.51,tint*.28);}indices.push(n,n+1,n+2,n,n+2,n+3);}
 for(let k=0;k<11;k++){
  const angle=k*Math.PI*2/11;const dx=Math.cos(angle),dz=Math.sin(angle),sx=-dz,sz=dx;const length=3.5+rand()*1.5;const lift=.8+rand()*1.2;
  const point=t=>new THREE.Vector3(dx*length*t,lift*Math.sin(t*Math.PI)-1.7*t*t,dz*length*t);
  for(let j=1;j<24;j++){
   const t=j/25,p=point(t),span=.65*Math.pow(Math.sin(t*Math.PI),.7)*(1-t*.25);
   for(const side of [-1,1]){
    const tip=p.clone().add(new THREE.Vector3(sx*side*span+dx*.39,-.20-span*.3,sz*side*span+dz*.39));
    const mid=p.clone().lerp(tip,.53);mid.y+=.08;const w=.024+Math.sin(t*Math.PI)*.018;
    leaf([p.toArray(),mid.clone().add(new THREE.Vector3(dx*w,0,dz*w)).toArray(),tip.toArray(),mid.clone().add(new THREE.Vector3(-dx*w,0,-dz*w)).toArray()],.7+rand()*.45);
   }
  }
  for(let j=0;j<23;j++){
   const a=point(j/24),b=point((j+1)/24),w=.018*(1-j/27);
   leaf([a.clone().add(new THREE.Vector3(sx*w,0,sz*w)).toArray(),b.clone().add(new THREE.Vector3(sx*w,0,sz*w)).toArray(),b.clone().add(new THREE.Vector3(-sx*w,0,-sz*w)).toArray(),a.clone().add(new THREE.Vector3(-sx*w,0,-sz*w)).toArray()],.6);
  }
 }
 const fronds=new THREE.BufferGeometry();fronds.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));fronds.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));fronds.setIndex(indices);fronds.computeVertexNormals();
 const leafMaterial=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,color:0x97a66b});
 const barkMaterial=new THREE.MeshLambertMaterial({color:0x615746});
 for(let i=0;i<44;i++){
  const x=-135+i*6.5+(rand()-.5)*4,z=-86-rand()*25,h=6.5+rand()*6.5,bend=(rand()-.5)*4;
  const path=new THREE.CatmullRomCurve3([new THREE.Vector3(x,-.6,z),new THREE.Vector3(x+bend*.28,h*.45,z+.3),new THREE.Vector3(x+bend,h,z+.7)]);
  const trunk=new THREE.Mesh(new THREE.TubeGeometry(path,14,.16+rand()*.07,7,false),barkMaterial);scene.add(trunk);
  const crown=new THREE.Mesh(fronds,leafMaterial);crown.position.set(x+bend,h,z+.7);crown.rotation.y=rand()*6.28;crown.rotation.z=(rand()-.5)*.15;crown.scale.setScalar(.75+rand()*.4);scene.add(crown);
 }
 // A canopy is many small leaf silhouettes, not large spherical clumps.
 const foliageMaterial=new THREE.MeshLambertMaterial({color:0xa1ac87,side:THREE.DoubleSide});
 const leafShape=new THREE.BufferGeometry();leafShape.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.45,-.15,.055,0,0,0,.45,.15,.055,0,0,.085,0],3));leafShape.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);leafShape.computeVertexNormals();
 const count=32000,foliage=new THREE.InstancedMesh(leafShape,foliageMaterial,count),dummy=new THREE.Object3D(),color=new THREE.Color();
 const clusters=Array.from({length:220},()=>({x:-165+rand()*330,y:1.5+rand()*3.6,z:-83-rand()*24,sx:1.4+rand()*2.8,sy:1.1+rand()*2.1,sz:1.3+rand()*3}));
 for(let i=0;i<count;i++){
  const c=clusters[i%clusters.length],a=rand()*Math.PI*2,u=rand()*2-1,r=Math.pow(rand(),.34),q=Math.sqrt(1-u*u);
  dummy.position.set(c.x+c.sx*r*q*Math.cos(a),c.y+c.sy*r*u,c.z+c.sz*r*q*Math.sin(a));dummy.scale.setScalar(.45+rand()*.8);dummy.rotation.set(rand()*3,rand()*6,rand()*3);dummy.updateMatrix();foliage.setMatrixAt(i,dummy.matrix);color.setHSL(.22+rand()*.07,.17+rand()*.15,.09+rand()*.12);foliage.setColorAt(i,color);
 }
 scene.add(foliage);
 const bankPositions=[],bankIndices=[];
 for(let i=0;i<=100;i++){const x=-180+i*3.6,z=-79+Math.sin(i*.18)*2+Math.sin(i*.72)*.4;bankPositions.push(x,-.64,z,x,.7,z-8,x,1.2,z-42);if(i<100){const n=i*3;bankIndices.push(n,n+1,n+3,n+1,n+4,n+3,n+1,n+2,n+4,n+2,n+5,n+4);}}
 const bank=new THREE.BufferGeometry();bank.setAttribute('position',new THREE.Float32BufferAttribute(bankPositions,3));bank.setIndex(bankIndices);bank.computeVertexNormals();scene.add(new THREE.Mesh(bank,new THREE.MeshLambertMaterial({color:0x293729,side:THREE.DoubleSide})));
 return {setNight(n){leafMaterial.color.setHex(0x97a66b).multiplyScalar(1-n*.48);foliageMaterial.color.setHex(0xa1ac87).multiplyScalar(1-n*.48);barkMaterial.color.setHex(0x615746).multiplyScalar(1-n*.35);}};
}
