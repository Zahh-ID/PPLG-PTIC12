export function circuitPlan(spec){
 if(['and-not-b','or-not-b','xor-not-b','not-a-and-b'].includes(spec.type)){const input=spec.type==='not-a-and-b'?'A':'B',other=input==='A'?'B':'A',gate=spec.type.startsWith('or-')?'or':spec.type.startsWith('xor-')?'xor':'and';return{gates:[[34,'not'],[37,gate]],links:[[input+'.out','g34.a'],[other+'.out','g37.a'],['g34.out','g37.b'],['g37.out','Y.in']]};}
 if(spec.type==='xor-then-not')return{gates:[[34,'xor'],[37,'not']],links:[['A.out','g34.a'],['B.out','g34.b'],['g34.out','g37.a'],['g37.out','Y.in']]};
 const composed=['combined','nand-only-and','double-not'].includes(spec.type);
 const gates=[[34,spec.type==='double-not'?'not':composed?'nand':spec.type]],links=[['A.out','g34.a']];
 if(!spec.unary)links.push(['B.out','g34.b']);
 if(composed){gates.push([37,spec.type==='nand-only-and'?'nand':'not']);links.push(['g34.out','g37.a']);if(spec.type==='nand-only-and')links.push(['g34.out','g37.b']);links.push(['g37.out','Y.in']);}
 else links.push(['g34.out','Y.in']);
 return{gates,links};
}
