import {actionDiagnostics} from './action-diagnostics.js';
import {runTravelDiagnostics} from './travel-diagnostics.js';
import {runMapDiagnostics} from './map-diagnostics.js';
import {runUiSmokeDiagnostics} from './ui-smoke-diagnostics.js';
import {runtimeTrace} from './runtime-trace.js';
import {assetCacheStatus} from '../client/asset-cache.js';

export async function runShellDiagnostics({session,persistenceSupported,updateManager,installedBuild,remoteBuild,swRegistration}={}){
 let remote=null,remoteError=null,assets=null,assetError=null;
 try{remote=remoteBuild?await remoteBuild():null}catch(e){remoteError=String(e)}
 try{assets=await assetCacheStatus()}catch(e){assetError=String(e)}
 const controller=!!navigator.serviceWorker?.controller;
 const checks=[
  ['DOM shell',!!document.getElementById('app')],
  ['Main menu action targets',document.querySelectorAll('[data-action]').length>0],
  ['History API',!!history?.pushState],
  ['Local storage',storageCheck()],
  ['IndexedDB',!!persistenceSupported],
  ['Service Worker API','serviceWorker' in navigator],
  ['Service Worker controller',controller],
  ['Service Worker registration',!!swRegistration],
  ['Update manager',!!updateManager],
  ['Update lock idle',!updateManager?.busy],
  ['Installed build metadata',!!(installedBuild?.version&&installedBuild?.build)],
  ['Remote build reachable',!!remote&&!remoteError],
  ['Asset manifest/cache',!!assets?.ok&&!assetError],
  ['Session schema',!session||!!(session.meta?.worldId&&session.session?.hostPlayerId&&session.entities&&session.world)]
 ];
 const map=runMapDiagnostics();for(const [name,ok] of map.checks)checks.push(['Map: '+name,ok]);
 const travel=runTravelDiagnostics();for(const [name,ok] of travel.checks)checks.push(['Travel: '+name,ok]);
 const ui=await runUiSmokeDiagnostics();for(const [name,ok] of ui.checks)checks.push(['UI: '+name,ok]);
 const traceTest=runtimeTrace.selfTest();checks.push(['RuntimeTrace: begin/end chain',traceTest.ok]);runtimeTrace.checkpoint('diagnostics.complete',{checks:checks.length});
 const actions=actionDiagnostics.snapshot();
 return {ok:checks.every(([,ok])=>ok),at:new Date().toISOString(),checks,actions,assets:{...assets,error:assetError},map,travel,ui,runtimeTrace:{selfTest:traceTest,eventCount:runtimeTrace.snapshot().length},update:{state:updateManager?.state||null,busy:updateManager?.busy||false,installed:installedBuild||null,remote,error:remoteError,worker:{installing:swRegistration?.installing?.state||null,waiting:swRegistration?.waiting?.state||null,active:swRegistration?.active?.state||null,controller}}};
}
function storageCheck(){try{localStorage.setItem('__eirdan_test','1');localStorage.removeItem('__eirdan_test');return true}catch{return false}}
