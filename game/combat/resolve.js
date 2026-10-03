export function ensureResolve(u){if(u.resolve==null){u.resolve=100;u.maxResolve=100;u.panic=false;}return u;}
export function changeResolve(u,delta){ensureResolve(u);const old=u.resolve;u.resolve=Math.max(0,Math.min(100,u.resolve+delta));u.panic=u.resolve<=15;return u.resolve-old;}
export function resolveState(u){ensureResolve(u);return u.resolve<=15?'panic':u.resolve<=30?'broken':u.resolve<=50?'suppressed':u.resolve<=70?'tense':'steady';}
export function damageResolveLoss(target,damage,round){
 const maxHp=Math.max(1,Number(target?.maxHp||target?.maxhp||90)),pct=Math.max(0,damage)/maxHp*100;
 const base=Math.min(16,4+Math.floor(Math.max(0,damage)/5));let shock=0;
 if(pct>=40)shock=10;else if(pct>=30)shock=6;else if(pct>=20)shock=3;else if(pct>=10)shock=1;
 let arr=Array.isArray(target._recentWounds)?target._recentWounds.filter(x=>round-x<=4):[];
 const stack=Math.min(.20,arr.length*.05);
 const loss=Math.min(24,Math.max(1,Math.round((base+shock)*(1+stack))));
 if(pct>=10)arr.push(round);target._recentWounds=arr;return loss;
}
