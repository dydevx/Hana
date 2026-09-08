import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2','.ico':'image/x-icon','.svg':'image/svg+xml','.xml':'application/xml','.json':'application/json','.txt':'text/plain','.pdf':'application/pdf'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end('Nicht gefunden');}}).listen(3000,'127.0.0.1',()=>console.log('HANA: http://127.0.0.1:3000'));
