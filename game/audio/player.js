// ============================================================================
// AUDIO PLAYER
// Owns browser music playback, volume, track transitions and autoplay recovery.
// ============================================================================
export class AudioPlayer{
 constructor({AudioClass=globalThis.Audio,onState=()=>{}}={}){this.AudioClass=AudioClass;this.onState=onState;this.audio=null;this.track=null;this.volume=.7;this.blocked=false}
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));if(this.audio)this.audio.volume=this.volume;this.emit()}
 async play(track){if(!track||this.track?.id===track.id&&!this.audio?.paused)return;this.stop();const audio=new this.AudioClass(track.path);audio.loop=track.loop!==false;audio.volume=this.volume;audio.preload='auto';this.audio=audio;this.track=track;audio.onerror=()=>this.emit('error');try{await audio.play();this.blocked=false;this.emit('playing')}catch(error){this.blocked=error?.name==='NotAllowedError';this.emit(this.blocked?'blocked':'error')}}
 async resume(){if(!this.audio)return false;try{await this.audio.play();this.blocked=false;this.emit('playing');return true}catch{return false}}
 stop(){if(this.audio){this.audio.pause();this.audio.src='';this.audio.load?.()}this.audio=null;this.track=null;this.blocked=false;this.emit('stopped')}
 snapshot(){return{trackId:this.track?.id||null,title:this.track?.title||null,volume:this.volume,playing:!!this.audio&&!this.audio.paused,blocked:this.blocked}}
 emit(status){this.onState({...this.snapshot(),status})}
}
