// ============================================================================
// MODULE CATALOG
// Registers Eirdan runtime modules and their dependency/ownership metadata.
// ============================================================================
import {ModuleRegistry} from '../core/modules/registry.js';

ModuleRegistry.register({id:'campaign',label:'Кампания',enabledByDefault:true,owns:['world','map','travel','character','inventory','knowledge']});
ModuleRegistry.register({id:'combat',label:'Боевая система',enabledByDefault:false,dependsOn:['campaign'],owns:['combat','ai']});
ModuleRegistry.register({id:'combat-lab',label:'Combat Lab',enabledByDefault:false,dependsOn:['combat'],kind:'tool'});

export {ModuleRegistry};
