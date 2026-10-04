const ENDPOINT='https://eirdan-diagnostics.arttk800.workers.dev/';
export async function uploadDiagnostic({build,log,summary=null}){
 const runId='eirdan_shell_'+Date.now();
 const payload={run_id:runId,build:build||'unknown',generated_at:new Date().toISOString(),source:'shell-action-diagnostics',summary,log};
 const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 let body={};try{body=await r.json()}catch{}
 if(!r.ok||body.ok===false)throw new Error(body.error||('HTTP '+r.status));
 return{runId:body.run_id||runId,response:body};
}
