export function nearestEnemy(state,a,distance){return state.units.filter(x=>x.alive&&x.team!==a.team).sort((x,y)=>distance(a,x)-distance(a,y))[0]||null}
