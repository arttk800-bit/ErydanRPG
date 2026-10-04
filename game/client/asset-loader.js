const CACHE='eirdan-assets-v1';
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
export async function preloadStartupAssets({onProgress}={}){
 const cache='caches' in window?await caches.open(CACHE):null,total=STARTUP_ASSETS.length;let loaded=0;
 for(const relative of STARTUP_ASSETS){
  const url=absolute(relative),request=new Request(url,{cache:'default'});
  let response=cache?await cache.match(request):null;
  if(!response){response=await fetch(request);if(!response.ok)throw new Error('asset '+relative+' '+response.status);if(cache)await cache.put(request,response.clone())}
  await decodeImage(response.clone(),relative);loaded++;onProgress?.({loaded,total,ratio:loaded/total,asset:relative});
 }
 return{loaded,total};
}
