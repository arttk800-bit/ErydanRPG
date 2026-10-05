// ============================================================================
// MAP ACCESS POINTS
// Physical ports connect one logical POI to one or more navigation nodes.
// Legacy {node} access remains readable while maps migrate to {ports:[...]}.
// ============================================================================
export function accessPorts(roads,ownerId){
 const entry=roads?.access?.[ownerId];if(!entry)return[];
 if(Array.isArray(entry.ports))return entry.ports.filter(p=>p?.id&&p?.node);
 if(entry.node)return[{id:ownerId+':default',node:entry.node,externalNode:entry.externalNode||null,kind:'legacy'}];
 return[]
}
export function accessPort(roads,ownerId,portId){
 const ports=accessPorts(roads,ownerId);return ports.find(p=>p.id===portId)||ports[0]||null
}
export function accessNodes(roads,ownerId){return accessPorts(roads,ownerId).map(p=>p.node)}
