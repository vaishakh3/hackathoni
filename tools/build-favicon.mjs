// Package the existing emblem as a transparent, theme-aware tab icon.
// Luminance masking preserves the approved mark without regenerating its shape.
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const root=new URL('../public/assets/brand/',import.meta.url);
const source=await readFile(new URL('hackathoni-emblem.webp',root));
const data=(await sharp(source).png().toBuffer()).toString('base64');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 240 240">
<style>.mark{fill:#f5efdd}@media(prefers-color-scheme:light){.mark{fill:#082f43}}</style>
<defs><mask id="boat" x="0" y="0" width="240" height="240" maskUnits="userSpaceOnUse" style="mask-type:luminance"><image x="0" y="49" width="240" height="142" href="data:image/png;base64,${data}"/></mask></defs>
<path class="mark" d="M0 0h240v240H0z" mask="url(#boat)"/>
</svg>`;
await writeFile(new URL('favicon.svg',root),svg);
// PNG is a compatibility fallback; modern browsers use the adaptive SVG.
await sharp(Buffer.from(svg.replace('fill:#f5efdd','fill:#082f43'))).resize(64,64).png().toFile(new URL('favicon.png',root).pathname);
const {data:pixels,info}=await sharp(new URL('favicon.png',root).pathname).raw().toBuffer({resolveWithObject:true});
let left=info.width,right=0,visible=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(pixels[(y*info.width+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);visible++;}
console.log(JSON.stringify({alpha:info.channels===4,cornerAlpha:pixels[3],markWidth:right-left+1,canvasWidth:info.width,visiblePixels:visible}));
