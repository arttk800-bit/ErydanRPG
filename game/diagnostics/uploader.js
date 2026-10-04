const ENDPOINT='https://eirdan-diagnostics.arttk800.workers.dev/';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
export async function uploadDiagnostic({build,log,summary=null,onStatus=()=>{}}){
 const runId='eirdan_shell_'+Date.now();
 const payload={run_id:runId,build:build||'unknown',generated_at:new Date().toISOString(),source:'shell-action-diagnostics',summary,log};
 onStatus('sending',{runId});
 const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 let body={};try{body=await r.json()}catch{}
 if(!r.ok||body.ok===false)throw new Error(body.error||('HTTP '+r.status));
 const accepted=body.run_id||runId;
 onStatus('accepted',{runId:accepted,dispatch:body.github_dispatch});
 const intervalSeconds=2,maxWaitSeconds=30;
 for(let elapsed=0;elapsed<maxWaitSeconds;elapsed+=intervalSeconds){
  onStatus('waiting',{runId:accepted,seconds:intervalSeconds,elapsed,maxWaitSeconds,attempt:elapsed/intervalSeconds+1});
  await wait(intervalSeconds*1000);
  const s=await fetch(ENDPOINT+'status?run_id='+encodeURIComponent(accepted)+'&t='+Date.now(),{cache:'no-store'});
  let status={};try{status=await s.json()}catch{}
  if(s.ok&&status.confirmed===true){onStatus('confirmed',{runId:accepted,status,elapsed:elapsed+intervalSeconds});return{runId:accepted,confirmed:true,status,response:body}}
 }
 onStatus('pending',{runId:accepted});
 return{runId:accepted,confirmed:false,response:body};
}


export async function checkDiagnosticDelivery(runId){
 if(!runId) throw new Error('Missing diagnostic run id');
 const url=ENDPOINT+'status?run_id='+encodeURIComponent(runId)+'&t='+Date.now();
 const response=await fetch(url,{cache:'no-store'});
 let status={}; try{status=await response.json()}catch{}
 if(!response.ok) throw new Error(status.error||('HTTP '+response.status));
 return {runId,confirmed:status.confirmed===true,status};
}
