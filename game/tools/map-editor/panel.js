import {el,choiceMenu,downloadJson} from '../../ui/map-ui.js';
import {buildMapEditorExport} from './export-data.js';
import {createEditorModeSelect,createRoadTypeSelect,createTerrainTypeSelect,createTerrainControls,createRoadSelectionControls,setEditorControlVisibility} from './editor-ui.js';

function exportAllButton(){const button=el('button','Экспорт всех карт');button.onclick=()=>downloadJson('eirdan-map-editor-all.json',buildMapEditorExport());return button}

export function createMapEditorPanel({kind='location',poiOptions,poiInitial,poiPlaceholder,hintText,clearLabel}={}){
 const panel=el('div');panel.className='region-editor hidden';
 const mode=createEditorModeSelect(),poiType=choiceMenu(poiOptions,poiInitial),name=el('input');name.placeholder=poiPlaceholder||'Название';
 const roadType=createRoadTypeSelect(),terrainType=createTerrainTypeSelect(),terrain=createTerrainControls(),road=createRoadSelectionControls();
 const clearRoads=el('button','Удалить все узлы'),hint=el('p',hintText||'Создавайте и перемещайте метки.');hint.className='quiet';
 const clearPoi=el('button',clearLabel||'Удалить локальные метки'),poiSelection=el('p','Метка не выбрана'),removePoi=el('button','Удалить выбранную метку');poiSelection.className='quiet';removePoi.disabled=true;
 const extra=kind==='region'?{toggleLabels:el('button','Развернуть названия'),bindRoadPoi:el('button','Привязать узел к метке'),clearOptionalPoi:el('button','Удалить обычные метки')} :{bindTransition:el('button','Назначить точкой перехода')};
 if(extra.bindRoadPoi)extra.bindRoadPoi.disabled=true;if(extra.bindTransition)extra.bindTransition.disabled=true;
 panel.append(mode,poiType,name,poiSelection,removePoi,roadType,terrainType,terrain.finish,terrain.undo,terrain.cancel,terrain.selection,terrain.remove,terrain.clear,...(extra.toggleLabels?[extra.toggleLabels]:[]),...(extra.bindTransition?[extra.bindTransition]:[]),hint,road.selection,road.removeNode,road.removeEdge,road.clearSelection,...(extra.bindRoadPoi?[extra.bindRoadPoi]:[]),clearRoads,...(extra.clearOptionalPoi?[extra.clearOptionalPoi]:[]),exportAllButton(),clearPoi);
 const controls={panel,mode,poiType,name,poiSelection,removePoi,roadType,terrainType,terrain,road,clearRoads,hint,clearPoi,...extra};
 controls.sync=editorMode=>setEditorControlVisibility({mode:editorMode,road:[roadType,road.selection,road.removeNode,road.removeEdge,road.clearSelection,...(extra.bindRoadPoi?[extra.bindRoadPoi]:[]),clearRoads],terrain:[terrainType,terrain.finish,terrain.undo,terrain.cancel,terrain.selection,terrain.remove,terrain.clear],poi:[poiType,name,poiSelection,removePoi,...(extra.toggleLabels?[extra.toggleLabels]:[]),...(extra.bindTransition?[extra.bindTransition]:[]),...(extra.clearOptionalPoi?[extra.clearOptionalPoi]:[]),clearPoi]});
 return controls;
}
