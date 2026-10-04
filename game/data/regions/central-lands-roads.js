// Central Lands road topology v2.
// Nodes are invisible road junctions/crossings. POIs connect to roads explicitly.
// Only visually supported traversable corridors are represented.
export const CENTRAL_LANDS_ROADS={
 regionId:'forest',version:2,
 nodes:[
  ['r01',.205,.244],['r02',.265,.274],['r03',.315,.316],['r04',.365,.344],
  ['r05',.423,.365],['r06',.470,.390],['r07',.515,.420],['r08',.548,.455],
  ['r09',.575,.493],['r10',.558,.535],['r11',.520,.575],['r12',.480,.610],
  ['r13',.430,.625],['r14',.375,.620],['r15',.325,.595],['r16',.285,.555],
  ['r17',.245,.505],['r18',.215,.455],['r19',.270,.430],['r20',.330,.445],
  ['r21',.390,.455],['r22',.455,.465],['r23',.610,.455],['r24',.675,.450],
  ['r25',.735,.435],['r26',.790,.420],['r27',.835,.405],['r28',.705,.365],
  ['r29',.665,.320],['r30',.625,.275],['r31',.590,.235],['r32',.535,.215],
  ['r33',.475,.235],['r34',.420,.265],['r35',.365,.285],
  ['r36',.605,.535],['r37',.650,.575],['r38',.690,.615],['r39',.735,.645],
  ['r40',.665,.690],['r41',.610,.720],['r42',.550,.735],['r43',.495,.710],
  ['r44',.445,.675],['r45',.385,.700],['r46',.325,.735],['r47',.275,.760],
  ['r48',.235,.705],['r49',.195,.650],['r50',.760,.705],
  ['bridge-central-n',.548,.472],['bridge-central-s',.557,.510],
  ['bridge-east-w',.742,.438],['bridge-east-e',.770,.426],
  ['bridge-south-w',.520,.660],['bridge-south-e',.545,.680],
  ['bridge-north-w',.585,.350],['bridge-north-e',.610,.365]
 ].map(([id,x,y])=>({id,x,y})),
 edges:[
  ['r01','r02'],['r02','r03'],['r03','r04'],['r04','r05'],['r05','r06'],['r06','r07'],
  ['r07','bridge-central-n'],['bridge-central-n','bridge-central-s'],['bridge-central-s','r10'],
  ['r10','r11'],['r11','r12'],['r12','r13'],['r13','r14'],['r14','r15'],['r15','r16'],
  ['r16','r17'],['r17','r18'],['r18','r19'],['r19','r20'],['r20','r21'],['r21','r22'],['r22','r07'],
  ['r22','r23'],['r23','r24'],['r24','bridge-east-w'],['bridge-east-w','bridge-east-e'],['bridge-east-e','r26'],['r26','r27'],
  ['r24','r28'],['r28','r29'],['r29','bridge-north-e'],['bridge-north-e','bridge-north-w'],['bridge-north-w','r30'],
  ['r30','r31'],['r31','r32'],['r32','r33'],['r33','r34'],['r34','r35'],['r35','r04'],
  ['r10','r36'],['r36','r37'],['r37','r38'],['r38','r39'],['r39','r50'],
  ['r37','r40'],['r40','r41'],['r41','r42'],['r42','r43'],['r43','bridge-south-e'],['bridge-south-e','bridge-south-w'],['bridge-south-w','r44'],
  ['r44','r45'],['r45','r46'],['r46','r47'],['r47','r48'],['r48','r49'],['r49','r16']
 ],
 access:{
  'sosnovy-bor':{node:'r01'},'north-gate':{node:'r34'},'kamenka':{node:'r03'},'high-pass':{node:'r33'},
  'medovye-luga':{node:'r05'},'starolesye':{node:'r19'},'west-watch':{node:'r18'},'lesnoy-brod':{node:'r20'},
  'malinovka':{node:'r21'},'veligrad':{node:'r07'},'zarechye':{node:'r30'},'white-rock':{node:'r31'},
  'vetrovo':{node:'r29'},'east-watch':{node:'r27'},'rechnoe':{node:'r28'},'grey-ruins':{node:'r26'},
  'berezovka':{node:'r37'},'dubrava':{node:'r39'},'yuzhny-brod':{node:'r50'},'eastern-marshes':{node:'r40'},
  'podgorye':{node:'r12'},'stone-guard':{node:'r44'},'old-river-tower':{node:'r45'},'ozernoe':{node:'r47'},
  'south-shield':{node:'r42'},'western-ruins':{node:'r49'}
 }
};
