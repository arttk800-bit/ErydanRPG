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
 for(const seconds of [10,20,30]){
  onStatus('waiting',{runId:accepted,seconds});
  await wait(seconds*1000);
  const s=await fetch(ENDPOINT+'status?run_id='+encodeURIComponent(accepted)+'&t='+Date.now(),{cache:'no-store'});
  let status={};try{status=await s.json()}catch{}
  if(s.ok&&status.confirmed===true){onStatus('confirmed',{runId:accepted,status});return{runId:accepted,confirmed:true,status,response:body}}
 }
 onStatus('pending',{runId:accepted});
 return{runId:accepted,confirmed:false,response:body};
}
