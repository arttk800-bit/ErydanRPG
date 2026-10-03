const BUILD="diagnostic-24";
const bar=()=>document.getElementById("bootBar"),status=()=>document.getElementById("bootStatus"),boot=()=>document.getElementById("bootScreen");
function progress(n,msg){if(bar())bar().style.width=n+"%";if(status())status().textContent=msg}
async function clearOldCaches(){if(!("caches" in window))return;for(const key of await caches.keys())await caches.delete(key)}
async function startEirdan(){
 progress(12,"Проверка версии…");
 try{
  const seen=localStorage.getItem("eirdan-build");
  if(seen!==BUILD){
   progress(28,"Найдена новая версия · "+BUILD);
   await clearOldCaches();
   if("serviceWorker" in navigator){
    const regs=await navigator.serviceWorker.getRegistrations();
    for(const reg of regs)await reg.unregister();
   }
   localStorage.setItem("eirdan-build",BUILD);
   const url=new URL(location.href);
   if(url.searchParams.get("build")!==BUILD){progress(52,"Обновление файлов…");url.searchParams.set("build",BUILD);location.replace(url.toString());return}
  }
  progress(72,"Загрузка ресурсов…");
  if("serviceWorker" in navigator){
   const reg=await navigator.serviceWorker.register("../sw.js?v="+BUILD,{updateViaCache:"none"});
   await reg.update();
  }
  progress(100,"Eirdan · "+BUILD);
  setTimeout(()=>boot()?.classList.add("hidden"),300);
 }catch(e){console.error("Eirdan update check failed",e);progress(100,"Запуск · "+BUILD);setTimeout(()=>boot()?.classList.add("hidden"),500)}
}
window.addEventListener("load",startEirdan);
