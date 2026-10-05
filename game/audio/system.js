// ============================================================================
// AUDIO SYSTEM
// Owns semantic music scenes. UI/world systems report context; this system
// decides whether that context requires an actual music transition.
// ============================================================================
import {AudioPlayer} from './player.js';
import {AudioContextSelector} from './context.js';
import {musicSceneForContext} from './catalog.js';
import {resolveManagedAssetUrl} from '../client/asset-cache.js';

export class AudioSystem{
 constructor({volume=70,onState=()=>{},AudioClass,random,resolveAsset=resolveManagedAssetUrl}={}){
  this.player=new AudioPlayer({AudioClass,onState});this.selector=new AudioContextSelector({random});this.resolveAsset=resolveAsset;this.context=null;this.scene=null;this.request=0;this.player.setVolume(volume/100);
  this.unlock=()=>this.player.resume();globalThis.addEventListener?.('pointerdown',this.unlock,{passive:true});
 }
 setVolume(value){this.player.setVolume(Number(value)/100)}
 async setContext(context){
  if(!context)return;
  const scene=musicSceneForContext(context);
  if(context===this.context&&scene===this.scene)return;
  this.context=context;
  if(scene&&scene===this.scene&&this.player.snapshot().trackId)return;
  this.scene=scene;
  const request=++this.request,track=this.selector.select(context);if(!track)return;
  try{const path=await this.resolveAsset(track.assetId);if(request!==this.request||!path)return;await this.player.play({...track,path})}catch(error){this.player.onState({...this.snapshot(),status:'error',error:String(error)})}
 }
 stop(){this.context=null;this.scene=null;this.request++;this.player.stop()}
 snapshot(){return{context:this.context,scene:this.scene,...this.player.snapshot()}}
 destroy(){this.request++;globalThis.removeEventListener?.('pointerdown',this.unlock);this.player.stop()}
}
