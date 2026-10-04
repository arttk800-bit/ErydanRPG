export function createNavigationContext({roads,terrainZones=[]}={}){if(!roads)throw new Error('Navigation roads required');return{roads,terrainZones:Array.isArray(terrainZones)?terrainZones:[]}}
