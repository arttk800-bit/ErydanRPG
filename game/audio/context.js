// ============================================================================
// AUDIO CONTEXT
// Maps semantic game context to catalog tracks without coupling domains to files.
// ============================================================================
import {tracksForContext} from './catalog.js';
export class AudioContextSelector{
 constructor({random=Math.random}={}){this.random=random;this.lastByContext=new Map()}
 select(context){const pool=tracksForContext(context);if(!pool.length)return null;const last=this.lastByContext.get(context);const choices=pool.length>1?pool.filter(track=>track.id!==last):pool;const track=choices[Math.floor(this.random()*choices.length)]||pool[0];this.lastByContext.set(context,track.id);return track}
}
