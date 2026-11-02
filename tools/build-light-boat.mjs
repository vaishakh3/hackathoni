// Re-encode the web master without simplifying the geometry. Run after the model export.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune,draco,textureCompress,dequantize} from '@gltf-transform/functions';
import {MeshoptDecoder} from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import {stat,mkdir,copyFile,writeFile} from 'node:fs/promises';
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'draco3d.encoder':await draco3d.createEncoderModule()});
const doc=await io.read('public/assets/houseboat.glb');
// Remove the old compression extension; Draco preserves the existing triangles.
for(const ext of doc.getRoot().listExtensionsUsed())if(ext.extensionName==='EXT_meshopt_compression')ext.dispose();
await doc.transform(dequantize(),textureCompress({encoder:sharp,targetFormat:'webp',quality:78,resize:[512,512]}),prune({keepLeaves:true}),draco({method:'edgebreaker',encodeSpeed:0,decodeSpeed:5,quantizePosition:12,quantizeNormal:8,quantizeColor:8,quantizeTexcoord:12}));
await io.write('public/assets/houseboat-light.glb',doc);
await mkdir('public/assets/draco',{recursive:true});
for(const file of ['draco_decoder.wasm','draco_wasm_wrapper.js'])await copyFile('node_modules/three/examples/jsm/libs/draco/gltf/'+file,'public/assets/draco/'+file);
await sharp('public/assets/waternormals.jpg').resize(512,512).jpeg({quality:78}).toFile('public/assets/water-normal-small.jpg');
const stats={bytes:(await stat('public/assets/houseboat-light.glb')).size,triangles:doc.getRoot().listMeshes().reduce((s,m)=>s+m.listPrimitives().reduce((s,p)=>s+p.getIndices().getCount()/3,0),0),meshes:doc.getRoot().listMeshes().length,materials:doc.getRoot().listMaterials().length,textures:doc.getRoot().listTextures().length,roofChildren:doc.getRoot().listNodes().find(n=>n.getName()==='roof').listChildren().length,compression:'Draco',masterBytes:(await stat('public/assets/houseboat.glb')).size};
await writeFile('model-stats.json',JSON.stringify(stats,null,2)+'\n');console.log(stats);
