// ============================================================================
// SHELL DIAGNOSTICS
// Aggregates read-only domain diagnostics. Domain rules stay in their owners.
// ============================================================================
import {actionDiagnostics} from './action-diagnostics.js';
import {runTravelDiagnostics} from './travel-diagnostics.js';
import {runMapDiagnostics} from './map-diagnostics.js';
import {runUiSmokeDiagnostics} from './ui-smoke-diagnostics.js';
import {runStateDiagnostics} from './state-diagnostics.js';
import {runWorldDiagnostics} from './world-diagnostics.js';
import {runPwaDiagnostics} from './pwa-diagnostics.js';
import {audioDiagnosticSnapshot} from '../audio/diagnostics.js';
import {runtimeTrace} from './runtime-trace.js';
import {assetCacheStatus} from '../client/asset-cache.js';

export async function runShellDiagnostics({session,persistenceSupported,updateManager,installedBuild,remoteBuild,swRegistration,audio}={}){
 const checks=[
  ['DOM shell',!!document.getElementById('app')],
  ['Main menu action targets',document.querySelectorAll('[data-action]').length>0],
  ['History API',!!history?.pushState],
  ['Local storage',storageCheck()]
 ];
 const state=runStateDiagnostics(session,{persistenceSupported});
 for(const [name,ok] of state.checks)checks.push(['State: '+name,ok]);
 const world=runWorldDiagnostics(session);
 for(const [name,ok] of world.checks)checks.push(['World: '+name,ok]);
 const pwa=await runPwaDiagnostics({updateManager,installedBuild,remoteBuild,swRegistration,assetCacheStatus});
 for(const [name,ok] of pwa.checks)checks.push(['PWA: '+name,ok]);
 const audioState=audioDiagnosticSnapshot(audio);
 checks.push(['Audio: diagnostic snapshot',!!audioState&&typeof audioState==='object']);
 const map=runMapDiagnostics();for(const [name,ok] of map.checks)checks.push(['Map: '+name,ok]);
 const travel=runTravelDiagnostics();for(const [name,ok] of travel.checks)checks.push(['Travel: '+name,ok]);
 const ui=await runUiSmokeDiagnostics();for(const [name,ok] of ui.checks)checks.push(['UI: '+name,ok]);
 const traceTest=runtimeTrace.selfTest();checks.push(['RuntimeTrace: begin/end chain',traceTest.ok]);
 runtimeTrace.checkpoint('diagnostics.complete',{checks:checks.length});
 const actions=actionDiagnostics.snapshot();
 return{ok:checks.every(([,ok])=>ok),at:new Date().toISOString(),checks,actions,state,world,pwa,audio:audioState,assets:pwa.assets,map,travel,ui,runtimeTrace:{selfTest:traceTest,eventCount:runtimeTrace.snapshot().length},update:pwa.update};
}
function storageCheck(){try{localStorage.setItem('__eirdan_test','1');localStorage.removeItem('__eirdan_test');return true}catch{return false}}
