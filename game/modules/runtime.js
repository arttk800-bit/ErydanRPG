// ============================================================================
// MODULE RUNTIME
// Single composition boundary for conditionally loading enabled game modules.
// Disabled modules are not imported or evaluated by the campaign runtime.
// ============================================================================
import {ModuleRegistry} from './index.js';

const loaders={
 campaign:()=>import('./campaign.js'),
 combat:()=>import('./combat.js'),
 'combat-lab':()=>import('./combat-lab.js')
};

export const ModuleRuntime={
 active(state){return ModuleRegistry.resolve(state)},
 async load(state,id){
  if(!ModuleRegistry.enabled(state,id))return null;
  const active=new Set(ModuleRegistry.resolve(state).map(module=>module.id));
  if(!active.has(id))return null;
  const loader=loaders[id];
  if(!loader)throw new Error('No runtime loader for module '+id);
  return loader();
 },
 async mount(state,id,context={}){
  const module=await this.load(state,id);
  if(!module)return ()=>{};
  return typeof module.mount==='function'?await module.mount(state,context):()=>{};
 }
};
