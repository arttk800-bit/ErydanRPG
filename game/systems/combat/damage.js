import {GameRNG} from '../../alpha14p/core/rng.js';
import {armorSlotForPart,armorCoverageForPart} from './armor.js';
export function applyHit(target,part,weapon,raw){
 if(target.shield>0&&GameRNG.random()<(weapon.type==='bow'?.82:.65)){let loss=Math.max(1,Math.round(raw*weapon.sd));target.shield=Math.max(0,target.shield-loss);return{kind:'shield',damage:0,shield:loss}}
 let slot=armorSlotForPart(part),bodyDamage=raw,armorLoss=0;
 if(slot&&target[slot]>0&&GameRNG.random()<armorCoverageForPart(target,part)){let max='max'+slot[0].toUpperCase()+slot.slice(1),ratio=target[slot]/Math.max(1,target[max]),pen=Math.min(.7,(weapon.pen||.1)+(1-ratio)*.45);bodyDamage=Math.max(1,Math.round(raw*pen));armorLoss=Math.min(target[slot],Math.max(1,Math.round(raw*(weapon.ad||.5))));target[slot]=Math.max(0,target[slot]-armorLoss)}
 if(target.prepared)bodyDamage=Math.max(1,Math.round(bodyDamage*.8));let before=target.body[part].hp;target.body[part].hp=Math.max(0,before-bodyDamage);target.hp=Math.max(0,target.hp-bodyDamage);if(before>0&&target.body[part].hp<=0&&['larm','rarm','lleg','rleg'].includes(part))target.bleed=Math.min(12,(target.bleed||0)+2);if(target.hp<=0||target.body.head.hp<=0||target.body.torso.hp<=0)target.alive=false;return{kind:'body',damage:bodyDamage,armor:armorLoss}
}
