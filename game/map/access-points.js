// ============================================================================
// MAP ACCESS POINTS
// Regional POIs use one {node}; internal map owners may retain multiple ports.
// ============================================================================
export function accessNodeId(roads,ownerId){
 const entry=roads?.access?.[ownerId];if(!entry)return null;
 if(entry.node)return entry.node;
 return Array.isArray(entry.ports)?entry.ports.find(p=>p?.node)?.node||null:null
}
export function accessNode(roads,ownerId){const id=accessNodeId(roads,ownerId);return id?(roads?.nodes||[]).find(n=>n.id===id)||null:null}
export function accessPorts(roads,ownerId){
 const entry=roads?.access?.[ownerId];if(!entry)return[];
 if(Array.isArray(entry.ports))return entry.ports.filter(p=>p?.node);
 return entry.node?[{id:ownerId+':access',node:entry.node,...(entry.pointId?{pointId:entry.pointId}:{})}]:[]
}
export function accessPort(roads,ownerId,portId=null){const ports=accessPorts(roads,ownerId);return (portId&&ports.find(p=>p.id===portId))||ports[0]||null}
export function accessNodes(roads,ownerId){return accessPorts(roads,ownerId).map(p=>p.node)}
