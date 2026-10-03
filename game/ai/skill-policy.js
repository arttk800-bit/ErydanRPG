import {hexDistance} from '../core/hex-grid.js';
export function chooseUtilitySkill(state,u){
 const enemies=state.units.filter(x=>x.alive&&!x.escaped&&x.team!==u.team),friends=state.units.filter(x=>x.alive&&!x.escaped&&x.team===u.team);
 const near=enemies.filter(e=>hexDistance(u,e)<=1).length;
 if(u.cls==='archer'&&u.ap>=4&&near>0&&!u.smoke)return{type:'skill',skill:'smoke',target:u};
 if(u.cls==='priest'&&u.ap>=5&&u.mana>=20){const hurt=friends.filter(f=>f.hp/f.maxHp<.55&&hexDistance(u,f)<=5).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(hurt)return{type:'skill',skill:'heal',target:hurt};}
 if(u.cls==='guardian'&&u.ap>=4&&near>0&&!u.guarding)return{type:'guard'};
 if(u.cls==='berserker'&&u.ap>=4&&near>0&&!(u.buffs?.rage>0))return{type:'skill',skill:'rage',target:u};
 return null;
}
