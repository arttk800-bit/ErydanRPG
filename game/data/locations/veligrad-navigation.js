// ============================================================================
// VELIGRAD NAVIGATION
// First canonical navigation layer derived from city-01-central-lands.png.
// Coordinates are normalized to the 1536x1024 source image.
// ============================================================================
export const VELIGRAD_NAVIGATION={
 mapId:'location:veligrad',version:1,
 nodes:[
  {id:'vg-west-gate',x:.0413,y:.6691},{id:'vg-west-street',x:.150,y:.600},{id:'vg-center-west',x:.350,y:.500},
  {id:'vg-center',x:.500,y:.459},{id:'vg-center-east',x:.680,y:.430},{id:'vg-east-gate',x:.963,y:.5196},
  {id:'vg-nw-gate',x:.3557,y:.0257},{id:'vg-north',x:.480,y:.179},{id:'vg-south',x:.505,y:.760},{id:'vg-south-gate',x:.5034,y:.9472}
 ],
 edges:[
  ['vg-west-gate','vg-west-street'],['vg-west-street','vg-center-west'],['vg-center-west','vg-center'],
  ['vg-center','vg-center-east'],['vg-center-east','vg-east-gate'],['vg-nw-gate','vg-north'],['vg-north','vg-center'],
  ['vg-center','vg-south'],['vg-south','vg-south-gate']
 ],
 access:{
  'veligrad':{ports:[
   {id:'veligrad:west',node:'vg-west-gate',pointId:'veligrad-gate-west'},
   {id:'veligrad:northwest',node:'vg-nw-gate',pointId:'veligrad-gate-northwest'},
   {id:'veligrad:east',node:'vg-east-gate',pointId:'veligrad-gate-east'},
   {id:'veligrad:south',node:'vg-south-gate',pointId:'veligrad-gate-south'}
  ]},
  'veligrad-district-center':{ports:[
   {id:'district-center:west',node:'vg-center-west'},
   {id:'district-center:north',node:'vg-north'},
   {id:'district-center:east',node:'vg-center-east'},
   {id:'district-center:south',node:'vg-south'}
  ]}
 },
 terrainZones:[
  {id:'veligrad-water-north',type:'water',priority:20,polygon:[{x:.00,y:.00},{x:.28,y:.00},{x:.26,y:.22},{x:.18,y:.34},{x:.00,y:.38}]},
  {id:'veligrad-water-southwest',type:'water',priority:20,polygon:[{x:.00,y:.72},{x:.16,y:.70},{x:.25,y:.78},{x:.28,y:1},{x:.00,y:1}]},
  {id:'veligrad-wall-northwest',type:'blocked',priority:30,polygon:[{x:.05,y:.12},{x:.31,y:.05},{x:.35,y:.08},{x:.15,y:.20}]},
  {id:'veligrad-wall-east',type:'blocked',priority:30,polygon:[{x:.86,y:.20},{x:.98,y:.22},{x:.98,y:.46},{x:.94,y:.47},{x:.91,y:.28}]}
 ]
};
