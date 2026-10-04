export function formatDiagnosticLog(d){
 const lines=['EIRDAN SHELL + ACTION DIAGNOSTIC','Generated: '+d.at,'','=== SHELL CHECKS ==='];
 for(const [name,ok] of d.checks)lines.push((ok?'PASS ':'FAIL ')+name);
 lines.push('','=== UPDATE ===',JSON.stringify(d.update,null,2),'','=== ACTION TRACE ===');
 for(const e of d.actions)lines.push('#'+e.id+' ['+e.at+'] '+e.action+' -> '+e.phase+' '+JSON.stringify(e.data||{}));
 return lines.join('\n');
}
