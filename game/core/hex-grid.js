export const COLS=14, ROWS=10;
const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function hexId(q,r){return `${LETTERS[q]??('Q'+q)}${r+1}`;}
export function inBounds(q,r){return Number.isInteger(q)&&Number.isInteger(r)&&q>=0&&q<COLS&&r>=0&&r<ROWS;}
export function neighbors(q,r){
 const dirs=q%2===0?[[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[0,1]]:[[1,1],[1,0],[0,-1],[-1,0],[-1,1],[0,1]];
 return dirs.map(([dq,dr])=>({q:q+dq,r:r+dr})).filter(p=>inBounds(p.q,p.r));
}
function cube(q,r){const x=q,z=r-(q-(q&1))/2,y=-x-z;return{x,y,z};}
export function hexDistance(a,b){const A=cube(a.q,a.r),B=cube(b.q,b.r);return Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y),Math.abs(A.z-B.z));}
export function occupied(state,q,r,ignoreId=null){return state.units.some(u=>u.alive&&!u.escaped&&u.id!==ignoreId&&u.q===q&&u.r===r);}
