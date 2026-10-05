// ============================================================================
// AUDIO EFFECTS
// Independent ambience/weather/UI channels with fade and one-shot cooldown.
// ============================================================================
export class AudioChannel{
 constructor({AudioClass=globalThis.Audio,volume=1,fadeMs=900,onState=()=>{}}={}){this.AudioClass=AudioClass;this.volume=volume;this.fadeMs=fadeMs;this.onState=onState;this.audio=null;this.id=null;this.timer=null}
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));if(this.audio)this.audio.volume=Math.min(this.audio.volume,this.volume)}
 async play({id,path,loop=true,gain=1}){
  if(!id||!path||this.id===id&&!this.audio?.paused)return;
  const previous=this.audio;clearInterval(this.timer);this.audio=null;this.id=id;
  if(previous)this.fadeOut(previous);
  const audio=new this.AudioClass(path);audio.loop=loop;audio.preload='auto';audio.volume=0;this.audio=audio;
  try{await audio.play();this.fadeIn(audio,this.volume*gain);this.emit('playing')}catch(error){this.emit(error?.name==='NotAllowedError'?'blocked':'error')}
 }
 fadeIn(audio,target){const step=Math.max(.02,target/(this.fadeMs/40));this.timer=setInterval(()=>{if(this.audio!==audio){clearInterval(this.timer);return}audio.volume=Math.min(target,audio.volume+step);if(audio.volume>=target)clearInterval(this.timer)},40)}
 fadeOut(audio){const start=audio.volume,step=Math.max(.02,start/(this.fadeMs/40));const timer=setInterval(()=>{audio.volume=Math.max(0,audio.volume-step);if(audio.volume<=0){clearInterval(timer);audio.pause();audio.src='';audio.load?.()}},40)}
 stop(){clearInterval(this.timer);const audio=this.audio;this.audio=null;this.id=null;if(audio)this.fadeOut(audio);this.emit('stopped')}
 emit(status){this.onState({id:this.id,playing:!!this.audio&&!this.audio.paused,volume:this.volume,status})}
}

export class OneShotChannel{
 constructor({AudioClass=globalThis.Audio,volume=.35,cooldownMs=180,onState=()=>{}}={}){this.AudioClass=AudioClass;this.volume=volume;this.cooldownMs=cooldownMs;this.onState=onState;this.last=new Map();this.active=new Set()}
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0))}
 async play({id,path,gain=1,cooldownMs=this.cooldownMs}){
  const now=Date.now();if(!id||!path||now-(this.last.get(id)||0)<cooldownMs)return false;this.last.set(id,now);
  const audio=new this.AudioClass(path);audio.volume=Math.min(1,this.volume*gain);this.active.add(audio);
  const done=()=>{this.active.delete(audio);audio.src='';audio.load?.()};audio.onended=done;audio.onerror=done;
  try{await audio.play();this.onState({id,status:'playing'});return true}catch(error){done();this.onState({id,status:error?.name==='NotAllowedError'?'blocked':'error'});return false}
 }
 stop(){for(const audio of this.active){audio.pause();audio.src='';audio.load?.()}this.active.clear()}
}
