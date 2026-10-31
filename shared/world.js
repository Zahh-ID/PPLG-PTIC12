export const VERSION = 1;
export const TILE = 16;
export const WIDTH = 160;
export const HEIGHT = 34;
export const SPAWN = { x: 320, y: 416 };
export const STOCK = { switch: 8, wire: 128, and: 8, or: 8, not: 8, lamp: 8, door: 4, block: 64 };
export const key = (x, y) => `${x},${y}`;
export const size = kind => kind === 'door' ? [1, 4] : ['and', 'or', 'not'].includes(kind) ? [2, 3] : [1, 1];
export function cells(device) {
  const [w, h] = size(device.kind), result = [];
  for (let y = device.y; y < device.y + h; y++) for (let x = device.x; x < device.x + w; x++) result.push(key(x, y));
  return result;
}
export function editable(device) {
  return cells(device).every(cell => { const [x,y] = cell.split(',').map(Number); return x >= 12 && x < 110 && y >= 17 && y < 29; });
}
export function example() {
  const items = [{kind:'switch',x:22,y:21},{kind:'switch',x:22,y:27},{kind:'and',x:30,y:23},{kind:'door',x:38,y:25}];
  const wire = (x,y) => items.push({kind:'wire',x,y});
  for(let x=23;x<=29;x++) wire(x,21);
  wire(29,22); wire(29,23);
  for(let x=23;x<=28;x++) wire(x,27);
  wire(28,26); wire(28,25); wire(29,25);
  for(let x=32;x<=37;x++) wire(x,23);
  wire(37,24); wire(37,25);
  return items;
}
// Four-way wires form nets; device ports are directional. Gate inputs are
// immediately left of its top/bottom cells; output is immediately right at top.
// Reject feedback loops, even if their current values would happen to settle.
export function evaluate(devices) {
  const wires = new Map(devices.filter(d=>d.kind==='wire').map(d=>[key(d.x,d.y),d]));
  const nets = new Map(), netMembers = [];
  for (const start of wires.keys()) {
    if(nets.has(start)) continue;
    const id = netMembers.length, stack=[start], members=[];
    nets.set(start,id);
    while(stack.length) {
      const k=stack.pop(); members.push(k);
      const [x,y]=k.split(',').map(Number);
      for(const n of [key(x-1,y),key(x+1,y),key(x,y-1),key(x,y+1)]) if(wires.has(n)&&!nets.has(n)){nets.set(n,id);stack.push(n);}
    }
    netMembers.push(members);
  }
  const sources = new Map(), gates=devices.filter(d=>['and','or','not'].includes(d.kind));
  for(const d of devices.filter(d=>d.kind==='switch'||gates.includes(d))) {
    const n=nets.get(key(d.x+size(d.kind)[0],d.y));
    if(n!==undefined) { if(!sources.has(n)) sources.set(n,[]); sources.get(n).push(d); }
  }
  const values = {}, visiting=new Set(), done=new Set();
  function signal(x,y) { const n=nets.get(key(x,y)); return n!==undefined && (sources.get(n)||[]).map(value).some(Boolean); }
  function value(d) {
    if(done.has(d.id)) return values[d.id];
    if(visiting.has(d.id)) throw new Error('Circuit feedback loop: remove a wire to break the cycle.');
    visiting.add(d.id);
    let out=false;
    if(d.kind==='switch') out=!!d.on;
    else if(gates.includes(d)) {
      const a=signal(d.x-1,d.y), b=d.kind==='not'?false:signal(d.x-1,d.y+2);
      out=d.kind==='and'?a&&b:d.kind==='or'?a||b:!a;
    } else if(d.kind==='lamp'||d.kind==='door') out=signal(d.x-1,d.y);
    visiting.delete(d.id);done.add(d.id);values[d.id]=out; return out;
  }
  for(const d of devices) if(d.kind!=='wire') value(d);
  for(const [i,members] of netMembers.entries()) {
    const on=(sources.get(i)||[]).map(value).some(Boolean);
    for(const k of members) values[wires.get(k).id]=on;
  }
  return values;
}
