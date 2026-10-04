// Armor rules boundary. Full armor mutation is migrated with damage to preserve exact combat parity.
export function armorSlotForPart(part){
 return part==='head'?'armorHead':part==='torso'||part.includes('arm')||part.includes('leg')?'armorBody':null;
}
export function armorCoverageForPart(target,part){
 return part==='head'||part==='torso'?1:part.includes('arm')?target.armCover:target.legCover;
}
