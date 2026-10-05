// ============================================================================
// FEEDBACK DEVICE INFO
// Collects non-sensitive client diagnostics only after explicit user consent.
// ============================================================================
export function collectDeviceInfo(){
 const nav=navigator,screenInfo=window.screen||{};
 const connection=nav.connection||nav.mozConnection||nav.webkitConnection;
 return {
  userAgent:nav.userAgent||null,platform:nav.userAgentData?.platform||nav.platform||null,
  language:nav.language||null,languages:Array.from(nav.languages||[]),
  mobile:nav.userAgentData?.mobile??null,logicalProcessors:nav.hardwareConcurrency||null,
  deviceMemoryGb:nav.deviceMemory||null,touchPoints:nav.maxTouchPoints||0,
  screen:{width:screenInfo.width||null,height:screenInfo.height||null,pixelRatio:window.devicePixelRatio||1,
   viewportWidth:window.innerWidth||null,viewportHeight:window.innerHeight||null},
  displayMode:matchMedia?.('(display-mode: standalone)')?.matches?'standalone':'browser',
  online:nav.onLine,connection:connection?{effectiveType:connection.effectiveType||null,downlink:connection.downlink||null,saveData:connection.saveData||false}:null,
  serviceWorker:'serviceWorker' in nav
 };
}
