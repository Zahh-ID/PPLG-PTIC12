// Dependency-free pixel-art cable tiles. Run from any directory with Node 18+.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../assets/circuit-rescue-v1');
const out=path.join(root,'cables');fs.mkdirSync(out,{recursive:true});
function crc(b){let n=0xffffffff;for(const v of b){n^=v;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return(n^0xffffffff)>>>0;}
function chunk(type,b){const t=Buffer.from(type),n=Buffer.alloc(4),c=Buffer.alloc(4);n.writeUInt32BE(b.length);c.writeUInt32BE(crc(Buffer.concat([t,b])));return Buffer.concat([n,t,b,c]);}
function png(w,h,p){const hdr=Buffer.alloc(13);hdr.writeUInt32BE(w);hdr.writeUInt32BE(h,4);hdr[8]=8;hdr[9]=6;const rows=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++)p.copy(rows,y*(w*4+1)+1,y*w*4,(y+1)*w*4);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
const colors={outline:[12,23,39,255],shell:[73,99,121,255],off:[161,105,54,255],on:[30,216,247,255],shine:[185,249,255,255]};
function tile(mask,on,cross=false){const p=Buffer.alloc(64*64*4);function rect(x,y,w,h,c){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>=0&&j>=0&&i<64&&j<64)p.set(c,(j*64+i)*4);}
function route(bits){for(const [half,col]of [[8,colors.outline],[6,colors.shell],[4,on?colors.on:colors.off]]){rect(32-half,32-half,half*2,half*2,col);if(bits&1)rect(32-half,0,half*2,32,col);if(bits&2)rect(32,32-half,32,half*2,col);if(bits&4)rect(32-half,32,half*2,32,col);if(bits&8)rect(0,32-half,32,half*2,col);}}
if(cross){route(5);rect(18,20,28,24,colors.outline);route(10);rect(22,22,4,20,colors.shell);rect(38,22,4,20,colors.shell);}else route(mask);
if(on){rect(30,30,4,4,colors.shine);if(mask&1)rect(30,0,2,24,colors.shine);if(mask&2)rect(40,30,24,2,colors.shine);if(mask&4)rect(30,40,2,24,colors.shine);if(mask&8)rect(0,30,24,2,colors.shine);}
return p;}
const assets=[],pixels=[];
for(const on of [false,true])for(let mask=0;mask<16;mask++){const file=`cable-${String(mask).padStart(2,'0')}-${on?'on':'off'}.png`,p=tile(mask,on);fs.writeFileSync(path.join(out,file),png(64,64,p));assets.push({file,mask,powered:on,connections:['up','right','down','left'].filter((_,i)=>mask&(1<<i))});pixels.push(p);}
for(const on of [false,true]){const file=`crossing-insulated-${on?'on':'off'}.png`;fs.writeFileSync(path.join(out,file),png(64,64,tile(15,on,true)));assets.push({file,powered:on,insulated:true});}
// Verify every boundary pixel, including highlight, matches its neighboring tile.
for(const on of [false,true])for(let mask=0;mask<16;mask++){const p=tile(mask,on);for(const [bit,other,axis]of [[2,8,'x'],[4,1,'y']])if(mask&bit){const q=tile(other,on);for(let n=0;n<64;n++){const i=axis==='x'?(n*64+63)*4:(63*64+n)*4,j=axis==='x'?n*64*4:n*4;if(!p.subarray(i,i+4).equals(q.subarray(j,j+4)))throw Error('Cable seam mismatch');}}}
const preview=Buffer.alloc(512*256*4);for(let y=0;y<256;y++)for(let x=0;x<512;x++)preview.set([24,39,56,255],(y*512+x)*4);for(let i=0;i<pixels.length;i++){const tx=(i%8)*64,ty=Math.floor(i/8)*64;for(let y=0;y<64;y++)for(let x=0;x<64;x++){const src=(y*64+x)*4;if(pixels[i][src+3])pixels[i].copy(preview,((ty+y)*512+tx+x)*4,src,src+4);}}
fs.writeFileSync(path.join(out,'preview.png'),png(512,256,preview));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({tileSize:64,origin:{x:0,y:0},center:{x:32,y:32},bits:{up:1,right:2,down:4,left:8},assets},null,2)+'\n');
fs.writeFileSync(path.join(out,'README.md'),'# Auto-connecting cables\n\n34 transparent, exact-grid 64×64 PNGs. No tile padding or UI frames. All 16 neighbor combinations exist in off/on states; isolated cables use mask 0. Two additional insulated crossing images are provided. Generated as original pixel geometry with scripts/generate-circuit-cables.mjs; existing generated art is unchanged.\n\n## Selection\n\nmask = (up ? 1 : 0) | (right ? 2 : 0) | (down ? 4 : 0) | (left ? 8 : 0). Use cable-{mask padded to two digits}-{off or on}.png. Example: up+right = 3; horizontal = 10; vertical = 5; all directions = 15. Place without gaps on a 64-pixel grid. Recompute the placed/removed cell and its four neighbors after every edit. Only connect gate sides with a compatible exposed port.\n\nOrdinary T/cross tiles join all their arms electrically. Insulated crossings keep horizontal and vertical networks separate; for independently powered crossing lanes, layer a horizontal and vertical cable on separate render layers instead of relying on the single-state crossing image. Neighbor detection and signal simulation still require game code.\n\nSignal color is additional feedback: retain visible 0/1 output labels in the puzzle. Node generator checks edge-pixel compatibility for every connected horizontal and vertical seam. Preview rows: masks 0–7 off, 8–15 off, 0–7 on, 8–15 on.\n');
console.log('Created 34 cable assets; all connected edge seams verified.');
