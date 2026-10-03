import {applyPartDamage,syncBleed,randomPart} from './body-parts.js';
import {changeResolve,damageResolveLoss} from './resolve.js';
import {markDead} from '../core/turn-manager.js';
export const ELEMENT_MOD={fire:{light:.80,medium:.95,heavy:.90},lightning:{light:.75,medium:1.15,heavy:1.30},holy:{light:1,medium:1,heavy:1}};
export function armorSlot(t,p){
 if(p==='head')return{key:'armorHead',max:'maxArmorHead',cover:1};
 if(p==='torso')return{key:'armorBody',max:'maxArmorBody',cover:1};
 if(p==='larm'||p==='rarm')return{key:'armorBody',max:'maxArmorBody',cover:t.armCover};
 if(p==='lleg'||p==='rleg')return{key:'armorBody',max:'maxArmorBody',cover:t.legCover};return null;
}
export function physicalBleedChance(wk,d){const base={sword:.13,axe:.17,spear:.15,bow:.12,dagger:.16,crossbow:.15,greatsword:.20,greataxe:.24,throwknife:.15,bite:.14}[wk]||.05;return Math.min(.38,base+Math.max(0,d-10)*.006);}
function finish(state,a,t,d){t.hp=Math.max(0,Math.min(t.maxHp,t.hp));changeResolve(t,-damageResolveLoss(t,d,state.round));changeResolve(a,Math.min(5,1+Math.floor(d/10)));if(t.lethal||t.hp<=0)markDead(state,t);}
export function physicalHit(state,a,t,p,wk,w,{mult=1,crit=false,rng=Math.random}={}){
 const fat=a.st<25?.7:a.st<50?.88:1,armPenalty=(a.body?.rarm&&a.body.rarm.hp<=0&&!a.body.rarm.severed)?.5:1,rage=a.buffs?.rage>0?1.30:1;
 const raw=Math.max(1,Math.round((w.min+rng()*(w.max-w.min))*fat*mult*(crit?1.6:1)*armPenalty*rage));
 if(t.shield>0&&rng()<(w.type==='bow'?.82:.65)){const sd=Math.max(1,Math.round(raw*(w.sd||1)));t.shield=Math.max(0,t.shield-sd);return{raw,shieldDamage:sd,damage:0};}
 const slot=armorSlot(t,p);let d=raw,armorDamage=0,blocked=0;
 if(slot&&t[slot.key]>0&&rng()<slot.cover){const ratio=t[slot.key]/Math.max(1,t[slot.max]),pen=Math.min(.75,(w.pen||.1)+(1-ratio)*.40);d=Math.max(1,Math.round(raw*pen));blocked=raw-d;armorDamage=Math.max(1,Math.round(raw*(w.ad||.5)));t[slot.key]=Math.max(0,t[slot.key]-armorDamage);}
 if(t.guarding)d=Math.max(1,Math.round(d*.5));if(t.buffs?.stone>0)d=Math.max(1,Math.round(d*.7));
 const part=applyPartDamage(t,p,d);t.hp=Math.max(0,t.hp-d);
 if(d>=4&&rng()<physicalBleedChance(wk,d))t.body[p].bleed=Math.min(6,(t.body[p].bleed||0)+(d>=20?2:1));
 if(part?.newlyCrippled&&['larm','rarm','lleg','rleg'].includes(p))t.body[p].bleed=Math.min(6,(t.body[p].bleed||0)+2);
 if(t.body[p]?.hp<=0&&part?.before<=0&&['larm','rarm','lleg','rleg'].includes(p)&&!t.body[p].severed&&(wk==='sword'||wk==='axe')&&rng()<(wk==='axe'?.65:.35)){t.body[p].severed=true;t.body[p].bleed=Math.min(8,(t.body[p].bleed||0)+5);}
 syncBleed(t);finish(state,a,t,d);return{raw,damage:d,blocked,armorDamage,part:p};
}
export function magicHit(state,a,t,base,{mult=1,label='Магия',element='arcane',spellPower=1,rng=Math.random}={}){
 const p=randomPart(rng),raw=Math.max(1,Math.round(base*spellPower*mult)),slot=armorSlot(t,p);let mod=1,covered=false;
 if(element!=='arcane'&&slot&&t[slot.key]>0&&rng()<slot.cover){covered=true;mod=ELEMENT_MOD[element]?.[t.armorKind]??1;}
 if(element==='holy'&&(t.species==='undead'||t.undead===true))mod*=2;
 let d=Math.max(1,Math.round(raw*mod));if(t.buffs?.stone>0)d=Math.max(1,Math.round(d*.7));
 applyPartDamage(t,p,d);t.hp=Math.max(0,t.hp-d);finish(state,a,t,d);return{raw,damage:d,part:p,covered,modifier:mod};
}
