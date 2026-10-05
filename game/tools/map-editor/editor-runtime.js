import {RoadEditor} from './road-editor.js';
import {TerrainEditor} from './terrain-editor.js';

export function createMapEditorRuntime({
 frame,roadMapId,terrainMapId,roads,zones,getPois=()=>[],
 roadType='road',terrainType='forest',
 onRoadsChange=()=>{},onZonesChange=()=>{},onRoadSelection=()=>{},onTerrainSelection=()=>{}
}){
 const roadEditor=new RoadEditor({
  frame,regionId:roadMapId,roads,getPois,
  onChange:onRoadsChange,onSelection:onRoadSelection
 });
 const terrainEditor=new TerrainEditor({
  frame,mapId:terrainMapId,zones,
  onChange:onZonesChange,onSelection:onTerrainSelection
 });
 roadEditor.setRoadType(roadType);
 terrainEditor.setType(terrainType);
 return {
  roadEditor,terrainEditor,
  setMode(editing,mode){
   roadEditor.setActive(Boolean(editing&&mode==='road'));
   terrainEditor.setActive(Boolean(editing&&mode==='terrain'));
  },
  setRoadType:type=>roadEditor.setRoadType(type),
  setTerrainType:type=>terrainEditor.setType(type),
  destroy(){roadEditor.destroy();terrainEditor.destroy()}
 };
}
