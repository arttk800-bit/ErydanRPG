const CACHE='eirdan-shell-v1';
const CORE=['./','./app/index.html','./app/shell.css','./app/bootstrap.js','./app/navigation.js','./core/session.js','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(CORE);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==location.origin)return;event.respondWith((async()=>{try{const fresh=await fetch(event.request);const cache=await caches.open(CACHE);cache.put(event.request,fresh.clone());return fresh}catch{return (await caches.match(event.request))||(event.request.mode==='navigate'?await caches.match('./app/index.html'):Response.error())}})())});
