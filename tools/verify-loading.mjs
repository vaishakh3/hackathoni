// Local-only verification server: make the loading state observable on demand.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 const file=resolve(root,'.'+(path==='/'?'/index.html':path));
 if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{
  if(path.endsWith('/houseboat.glb')){
   console.log('Holding the model download for 7 seconds.');
   await new Promise(resolve=>setTimeout(resolve,7000));
  }
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404).end();}
});
server.listen(4322,'127.0.0.1',()=>console.log('Loading verification: http://localhost:4322/'));
