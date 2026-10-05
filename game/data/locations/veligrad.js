export const VELIGRAD={
 id:'veligrad',
 map:'../assets/locations/city-01-central-lands.png',
 description:'Крупный укреплённый город Центральных земель.',
 spawnPointId:'veligrad-district-center',
 accessPorts:[
  {id:'veligrad:west',pointId:'veligrad-gate-west'},
  {id:'veligrad:northwest',pointId:'veligrad-gate-northwest'},
  {id:'veligrad:east',pointId:'veligrad-gate-east'},
  {id:'veligrad:south',pointId:'veligrad-gate-south'}
 ],
 points:[
  {id:'veligrad-district-north',name:'Район',class:'district',type:'district',x:0.47943,y:0.179},
  {id:'veligrad-district-northwest',name:'Район',class:'district',type:'district',x:0.28877,y:0.23198},
  {id:'veligrad-district-southwest',name:'Район',class:'district',type:'district',x:0.38347,y:0.67663},
  {id:'veligrad-district-east',name:'Район',class:'district',type:'district',x:0.82286,y:0.44579},
  {id:'veligrad-place-eastcentral',name:'Место',class:'place',type:'place',x:0.66882,y:0.40417},
  {id:'veligrad-place-central',name:'Место',class:'place',type:'place',x:0.52235,y:0.40038},
  {id:'veligrad-district-center',name:'Район',class:'district',type:'district',x:0.48069,y:0.45904},
  {id:'veligrad-district-northeast',name:'Район',class:'district',type:'district',x:0.7673,y:0.26982},
  {id:'veligrad-district-southeast',name:'Район',class:'district',type:'district',x:0.75468,y:0.70123},
  {id:'veligrad-district-west',name:'Район',class:'district',type:'district',x:0.09938,y:0.52337},
  {id:'veligrad-place-westnorth',name:'Место',class:'place',type:'place',x:0.07286,y:0.179},
  {id:'veligrad-place-farnortheast',name:'Место',class:'place',type:'place',x:0.9466,y:0.09007},
  {id:'veligrad-place-southwest',name:'Место',class:'place',type:'place',x:0.15746,y:0.8053},
  {id:'veligrad-place-south',name:'Место',class:'place',type:'place',x:0.31907,y:0.89612},
  {id:'veligrad-place-north',name:'Место',class:'place',type:'place',x:0.69155,y:0.09007},
  {id:'veligrad-place-farsoutheast',name:'Место',class:'place',type:'place',x:0.88346,y:0.89233},
  {id:'veligrad-place-farsouth',name:'Место',class:'place',type:'place',x:0.50342,y:0.94721},
  {id:'veligrad-place-farnorthwest',name:'Место',class:'place',type:'place',x:0.08801,y:0.03331},
  {id:'veligrad-gate-west',name:'Западные ворота',class:'transition',type:'transition',exit:{regionId:'forest'},x:0.0413,y:0.66906},
  {id:'veligrad-gate-east',name:'Восточные ворота',class:'transition',type:'transition',exit:{regionId:'forest'},x:0.96301,y:0.51959},
  {id:'veligrad-gate-northwest',name:'Северо-западные ворота',class:'transition',type:'transition',exit:{regionId:'forest'},x:0.35569,y:0.02574},
  {id:'veligrad-gate-south',name:'Южные ворота',class:'transition',type:'transition',exit:{regionId:'forest'},x:0.50342,y:0.94721}
 ]
};
