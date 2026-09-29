const CACHE='eyrdan-v4.2-shell';
const SHELL=['/','/index.html','/manifest.webmanifest','/icon.svg','/icon-maskable.svg'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(SHELL.map(url=>new Request(url,{cache:'reload'}))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/portrait/')) return;

  const isNavigation=e.request.mode==='navigate' || u.pathname==='/' || u.pathname==='/index.html';

  if(isNavigation){
    e.respondWith(
      fetch(new Request(e.request,{cache:'no-store'}))
        .then(r=>{
          if(r && r.ok){
            const copy=r.clone();
            caches.open(CACHE).then(c=>c.put('/index.html',copy));
          }
          return r;
        })
        .catch(()=>caches.match('/index.html'))
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(r=>{
        if(r && r.ok){
          const copy=r.clone();
          caches.open(CACHE).then(c=>c.put(e.request,copy));
        }
        return r;
      })
      .catch(()=>caches.match(e.request))
  );
});
