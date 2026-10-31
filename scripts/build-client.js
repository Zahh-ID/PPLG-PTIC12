import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const project=JSON.parse(await readFile(path.join(root,'LogicGate.json'),'utf8'));
const scene=JSON.parse(await readFile(path.join(root,'layouts/sandbox.json'),'utf8'));
scene.events=[{type:'BuiltinCommonInstructions::JsCode',inlineCode:(await readFile(path.join(root,'client/game.js'),'utf8')).split('\n'),parameterObjects:'',useStrict:true,eventsSheetExpanded:false}];
await writeFile(path.join(root,'layouts/sandbox.json'),JSON.stringify(scene,null,2)+'\n');
// The MCP exporter/validator expects a single-file project. The editor keeps
// its native split layout; generated files and exports never enter source control.
project.layouts=[scene];project.properties.folderProject=false;
for(const r of project.resources.resources)r.file=path.resolve(root,r.file);
await mkdir(path.join(root,'.cache'),{recursive:true});
await writeFile(path.join(root,'.cache/preview.json'),JSON.stringify(project,null,2));
console.log('Updated scene JavaScript and .cache/preview.json');
