// Combat spatial rules. Pure functions: no DOM and no global battle state.
export const dirs=()=>[[1,0],[-1,0],[0,1],[0,-1]];
export const hd=(q1,r1,q2,r2)=>Math.abs(q1-q2)+Math.abs(r1-r2);
export const distance=(a,b)=>hd(a.q,a.r,b.q,b.r);
export function neighbors(q,r,grid){
 return dirs().map(d=>[q+d[0],r+d[1]]).filter(p=>p[0]>=0&&p[0]<grid.C&&p[1]>=0&&p[1]<grid.R);
}
export const isBlockedTerrain=t=>['rock','tree'].includes(t);
export function movementCost(unit){
 const legs=['lleg','rleg'].map(k=>unit.body[k]);
 const crippled=legs.filter(x=>x.hp<=0).length;
 return crippled?{ap:4,st:18}:{ap:unit.st<25?3:2,st:8};
}
