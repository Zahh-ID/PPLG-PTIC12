import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer';

// Headless, numeric/DOM assertions only. Appearance is reviewed by the developer.
export async function gameBrowser(firstLayout='permainan',viewport={width:1280,height:720}) {
 const root=path.resolve('dist'),errors=[],missing=[];
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  let data=fs.readFileSync(file);
  if(file.endsWith('.html'))data=data.toString().replace('var game = new gdjs.RuntimeGame(gdjs.projectData, {});',`gdjs.projectData.firstLayout=${JSON.stringify(firstLayout)};localStorage.setItem('cr-language','en');var game=window.__testGame=new gdjs.RuntimeGame(gdjs.projectData, {});`);
  res.end(data);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage();page.setDefaultTimeout(60000);await page.setViewport(viewport);
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400&&response.url().startsWith('http://127.0.0.1:')&&!response.url().endsWith('favicon.ico'))missing.push(response.url());});
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
 async function ready(level) {
  await page.waitForFunction(level=>window.__testGame?.getSceneStack().getCurrentScene()?.__campaign?.level===level,{},level);
  await page.waitForSelector('[data-flow=start-level]',{visible:true});await page.click('[data-flow=start-level]');
  await page.waitForFunction(()=>!document.querySelector('#cr-journey')&&window.__testGame.getSceneStack().getCurrentScene().__islandGame?.time>.15);
 }
 async function seconds(duration) {
  const start=await page.evaluate(()=>window.__testGame.getSceneStack().getCurrentScene().__islandGame.time);
  await page.waitForFunction(time=>window.__testGame.getSceneStack().getCurrentScene().__islandGame.time>=time,{},start+duration);
 }
 async function level(number) {
  await page.evaluate(number=>window.__testGame.__crJourney.request={scene:number===1?'permainan':'sector'+number,reset:true},number);
  await ready(number);
 }
 return {page,errors,missing,ready,seconds,level,close:async()=>{await browser.close();await new Promise(resolve=>server.close(resolve));}};
}
