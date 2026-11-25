import fs from 'node:fs';
import {iconAnimation,brandAnimation,buttonAnimation} from './lottie-shapes.mjs';
const root=new URL('../',import.meta.url),dir=new URL('../assets/circuit-rescue-v1/vector-ui/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',dir),'utf8'));
const lottieDir=new URL('lottie/',dir);fs.mkdirSync(lottieDir,{recursive:true});
const projectPath=new URL('Animal Hunter.json',root),project=JSON.parse(fs.readFileSync(projectPath,'utf8'));
const before=project.resources.resources.reduce((n,r)=>n+(r.file&&fs.existsSync(new URL(r.file,root))?fs.statSync(new URL(r.file,root)).size:0),0);
const symbols=[];let oldBytes=0,newBytes=0,references=0;
for(const [id,icon] of Object.entries(manifest.icons)){
 const fill=icon.color??manifest.palette.foreground;
 const frame=icon.pickup?'':`<path d="M18 5H110L123 18V110L110 123H18L5 110V18Z" fill="${manifest.palette.surface}" stroke="${manifest.palette.edge}" stroke-width="5"/><path d="M24 13H104" stroke="${manifest.palette.accent}" stroke-width="3"/>`;
 const body=frame+`<g fill="${fill}" stroke="${fill}" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter">${icon.body}</g>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${body}</svg>\n`;
 fs.writeFileSync(new URL(id+'.svg',dir),svg);symbols.push(`<symbol id="${id}" viewBox="0 0 128 128">${body}</symbol>`);
 fs.writeFileSync(new URL(id+'.json',lottieDir),JSON.stringify(iconAnimation(id,icon.body,frame,{...manifest.palette,foreground:fill}))+'\n');
 const target='assets/circuit-rescue-v1/vector-ui/'+id+'.svg';
 for(const resource of project.resources.resources){if(icon.resources.includes(resource.name)){
  const original=icon.originals?.[resource.name];if(original&&fs.existsSync(new URL(original,root)))oldBytes+=fs.statSync(new URL(original,root)).size;
  resource.file=target;resource.smoothed=true;references++;newBytes+=Buffer.byteLength(svg);
 }}
}
fs.writeFileSync(new URL('icons.svg',dir),`<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>\n`);
fs.copyFileSync(new URL(manifest.brand.source,root),new URL(manifest.brand.file,dir));
fs.writeFileSync(new URL('logo.json',lottieDir),JSON.stringify(brandAnimation(manifest.brand.file,manifest.brand.width,manifest.brand.height))+'\n');
fs.writeFileSync(new URL('button-feedback.json',lottieDir),JSON.stringify(buttonAnimation(manifest.palette))+'\n');
fs.writeFileSync(new URL('index.json',lottieDir),JSON.stringify({icons:Object.keys(manifest.icons),logo:'logo',button:'button-feedback',frames:12,fps:30,loop:false})+'\n');
const {enterMs,exitMs,swapMs,feedbackMs}=manifest.motion;
const themeTokens={...manifest.palette,enterMs,exitMs,swapMs,feedbackMs};
const theme=fs.readFileSync(new URL('../src/ui/modal-theme.css',import.meta.url),'utf8').replace(/\{\{(\w+)\}\}/g,(_,key)=>{
 if(!(key in themeTokens))throw Error('Unknown UI theme token: '+key);
 return String(themeTokens[key]);
});
fs.writeFileSync(new URL('theme.css',dir),theme);
const localePath=new URL('../src/events/localization.js',import.meta.url);
let locale=fs.readFileSync(localePath,'utf8');
const themeDeclaration='const crVectorThemeCSS='+JSON.stringify(theme)+';';
if(/^const crVectorThemeCSS=.*;$/m.test(locale))locale=locale.replace(/^const crVectorThemeCSS=.*;$/m,()=>themeDeclaration);
else locale+='\n'+themeDeclaration+`\nif(typeof document.createElement==='function'&&!document.querySelector('[data-cr-vector-theme]')&&!document.querySelector('link[href$="vector-ui/theme.css"]')){const style=document.createElement('style');style.dataset.crVectorTheme='';style.textContent=crVectorThemeCSS;document.head.append(style);}\n`;
fs.writeFileSync(localePath,locale);
fs.writeFileSync(projectPath,JSON.stringify(project,null,2)+'\n');
fs.mkdirSync(new URL('.local/reports/',root),{recursive:true});
const report={symbols:Object.keys(manifest.icons).length,resourceReferences:references,replacedRasterBytes:oldBytes,svgResourceBytes:newBytes,savedBytes:oldBytes-newBytes,resourceBytesBefore:before};
fs.writeFileSync(new URL('.local/reports/svg-ui-size.json',root),JSON.stringify(report,null,2)+'\n');console.log(report);
