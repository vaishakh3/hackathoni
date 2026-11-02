import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {gzipSync} from 'node:zlib';
import {chromium} from 'playwright';
const output=resolve('work/mobile-fixes');await mkdir(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary','.wasm':'application/wasm','.woff2':'font/woff2','.m4a':'audio/mp4'};
const server=createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost'),baseline=u.pathname.startsWith('/baseline/'),relative=baseline?u.pathname.slice(9):u.pathname;const root=resolve(baseline?'work/loading-baseline/dist':'dist');const file=resolve(root,'.'+(relative==='/'?'/index.html':relative));try{let body=await readFile(file),type=mime[extname(file)]??'application/octet-stream';const headers={'Content-Type':type,'Cache-Control':'no-store'};if(type.startsWith('text/')){body=gzipSync(body);headers['Content-Encoding']='gzip';}res.writeHead(200,headers).end(body);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
const hasBaseline=await access('work/loading-baseline/dist/index.html').then(()=>true,()=>false);
const report={checks:[],loading:{},errors:[]};function check(name,value){assert(value,name);report.checks.push(name);console.log(name);}
async function swipe(cdp,x,y,dx,dy,steps=14){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=steps;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/steps,y:y+dy*i/steps}]});await new Promise(r=>setTimeout(r,20));}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function go(page,i){await page.locator(`.route [data-go="${i}"]`).click();await page.waitForFunction(i=>document.body.dataset.stop===String(i)&&Math.abs(document.querySelector('#voyage').scrollTop-i*innerHeight)<2,i);}
try{
 for(const version of (process.env.SKIP_LOAD?[]:hasBaseline?['baseline','updated']:['updated'])){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  if(version==='baseline')await page.route(base+'/**',async route=>{const url=new URL(route.request().url());if(!url.pathname.startsWith('/baseline/'))url.pathname='/baseline'+url.pathname;await route.continue({url:url.toString()});});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:1000000,uploadThroughput:500000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const resources=[];page.on('request',r=>resources.push(r.url()));
  await page.goto(base+'/?diagnostics',{waitUntil:'domcontentloaded'});await page.waitForSelector('.world.ready',{timeout:60000});
  report.loading[version]=await page.evaluate(()=>({boatMs:performance.getEntriesByName('voyage-scene-ready')[0].startTime,landscapeMs:performance.getEntriesByName('voyage-landscape-ready')[0]?.startTime,resources:performance.getEntriesByType('resource').map(r=>({url:r.name.split('/').pop(),bytes:r.transferSize,start:r.startTime,end:r.responseEnd}))}));
  await page.screenshot({path:resolve(output,version+'-hero.png')});
  if(version==='updated')check('Boat requested once; no startup poster',resources.filter(r=>r.includes('houseboat-light.glb')).length===1&&!resources.some(r=>r.includes('voyage-poster')));
  await page.close();
 }
 if(!process.env.SKIP_LOAD&&hasBaseline)check('Cold boat load improves under the same network and CPU limits',report.loading.updated.boatMs<report.loading.baseline.boatMs*.8);
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 const cdp=await page.context().newCDPSession(page);await page.goto(base+'/?diagnostics');await page.waitForSelector('.world.ready',{timeout:60000});await page.waitForTimeout(500);
 check('Hero describes twelve hours',await page.locator('#jetty .chapter-description').innerText().then(t=>t.includes('Twelve hours')));
 check('Phone uses native vertical scrolling',await page.locator('#voyage').evaluate(e=>getComputedStyle(e).overflowY==='auto'&&getComputedStyle(e).touchAction.includes('pan-y')));
 let yaw=await page.evaluate(()=>window.__lakeDiagnostics.boatYaw);
 await swipe(cdp,180,510,95,0);await page.waitForTimeout(150);
 check('Touch drag rotates the boat',Math.abs(await page.evaluate(()=>window.__lakeDiagnostics.boatYaw)-yaw)>.25);
 check('Sideways rotation stays in the hero',await page.locator('body').getAttribute('data-stop')==='0');
 await page.waitForFunction(()=>window.__waterAudioDiagnostics.state==='playing');
 check('Quiet bed uses the iOS-compatible gain mixer',await page.evaluate(()=>window.__waterAudioDiagnostics.bedGain<=.16));
 const beforeTurn=await page.evaluate(()=>window.__waterAudioDiagnostics.effects);await swipe(cdp,180,510,-75,0);const turnSounds=await page.evaluate(()=>window.__waterAudioDiagnostics.effects)-beforeTurn;check('Rotation produces restrained, rate-limited water sounds',turnSounds>0&&turnSounds<=2);
 await swipe(cdp,190,560,0,-280);await page.waitForTimeout(1100);
 check('Vertical touch swipe advances chapters',await page.locator('#voyage').evaluate(e=>e.scrollTop>innerHeight*.5));
 await go(page,0);await page.waitForTimeout(4500);await swipe(cdp,190,550,0,-260);await page.waitForTimeout(1100);
 check('Vertical swiping over the boat navigates instead of trapping the finger',await page.locator('body').getAttribute('data-stop')!=='0');
 await go(page,4);await page.waitForTimeout(800);await swipe(cdp,180,550,0,-330);await page.waitForTimeout(1100);
 check('Final chapter has no nested scrolling over the boat',await page.locator('#boarding').evaluate(e=>e.scrollHeight===e.clientHeight));
 check('Registration remains visible on the last chapter',await page.locator('.ticket .registration-cta').isVisible());
 await page.screenshot({path:resolve(output,'mobile-boarding-notes.png')});
 await page.locator('#boarding').evaluate(e=>e.scrollTop=0);await swipe(cdp,180,300,0,270);await page.waitForTimeout(1100);
 check('A downward swipe from final chapter returns to earlier chapters',Number(await page.locator('body').getAttribute('data-stop'))<4);
 const effects=await page.evaluate(()=>window.__waterAudioDiagnostics.effects);await page.waitForTimeout(500);await go(page,0);await page.waitForTimeout(650);
 check('Chapter actions produce short water sounds',await page.evaluate(()=>window.__waterAudioDiagnostics.effects)>effects);
 await page.locator('#sound-toggle').click();const mutedEffects=await page.evaluate(()=>window.__waterAudioDiagnostics.effects);await go(page,1);await page.waitForTimeout(500);
 check('Mute silences the bed and interaction sounds',await page.evaluate(()=>window.__waterAudioDiagnostics.state==='muted'));
 // Check the counter separately to avoid exposing test data to the application.
 check('Muted actions do not spawn voices',await page.evaluate(()=>window.__waterAudioDiagnostics.effects)===mutedEffects);
 await page.reload();await page.waitForSelector('.world.ready');check('Mute preference survives reload',await page.locator('#sound-toggle').getAttribute('aria-pressed')==='false');
 await page.locator('#sound-toggle').click();await page.waitForFunction(()=>window.__waterAudioDiagnostics.state==='playing');
 await page.waitForTimeout(1000);check('Short voices release their resources',await page.evaluate(()=>window.__waterAudioDiagnostics.active)===0);
 check('No browser errors',report.errors.length===0);await page.close();
}finally{await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.loading,null,2));await browser.close();await new Promise(r=>server.close(r));}
