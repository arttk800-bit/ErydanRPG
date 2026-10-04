// Battle-state factory. Existing runtime state is migrated here incrementally.
export function createCombatState(defaultConfig){
 return {cfg:structuredClone(defaultConfig),units:[],terrain:{},order:[],idx:0,round:1,over:false,auto:false,speed:1,log:[],fullLog:[]};
}
