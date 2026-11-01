import * as THREE from 'three';

// The second boat occupies only a few pixels. Keep a purpose-built silhouette
// here instead of drawing the full workshop and its 600,000 triangles twice.
export function createDistantBoat(){
 const boat=new THREE.Group();
 const timber=new THREE.MeshStandardMaterial({color:'#25231b',roughness:.8});
 const palm=new THREE.MeshStandardMaterial({color:'#8d7048',roughness:.95,side:THREE.DoubleSide});
 const dark=new THREE.MeshBasicMaterial({color:'#1b2527'});
 const hullV=[],hullF=[];
 for(let i=0;i<=32;i++){
  const t=i/32,x=(t-.5)*16.4,w=1.8*Math.pow(Math.max(.001,Math.sin(t*Math.PI)),.35),rise=.65*Math.pow(Math.abs(t*2-1),5);
  for(let j=0;j<16;j++){const a=j/16*Math.PI*2;hullV.push(x,.15+.7*Math.cos(a)+rise,w*Math.sin(a));}
  if(i)for(let j=0;j<16;j++){const a=i*16+j,b=i*16+(j+1)%16;hullF.push(a,b,a-16,b,b-16,a-16);}
 }
 const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(hullV,3));hg.setIndex(hullF);hg.computeVertexNormals();boat.add(new THREE.Mesh(hg,timber));
 const cabin=new THREE.Mesh(new THREE.BoxGeometry(11.3,2.25,3.3),palm);cabin.position.set(-.25,1.9,0);boat.add(cabin);
 const rv=[],rf=[];
 for(let i=0;i<=8;i++)for(let j=0;j<=24;j++){
  const x=-6.3+i*12.6/8,a=j/24*Math.PI;
  rv.push(x,3+1.2*Math.sin(a)+.2*Math.pow(Math.abs(x)/6.3,6),1.85*Math.cos(a));
  if(i<8&&j<24){const k=i*25+j;rf.push(k,k+1,k+25,k+1,k+26,k+25);}
 }
 const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(rv,3));rg.setIndex(rf);rg.computeVertexNormals();boat.add(new THREE.Mesh(rg,palm));
 const windows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.2,1.4),dark,12),matrix=new THREE.Matrix4();
 for(let side=0;side<2;side++)for(let i=0;i<6;i++){
  matrix.makeRotationY(side?Math.PI:0);matrix.setPosition(-4.8+i*1.8,2.05,side?-1.66:1.66);windows.setMatrixAt(side*6+i,matrix);
 }
 boat.add(windows);
 return boat;
}
