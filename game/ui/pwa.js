const BUILD="diagnostic-48";
const VERSION_URL=new URL("./build.json",import.meta.url).href;
const bar=()=>document.getElementById("bootBar"),status=()=>document.getElementById("bootStatus"),boot=()=>document.getElementById("bootScreen");
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function progress(n,msg){if(bar())bar().style.width=n+"%";if(status())status().textContent=msg}
function enterGame(msg){progress(100,msg||("Eirdan · "+BUILD));setTimeout(()=>boot()?.classList.add("hidden"),180)}
async function removeDevelopmentCaches(){if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}}
async function remoteBuild(){const sep=VERSION_URL.includes("?")?"&":"?";const r=await fetch(VERSION_URL+sep+"t="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("version HTTP "+r.status);const data=await r.json();if(!data.build)throw new Error("version marker missing");return data.build}
async function fetchFreshPage(target){const u=new URL('./index.html',location.href);u.searchParams.set('build',target);u.searchParams.set('_',Date.now());const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error('page HTTP '+r.status);const html=await r.text(),m=html.match(/window\.EIRDAN_BUILD=["']([^"']+)/);return{html,build:m?.[1]||null,url:u}}
async function startEirdan(){
 progress(8,"Подготовка проверки…");await removeDevelopmentCaches();let failures=0;
 while(true){try{
  progress(25,"Проверка версии…");const latest=await remoteBuild();
  if(latest!==BUILD){
   progress(45,"Обновление до "+latest+" · ожидание сервера…");
   let fresh=null;while(!fresh){try{const page=await fetchFreshPage(latest);if(page.build===latest)fresh=page}catch(e){console.warn("fresh page retry",e)}if(!fresh)await wait(2000)}
   progress(70,'Сборка '+latest+' получена…');localStorage.setItem('eirdan-update-target',latest);location.replace(fresh.url.toString());return
  }
  if(window.EIRDAN_BUILD!==BUILD)throw new Error("runtime build mismatch");
  localStorage.setItem('eirdan-build',BUILD);localStorage.removeItem('eirdan-update-target');enterGame('Eirdan · '+BUILD);return
 }catch(e){failures++;console.warn("Eirdan startup retry",e);progress(25,"Нет ответа · повтор проверки "+failures+"…");await wait(Math.min(5000,1500+failures*350))}}
}
if(document.readyState==="complete")startEirdan();else window.addEventListener("load",startEirdan,{once:true});
