export function summarize(results,elapsedMs){
 const wins={ally:0,enemy:0,draw:0,limit:0};let rounds=0,maxRounds=0;
 for(const r of results){if(r.hardCapHit)wins.limit++;else if(r.result==='ally')wins.ally++;else if(r.result==='enemy')wins.enemy++;else wins.draw++;rounds+=r.rounds;maxRounds=Math.max(maxRounds,r.rounds);}
 return{battles:results.length,elapsedMs,msPerBattle:results.length?elapsedMs/results.length:0,wins,avgRounds:results.length?rounds/results.length:0,maxRounds,anomalies:results.reduce((n,r)=>n+(r.traces?.length||0),0)};
}
export async function runBatch(count,createBattle,runBattle,{yieldEvery=25}={}){
 const start=performance.now(),results=[];for(let i=0;i<count;i++){results.push(runBattle(createBattle(i),i));if(yieldEvery&&i%yieldEvery===yieldEvery-1)await new Promise(r=>setTimeout(r,0));}
 return{summary:summarize(results,performance.now()-start),results};
}
