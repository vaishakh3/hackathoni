// Run after npm run build. Check prize/partner navigation, responsive spacing,
// focus restoration, image loading, and the original voyage position.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';

const root=resolve('dist'),output=resolve('work/partners-prizes');
await mkdir(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary','.woff2':'font/woff2','.m4a':'audio/mp4','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{
 const path=resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
 if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const bytes=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});

const results=[];
function overlap(a,b){return Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;}
try {
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
 const mobile=viewport.width<=760;
 const page=await browser.newPage({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const prizeRequests=[];page.on('request',r=>{if(r.url().includes('/assets/prizes/')&&r.url().endsWith('.webp'))prizeRequests.push(r.url());});
 await page.goto(`http://127.0.0.1:${server.address().port}/?diagnostics`);
 await page.waitForSelector('.world.ready',{timeout:60000});
 await page.waitForTimeout(300);
 assert.equal(prizeRequests.length,0,'Prize images do not load with the hero');
 const sponsor=await page.locator('.sponsor-logos').boundingBox(),route=await page.locator('.route').boundingBox(),count=await page.locator('.voyage-count').boundingBox(),arrows=await page.locator('.chapter-arrows').boundingBox();
 assert.ok(!overlap(sponsor,route)&&!overlap(sponsor,count)&&!overlap(sponsor,arrows),'Footer credits remain separate from navigation');
 await page.screenshot({path:resolve(output,`${viewport.width}-hero.png`)});
 await page.locator('.partner-credits').click();
 assert.equal(await page.locator('#field-guide').evaluate(e=>e.open),true);
 const visibleHeading=await page.locator('#guide-partners-title').boundingBox();
 const header=await page.locator('.guide-header').boundingBox();
 assert.ok(visibleHeading.y>=header.y+header.height&&visibleHeading.y<viewport.height,'Partner heading is scrolled into view');
 assert.equal(await page.locator('#guide-partners img').count(),4);
 await page.locator('#guide-partners img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));
 await page.screenshot({path:resolve(output,`${viewport.width}-partners.png`)});
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('body').getAttribute('data-stop'),'0');
 await page.locator('.route [data-go="3"]').click();
 await page.waitForFunction(()=>document.body.dataset.stop==='3');await page.waitForTimeout(200);
 const prizeLink=await page.locator('.morning-note').boundingBox(),cta=await page.locator('.morning .stage-cta').boundingBox(),footer=await page.locator('.voyage-footer').boundingBox();
 assert.ok(!overlap(prizeLink,cta)&&!overlap(prizeLink,footer),'Prize link clears boarding CTA and footer');
 await page.screenshot({path:resolve(output,`${viewport.width}-morning.png`)});
 await page.locator('.prize-discovery').click();
 await page.locator('.prize-art img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));
 assert.equal(await page.locator('.prize-entry').count(),3);
 assert.ok(await page.locator('.guide-layout').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Guide has no horizontal overflow');
 const prizeHeading=await page.locator('#guide-prizes-title').boundingBox();
 assert.ok(prizeHeading.y>=header.y+header.height&&prizeHeading.y<viewport.height,'Prize heading is visible');
 await page.screenshot({path:resolve(output,`${viewport.width}-prizes.png`)});
 await page.locator('.prize-entry').last().scrollIntoViewIfNeeded();await page.screenshot({path:resolve(output,`${viewport.width}-prizes-last.png`)});
 await page.keyboard.press('Escape');assert.equal(await page.locator('body').getAttribute('data-stop'),'3');
 assert.equal(await page.locator('.prize-discovery').evaluate(e=>e===document.activeElement),true,'Focus returns to prize opener');
 assert.deepEqual(errors,[]);
 results.push({viewport,prizes:3,partners:4,lazyPrizes:true,overlaps:false,errors});
 await page.close();
 }
 await writeFile(resolve(output,'report.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
