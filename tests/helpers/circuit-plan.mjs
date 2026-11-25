export function circuitPlan(spec){
 const composed=['combined','nand-only-and'].includes(spec.type);
 const gates=[[34,composed?'nand':spec.type]],links=[['A.out','g34.a']];
 if(!spec.unary)links.push(['B.out','g34.b']);
 if(composed){gates.push([37,spec.type==='combined'?'not':'nand']);links.push(['g34.out','g37.a']);if(spec.type==='nand-only-and')links.push(['g34.out','g37.b']);links.push(['g37.out','Y.in']);}
 else links.push(['g34.out','Y.in']);
 return{gates,links};
}
