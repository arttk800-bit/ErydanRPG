export const PARTS={
 head:{name:'Голова',aimMod:-30,mult:1.55,max:12},torso:{name:'Туловище',aimMod:0,mult:1.15,max:32},
 larm:{name:'Л. рука',aimMod:-17,mult:.8,max:10},rarm:{name:'П. рука',aimMod:-17,mult:.8,max:10},
 lleg:{name:'Л. нога',aimMod:-13,mult:.85,max:13},rleg:{name:'П. нога',aimMod:-13,mult:.85,max:13}};
export function createBody(){return Object.fromEntries(Object.entries(PARTS).map(([k,p])=>[k,{name:p.name,hp:p.max,max:p.max,severed:false,bleed:0}]));}
export function randomPart(rng){const n=rng()*100;return n<8?'head':n<53?'torso':n<65?'larm':n<77?'rarm':n<89?'lleg':'rleg';}
export function applyPartDamage(u,p,d){const x=u.body[p];if(!x)return;const before=x.hp;x.hp=Math.max(0,x.hp-d);if(x.hp<=0&&(p==='head'||p==='torso'))u.lethal=p;return {before,after:x.hp,newlyCrippled:before>0&&x.hp<=0};}
export function syncBleed(u){u.bleed=Object.values(u.body).reduce((s,x)=>s+(x.bleed||0),0);return u.bleed;}
