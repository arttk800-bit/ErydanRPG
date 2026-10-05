// ============================================================================
// MAP VIEW STATE
// Owns map browsing/navigation only. Never changes physical world position.
// ============================================================================
export const MAP_VIEW_LEVEL=Object.freeze({WORLD:'world',REGION:'region',LOCATION:'location',SCENE:'scene'});

export const MapViewSystem={
 ensure(state){
  state.ui=state.ui||{};
  const current=state.world?.current||{};
  const physical=state.world?.position||{};
  const fallbackLocation=current.locationId||((physical.pointId==='veligrad')?'veligrad':null);
  state.ui.mapView=state.ui.mapView||{
   level:fallbackLocation?MAP_VIEW_LEVEL.LOCATION:(current.regionId?MAP_VIEW_LEVEL.REGION:MAP_VIEW_LEVEL.WORLD),
   regionId:current.regionId||physical.regionId||null,
   locationId:fallbackLocation
  };
  const view=state.ui.mapView;
  if(!Object.values(MAP_VIEW_LEVEL).includes(view.level))view.level=MAP_VIEW_LEVEL.WORLD;
  if(view.regionId===undefined)view.regionId=null;
  if(view.locationId===undefined)view.locationId=null;
  return view
 },
 world(state){const view=this.ensure(state);view.level=MAP_VIEW_LEVEL.WORLD;view.locationId=null;return view},
 region(state,regionId){const view=this.ensure(state);view.level=MAP_VIEW_LEVEL.REGION;view.regionId=regionId||null;view.locationId=null;return view},
 location(state,regionId,locationId){const view=this.ensure(state);view.level=MAP_VIEW_LEVEL.LOCATION;view.regionId=regionId||view.regionId||null;view.locationId=locationId||null;return view},
 snapshot(state){return{...this.ensure(state)}}
};
