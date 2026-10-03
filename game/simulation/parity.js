export const REFERENCE={version:'0.14.15-alpha14p',mirror3000:{battles:3000,pairs:1500,ally:1485,enemy:1488,draw:27,avgRounds:27.1,maxRounds:223,orientationA:{ally:733,enemy:757,draw:10},orientationB:{ally:752,enemy:731,draw:17},firstTurn:{ally:1504,enemy:1496},firstMoverWins:1522,decisive:2973}};

export function compareMirror(run,ref=REFERENCE.mirror3000,{rateTolerance=1,avgRoundsTolerance=3,maxRoundsMinRatio=.5,allowHardCaps=0}={}){
 const pct=(a,n)=>n?100*a/n:0;
 const out={
  battleDelta:(run.battles??0)-ref.battles,
  allyRateDelta:+(pct(run.ally??0,run.battles)-pct(ref.ally,ref.battles)).toFixed(3),
  enemyRateDelta:+(pct(run.enemy??0,run.battles)-pct(ref.enemy,ref.battles)).toFixed(3),
  drawRateDelta:+(pct(run.draw??0,run.battles)-pct(ref.draw,ref.battles)).toFixed(3),
  avgRoundsDelta:run.avgRounds==null?null:+(run.avgRounds-ref.avgRounds).toFixed(2),
  maxRoundsRatio:run.maxRounds==null?null:+(run.maxRounds/ref.maxRounds).toFixed(3),
  hardCaps:run.hardCaps??0
 };
 const reasons=[];
 if(out.battleDelta!==0)reasons.push('battle-count');
 if(Math.abs(out.allyRateDelta)>rateTolerance)reasons.push('ally-rate');
 if(Math.abs(out.enemyRateDelta)>rateTolerance)reasons.push('enemy-rate');
 if(Math.abs(out.drawRateDelta)>rateTolerance)reasons.push('draw-rate');
 if(out.avgRoundsDelta==null||Math.abs(out.avgRoundsDelta)>avgRoundsTolerance)reasons.push('avg-rounds');
 if(out.maxRoundsRatio==null||out.maxRoundsRatio<maxRoundsMinRatio)reasons.push('max-rounds');
 if(out.hardCaps>allowHardCaps)reasons.push('hard-caps');
 return {...out,pass:reasons.length===0,reasons};
}
