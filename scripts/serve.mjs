import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const option=name=>{const i=process.argv.indexOf(name);return i===-1?undefined:process.argv[i+1];};
const directory=option('--dir')||'public';if(!['public','dist'].includes(directory))throw new Error('--dir must be public or dist');
const root=path.resolve(project,directory),port=Number(option('--port')||process.env.PORT||4173),host=option('--host')||process.env.HOST||'127.0.0.1';
if(!fs.existsSync(path.join(root,'index.html')))throw new Error(`${directory}/index.html is missing. For dist, run npm run build first.`);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.ts':'text/plain; charset=utf-8'};
const routes=new Map([['/','index.html'],['/vaults','vaults.html'],['/btcvp','btcvp/index.html'],['/btcvc','btcvc/index.html'],['/ethvp','ethvp/index.html']]);
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
 const normalized=pathname.length>1?pathname.replace(/\/$/,''):pathname;
 const relative=routes.get(normalized)||'.'+pathname;
 const selected=path.resolve(root,relative);
 if((!selected.startsWith(root+path.sep)&&selected!==root)||pathname.includes('\0')||pathname.split('/').some(p=>p.startsWith('.'))){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(selected)||!fs.statSync(selected).isFile()){res.writeHead(404);res.end('Not found');return;}
 res.writeHead(200,{'Content-Type':mime[path.extname(selected)]||'application/octet-stream','Content-Length':fs.statSync(selected).size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 if(req.method==='HEAD'){res.end();return;}fs.createReadStream(selected).pipe(res);
});
server.listen(port,host,()=>console.log(`NARO ${directory}: http://${host}:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
