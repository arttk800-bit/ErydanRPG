export const STARTUP_ASSETS=[
 '../assets/world/eirdan-world-map-regions-final.png',
 '../assets/world/eirdan-world-region-index-final.png',
 '../assets/regions/region-central-lands.png',
 '../assets/locations/city-01-central-lands.png'
];
function absolute(url){return new URL(url,import.meta.url).href}
async function decodeImage(response,url){
 const blob=await response.blob(),objectUrl=URL.createObjectURL(blob);
 try{const img=new Image();img.decoding='async';img.src=objectUrl;await img.decode()}finally{URL.revokeObjectURL(objectUrl)}
 return url;
}
export async function preloadStartupAssets({build='dev',onProgress}={}){
 const cacheName='eirdan-assets-'+String(build).replace(/[^a-z0-9._-]/gi,'_'),cache='caches' in window?await caches.open(cacheName):null,total=STARTUP_ASSETS.length;let loaded=0;
 if('caches' in window)for(const key of await caches.keys())if(key.startsWith('eirdan-assets-')&&key!==cacheName)await caches.delete(key);
 for(const relative of STARTUP_ASSETS){
  const url=absolute(relative),request=new Request(url,{cache:'default'});
  let response=cache?await cache.match(request):null;
  if(!response){response=await fetch(request);if(!response.ok)throw new Error('asset '+relative+' '+response.status);if(cache)await cache.put(request,response.clone())}
  await decodeImage(response.clone(),relative);loaded++;onProgress?.({loaded,total,ratio:loaded/total,asset:relative});
 }
 return{loaded,total};
}
