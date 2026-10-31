import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
const file=new URL('../.env',import.meta.url);
let content='';try{content=await readFile(file,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
const values=Object.fromEntries(content.split(/\r?\n/).filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
const password=values.POSTGRES_PASSWORD||randomBytes(24).toString('hex');
const port=values.POSTGRES_PORT||'5433';
for(const [name,value] of Object.entries({POSTGRES_PASSWORD:password,POSTGRES_PORT:port,DATABASE_URL:`postgresql://logicworld:${encodeURIComponent(password)}@127.0.0.1:${port}/logicworld`})){
  if(!Object.hasOwn(values,name))content+=`${content&&!content.endsWith('\n')?'\n':''}${name}=${value}\n`;
}
await writeFile(file,content,{mode:0o600});
console.log('Local .env configured; credentials remain untracked.');
