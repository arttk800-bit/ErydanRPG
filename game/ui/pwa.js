const BUILD="rpg-shell-01";
async function forceFreshBuild(){
 if(!("serviceWorker" in navigator))return;
 try{
  const reg=await navigator.serviceWorker.register("../sw.js?v="+BUILD,{updateViaCache:"none"});
  await reg.update();
  const seen=sessionStorage.getItem("eirdan-build");
  if(seen!==BUILD){
   sessionStorage.setItem("eirdan-build",BUILD);
   if(reg.waiting){reg.waiting.postMessage({type:"SKIP_WAITING"})}
   location.replace(location.pathname+"?v="+BUILD);
  }
 }catch(e){console.error("Eirdan update check failed",e)}
}
window.addEventListener("load",forceFreshBuild);
navigator.serviceWorker?.addEventListener("controllerchange",()=>{
 if(!sessionStorage.getItem("eirdan-controller-reload")){sessionStorage.setItem("eirdan-controller-reload","1");location.reload()}
});