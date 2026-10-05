import {el,choiceMenu} from '../../ui/map-ui.js';

export const ROAD_TYPE_OPTIONS=[['trail','Тропа'],['road','Дорога'],['highway','Тракт'],['rough','Бездорожье']];
export const TERRAIN_TYPE_OPTIONS=[['forest','Лес'],['swamp','Болото'],['mountain','Горы'],['water','Глубокая вода'],['blocked','Непроходимая область']];

export function createEditorModeSelect(){return choiceMenu([['poi','Метки'],['road','Дороги'],['terrain','Местность']],'poi')}
export function createRoadTypeSelect(){return choiceMenu(ROAD_TYPE_OPTIONS,'road')}
export function createTerrainTypeSelect(){return choiceMenu(TERRAIN_TYPE_OPTIONS,'forest')}
export function createTerrainControls(){
 const finish=el('button','Замкнуть полигон'),undo=el('button','Удалить последнюю точку'),cancel=el('button','Отменить вершины'),selection=el('p','Зона не выбрана'),remove=el('button','Удалить выбранную зону'),clear=el('button','Удалить все зоны');
 selection.className='quiet';remove.disabled=true;
 return{finish,undo,cancel,selection,remove,clear};
}
export function createRoadSelectionControls(){
 const selection=el('p','Ничего не выбрано'),removeNode=el('button','Удалить узел'),removeEdge=el('button','Удалить участок'),clearSelection=el('button','Снять выбор');
 selection.className='quiet';removeNode.disabled=true;removeEdge.disabled=true;
 return{selection,removeNode,removeEdge,clearSelection};
}
export function setEditorControlVisibility({mode,poi=[],road=[],terrain=[]}){
 const isRoad=mode==='road',isTerrain=mode==='terrain';
 for(const control of road)control.classList.toggle('hidden',!isRoad);
 for(const control of terrain)control.classList.toggle('hidden',!isTerrain);
 for(const control of poi)control.classList.toggle('hidden',isRoad||isTerrain);
}
