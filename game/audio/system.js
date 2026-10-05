// ============================================================================
// AUDIO SYSTEM
// Public music API: semantic context in, verified managed playback state out.
// ============================================================================
import {AudioPlayer} from './player.js';
import {AudioContextSelector} from './context.js';
import {resolveManagedAssetUrl} from '../client/asset-cache.js';

export class AudioSystem{
 constructor({volume=70,onState=()=>{},AudioClass,random,resolveAsset=resolveManagedAssetUrl}={}){
  this.player=new AudioPlayer({AudioClass,onState});this.selector=new AudioContextSelector({random});this.resolveAsset=resolveAsset;this.context=null;this.request=0;this.player.setVolume(volume/100);
  this.unlock=()=>this.player.resume();globalThis.addEventListener?.('pointerdown',this.unlock,{passive:true});
 }
 setVolume(value){this.player.setVolume(Number(value)/100)}
 async setContext(context){
  if(!context||context===this.context)return;
  this.context=context;const request=++this.request,track=this.selector.select(context);if(!track)return;
  try{const path=await this.resolveAsset(track.assetId);if(request!==this.request||!path)return;await this.player.play({...track,path})}catch(error){this.player.onState({...this.snapshot(),status:'error',error:String(error)})}
 }
 snapshot(){return{context:this.context,...this.player.snapshot()}}
 destroy(){this.request++;globalThis.removeEventListener?.('pointerdown',this.unlock);this.player.stop()}
}
