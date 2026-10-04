import {actionDiagnostics} from './action-diagnostics.js';
import {runTravelDiagnostics} from './travel-diagnostics.js';
import {runUiSmokeDiagnostics} from './ui-smoke-diagnostics.js';

export async function runShellDiagnostics({session,persistenceSupported,updateManager,installedBuild,remoteBuild,swRegistration}={}){
 let remote=null,remoteError=null;
 try{remote=remoteBuild?await remoteBuild():null}catch(e){remoteError=String(e)}
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
  ['Session schema',!session||!!(session.meta?.worldId&&session.session?.hostPlayerId&&session.entities&&session.world)]
 ];
 const travel=runTravelDiagnostics();for(const [name,ok] of travel.checks)checks.push(['Travel: '+name,ok]);
 const ui=await runUiSmokeDiagnostics();for(const [name,ok] of ui.checks)checks.push(['UI: '+name,ok]);
 const actions=actionDiagnostics.snapshot();
 return {ok:checks.every(([,ok])=>ok),at:new Date().toISOString(),checks,actions,travel,ui,update:{state:updateManager?.state||null,busy:updateManager?.busy||false,installed:installedBuild||null,remote,error:remoteError,worker:{installing:swRegistration?.installing?.state||null,waiting:swRegistration?.waiting?.state||null,active:swRegistration?.active?.state||null,controller}}};
}
function storageCheck(){try{localStorage.setItem('__eirdan_test','1');localStorage.removeItem('__eirdan_test');return true}catch{return false}}
