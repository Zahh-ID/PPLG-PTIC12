import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('..',import.meta.url));
// Fixed workspace output; never delete a caller-provided path.
const out=path.join(root,'dist');fs.rmSync(out,{recursive:true,force:true});
const require=createRequire(import.meta.url),cli=require.resolve('gdexporter/bin/cli.js');
const result=spawnSync(process.execPath,[cli,'--project',path.join(root,'Animal Hunter.json'),'--out',out],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
if(!fs.existsSync(path.join(out,'index.html')))throw Error('HTML5 export did not produce dist/index.html');
fs.writeFileSync(path.join(out,'.nojekyll'),'');console.log('Web export ready in dist/ (not published).');
