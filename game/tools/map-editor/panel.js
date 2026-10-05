import {el,choiceMenu,downloadJson} from '../../ui/map-ui.js';
import {buildMapEditorExport} from './export-data.js';
import {createEditorModeSelect,createRoadTypeSelect,createTerrainTypeSelect,createTerrainControls,createRoadSelectionControls,setEditorControlVisibility} from './editor-ui.js';

function exportAllButton(){const button=el('button','Экспорт всех карт');button.onclick=()=>downloadJson('eirdan-map-editor-all.json',buildMapEditorExport());return button}

export function createMapEditorPanel({kind='location',poiOptions,poiInitial,poiPlaceholder,hintText,clearLabel}={}){
 const panel=el('div');panel.className='region-editor hidden';
 const mode=createEditorModeSelect(),poiType=choiceMenu(poiOptions,poiInitial),name=el('input');name.placeholder=poiPlaceholder||'Название';
 const roadType=createRoadTypeSelect(),terrainType=createTerrainTypeSelect(),terrain=createTerrainControls(),road=createRoadSelectionControls();
 const clearRoads=el('button','Удалить все узлы'),hint=el('p',hintText||'Создавайте и перемещайте метки.');hint.className='quiet';
 const poiExport=el('button','Экспорт меток'),roadExport=el('button','Экспорт дорог'),terrainExport=el('button','Экспорт местности'),mapExport=el('button','Экспорт карты целиком'),clearPoi=el('button',clearLabel||'Удалить локальные метки');
 const extra=kind==='region'?{toggleLabels:el('button','Развернуть названия'),bindRoadPoi:el('button','Привязать узел к метке'),clearOptionalPoi:el('button','Удалить обычные метки')}:{};
 if(extra.bindRoadPoi)extra.bindRoadPoi.disabled=true;
 panel.append(mode,poiType,name,roadType,terrainType,terrain.finish,terrain.undo,terrain.cancel,terrain.selection,terrain.remove,terrain.clear,...(extra.toggleLabels?[extra.toggleLabels]:[]),hint,road.selection,road.removeNode,road.removeEdge,road.clearSelection,...(extra.bindRoadPoi?[extra.bindRoadPoi]:[]),clearRoads,...(extra.clearOptionalPoi?[extra.clearOptionalPoi]:[]),poiExport,roadExport,terrainExport,mapExport,exportAllButton(),clearPoi);
 const controls={panel,mode,poiType,name,roadType,terrainType,terrain,road,clearRoads,hint,poiExport,roadExport,terrainExport,mapExport,clearPoi,...extra};
 controls.sync=editorMode=>setEditorControlVisibility({mode:editorMode,road:[roadType,road.selection,road.removeNode,road.removeEdge,road.clearSelection,...(extra.bindRoadPoi?[extra.bindRoadPoi]:[]),clearRoads,roadExport],terrain:[terrainType,terrain.finish,terrain.undo,terrain.cancel,terrain.selection,terrain.remove,terrain.clear,terrainExport],poi:[poiType,name,...(extra.toggleLabels?[extra.toggleLabels]:[]),...(extra.clearOptionalPoi?[extra.clearOptionalPoi]:[]),poiExport,clearPoi]});
 return controls;
}
