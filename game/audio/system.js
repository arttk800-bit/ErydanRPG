// ============================================================================
// AUDIO SYSTEM
// Public music API: semantic context in, playback state out.
// ============================================================================
import {AudioPlayer} from './player.js';
import {AudioContextSelector} from './context.js';
export class AudioSystem{
 constructor({volume=70,onState=()=>{},AudioClass,random}={}){this.player=new AudioPlayer({AudioClass,onState});this.selector=new AudioContextSelector({random});this.context=null;this.player.setVolume(volume/100);this.unlock=()=>this.player.resume();globalThis.addEventListener?.('pointerdown',this.unlock,{passive:true})}
 setVolume(value){this.player.setVolume(Number(value)/100)}
 async setContext(context){if(!context||context===this.context)return;this.context=context;await this.player.play(this.selector.select(context))}
 snapshot(){return{context:this.context,...this.player.snapshot()}}
 destroy(){globalThis.removeEventListener?.('pointerdown',this.unlock);this.player.stop()}
}
