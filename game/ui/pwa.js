const BUILD="diagnostic-33";
const VERSION_URL="https://raw.githubusercontent.com/arttk800-bit/ErydanRPG/main/game/ui/build.json";
const bar=()=>document.getElementById("bootBar"),status=()=>document.getElementById("bootStatus"),boot=()=>document.getElementById("bootScreen");
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function progress(n,msg){if(bar())bar().style.width=n+"%";if(status())status().textContent=msg}
function enterGame(msg){progress(100,msg||("Eirdan · "+BUILD));setTimeout(()=>boot()?.classList.add("hidden"),180)}
async function removeDevelopmentCaches(){
 if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}
 if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}
}
async function remoteBuild(){
 const r=await fetch(VERSION_URL+"?t="+Date.now(),{cache:"no-store"});
 if(!r.ok)throw new Error("version HTTP "+r.status);
 const data=await r.json();if(!data.build)throw new Error("version marker missing");return data.build
}
async function pageBuild(){
 const u=new URL(location.href);u.searchParams.set("_check",Date.now());
 const r=await fetch(u,{cache:"no-store"});if(!r.ok)throw new Error("page HTTP "+r.status);
 const html=await r.text(),m=html.match(/window\.EIRDAN_BUILD=["']([^"']+)/);return m?.[1]||null
}
async function waitForDeployment(target){
 let attempt=0;
 while(true){
  attempt++;
  progress(Math.min(88,45+attempt*3),"Обновление до "+target+" · ожидание сервера…");
  try{if(await pageBuild()===target)return}catch(e){console.warn("deployment check",e)}
  await wait(Math.min(5000,1200+attempt*350))
 }
}
async function startEirdan(){
 progress(8,"Подготовка проверки…");
 await removeDevelopmentCaches();
 let failures=0;
 while(true){
  try{
   progress(25,"Проверка версии на GitHub…");
   const latest=await remoteBuild();
   if(latest!==BUILD){
    progress(42,"Доступна "+latest+" · загрузка…");
    await waitForDeployment(latest);
    const fresh=new URL(location.href);fresh.searchParams.set("build",latest);fresh.searchParams.set("_",Date.now());
    location.replace(fresh.toString());return
   }
   if(window.EIRDAN_BUILD!==BUILD)throw new Error("runtime build mismatch");
   localStorage.setItem("eirdan-build",BUILD);
   enterGame("Eirdan · "+BUILD);return
  }catch(e){
   failures++;console.warn("Eirdan version check retry",e);
   progress(Math.min(80,25+failures*2),"Нет ответа · повтор проверки "+failures+"…");
   await wait(Math.min(5000,1200+failures*400))
  }
 }
}
if(document.readyState==="complete")startEirdan();else window.addEventListener("load",startEirdan,{once:true});
