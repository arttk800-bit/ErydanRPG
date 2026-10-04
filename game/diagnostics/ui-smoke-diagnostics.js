import {WorldUI} from '../ui/world.js';
import {CENTRAL_LANDS} from '../data/regions/central-lands.js';
function testState(){
 const knowledge={};for(const p of CENTRAL_LANDS.points)knowledge[p.id]={discovered:true};
 return{clock:{day:1,minute:480},world:{current:{regionId:'forest',locationId:null,districtId:null,placeId:null},position:{regionId:'forest',pointId:'veligrad'},knowledge,travel:{status:'idle'}},history:[]};
}
function click(el,name,checks){const ok=!!el;checks.push([name+' exists',ok]);if(ok)el.click();return ok}
export async function runUiSmokeDiagnostics(){
 const checks=[],details=[];const host=document.createElement('div');host.className='diagnostic-ui-sandbox';host.style.cssText='position:fixed;left:-10000px;top:0;width:900px;height:900px;visibility:hidden;pointer-events:none';document.body.append(host);
 const s=testState();let unmount=null;
 try{
  unmount=WorldUI.mount(host,s,()=>{});
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  checks.push(['Region screen mounted',!!host.querySelector('.region-map-frame')]);
  const legend=host.querySelector('.map-legend');if(click(legend,'Legend',checks))checks.push(['Legend toggles open',legend.open===true]);
  const target=host.querySelector('.region-poi[data-id="stone-guard"]');if(click(target,'POI Stone Guard',checks))checks.push(['POI action card opens',!!host.querySelector('.map-point-action')]);
  const walk=[...host.querySelectorAll('.map-point-action button')].find(b=>b.textContent.includes('Идти пешком'));if(click(walk,'Walk',checks)){checks.push(['Walk starts travel',s.world.travel?.status==='travelling']);checks.push(['Travel controls appear',!!host.querySelector('.travel-status')])}
  let stop=[...host.querySelectorAll('.travel-actions button')].find(b=>b.textContent==='Остановиться');if(click(stop,'Stop',checks))checks.push(['Stop changes state',s.world.travel?.status==='stopped']);
  let resume=[...host.querySelectorAll('.travel-actions button')].find(b=>b.textContent==='Продолжить');if(click(resume,'Resume',checks))checks.push(['Resume changes state',s.world.travel?.status==='travelling']);
  let camp=[...host.querySelectorAll('.travel-actions button')].find(b=>b.textContent==='Разбить лагерь');if(click(camp,'Camp',checks))checks.push(['Camp changes state',s.world.travel?.status==='camp'&&!!s.world.camp]);
  let fold=[...host.querySelectorAll('.travel-actions button')].find(b=>b.textContent==='Свернуть лагерь');if(click(fold,'Fold camp',checks))checks.push(['Fold camp resumes',s.world.travel?.status==='travelling']);
  const newTarget=host.querySelector('.region-poi[data-id="ozernoe"]');if(click(newTarget,'Change-target POI',checks)){const walk2=[...host.querySelectorAll('.map-point-action button')].find(b=>b.textContent.includes('Идти пешком'));if(click(walk2,'Reroute',checks))checks.push(['Reroute changes destination',s.world.travel?.toId==='ozernoe'&&s.world.travel?.status==='travelling'])}
  const cancel=[...host.querySelectorAll('.travel-actions button')].find(b=>b.textContent==='Отменить путь');if(click(cancel,'Cancel',checks)){checks.push(['Cancel returns idle',s.world.travel?.status==='idle']);checks.push(['Cancel keeps free position',!!s.world.position?.position&&!s.world.position?.pointId])}
  const restartTarget=host.querySelector('.region-poi[data-id="podgorye"]');if(click(restartTarget,'Restart-target POI',checks)){const walk3=[...host.querySelectorAll('.map-point-action button')].find(b=>b.textContent.includes('Идти пешком'));if(click(walk3,'Restart from terrain',checks)){checks.push(['Restart uses road entry',!!s.world.travel?.route?.roadEntry]);checks.push(['Restart does not teleport',s.world.travel?.fromId==='road-position'])}}
 }catch(e){details.push(String(e?.stack||e));checks.push(['UI smoke completed without exception',false])}
 finally{try{unmount?.()}catch{}host.remove()}
 return{ok:checks.every(([,ok])=>ok),checks,details};
}
