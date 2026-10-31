import {execFileSync,spawnSync,spawn} from 'node:child_process';
import path from 'node:path';
const actions={up:['up','-d','--wait'],stop:['stop'],status:['ps'],logs:['logs','--tail','60','postgres'],restart:['restart','postgres']};
const action=process.argv[2]||'status';
if(!Object.hasOwn(actions,action))throw new Error('Choose up, stop, status, logs or restart.');
const root=path.resolve(import.meta.dirname,'..');
const linuxRoot=execFileSync('wsl',['-d','Ubuntu','--exec','wslpath','-a',root.replaceAll('\\','/')],{encoding:'utf8'}).trim();
const args=['-d','Ubuntu','-u','root','--exec','docker','compose','--env-file',`${linuxRoot}/.env`,'-f',`${linuxRoot}/infra/compose.yaml`];
// WSL may otherwise shut down idle systemd services immediately after the CLI
// exits. flock ensures repeated starts keep only one hidden keeper process.
if(action==='up'||action==='restart'){
  const keeper=spawn('wsl',['-d','Ubuntu','-u','root','--exec','flock','-n','/run/lock/logicworld-wsl.lock','sleep','infinity'],{detached:true,stdio:'ignore',windowsHide:true});
  keeper.on('error',e=>console.error('Could not keep WSL active:',e.message));keeper.unref();
}
function run(command){const result=spawnSync('wsl',[...args,...command],{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);}
run(actions[action]);if(action==='restart')run(actions.up);
