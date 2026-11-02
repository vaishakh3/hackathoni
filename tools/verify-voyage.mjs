// Run after npm run build. Uses Chrome if installed, or Playwright's Chromium.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const output=resolve('work/verification');await mkdir(output,{recursive:true});
const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary','.woff2':'font/woff2','.ics':'text/calendar','.m4a':'audio/mp4'};
const server=createServer(async(req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,args:['--mute-audio'],...(process.env.PLAYWRIGHT_CHANNEL==='chromium'?{}:{channel:process.env.PLAYWRIGHT_CHANNEL??'chrome'})});
const report={date:new Date().toISOString(),checks:[],desktop:{},mobile:{},slowLoad:{}};
const errors=[];
function monitor(page){page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});}
function check(name,condition){assert.ok(condition,name);report.checks.push(name);}
function stats(values){const a=values.filter(v=>v>0&&v<1000).sort((a,b)=>a-b);return{samples:a.length,medianMs:a[Math.floor(a.length*.5)],p95Ms:a[Math.floor(a.length*.95)],over50:a.filter(x=>x>50).length};}
async function chapter(page,i){await page.locator(`.route [data-go="${i}"]`).click();await page.waitForFunction(i=>document.body.dataset.stop===String(i)&&Math.abs(document.querySelector('#voyage').scrollLeft-i*innerWidth)<1,i);}
async function screenshot(page,name){await page.screenshot({path:resolve(output,name+'.png')});}
async function within(page,selectors){return page.evaluate(selectors=>selectors.map(sel=>{const e=document.querySelector(sel),r=e.getBoundingClientRect();return{selector:sel,visible:r.width>0&&r.height>0&&r.left>=-1&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1};}),selectors);}

async function separated(page,first,second){
 return page.evaluate(([a,b])=>{const A=document.querySelector(a).getBoundingClientRect(),B=document.querySelector(b).getBoundingClientRect();return Math.min(A.right,B.right)-Math.max(A.left,B.left)<=1||Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top)<=1;},[first,second]);
}
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});monitor(page);
 await page.addInitScript(()=>{window.__longTasks=[];new PerformanceObserver(l=>window.__longTasks.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});});
 await page.goto(base+'/?diagnostics');await page.waitForSelector('.world.ready',{timeout:60000});await page.waitForTimeout(2000);
 check('Boat scene renders',await page.locator('#world.ready').count()===1);
 check('Water ambience is enabled by default',await page.locator('#sound-toggle').getAttribute('aria-pressed')==='true');
 check('No motion choice remains',await page.locator('#motion-toggle').count()===0);
 check('Transparent favicon loads without a black tile',await page.evaluate(async()=>{const icon=new Image();icon.src=document.querySelector('link[type="image/svg+xml"]').href;await icon.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d');c.drawImage(icon,0,0,64,64);const pixels=c.getImageData(0,0,64,64).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>100)visible++;return pixels[3]===0&&visible>300&&visible<3000;}));
 check('Generated emblem loads',await page.locator('.brand-emblem').evaluate(e=>e.complete&&e.naturalWidth>0));
 check('Brand note uses thoni translation',await page.locator('.translation-note').innerText().then(t=>t.includes('thōni')&&t.includes('തോണി')&&!t.includes('ഹാക്കത്തോണി')));
 check('Approved italic font loads locally',await page.evaluate(()=>document.fonts.check('italic 700 80px "Cormorant Garamond"')));
 check('Progress is compact and left aligned',await page.locator('.voyage-footer').evaluate(e=>e.getBoundingClientRect().width<innerWidth*.5&&e.getBoundingClientRect().left<innerWidth*.1));
 report.desktop.paint=await page.evaluate(()=>performance.getEntriesByType('paint').map(e=>({name:e.name,ms:e.startTime})));
 report.desktop.sceneInitMs=await page.evaluate(()=>performance.getEntriesByName('voyage-scene-init')[0].duration);
 report.desktop.longTasks=await page.evaluate(()=>window.__longTasks);
 const initial=await page.evaluate(()=>window.__lakeDiagnostics);report.desktop.frames=stats(initial.frames);report.desktop.render=stats(initial.renders);report.desktop.triangles=initial.triangles;report.desktop.drawCalls=initial.drawCalls;
 check('Redundant navigation captions are removed',await page.locator('.chapter-arrows').innerText().then(t=>t.trim()==='')&&await page.locator('#journey-hint').count()===0);
 check('Supplied partner logos load transparently',await page.locator('.sponsor-logos img').evaluateAll(es=>es.length===2&&es.every(e=>e.complete&&e.naturalWidth>0)));
 check('Left-side partner text is removed',await page.locator('.jetty-facts').innerText().then(t=>!t.includes('DEVIN')&&!t.includes('TINKERHUB')));
 check('Navigation uses the current-line glyphs',await page.locator('.chapter-arrows .current-arrow').count()===2);
 const yaw=await page.evaluate(()=>window.__lakeDiagnostics.boatYaw);
 await page.mouse.move(720,540);await page.mouse.down();check('Hero boat accepts a mouse drag',await page.locator('body.boat-dragging').count()===1);await page.mouse.move(900,540,{steps:12});await page.mouse.up();await page.waitForTimeout(80);
 check('Dragging turns the boat without changing chapters',Math.abs(await page.evaluate(()=>window.__lakeDiagnostics.boatYaw)-yaw)>.2&&await page.locator('#chapter-number').innerText()==='01');
 const flickRelease=await page.evaluate(()=>({yaw:window.__lakeDiagnostics.boatYaw,speed:window.__lakeDiagnostics.heroVelocity}));await page.waitForTimeout(350);const drift=await page.evaluate(()=>({yaw:window.__lakeDiagnostics.boatYaw,speed:window.__lakeDiagnostics.heroVelocity}));check('Flick momentum decays smoothly',Math.abs(drift.yaw-flickRelease.yaw)>.02&&Math.abs(drift.speed)<Math.abs(flickRelease.speed));
 await screenshot(page,'desktop-jetty');
 await chapter(page,1);await page.waitForFunction(()=>document.querySelector('#world').dataset.roofPhase==='open',null,{timeout:15000});await screenshot(page,'desktop-aboard');check('Aboard caption clears the voyage rail',await separated(page,'.tiny-note','.voyage-footer'));check('View selector clears the voyage rail',await separated(page,'.workshop-views','.voyage-footer'));check('Canopy and views have separate space',await separated(page,'.roof-control','.workshop-views'));check('View controls have no filled tab backgrounds',await page.locator('[data-inspect="0"]').evaluate(e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)'));
 await page.locator('[data-inspect="1"]').click();await page.waitForTimeout(1800);await screenshot(page,'desktop-company');check('Crew view selected',await page.locator('[data-inspect="1"]').getAttribute('aria-pressed')==='true');
 await page.keyboard.press('Escape');check('Escape restores wide composition',await page.locator('[data-inspect="0"]').getAttribute('aria-pressed')==='true');
 await page.locator('#roof-button').click();await page.waitForFunction(()=>document.querySelector('#world').dataset.roofPhase==='closed',null,{timeout:15000});check('Roof closes smoothly',await page.locator('#roof-button').getAttribute('aria-pressed')==='false');
 await page.locator('#roof-button').click();await page.waitForFunction(()=>document.querySelector('#world').dataset.roofPhase==='open',null,{timeout:15000});
 check('Boat labels and popup cards are removed',await page.locator('.hotspot,#hotspot-note,#boat-hotspots').count()===0);
 await page.waitForFunction(()=>{const a=document.querySelector('#backwater-audio');return !a.paused&&a.currentTime>.1;});check('Natural water loop starts after interaction',await page.locator('#backwater-audio').evaluate(a=>a.loop&&a.volume>0&&a.volume<=.6));
 for(const i of [2,3,4]){await chapter(page,i);await page.waitForTimeout(2200);await screenshot(page,'desktop-'+['jetty','aboard','midnight','morning','boarding'][i]);}
 check('Daylight scene has no full-screen wash',await page.locator('.boarding').evaluate(e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(e,'::before').content==='none'));
 check('Morning copy and action leave the scene open',await page.evaluate(()=>['.morning .chapter-copy','.morning .chapter-description','.morning .stage-cta'].every(s=>getComputedStyle(document.querySelector(s)).backgroundColor==='rgba(0, 0, 0, 0)')));
 check('Calendar action is an open text link',await page.locator('.calendar-cta').evaluate(e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)'));
 check('Itinerary has no overlay background',await page.locator('.ticket').evaluate(e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(e).backgroundImage==='none'));
 check('Admission note retains full-opacity text',await page.locator('.admission-note').evaluate(e=>getComputedStyle(e).opacity==='1'&&parseFloat(getComputedStyle(e).fontSize)>=13));
 check('Final progress reaches 100%',await page.locator('.route-line').getAttribute('aria-valuenow')==='100');
 const visible=await within(page,['.boarding-heading','.ticket .calendar-cta']);check('Final heading and calendar fit desktop',visible.every(v=>v.visible));
 const download=await Promise.all([page.waitForEvent('download'),page.locator('.calendar-cta').click()]);check('Calendar downloads',download[0].suggestedFilename()==='hackathoni.ics');
 const calendar=await(await fetch(base+'/hackathoni.ics')).text();check('Calendar remains valid',calendar.includes('BEGIN:VCALENDAR')&&calendar.includes('20261121T103000Z'));
 await page.locator('.mast-actions .guide-open').click();await page.waitForTimeout(100);const beforePause=await page.evaluate(()=>window.__lakeDiagnostics.totalFrames);await page.waitForTimeout(350);check('Scene pauses behind field guide',await page.evaluate(()=>window.__lakeDiagnostics.totalFrames)===beforePause);await screenshot(page,'desktop-field-guide');
 for(const detail of await page.locator('.guide-faqs details').all()){await detail.locator('summary').click();check('FAQ answer is readable: '+(await detail.locator('summary').innerText()).replaceAll('\n',' '),await detail.locator('p').isVisible());}
 check('Guide has no horizontal clipping',await page.locator('.field-guide').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.keyboard.press('Escape');check('Escape closes guide',!await page.locator('#field-guide').isVisible());
 await chapter(page,0);await page.locator('#sound-toggle').click();check('Ambience can be muted',await page.locator('#sound-toggle').getAttribute('aria-pressed')==='false');await page.waitForTimeout(250);check('Muted ambience stops playback',await page.locator('#backwater-audio').evaluate(a=>a.paused));await page.locator('#sound-toggle').click();await page.waitForFunction(()=>!document.querySelector('#backwater-audio').paused);check('Ambience can be enabled again',await page.locator('#sound-toggle').getAttribute('aria-pressed')==='true');
 await page.keyboard.press('Home');await page.waitForFunction(()=>document.body.dataset.stop==='0');check('Keyboard returns to jetty',await page.locator('#chapter-number').innerText()==='01');
 await page.setViewportSize({width:1280,height:720});await chapter(page,4);await page.waitForTimeout(1000);await screenshot(page,'desktop-compact-boarding');check('Short desktop final heading fits',(await within(page,['.boarding-heading'])).every(v=>v.visible));
 for(const viewport of [{width:1512,height:790},{width:1512,height:776},{width:1024,height:768},{width:844,height:390}]){await page.setViewportSize(viewport);await chapter(page,1);check(`Partner logos clear the route at ${viewport.width}×${viewport.height}`,await separated(page,'.route','.sponsor-logos'));await page.waitForTimeout(450);check(`No caption/route overlap at ${viewport.width}×${viewport.height}`,await separated(page,'.tiny-note','.voyage-footer'));check(`No selector/route overlap at ${viewport.width}×${viewport.height}`,await separated(page,'.workshop-views','.voyage-footer'));check(`No canopy/selector overlap at ${viewport.width}×${viewport.height}`,await separated(page,'.roof-control','.workshop-views'));await screenshot(page,`aboard-${viewport.width}x${viewport.height}`);
  if(viewport.height<=520){await chapter(page,4);check('Short landscape offers readable boarding notes',await page.locator('#boarding-reveal').isVisible());await page.locator('#boarding-reveal').click();await page.waitForTimeout(500);check('Landscape admission note clears the header and footer',await separated(page,'.admission-note','.masthead')&&await separated(page,'.admission-note','.voyage-footer'));check('Landscape calendar action fits',(await within(page,['.calendar-cta'])).every(v=>v.visible));await screenshot(page,'landscape-boarding-notes');}
 }
 await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});monitor(mobile);await mobile.goto(base+'/?diagnostics');await mobile.waitForSelector('.world.ready',{timeout:60000});await mobile.waitForTimeout(1500);await screenshot(mobile,'mobile-jetty');
 for(const i of [1,2,3,4]){await chapter(mobile,i);await mobile.waitForTimeout(i===1?5000:2200);await screenshot(mobile,'mobile-'+['jetty','aboard','midnight','morning','boarding'][i]);}
 check('Phone boarding notes have no opaque panel',await mobile.locator('.ticket').evaluate(e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)'));
 check('Mobile headline fits',(await within(mobile,['#boarding-title'])).every(v=>v.visible));check('Phone notes start below the scene',await mobile.locator('.ticket').evaluate(e=>e.getBoundingClientRect().top>=innerHeight-2));await mobile.locator('#boarding-reveal').click();await mobile.waitForTimeout(600);
 await mobile.locator('.calendar-cta').scrollIntoViewIfNeeded();await screenshot(mobile,'mobile-boarding-action');check('Mobile calendar remains reachable',await mobile.locator('.calendar-cta').isVisible());
 check('Phone branding and guide fit',(await within(mobile,['.wordmark','.mast-actions'])).every(v=>v.visible));
 check('Mobile page has no horizontal overflow',await mobile.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
 report.mobile=await mobile.evaluate(()=>({frames:window.__lakeDiagnostics.frames,renders:window.__lakeDiagnostics.renders,dpr:window.__lakeDiagnostics.dpr}));report.mobile.frames=stats(report.mobile.frames);report.mobile.renders=stats(report.mobile.renders);
 await mobile.locator('.mast-actions .guide-open').click();await screenshot(mobile,'mobile-guide');check('Mobile guide has no horizontal clipping',await mobile.locator('.field-guide').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await mobile.locator('#guide-close').click();
 await mobile.setViewportSize({width:320,height:568});await chapter(mobile,0);await mobile.waitForTimeout(1200);await screenshot(mobile,'small-phone-jetty');check('Small-phone logos clear the chapter count',await separated(mobile,'.sponsor-logos','.voyage-count'));check('Small-phone count clears the arrows',await separated(mobile,'.voyage-count','.chapter-arrows'));check('Small-phone chapter count stays on one line',await mobile.locator('.voyage-count').evaluate(e=>e.getBoundingClientRect().height<20));check('Small phone branding and guide fit',(await within(mobile,['.wordmark','.mast-actions'])).every(v=>v.visible));check('Small phone title fits',(await within(mobile,['#jetty-title'])).every(v=>v.visible));await chapter(mobile,1);check('Narrow-phone caption clears the footer',await separated(mobile,'.tiny-note','.voyage-footer'));check('Narrow-phone view selector clears the footer',await separated(mobile,'.workshop-views','.voyage-footer'));await chapter(mobile,4);await mobile.locator('#boarding-reveal').click();await mobile.waitForTimeout(500);await mobile.locator('.calendar-cta').scrollIntoViewIfNeeded();await screenshot(mobile,'small-phone-boarding');check('Small phone calendar is reachable',await mobile.locator('.calendar-cta').isVisible());await mobile.close();
 const reduced=await browser.newPage({viewport:{width:1024,height:768},reducedMotion:'reduce'});monitor(reduced);await reduced.goto(base+'/?diagnostics');await reduced.waitForSelector('.world.ready',{timeout:60000});await reduced.waitForTimeout(150);const frames=await reduced.evaluate(()=>window.__lakeDiagnostics.totalFrames);await reduced.waitForTimeout(350);check('OS reduced-motion preference stops continuous rendering',await reduced.evaluate(()=>window.__lakeDiagnostics.totalFrames)===frames);await chapter(reduced,3);await reduced.waitForTimeout(200);await screenshot(reduced,'reduced-motion-morning');await reduced.close();
 const slow=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});monitor(slow);
 const posterRequests=[];slow.on('request',request=>{if(request.url().includes('voyage-poster'))posterRequests.push(request.url());});
 const cdp=await slow.context().newCDPSession(slow);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:100000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 let release;const held=new Promise(r=>release=r);await slow.route('**/houseboat.glb*',async route=>{await held;await route.continue();});
 await Promise.all([slow.waitForRequest('**/houseboat.glb*'),slow.goto(base,{waitUntil:'domcontentloaded'})]);
 check('Slow startup has no standby image',!await slow.locator('.world.ready').count()&&await slow.locator('#world .world-fallback').count()===0&&posterRequests.length===0);
 await screenshot(slow,'slow-load-live-scene');await chapter(slow,4);check('Navigation works while 3D download is held',await slow.locator('#chapter-number').innerText()==='05');
 report.slowLoad=await slow.evaluate(()=>({paint:performance.getEntriesByType('paint').map(e=>({name:e.name,ms:e.startTime}))}));
 await slow.setViewportSize({width:1440,height:900});
 await Promise.all([slow.waitForRequest('**/houseboat.glb*'),slow.reload({waitUntil:'domcontentloaded'})]);
 check('Refresh has no standby image or poster download',await slow.locator('#world .world-fallback').count()===0&&posterRequests.length===0);
 release();await slow.waitForSelector('.world.ready',{timeout:60000});check('Refresh reveals the live scene directly',await slow.locator('#world .world-fallback').count()===0&&posterRequests.length===0);await slow.close();
 const fallback=await browser.newPage({viewport:{width:390,height:844}});monitor(fallback);await fallback.route('**/houseboat.glb*',route=>route.abort());await fallback.goto(base);await fallback.waitForSelector('.scene-unavailable',{timeout:30000});await chapter(fallback,3);await screenshot(fallback,'fallback-morning');check('Failed WebGL asset retains readable navigation',await fallback.locator('#chapter-number').innerText()==='04');await chapter(fallback,4);await fallback.locator('.calendar-cta').scrollIntoViewIfNeeded();check('Fallback retains calendar action',await fallback.locator('.calendar-cta').isVisible());await fallback.close();
 report.errors=errors;
 if(errors.length)console.error('Browser errors:',errors);
 check('No browser runtime or HTTP errors',errors.length===0);
 await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
