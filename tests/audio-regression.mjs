// ============================================================================
// AUDIO REGRESSION
// Verifies catalog contexts, deterministic selection and public AudioSystem flow.
// ============================================================================
import assert from 'node:assert/strict';
import {MUSIC_TRACKS,tracksForContext} from '../game/audio/catalog.js';
import {AudioSystem} from '../game/audio/system.js';

assert.equal(MUSIC_TRACKS.length,15);
assert.ok(tracksForContext('battle').some(track=>track.id==='battle-greensleeves'));
assert.ok(tracksForContext('town').length>=4);
assert.ok(tracksForContext('forest').length>=3);
class FakeAudio{constructor(src){this.src=src;this.paused=true;this.volume=1;this.loop=false}async play(){this.paused=false}pause(){this.paused=true}load(){}}
const states=[],audio=new AudioSystem({volume:40,AudioClass:FakeAudio,random:()=>0,resolveAsset:async id=>'asset://'+id,onState:s=>states.push(s)});
await audio.setContext('battle');
assert.equal(audio.snapshot().context,'battle');
assert.equal(audio.snapshot().trackId,'battle-greensleeves');
assert.equal(audio.snapshot().volume,.4);
assert.equal(audio.snapshot().playing,true);
audio.setVolume(25);assert.equal(audio.snapshot().volume,.25);
audio.stop();assert.equal(audio.snapshot().trackId,null);
audio.destroy();
console.log('audio catalog + runtime: OK');
