const registry=new Map();
function validate(def){if(!def?.id||typeof def.id!=='string')throw new Error('Module id required');if(registry.has(def.id))throw new Error('Duplicate module '+def.id);return Object.freeze({enabledByDefault:true,dependsOn:[],...def})}
export const ModuleRegistry={
 register(def){const module=validate(def);registry.set(module.id,module);return module},
 get(id){return registry.get(id)||null},
 list(){return [...registry.values()]},
 enabled(state,id){const m=registry.get(id);if(!m)return false;const configured=state?.modules?.[id]?.enabled;return configured==null?m.enabledByDefault:configured!==false},
 resolve(state){const active=[],visiting=new Set(),done=new Set();const visit=id=>{if(done.has(id))return;const m=registry.get(id);if(!m||!this.enabled(state,id))return;if(visiting.has(id))throw new Error('Module dependency cycle at '+id);visiting.add(id);for(const dep of m.dependsOn||[])visit(dep);visiting.delete(id);done.add(id);active.push(m)};for(const m of registry.values())visit(m.id);return active}
};
