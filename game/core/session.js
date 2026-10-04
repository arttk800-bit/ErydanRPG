export const SAVE_VERSION=1;
function token(){if(globalThis.crypto?.randomUUID)return crypto.randomUUID();return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
export function createSession({seed=Date.now()}={}){
 const worldId='world_'+token();
 const playerId='player_'+token();
 return {meta:{saveVersion:SAVE_VERSION,worldId,seed,createdAt:new Date().toISOString()},clock:{day:1,minute:480},session:{hostPlayerId:playerId,players:{[playerId]:{id:playerId,controlledEntities:[]}},party:{leaderPlayerId:playerId,members:[]}},entities:{characters:{},items:{},containers:{}},world:{locations:{}},relations:{},factions:{},quests:{},simulation:{},rng:{world:seed,combat:seed,loot:seed,simulation:seed}};
}