import {mkdir,readFile,readdir,writeFile,copyFile,cp} from 'node:fs/promises';
import seed from './seed.mjs';

const files = {
  '/':['index.html','text/html; charset=utf-8'],
  '/style.css':['style.css','text/css; charset=utf-8'],
  '/shop.js':['shop.js','text/javascript; charset=utf-8'],
};
for (const name of (await readdir('web/assets')).filter(name => name.endsWith('.jpg'))) {
  files['/assets/' + name] = ['assets/' + name,'image/jpeg'];
}
const assets = {};
for (const [route,[path,type]] of Object.entries(files)) {
  const binary = type === 'image/jpeg';
  assets[route] = {body:await readFile('web/' + path,binary ? 'base64' : 'utf8'),type,binary};
}

// 1. Copy web static assets into dist for Vercel, Netlify, and static hosting
await cp('web', 'dist', {recursive: true});

// 2. Write static fallback for /api/catalog
await mkdir('dist/api', {recursive: true});
await writeFile('dist/api/catalog', JSON.stringify({
  products: seed,
  orderPhone: process.env.WHATSAPP_ORDER_PHONE || '233279587605'
}));

// 3. Worker bundle for Cloudflare / OpenAI Sites / local preview
const worker = (await readFile('worker.mjs','utf8')).replace("import seed from './seed.mjs';", (await readFile('seed.mjs','utf8')).replace('export default','const seed ='));
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await writeFile('dist/server/index.js',worker + '\nexport default createWorker(' + JSON.stringify(assets) + ');\n');
