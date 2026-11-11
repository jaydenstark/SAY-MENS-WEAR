import seed from './seed.mjs';

const webhookPath = '/api/whatsapp/webhook';
const secretNames = ['WHATSAPP_APP_SECRET','WHATSAPP_VERIFY_TOKEN','WHATSAPP_PHONE_ID','WHATSAPP_ADMIN_PHONE'];
const skuPattern = /^[A-Z0-9-]{1,30}$/;

export function parseUpdate(body) {
  const match = /^UPDATE\s+([A-Z0-9-]+)[ \t]*\r?\n[ \t]*SIZES:[ \t]*([^\r\n]+)\r?\n[ \t]*PRICE:[ \t]*\$?(\d{1,5})(?:\.(\d{1,2}))?$/i.exec(body.trim());
  if (!match) return null;
  const sku = match[1].toUpperCase();
  const sizes = [...new Set(match[2].split(',').map(size => size.trim().toUpperCase()))];
  const price = Number(match[3]) * 100 + Number((match[4] || '').padEnd(2,'0'));
  if (!skuPattern.test(sku) || sizes.length > 20 || sizes.some(size => !/^[A-Z0-9][A-Z0-9 /.-]{0,15}$/.test(size)) || price <= 0) return null;
  if (!seed.some(product => product.sku === sku)) return null;
  return {sku,sizes,price};
}

async function hasValidSignature(bytes, signature, secret) {
  if (!/^sha256=[a-f0-9]{64}$/.test(signature || '')) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['verify']);
  const hash = Uint8Array.from(signature.slice(7).match(/../g), value => parseInt(value,16));
  return crypto.subtle.verify('HMAC',key,hash,bytes);
}

async function updateProduct(bucket, product, timestamp, messageId) {
  const key = 'catalog/' + product.sku;
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await bucket.get(key);
    const previous = await existing?.json();
    if (previous && (previous.timestamp > timestamp ||
      (previous.timestamp === timestamp && previous.messageId >= messageId))) return;
    const saved = await bucket.put(key,JSON.stringify({...product,timestamp,messageId}), {
      onlyIf:existing ? {etagMatches:existing.etag} : {etagDoesNotMatch:'*'}
    });
    if (saved) return;
  }
  throw new Error('Catalog record was busy');
}

async function whatsapp(request, env, url) {
  if (!env.BUCKET || secretNames.some(name => !env[name])) return new Response('WhatsApp setup pending',{status:503});
  if (request.method === 'GET') {
    const query = url.searchParams;
    const valid = query.get('hub.mode') === 'subscribe' && query.get('hub.verify_token') === env.WHATSAPP_VERIFY_TOKEN && query.has('hub.challenge');
    return valid ? new Response(query.get('hub.challenge')) : new Response('Forbidden',{status:403});
  }
  if (request.method !== 'POST') return new Response(null,{status:405,headers:{Allow:'GET, POST'}});
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > 1_000_000) return new Response('Payload too large',{status:413});
  if (!await hasValidSignature(bytes,request.headers.get('x-hub-signature-256'),env.WHATSAPP_APP_SECRET)) return new Response('Forbidden',{status:403});
  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { return new Response('Invalid JSON',{status:400}); }
  if (payload?.object !== 'whatsapp_business_account') return new Response(null,{status:204});
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages' || change.value?.metadata?.phone_number_id !== env.WHATSAPP_PHONE_ID) continue;
      for (const message of change.value.messages || []) {
        if (message.from !== env.WHATSAPP_ADMIN_PHONE || message.type !== 'text' || typeof message.text?.body !== 'string' || !message.id) continue;
        const timestamp = Number(message.timestamp);
        const product = parseUpdate(message.text.body);
        if (product && Number.isSafeInteger(timestamp) && timestamp > 0) await updateProduct(env.BUCKET,product,timestamp,message.id);
      }
    }
  }
  return new Response(null,{status:204});
}

export function createWorker(assets) {
  return {async fetch(request,env) {
    const url = new URL(request.url);
    if (url.pathname === webhookPath) return whatsapp(request,env,url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
    if (url.pathname === '/api/catalog') {
      const products = await Promise.all(seed.map(async product => {
        const object = await env.BUCKET?.get('catalog/' + product.sku);
        if (!object) return product;
        const {price,sizes} = await object.json();
        return {...product,price,sizes};
      }));
      const orderPhone = /^[1-9]\d{6,14}$/.test(env.WHATSAPP_ORDER_PHONE || '') ? env.WHATSAPP_ORDER_PHONE : '';
      return Response.json({products,orderPhone},{headers:{'cache-control':'no-store'}});
    }
    const asset = assets[url.pathname];
    if (!asset || !Object.hasOwn(assets,url.pathname)) return new Response('Page not found',{status:404});
    return new Response(request.method === 'HEAD' ? null : asset.binary ? Uint8Array.from(atob(asset.body),char => char.charCodeAt(0)) : asset.body,
      {headers:{'content-type':asset.type,'x-content-type-options':'nosniff'}});
  }};
}
