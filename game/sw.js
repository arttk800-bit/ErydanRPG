const CACHE='eirdan-shell-v4';
const CORE=['./','./app/index.html','./app/shell.css','./app/bootstrap.js','./app/navigation.js','./app/lifecycle.js','./core/session.js','./core/persistence.js','./diagnostics/shell-diagnostics.js','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(CORE);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key!==CACHE)await caches.delete(key);await self.clients.claim();for(const client of await self.clients.matchAll({type:'window'}))client.postMessage({type:'UPDATE_READY'})})()));
self.addEventListener('message',event=>{if(event.data?.type==='CHECK_UPDATE')event.waitUntil(self.registration.update())});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==location.origin)return;
  if(url.pathname.endsWith('/ui/build.json')||url.pathname.endsWith('/data/version.json')){event.respondWith(fetch(event.request,{cache:'no-store'}));return}
  event.respondWith((async()=>{if(event.request.mode==='navigate'){try{const fresh=await fetch(event.request);return fresh}catch{return (await caches.match('./app/index.html'))||Response.error()}}
    const cached=await caches.match(event.request);const network=fetch(event.request).then(async fresh=>{if(fresh.ok){const cache=await caches.open(CACHE);cache.put(event.request,fresh.clone())}return fresh}).catch(()=>null);return cached||(await network)||Response.error()})())});
