const BUILD=window.EIRDAN_BUILD||"unknown";
const bar=()=>document.getElementById("bootBar"),status=()=>document.getElementById("bootStatus"),boot=()=>document.getElementById("bootScreen");
function progress(n,msg){if(bar())bar().style.width=n+"%";if(status())status().textContent=msg}
function enterGame(msg){progress(100,msg||("Eirdan · "+BUILD));setTimeout(()=>boot()?.classList.add("hidden"),180)}
async function cleanup(){try{if("serviceWorker" in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}}catch(_){}try{if("caches" in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}}catch(_){}}
async function startEirdan(){progress(25,"Подготовка…");await cleanup();progress(75,"Запуск…");enterGame("Eirdan · "+BUILD)}
window.EirdanUpdater={async check(){enterGame("Eirdan · "+BUILD);return {current:true,build:BUILD}},reload(){const u=new URL("./index.html",location.href);u.searchParams.set("_",Date.now());location.replace(u.toString())}};
if(document.readyState==="complete")startEirdan();else window.addEventListener("load",startEirdan,{once:true});
