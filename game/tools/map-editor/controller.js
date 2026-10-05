// ============================================================================
// MAP EDITOR CONTROLLER
// Owns generic editor-mode controls and synchronizes editor state with its host.
// POI creation and gameplay behavior remain outside this development tool.
// ============================================================================
export function bindMapEditorController({
 panel,runtime,frame,editButton,getMode,setMode,getEditing,setEditing,onPaint=()=>{},onModeChange=()=>{},
 clearTerrainMessage='Удалить все зоны местности?',clearRoadsMessage='Удалить ВСЕ дорожные узлы и участки?'
}){
 const {mode,roadType,terrainType,terrain,road,clearRoads}=panel;
 terrain.finish.onclick=()=>runtime.terrainEditor.finish();
 terrain.undo.onclick=()=>runtime.terrainEditor.undoLastPoint();
 terrain.cancel.onclick=()=>runtime.terrainEditor.cancelDraft();
 terrain.remove.onclick=()=>runtime.terrainEditor.removeSelected();
 terrain.clear.onclick=()=>{if(confirm(clearTerrainMessage))runtime.terrainEditor.clear()};
 road.removeNode.onclick=()=>runtime.roadEditor.removeSelectedNode();
 road.removeEdge.onclick=()=>runtime.roadEditor.removeSelectedEdge();
 road.clearSelection.onclick=()=>runtime.roadEditor.clearSelection();
 clearRoads.onclick=()=>{if(confirm(clearRoadsMessage))runtime.roadEditor.clearAll()};
 roadType.onchange=()=>runtime.setRoadType(roadType.value);
 terrainType.onchange=()=>runtime.setTerrainType(terrainType.value);
 mode.onchange=()=>{const next=mode.value;setMode(next);runtime.setMode(getEditing(),next);frame.dataset.editorMode=getEditing()?next:'';panel.sync(next);onModeChange(next);onPaint()};
 editButton.onclick=()=>{const editing=!getEditing(),current=getMode();setEditing(editing);panel.panel.classList.toggle('hidden',!editing);frame.classList.toggle('editing',editing);frame.dataset.editorMode=editing?current:'';editButton.textContent=editing?'Готово':'Редактор';runtime.setMode(editing,current);onModeChange(current);onPaint()};
 panel.sync(getMode());
 return {isEditing:getEditing,destroy(){editButton.onclick=null;mode.onchange=null;roadType.onchange=null;terrainType.onchange=null;runtime.destroy()}};
}
