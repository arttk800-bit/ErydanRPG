// ============================================================================
// MODULE REGISTRY
// Owns module metadata, enabled state resolution and dependency validation.
// It does not import domain implementations; ModuleRuntime owns loading.
// ============================================================================
const registry=new Map();

function validate(def){if(!def?.id||typeof def.id!=='string')throw new Error('Module id required');if(registry.has(def.id))throw new Error('Duplicate module '+def.id);return Object.freeze({enabledByDefault:true,dependsOn:[],...def})}
function stateEntry(state,id){state.modules??={};return state.modules[id]??=( {enabled:registry.get(id)?.enabledByDefault!==false} )}

export const ModuleRegistry={
 register(def){const module=validate(def);registry.set(module.id,module);return module},
 get(id){return registry.get(id)||null},
 list(){return [...registry.values()]},
 enabled(state,id){const m=registry.get(id);if(!m)return false;const configured=state?.modules?.[id]?.enabled;return configured==null?m.enabledByDefault:configured!==false},
 setEnabled(state,id,enabled){
  const module=registry.get(id);if(!module)throw new Error('Unknown module '+id);
  if(enabled)for(const dep of module.dependsOn||[]){if(!this.enabled(state,dep))throw new Error('Module '+id+' requires enabled dependency '+dep)}
  else for(const candidate of registry.values()){if(this.enabled(state,candidate.id)&&(candidate.dependsOn||[]).includes(id))throw new Error('Cannot disable '+id+' while '+candidate.id+' is enabled')}
  stateEntry(state,id).enabled=Boolean(enabled);return stateEntry(state,id).enabled;
 },
 resolve(state){const active=[],visiting=new Set(),done=new Set();const visit=id=>{if(done.has(id))return;const m=registry.get(id);if(!m||!this.enabled(state,id))return;if(visiting.has(id))throw new Error('Module dependency cycle at '+id);visiting.add(id);for(const dep of m.dependsOn||[]){if(!this.enabled(state,dep))throw new Error('Enabled module '+id+' requires disabled dependency '+dep);visit(dep)}visiting.delete(id);done.add(id);active.push(m)};for(const m of registry.values())visit(m.id);return active}
};
