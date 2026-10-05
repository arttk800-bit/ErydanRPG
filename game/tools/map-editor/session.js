// ============================================================================
// MAP EDITOR SESSION
// Composes panel, road/terrain editors and generic controls for one map.
// Host UI supplies POI data/state and map-specific callbacks.
// ============================================================================
import {createMapEditorPanel} from './panel.js';
import {createMapEditorRuntime} from './editor-runtime.js';
import {bindMapEditorController} from './controller.js';

export function createMapEditorSession({
 root,frame,editButton,kind='location',panelOptions={},roadMapId,terrainMapId,roads,zones,getPois,
 getMode,setMode,getEditing,setEditing,onPaint=()=>{},onModeChange=()=>{},onRoadsChange=()=>{},onZonesChange=()=>{},
 onRoadSelection=()=>{},onTerrainSelection=()=>{},clearTerrainMessage,clearRoadsMessage
}){
 const panel=createMapEditorPanel({kind,...panelOptions});root.append(panel.panel);
 let roadEditor=null;
 const runtime=createMapEditorRuntime({
  frame,roadMapId,terrainMapId,roads,zones,getPois,roadType:panel.roadType.value,terrainType:panel.terrainType.value,
  onRoadsChange,onZonesChange,
  onRoadSelection:selection=>{panel.road.removeNode.disabled=!selection.nodeId;panel.road.removeEdge.disabled=!selection.edge;onRoadSelection(selection,{panel,roadEditor})},
  onTerrainSelection:zone=>{panel.terrain.selection.textContent=zone?'Выбрана зона: '+zone.type+' · '+zone.id:'Зона не выбрана';panel.terrain.remove.disabled=!zone;onTerrainSelection(zone,{panel})}
 });
 roadEditor=runtime.roadEditor;
 const controller=bindMapEditorController({panel,runtime,frame,editButton,getMode,setMode,getEditing,setEditing,onPaint,onModeChange,clearTerrainMessage,clearRoadsMessage});
 return {panel,runtime,controller,roadEditor:runtime.roadEditor,terrainEditor:runtime.terrainEditor,destroy:()=>controller.destroy()};
}
