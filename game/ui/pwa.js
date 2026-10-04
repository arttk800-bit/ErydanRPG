const BUILD=window.EIRDAN_BUILD||"unknown";
const VERSION_URL=new URL("./build.json",import.meta.url).href;
const bar=()=>document.getElementById("bootBar"),status=()=>document.getElementById("bootStatus"),boot=()=>document.getElementById("bootScreen");
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function progress(n,msg){if(bar())bar().style.width=n+"%";if(status())status().textContent=msg}
function enterGame(msg){progress(100,msg||("Eirdan · "+BUILD));setTimeout(()=>boot()?.classList.add("hidden"),180)}
async function cleanup(){try{if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}}catch(e){console.warn(e)}try{if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}}catch(e){console.warn(e)}}
async function getJson(url,timeout=4500){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeout);try{const r=await fetch(url,{cache:"no-store",signal:ctrl.signal});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(timer)}}
async function remoteBuild(){const u=new URL(VERSION_URL);u.searchParams.set("_",Date.now());const data=await getJson(u);if(!data.build)throw new Error("version marker missing");return data}
function showUpdateNotice(latest){localStorage.setItem("eirdan-update-available",latest);progress(100,"Доступна "+latest+" · игра запускается");setTimeout(()=>boot()?.classList.add("hidden"),260)}
async function startEirdan(){
 progress(10,"Подготовка…");await cleanup();
 progress(45,"Проверка версии…");
 try{
   const remote=await remoteBuild();
   if(remote.build!==BUILD){showUpdateNotice(remote.build);return}
   localStorage.removeItem("eirdan-update-available");
   localStorage.setItem("eirdan-build",BUILD);
   enterGame("Eirdan · "+BUILD);
 }catch(e){
   console.warn("version check unavailable",e);
   progress(100,"Сервер версии недоступен · запуск текущей сборки");
   await wait(350);boot()?.classList.add("hidden");
 }
}
window.EirdanUpdater={
 async check(){
   progress(20,"Проверка обновлений…");boot()?.classList.remove("hidden");
   try{const remote=await remoteBuild();if(remote.build===BUILD){enterGame("Установлена актуальная версия · "+BUILD);return {current:true,build:BUILD}}showUpdateNotice(remote.build);return {current:false,build:remote.build}}catch(e){progress(100,"Не удалось проверить обновления");await wait(650);boot()?.classList.add("hidden");return {error:String(e)}}
 },
 reload(){
   const u=new URL("./index.html",location.href);u.searchParams.set("_update",Date.now());location.replace(u.toString())
 }
};
if(document.readyState==="complete")startEirdan();else window.addEventListener("load",startEirdan,{once:true});
