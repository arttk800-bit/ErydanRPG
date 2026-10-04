const KEY='eirdan.map-terrain.v1';const clone=v=>JSON.parse(JSON.stringify(v));
export function loadTerrainZones(mapId,fallback=[]){try{const all=JSON.parse(localStorage.getItem(KEY)||'{}');if(Array.isArray(all[mapId]))return clone(all[mapId])}catch{}return clone(fallback)}
export function saveTerrainZones(mapId,zones){let all={};try{all=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}all[mapId]=clone(zones||[]);localStorage.setItem(KEY,JSON.stringify(all))}
export function clearTerrainZones(mapId){let all={};try{all=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}delete all[mapId];localStorage.setItem(KEY,JSON.stringify(all))}
