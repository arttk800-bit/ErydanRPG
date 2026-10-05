// ============================================================================
// AUDIO SYSTEM
// Public audio facade. Owns music scenes and independent ambience/weather/UI
// playback while world state remains owned by WorldSystem.
// ============================================================================
import {AudioPlayer} from './player.js';
import {AudioContextSelector} from './context.js';
import {musicSceneForContext} from './catalog.js';
import {AudioChannel,OneShotChannel} from './effects.js';
import {environmentForState} from './environment.js';
import {resolveManagedAssetUrl} from '../client/asset-cache.js';

const AMBIENCE=Object.freeze({
 forest:{assetId:'ambience-forest',gain:.32},town:{assetId:'ambience-town',gain:.24},market:{assetId:'ambience-market',gain:.22},
 tavern:{assetId:'ambience-tavern',gain:.2},mountains:{assetId:'ambience-mountains',gain:.22},campfire:{assetId:'ambience-campfire',gain:.2},blacksmith:{assetId:'ambience-blacksmith',gain:.12}
});
const WEATHER=Object.freeze({rain:{assetId:'ambience-rain',gain:.28}});
const UI=Object.freeze({click:{assetId:'ui-click',gain:.45},back:{assetId:'ui-back',gain:.45},confirm:{assetId:'ui-confirm',gain:.45}});

export class AudioSystem{
 constructor({volume=70,onState=()=>{},AudioClass,random,resolveAsset=resolveManagedAssetUrl}={}){
  this.onState=onState;this.resolveAsset=resolveAsset;this.player=new AudioPlayer({AudioClass,onState:s=>onState({...s,channel:'music'})});this.selector=new AudioContextSelector({random});
  this.ambience=new AudioChannel({AudioClass,fadeMs:1200,onState:s=>onState({...s,channel:'ambience'})});this.weather=new AudioChannel({AudioClass,fadeMs:1600,onState:s=>onState({...s,channel:'weather'})});this.ui=new OneShotChannel({AudioClass,cooldownMs:90,onState:s=>onState({...s,channel:'ui'})});
  this.context=null;this.scene=null;this.environment={location:null,weather:null};this.request=0;this.setVolume(volume);
  this.unlock=()=>this.player.resume();globalThis.addEventListener?.('pointerdown',this.unlock,{passive:true});
 }
 setVolume(value){const v=Math.max(0,Math.min(1,Number(value)/100||0));this.player.setVolume(v);this.ambience.setVolume(v*.65);this.weather.setVolume(v*.6);this.ui.setVolume(v*.55)}
 async setContext(context){
  if(!context)return;const scene=musicSceneForContext(context);if(context===this.context&&scene===this.scene)return;this.context=context;
  if(scene&&scene===this.scene&&this.player.snapshot().trackId)return;this.scene=scene;const request=++this.request,track=this.selector.select(context);if(!track)return;
  try{const path=await this.resolveAsset(track.assetId);if(request!==this.request||!path)return;await this.player.play({...track,path})}catch(error){this.onState({...this.snapshot(),channel:'music',status:'error',error:String(error)})}
 }
 async syncEnvironment(state){
  const next=environmentForState(state);if(next.location!==this.environment.location){this.environment.location=next.location;await this.playLayer(this.ambience,AMBIENCE[next.location],next.location)}
  if(next.weather!==this.environment.weather){this.environment.weather=next.weather;await this.playLayer(this.weather,WEATHER[next.weather],next.weather)}
 }
 async setAmbience(id){this.environment.location=id||null;return this.playLayer(this.ambience,AMBIENCE[id],id)}
 async setWeather(id){this.environment.weather=id||null;return this.playLayer(this.weather,WEATHER[id],id)}
 async playLayer(channel,entry,id){if(!entry){channel.stop();return}try{const path=await this.resolveAsset(entry.assetId);await channel.play({id,path,loop:true,gain:entry.gain})}catch(error){this.onState({channel:'environment',id,status:'error',error:String(error)})}}
 async playUi(id='click'){const entry=UI[id]||UI.click;try{const path=await this.resolveAsset(entry.assetId);return this.ui.play({id,path,gain:entry.gain})}catch(error){this.onState({channel:'ui',id,status:'error',error:String(error)});return false}}
 stop(){this.context=null;this.scene=null;this.environment={location:null,weather:null};this.request++;this.player.stop();this.ambience.stop();this.weather.stop();this.ui.stop()}
 snapshot(){return{context:this.context,scene:this.scene,environment:{...this.environment},...this.player.snapshot()}}
 destroy(){this.request++;globalThis.removeEventListener?.('pointerdown',this.unlock);this.stop()}
}
