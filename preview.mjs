import {createServer} from 'node:http';
import worker from './dist/server/index.js';

const port = Number(process.env.PORT || 4175);
createServer(async (request,response) => {
  try {
    const result = await worker.fetch(new Request(new URL(request.url,'http://127.0.0.1:' + port),{method:request.method}),process.env);
    response.writeHead(result.status,Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch {
    response.writeHead(500).end('Preview error');
  }
}).listen(port,'127.0.0.1',() => console.log('http://127.0.0.1:' + port));
