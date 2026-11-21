import {mkdir,readFile,readdir,writeFile,copyFile} from 'node:fs/promises';

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
const worker = (await readFile('worker.mjs','utf8')).replace("import seed from './seed.mjs';", (await readFile('seed.mjs','utf8')).replace('export default','const seed ='));
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await writeFile('dist/server/index.js',worker + '\nexport default createWorker(' + JSON.stringify(assets) + ');\n');
