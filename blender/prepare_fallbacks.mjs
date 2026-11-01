import sharp from 'sharp';
const assets=new URL('../public/assets/',import.meta.url);
for(const name of ['boat-night','boat-cutaway']){
 await sharp(new URL(name+'.png',assets).pathname).webp({quality:92}).toFile(new URL(name+'.webp',assets).pathname);
}
