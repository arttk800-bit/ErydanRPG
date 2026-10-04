const BUILD="diagnostic-28";
const bar=()=>document.getElementById("bootBar"),status=()=>document.getElementById("bootStatus"),boot=()=>document.getElementById("bootScreen");
function progress(n,msg){if(bar())bar().style.width=n+"%";if(status())status().textContent=msg}
function enterGame(msg){progress(100,msg||("Eirdan · "+BUILD));setTimeout(()=>boot()?.classList.add("hidden"),220)}
const watchdog=setTimeout(()=>enterGame("Запуск · "+BUILD),3500);
async function startEirdan(){
 progress(15,"Проверка версии…");
 try{
  const seen=localStorage.getItem("eirdan-build");
  if(seen!==BUILD){
   progress(45,"Обновление · "+BUILD);
   localStorage.setItem("eirdan-build",BUILD);
  }
  progress(75,"Загрузка игры…");
  clearTimeout(watchdog);
  enterGame("Eirdan · "+BUILD);
  if("serviceWorker" in navigator){
   navigator.serviceWorker.register("../sw.js?v="+BUILD,{updateViaCache:"none"}).then(r=>r.update()).catch(e=>console.warn("SW update skipped",e));
  }
 }catch(e){console.error("Eirdan startup check failed",e);clearTimeout(watchdog);enterGame("Запуск · "+BUILD)}
}
if(document.readyState==="complete")startEirdan();else window.addEventListener("load",startEirdan,{once:true});
