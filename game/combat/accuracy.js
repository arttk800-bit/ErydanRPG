import {PARTS} from './body-parts.js';import {hexDistance} from '../core/hex-grid.js';
export function activeWeapon(a,t){return a.cls==='archer'&&hexDistance(a,t)<=1?'dagger':a.w;}
export function hitChance(a,t,weapons,{part=null,weaponKey=null,pressurePenalty=0}={}){const wk=weaponKey??activeWeapon(a,t),x=weapons[wk],d=hexDistance(a,t),pen=x.type==='bow'?Math.max(0,d-2)*8:0,fat=a.st<25?20:a.st<50?8:0,aim=part?(PARTS[part]?.aimMod??0):0,r=(a.resolve??100)<50?Math.ceil((50-(a.resolve??100))/5):0;return Math.max(5,Math.min(95,a.skill+x.acc-(t.def??0)-pen-fat+aim-pressurePenalty-r));}
