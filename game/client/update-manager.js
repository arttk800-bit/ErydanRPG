import {actionDiagnostics} from '../diagnostics/action-diagnostics.js';

export class UpdateManager{
 constructor({registration,getInstalled,fetchRemote,onState,onAvailable,onReady,onApply}){
  this.registration=registration;this.getInstalled=getInstalled;this.fetchRemote=fetchRemote;this.onState=onState;
  this.onAvailable=onAvailable;this.onReady=onReady;this.onApply=onApply;
  this.busy=false;this.available=null;this.state='idle';
 }
 setState(state,data={}){this.state=state;actionDiagnostics.record('update',state,data);this.onState?.(state,data)}
 async exclusive(task){
  if(this.busy){actionDiagnostics.record('update','blocked',{state:this.state});return false}
  this.busy=true;
  try{return await task()}finally{this.busy=false}
 }
 same(a,b){return a?.version===b?.version&&a?.build===b?.build}
 async check({manual=false}={}){
  return this.exclusive(async()=>{
   this.setState('checking',{manual});
   try{
    const installed=await this.getInstalled(),remote=await this.fetchRemote();
    actionDiagnostics.record('update','compared',{installed,remote});
    if(this.same(installed,remote)){this.available=null;this.setState('current',{version:installed.version});return null}
    this.available=remote;this.setState('available',{remote});this.onAvailable?.(remote);return remote;
   }catch(error){this.setState('error',{step:'check',message:String(error)});return null}
  });
 }
 async download(meta=this.available){
  return this.exclusive(async()=>{
   if(!meta){this.setState('error',{step:'download',message:'no update metadata'});return false}
   try{
    this.setState('downloading',{remote:meta});
    await this.registration.update();
    let worker=this.registration.installing||this.registration.waiting;
    if(worker?.state==='installing')await waitWorker(worker);
    worker=this.registration.waiting||worker;
    this.setState('ready',{remote:meta,workerState:worker?.state||null});this.onReady?.(meta);return true;
   }catch(error){this.setState('error',{step:'download',message:String(error)});return false}
  });
 }
 async apply(){
  return this.exclusive(async()=>{
   try{
    const remote=this.available||await this.fetchRemote();
    this.setState('installing',{remote});
    await this.registration.update();
    let worker=this.registration.installing||this.registration.waiting;
    if(worker?.state==='installing')await waitWorker(worker);
    this.registration.waiting?.postMessage({type:'SKIP_WAITING'});
    await waitForBuild(remote.build);
    this.setState('applied',{remote});
    await this.onApply?.(remote);return true;
   }catch(error){this.setState('error',{step:'apply',message:String(error)});return false}
  });
 }
}
function waitWorker(worker,timeout=30000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('worker timeout')),timeout);const done=()=>{if(worker.state==='installed'||worker.state==='activated'){clearTimeout(timer);resolve()}else if(worker.state==='redundant'){clearTimeout(timer);reject(new Error('worker redundant'))}};worker.addEventListener('statechange',done);done()})}
function waitForBuild(expected,timeout=20000){return new Promise((resolve,reject)=>{let done=false;const finish=ok=>{if(done)return;done=true;clearInterval(poll);clearTimeout(timer);navigator.serviceWorker.removeEventListener('message',message);ok?resolve():reject(new Error('service worker build mismatch'))};const message=e=>{if((e.data?.type==='SW_ACTIVATED'||e.data?.type==='SW_BUILD')&&e.data.build===expected)finish(true)};navigator.serviceWorker.addEventListener('message',message);const poll=setInterval(()=>navigator.serviceWorker.controller?.postMessage({type:'GET_BUILD'}),250);const timer=setTimeout(()=>finish(false),timeout);navigator.serviceWorker.controller?.postMessage({type:'GET_BUILD'})})}
