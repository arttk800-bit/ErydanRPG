// ============================================================================
// PWA DIAGNOSTICS
// Read-only PWA/update/cache health adapter. Client systems own behavior.
// ============================================================================
export async function runPwaDiagnostics({updateManager,installedBuild,remoteBuild,swRegistration,assetCacheStatus}={}){
 let remote=null,remoteError=null,assets=null,assetError=null;
 try{remote=remoteBuild?await remoteBuild():null}catch(error){remoteError=String(error)}
 try{assets=assetCacheStatus?await assetCacheStatus():null}catch(error){assetError=String(error)}
 const controller=!!navigator.serviceWorker?.controller;
 const checks=[
  ['Service Worker API','serviceWorker' in navigator],
  ['Service Worker controller',controller],
  ['Service Worker registration',!!swRegistration],
  ['Update manager',!!updateManager],
  ['Update lock idle',!updateManager?.busy],
  ['Installed build metadata',!!(installedBuild?.version&&installedBuild?.build)],
  ['Remote build reachable',!!remote&&!remoteError],
  ['Asset manifest/cache',!!assets?.ok&&!assetError]
 ];
 return{ok:checks.every(([,ok])=>ok),checks,assets:{...assets,error:assetError},update:{state:updateManager?.state||null,busy:updateManager?.busy||false,installed:installedBuild||null,remote,error:remoteError,worker:{installing:swRegistration?.installing?.state||null,waiting:swRegistration?.waiting?.state||null,active:swRegistration?.active?.state||null,controller}}};
}
