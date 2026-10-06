// ============================================================================
// VELIGRAD NAVIGATION
// Canonical pedestrian graph for city-01-central-lands.png.
// The location boundary has one selected transition; districts may still use
// multiple internal access nodes. Obstacles and passages remain map-local.
// ============================================================================
export const VELIGRAD_NAVIGATION={
 mapId:'location:veligrad',version:2,
 metrics:{widthMeters:1800,heightMeters:1200},
 nodes:[
  {id:'vg-gate-w',x:.0413,y:.6691},{id:'vg-w1',x:.105,y:.625},{id:'vg-w2',x:.185,y:.570},{id:'vg-w3',x:.270,y:.525},
  {id:'vg-cw',x:.365,y:.495},{id:'vg-c',x:.500,y:.459},{id:'vg-ce',x:.635,y:.445},{id:'vg-e2',x:.755,y:.455},{id:'vg-e1',x:.865,y:.485},{id:'vg-gate-e',x:.963,y:.5196},
  {id:'vg-gate-nw',x:.3557,y:.0257},{id:'vg-n1',x:.385,y:.105},{id:'vg-n2',x:.430,y:.185},{id:'vg-n3',x:.465,y:.285},{id:'vg-n4',x:.485,y:.370},
  {id:'vg-sw1',x:.330,y:.585},{id:'vg-sw2',x:.360,y:.690},{id:'vg-s1',x:.455,y:.610},{id:'vg-s2',x:.490,y:.720},{id:'vg-s3',x:.505,y:.835},{id:'vg-gate-s',x:.5034,y:.9472},
  {id:'vg-ne1',x:.585,y:.330},{id:'vg-ne2',x:.690,y:.315},{id:'vg-ne3',x:.785,y:.300},{id:'vg-ne4',x:.850,y:.365},
  {id:'vg-se1',x:.620,y:.565},{id:'vg-se2',x:.700,y:.635},{id:'vg-se3',x:.775,y:.720},{id:'vg-se4',x:.850,y:.800},
  {id:'vg-bridge-w',x:.285,y:.445},{id:'vg-bridge-e',x:.335,y:.445}
 ],
 edges:[
  ['vg-gate-w','vg-w1'],['vg-w1','vg-w2'],['vg-w2','vg-w3'],['vg-w3','vg-cw'],['vg-cw','vg-c'],['vg-c','vg-ce'],['vg-ce','vg-e2'],['vg-e2','vg-e1'],['vg-e1','vg-gate-e'],
  ['vg-gate-nw','vg-n1'],['vg-n1','vg-n2'],['vg-n2','vg-n3'],['vg-n3','vg-n4'],['vg-n4','vg-c'],
  ['vg-cw','vg-sw1'],['vg-sw1','vg-sw2'],['vg-c','vg-s1'],['vg-s1','vg-s2'],['vg-s2','vg-s3'],['vg-s3','vg-gate-s'],
  ['vg-n4','vg-ne1'],['vg-ne1','vg-ne2'],['vg-ne2','vg-ne3'],['vg-ne3','vg-ne4'],['vg-ne4','vg-e2'],
  ['vg-ce','vg-se1'],['vg-se1','vg-se2'],['vg-se2','vg-se3'],['vg-se3','vg-se4'],['vg-se4','vg-s3'],
  ['vg-w3','vg-bridge-w'],['vg-bridge-w','vg-bridge-e'],['vg-bridge-e','vg-cw'],
  ['vg-sw2','vg-s2'],['vg-ne2','vg-ce'],['vg-se2','vg-s2']
 ],
 access:{
  'veligrad':{node:'vg-gate-w',pointId:'veligrad-gate-west'},
  'veligrad-district-west':{ports:[{id:'west:north',node:'vg-w2'},{id:'west:east',node:'vg-w3'},{id:'west:south',node:'vg-w1'}]},
  'veligrad-district-northwest':{ports:[{id:'northwest:north',node:'vg-n2'},{id:'northwest:east',node:'vg-n3'},{id:'northwest:south',node:'vg-bridge-w'}]},
  'veligrad-district-north':{ports:[{id:'north:west',node:'vg-n3'},{id:'north:south',node:'vg-n4'},{id:'north:east',node:'vg-ne1'}]},
  'veligrad-district-northeast':{ports:[{id:'northeast:west',node:'vg-ne1'},{id:'northeast:north',node:'vg-ne3'},{id:'northeast:east',node:'vg-ne4'},{id:'northeast:south',node:'vg-ne2'}]},
  'veligrad-district-center':{ports:[{id:'center:west',node:'vg-cw'},{id:'center:north',node:'vg-n4'},{id:'center:east',node:'vg-ce'},{id:'center:south',node:'vg-s1'}]},
  'veligrad-district-east':{ports:[{id:'east:north',node:'vg-ne4'},{id:'east:west',node:'vg-e2'},{id:'east:east',node:'vg-e1'},{id:'east:south',node:'vg-se2'}]},
  'veligrad-district-southwest':{ports:[{id:'southwest:north',node:'vg-sw1'},{id:'southwest:west',node:'vg-sw2'},{id:'southwest:east',node:'vg-s2'}]},
  'veligrad-district-southeast':{ports:[{id:'southeast:north',node:'vg-se1'},{id:'southeast:west',node:'vg-s2'},{id:'southeast:east',node:'vg-se3'},{id:'southeast:south',node:'vg-se4'}]}
 },
 passages:[
  {id:'passage-gate-west',type:'gate',node:'vg-gate-w'},
  {id:'passage-gate-northwest',type:'gate',node:'vg-gate-nw'},
  {id:'passage-gate-east',type:'gate',node:'vg-gate-e'},
  {id:'passage-gate-south',type:'gate',node:'vg-gate-s'},
  {id:'passage-river-bridge',type:'bridge',from:'vg-bridge-w',to:'vg-bridge-e'}
 ],
 terrainZones:[
  {id:'water-west-north',type:'water',priority:20,polygon:[{x:0,y:.00},{x:.19,y:.00},{x:.23,y:.16},{x:.21,y:.30},{x:.16,y:.40},{x:.10,y:.46},{x:0,y:.48}]},
  {id:'water-west-south',type:'water',priority:20,polygon:[{x:0,y:.72},{x:.10,y:.70},{x:.18,y:.73},{x:.23,y:.82},{x:.25,y:1},{x:0,y:1}]},
  {id:'block-nw-complex',type:'blocked',priority:30,polygon:[{x:.235,y:.12},{x:.335,y:.08},{x:.365,y:.19},{x:.325,y:.34},{x:.235,y:.34},{x:.205,y:.24}]},
  {id:'block-north-complex',type:'blocked',priority:30,polygon:[{x:.49,y:.06},{x:.68,y:.055},{x:.72,y:.17},{x:.67,y:.255},{x:.53,y:.25},{x:.47,y:.17}]},
  {id:'block-ne-complex',type:'blocked',priority:30,polygon:[{x:.75,y:.08},{x:.94,y:.07},{x:.98,y:.19},{x:.91,y:.28},{x:.79,y:.25},{x:.73,y:.17}]},
  {id:'block-east-complex',type:'blocked',priority:30,polygon:[{x:.84,y:.34},{x:.98,y:.32},{x:1,y:.48},{x:.94,y:.61},{x:.84,y:.57},{x:.80,y:.45}]},
  {id:'block-sw-complex',type:'blocked',priority:30,polygon:[{x:.14,y:.55},{x:.28,y:.52},{x:.33,y:.64},{x:.28,y:.76},{x:.15,y:.78},{x:.11,y:.68}]},
  {id:'block-south-complex',type:'blocked',priority:30,polygon:[{x:.31,y:.76},{x:.45,y:.72},{x:.49,y:.84},{x:.44,y:.94},{x:.31,y:.93},{x:.27,y:.84}]},
  {id:'block-se-complex',type:'blocked',priority:30,polygon:[{x:.70,y:.68},{x:.88,y:.66},{x:.94,y:.79},{x:.88,y:.92},{x:.73,y:.90},{x:.66,y:.80}]}
 ]
};
