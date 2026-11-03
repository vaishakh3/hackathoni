// Run after npm run build. Inspect canvas resets before the browser can present
// them: every visible resize must be followed by a screen draw in the same task.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=resolve('dist'),output=resolve('work/frame-continuity');
await mkdir(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary','.woff2':'font/woff2','.m4a':'audio/mp4','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{
 const path=resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
 if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const bytes=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
const report=[];
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const audit=window.__frameAudit={resets:[],unpainted:[],stress:false,contextsLost:0};
   let screenDraws=0;
   for(const method of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced','blitFramebuffer']){
    const original=WebGL2RenderingContext.prototype[method];
    WebGL2RenderingContext.prototype[method]=function(...args){
     const result=original.apply(this,args);
     if(this.canvas.id==='lake'&&this.getParameter(this.DRAW_FRAMEBUFFER_BINDING)===null)screenDraws++;
     return result;
    };
   }
   for(const property of ['width','height']){
    const descriptor=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,property);
    Object.defineProperty(HTMLCanvasElement.prototype,property,{...descriptor,set(value){
     descriptor.set.call(this,value);
     if(this.id!=='lake'||!document.querySelector('.world.landscape-ready'))return;
     const count=screenDraws,entry={property,value,time:performance.now(),chapter:document.body.dataset.stop};
     queueMicrotask(()=>{
      entry.painted=screenDraws>count;audit.resets.push(entry);
      if(!entry.painted)audit.unpainted.push(entry);
     });
    }});
   }
   const raf=window.requestAnimationFrame;
   window.requestAnimationFrame=callback=>raf.call(window,time=>{
    // Deterministically exercise adaptive quality without a special app API.
    if(audit.stress){const end=performance.now()+26;while(performance.now()<end){/* busy GPU/CPU workload */}}
    callback(time);
   });
   document.addEventListener('webglcontextlost',()=>audit.contextsLost++,true);
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/?diagnostics`);
  await page.waitForSelector('.world.ready',{timeout:60000});
  await page.waitForFunction(()=>performance.getEntriesByName('voyage-lighting-ready').length>0);
  await page.evaluate(()=>window.__frameAudit.stress=true);
  const initialDpr=await page.evaluate(()=>window.__lakeDiagnostics.dpr);
  for(const stop of [1,2,3,4,2,0]){
   await page.locator(`.route [data-go="${stop}"]`).click();
   await page.waitForFunction(stop=>document.body.dataset.stop===String(stop),stop);
   await page.waitForTimeout(900);
  }
  await page.waitForFunction(initial=>window.__lakeDiagnostics.dpr<initial,initialDpr,{timeout:30000});
  await page.evaluate(()=>window.__frameAudit.stress=false);
  for(const height of [720,760,800]){await page.setViewportSize({width:mobile?390:1440,height});await page.waitForTimeout(150);}
  await page.locator('.mast-actions .guide-open').click();
  await page.setViewportSize({width:mobile?390:1440,height:740});
  await page.waitForTimeout(200);
  await page.locator('#guide-close').click();await page.waitForTimeout(200);
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const stop of [3,4,0]){await page.locator(`.route [data-go="${stop}"]`).click();await page.waitForTimeout(150);}
  await page.setViewportSize({width:mobile?390:1440,height:820});await page.waitForTimeout(200);
  await page.screenshot({path:resolve(output,mobile?'mobile.png':'desktop.png')});
  const result=await page.evaluate(()=>({audit:window.__frameAudit,dpr:window.__lakeDiagnostics.dpr,ready:document.querySelector('#world').classList.contains('ready')}));
  report.push({mobile,initialDpr,...result,errors});
  await page.close();
 }
 await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));
 for(const result of report){
  console.log(JSON.stringify({mobile:result.mobile,initialDpr:result.initialDpr,finalDpr:result.dpr,resets:result.audit.resets.length,unpainted:result.audit.unpainted.length,errors:result.errors}));
 }
 assert.ok(report.every(r=>r.audit.resets.length>0),'Resize paths were exercised');
 assert.ok(report.every(r=>r.audit.unpainted.length===0),'Every visible canvas resize is painted before presentation');
 assert.ok(report.every(r=>r.ready&&r.audit.contextsLost===0&&r.errors.length===0),'Scene remains healthy through transitions');
}finally{await browser.close();await new Promise(r=>server.close(r));}
