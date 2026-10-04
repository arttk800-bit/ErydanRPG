// Pure attack calculations. Random damage application remains in damage.js migration step.
export function hitChance({attacker,target,weapon,part,partData,distance,coverPenalty=0}){
 const rangePenalty=weapon.type==='bow'?Math.max(0,distance-2)*8:0;
 const fatigue=attacker.st<25?20:attacker.st<50?8:0;
 const cover=weapon.type==='bow'?coverPenalty:0;
 const prepared=target.prepared?15:0;
 return Math.max(5,Math.min(95,attacker.skill+weapon.acc-target.def-rangePenalty-fatigue-cover-prepared+(part?partData[part].mod:0)));
}
