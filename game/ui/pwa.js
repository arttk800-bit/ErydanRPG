const BUILD="diagnostic-31";
const bar=()=>document.getElementById("bootBar"),status=()=>document.getElementById("bootStatus"),boot=()=>document.getElementById("bootScreen");
function progress(n,msg){if(bar())bar().style.width=n+"%";if(status())status().textContent=msg}
function enterGame(msg){progress(100,msg||("Eirdan · "+BUILD));setTimeout(()=>boot()?.classList.add("hidden"),180)}
async function removeDevelopmentCaches(){
 if(!("serviceWorker" in navigator))return;
 progress(20,"Отключение старого кэша…");
 const regs=await navigator.serviceWorker.getRegistrations();
 await Promise.all(regs.map(r=>r.unregister()));
 if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}
}
async function verifyBuild(){
 progress(45,"Проверка актуальной сборки…");
 const url=new URL(location.href);url.searchParams.set("_eirdan_check",Date.now());
 const r=await fetch(url,{cache:"no-store",headers:{"Cache-Control":"no-cache"}});
 if(!r.ok)throw new Error("version check HTTP "+r.status);
 const html=await r.text(),m=html.match(/window\.EIRDAN_BUILD=["']([^"']+)/),latest=m?.[1];
 if(!latest)throw new Error("build marker missing");
 if(latest!==BUILD||window.EIRDAN_BUILD!==BUILD){
  progress(65,"Найдена "+latest+" · обновление…");
  localStorage.setItem("eirdan-build",latest);
  const fresh=new URL(location.href);fresh.searchParams.set("build",latest);fresh.searchParams.set("_",Date.now());
  location.replace(fresh.toString());return false
 }
 return true
}
async function startEirdan(){
 try{
  progress(8,"Подготовка проверки…");
  await removeDevelopmentCaches();
  if(!(await verifyBuild()))return;
  progress(78,"Проверка файлов игры…");
  if(!window.EIRDAN_BUILD||window.EIRDAN_BUILD!==BUILD)throw new Error("runtime build mismatch");
  localStorage.setItem("eirdan-build",BUILD);
  progress(92,"Сборка подтверждена…");
  enterGame("Eirdan · "+BUILD);
 }catch(e){
  console.error("Eirdan startup verification failed",e);
  progress(100,"Не удалось проверить обновление · повторите запуск");
  const b=boot();if(b){b.onclick=()=>location.reload();b.style.cursor="pointer"}
 }
}
if(document.readyState==="complete")startEirdan();else window.addEventListener("load",startEirdan,{once:true});
