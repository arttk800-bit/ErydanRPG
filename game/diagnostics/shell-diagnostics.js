export async function runShellDiagnostics({session,persistenceSupported}={}){
 const checks=[
  ['DOM shell',!!document.getElementById('app')],
  ['History API',!!history?.pushState],
  ['Local storage',(()=>{try{localStorage.setItem('__eirdan_test','1');localStorage.removeItem('__eirdan_test');return true}catch{return false}})()],
  ['IndexedDB',!!persistenceSupported],
  ['Service Worker','serviceWorker' in navigator],
  ['Fullscreen','fullscreenEnabled' in document],
  ['Session schema',!session||!!(session.meta?.worldId&&session.session?.hostPlayerId&&session.entities&&session.world)]
 ];
 return {ok:checks.every(([,ok])=>ok),at:new Date().toISOString(),checks};
}
