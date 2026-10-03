import {physicalAttack,spellAttack,canAct,spendAP} from './actions.js';
export const SKILL_IDS=Object.freeze({ATTACK:'attack',AIM:'aim',HEAVY:'heavy',BASH:'bash',SWEEP:'sweep',DIVINE:'divine',FLAME:'flame',FIREBALL:'fireball',WAVE:'wave',LIGHTNING:'lightning',BANDAGE:'bandage',CONCENTRATE:'concentrate',DISENGAGE:'disengage',END:'end'});
export function useHeavy(state,a,t,ctx){return physicalAttack(state,a,t,{...ctx,cost:ctx.cost??5,mult:ctx.mult??1.35});}
export function useAim(state,a,t,part,ctx){return physicalAttack(state,a,t,{...ctx,part,cost:ctx.cost??5});}
export function useSpell(state,a,t,ctx){return spellAttack(state,a,t,ctx);}
export function bandage(a){if(!canAct(a,4))return{ok:false,reason:'ap'};if((a.bandages??0)<=0)return{ok:false,reason:'bandage'};spendAP(a,4);a.bandages--;for(const p of Object.values(a.body??{}))p.bleed=0;a.bleed=0;return{ok:true};}
