import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('..',import.meta.url));
// Fixed workspace output; never delete a caller-provided path.
const out=path.join(root,'dist');fs.rmSync(out,{recursive:true,force:true});
const require=createRequire(import.meta.url),cli=require.resolve('gdexporter/bin/cli.js');
const result=spawnSync(process.execPath,[cli,'--project',path.join(root,'Animal Hunter.json'),'--out',out],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
if(!fs.existsSync(path.join(out,'index.html')))throw Error('HTML5 export did not produce dist/index.html');
const vectorSource=path.join(root,'assets','circuit-rescue-v1','vector-ui'),vectorOut=path.join(out,'vector-ui');
fs.mkdirSync(vectorOut,{recursive:true});
const uiManifest=JSON.parse(fs.readFileSync(path.join(vectorSource,'manifest.json'),'utf8'));
for(const file of ['theme.css','manifest.json','icons.svg',uiManifest.brand.file])fs.copyFileSync(path.join(vectorSource,file),path.join(vectorOut,file));
fs.cpSync(path.join(vectorSource,'lottie'),path.join(vectorOut,'lottie'),{recursive:true});
fs.copyFileSync(path.join(root,'node_modules/lottie-web/build/player/lottie_light.min.js'),path.join(vectorOut,'lottie-light.min.js'));
fs.copyFileSync(path.join(root,'node_modules/lottie-web/LICENSE.md'),path.join(vectorOut,'lottie-LICENSE.txt'));
fs.copyFileSync(path.join(root,'src/ui/lottie-icons.js'),path.join(vectorOut,'lottie-icons.js'));
fs.copyFileSync(path.join(root,'node_modules/animejs/dist/bundles/anime.umd.min.js'),path.join(vectorOut,'anime.umd.min.js'));
fs.copyFileSync(path.join(root,'src/ui/modal-motion.js'),path.join(vectorOut,'modal-motion.js'));
for(const license of ['LICENSE.md','LICENSE'])if(fs.existsSync(path.join(root,'node_modules/animejs',license))){fs.copyFileSync(path.join(root,'node_modules/animejs',license),path.join(vectorOut,'animejs-LICENSE.txt'));break;}
const htmlPath=path.join(out,'index.html');
fs.writeFileSync(htmlPath,fs.readFileSync(htmlPath,'utf8').replace('</head>','<link rel="stylesheet" href="vector-ui/theme.css">\n<link rel="preload" as="image" type="image/svg+xml" href="vector-ui/'+uiManifest.brand.file+'">\n<script src="vector-ui/anime.umd.min.js"></script>\n<script src="vector-ui/modal-motion.js"></script>\n<script defer src="vector-ui/lottie-light.min.js"></script>\n<script defer src="vector-ui/lottie-icons.js"></script>\n</head>'));
fs.writeFileSync(path.join(out,'.nojekyll'),'');console.log('Web export ready in dist/ (not published).');
