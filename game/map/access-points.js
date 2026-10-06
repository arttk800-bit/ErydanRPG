// ============================================================================
// MAP ACCESS POINTS
// One logical map owner has at most one physical navigation access node.
// ============================================================================

export function accessNodeId(roads,ownerId){
 const entry=roads?.access?.[ownerId];
 if(!entry)return null;
 if(entry.node)return entry.node;
 // v2 editor data is read during migration; only the first old port survives.
 return Array.isArray(entry.ports)?entry.ports.find(p=>p?.node)?.node||null:null
}
export function accessNode(roads,ownerId){
 const id=accessNodeId(roads,ownerId);
 return id?(roads?.nodes||[]).find(n=>n.id===id)||null:null
}
export function accessNodes(roads,ownerId){const id=accessNodeId(roads,ownerId);return id?[id]:[]}
export function accessPorts(roads,ownerId){const node=accessNodeId(roads,ownerId);return node?[{id:ownerId+':access',node}]:[]}
export function accessPort(roads,ownerId){return accessPorts(roads,ownerId)[0]||null}
