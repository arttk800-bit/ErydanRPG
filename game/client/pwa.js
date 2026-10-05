export async function activeServiceWorkerBuild(timeout=1200){
 if(!navigator.serviceWorker?.controller)return null;
 return new Promise(resolve=>{const timer=setTimeout(()=>{navigator.serviceWorker.removeEventListener('message',onMessage);resolve(null)},timeout);function onMessage(event){if(event.data?.type!=='SW_BUILD')return;clearTimeout(timer);navigator.serviceWorker.removeEventListener('message',onMessage);resolve(event.data.build||null)}navigator.serviceWorker.addEventListener('message',onMessage);navigator.serviceWorker.controller.postMessage({type:'GET_BUILD'})});
}
export async function registerServiceWorker({url='../sw.js',scope='../'}={}){
 if(!('serviceWorker' in navigator))return null;
 return navigator.serviceWorker.register(url,{scope,updateViaCache:'none'});
}
