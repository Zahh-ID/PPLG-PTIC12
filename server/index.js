import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION, STOCK, SPAWN, WIDTH, TILE, cells, editable, evaluate, example } from '../shared/world.js';
import {openStore} from './storage.js';

export async function createServer({ port=Number(process.env.PORT||8787), host=process.env.HOST||'127.0.0.1', dataDir=process.env.DATA_DIR||'data', clientDir='exports/web', databaseUrl=process.env.DATABASE_URL, worldId=process.env.WORLD_ID||'workshop' }={}) {
  const opened=await openStore({databaseUrl,dataDir,worldId}),store=opened.store;
  let state=opened.state;
  const persist=next=>store.save(next);
  const sessions=new Map(); let queue=Promise.resolve();
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,version:VERSION,storage:store.kind,players:sessions.size,revision:state.revision}));return;}
    try {
      const url=new URL(req.url,'http://localhost'), base=path.resolve(clientDir);
      const target=path.resolve(base,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
      if(!target.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
      const content=await readFile(target);
      const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css','.wasm':'application/wasm'};
      res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(content);
    } catch {res.writeHead(404);res.end('Export GDevelop to exports/web, or use GDevelop Preview.');}
  });
  const wss=new WebSocketServer({server,maxPayload:4096});
  const send=(ws,data)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({v:VERSION,...data}));};
  const snapshot=()=>({type:'world',revision:state.revision,devices:state.devices,signals:evaluate(state.devices)});
  function broadcast(data){for(const ws of wss.clients)send(ws,data);}
  function presence(){broadcast({type:'presence',players:[...sessions].map(([id,s])=>({id,...s.position}))});}
  function reject(ws,e){send(ws,{type:'error',message:e.message});}
  async function command(ws,m) {
    if(m.v!==VERSION)throw new Error('Client version mismatch.');
    if(m.type==='join') {
      if(ws.playerId)throw new Error('Already joined.');
      if(sessions.size>=8)throw new Error('World is full (8 players).');
      const next=structuredClone(state);
      let player=typeof m.token==='string'?Object.values(next.players).find(p=>p.token===m.token):null;
      if(!player){player={id:randomUUID(),token:randomBytes(24).toString('hex'),inventory:{...STOCK}};next.players[player.id]=player;await persist(next);state=next;}
      if(sessions.has(player.id))throw new Error('This player is already connected. Open a second tab for a second player.');
      ws.playerId=player.id;sessions.set(player.id,{ws,position:{...SPAWN},lastMove:Date.now()});
      send(ws,{type:'welcome',id:player.id,token:player.token,inventory:player.inventory,spawn:SPAWN});send(ws,snapshot());presence();return;
    }
    if(!ws.playerId)throw new Error('Join the world first.');
    const session=sessions.get(ws.playerId);
    if(m.type==='ping'){send(ws,{type:'pong'});return;}
    if(m.type==='move') {
      if(!Number.isFinite(m.x)||!Number.isFinite(m.y))throw new Error('Invalid position.');
      const elapsed=Math.min((Date.now()-session.lastMove)/1000,2), limit=400*elapsed+48;
      if(m.x<0||m.x>WIDTH*TILE-16||m.y<0||m.y>500||Math.abs(m.x-session.position.x)>limit||Math.abs(m.y-session.position.y)>1600*elapsed+64) {
        send(ws,{type:'correction',...session.position});return;
      }
      session.position={x:m.x,y:m.y};session.lastMove=Date.now();presence();return;
    }
    const next=structuredClone(state), inv=next.players[ws.playerId].inventory;
    const nearby=d=>Math.hypot(d.x*TILE-session.position.x,d.y*TILE-session.position.y)<=240;
    function place(spec,checkReach=true) {
      if(!Object.hasOwn(STOCK,spec.kind)||!Number.isInteger(spec.x)||!Number.isInteger(spec.y))throw new Error('Invalid placement.');
      const d={id:randomUUID(),kind:spec.kind,x:spec.x,y:spec.y,on:false};
      if(!editable(d))throw new Error('Build only inside the workshop (columns 12–109, rows 17–28).');
      if(checkReach&&!nearby(d))throw new Error('Move closer to build here.');
      const occupied=new Set(next.devices.flatMap(cells));
      if(cells(d).some(c=>occupied.has(c)))throw new Error('That space is occupied.');
      if(inv[d.kind]<=0)throw new Error('No items of this type left.');
      if(['block','door'].includes(d.kind)&&[...sessions.values()].some(s=>cells(d).some(c=>{const[x,y]=c.split(',').map(Number);return s.position.x<x*TILE+16&&s.position.x+16>x*TILE&&s.position.y<y*TILE+16&&s.position.y+32>y*TILE;})))throw new Error('A player is standing there.');
      inv[d.kind]--; next.devices.push(d);
    }
    if(m.type==='place')place(m);
    else if(m.type==='example') {
      if(!nearby({x:30,y:25}))throw new Error('Move closer to the workshop example.');
      for(const d of example())place(d,false);
    } else if(m.type==='remove'||m.type==='toggle') {
      const index=next.devices.findIndex(d=>d.id===m.id), d=next.devices[index];
      if(!d)throw new Error('Device no longer exists.');
      if(!nearby(d))throw new Error('Move closer to interact.');
      if(m.type==='toggle'){if(d.kind!=='switch')throw new Error('Only switches can be toggled.');d.on=!d.on;}
      else {if(inv[d.kind]>=STOCK[d.kind])throw new Error('Inventory is full for this item.');inv[d.kind]++;next.devices.splice(index,1);}
    } else throw new Error('Unknown command.');
    evaluate(next.devices);next.revision++;await persist(next);state=next;
    send(ws,{type:'inventory',inventory:inv});broadcast(snapshot());
  }
  wss.on('connection',ws=>{
    ws.alive=true;ws.count=0;ws.window=Date.now();
    ws.on('pong',()=>ws.alive=true);
    ws.on('message',raw=>{
      if(Date.now()-ws.window>1000){ws.window=Date.now();ws.count=0;}
      if(++ws.count>50){ws.close(1008,'Rate limit');return;}
      let m;try{m=JSON.parse(raw);if(!m||typeof m!=='object'||Array.isArray(m))throw Error();}catch{reject(ws,new Error('Invalid message.'));return;}
      queue=queue.then(()=>command(ws,m)).catch(e=>reject(ws,e));
    });
    ws.on('error',()=>{});
    ws.on('close',()=>{queue=queue.then(()=>{if(sessions.get(ws.playerId)?.ws===ws)sessions.delete(ws.playerId);presence();});});
  });
  const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},10000);heartbeat.unref();
  try {await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});}
  catch(e){clearInterval(heartbeat);wss.close();await store.close();throw e;}
  return {server,wss,port:server.address().port,async close(){clearInterval(heartbeat);for(const ws of wss.clients)ws.terminate();await queue;await new Promise(r=>wss.close(r));await new Promise(r=>server.close(r));await store.close();}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const app=await createServer();console.log(`LogicWorld listening at http://${process.env.HOST||'127.0.0.1'}:${app.port}`);
  for(const event of ['SIGINT','SIGTERM'])process.on(event,()=>app.close().then(()=>process.exit()));
}
