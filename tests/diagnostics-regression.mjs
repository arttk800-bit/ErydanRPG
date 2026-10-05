import assert from 'node:assert/strict';
import {createGameState,STATE_VERSION} from '../game/core/state.js';
import {runStateDiagnostics} from '../game/diagnostics/state-diagnostics.js';
import {runWorldDiagnostics} from '../game/diagnostics/world-diagnostics.js';
import {audioDiagnosticSnapshot} from '../game/audio/diagnostics.js';

const state=createGameState({worldName:'Diagnostics',seed:42});
const stateReport=runStateDiagnostics(state,{persistenceSupported:true});
assert.equal(stateReport.ok,true);
assert.equal(stateReport.version,STATE_VERSION);
assert.equal(stateReport.save.worldId,state.meta.worldId);

const worldReport=runWorldDiagnostics(state);
assert.equal(worldReport.ok,true);
assert.equal(worldReport.simulation.mode,'world');
assert.equal(worldReport.clock.day,1);
assert.equal(worldReport.clock.minute,480);

const bad=structuredClone(state);
bad.clock.minute=1440;
bad.simulation.runtime.mode='sleep';
bad.simulation.runtime.sleep=null;
const badWorld=runWorldDiagnostics(bad);
assert.equal(badWorld.ok,false);
assert.ok(badWorld.checks.some(([name,ok])=>name==='Clock minute valid'&&!ok));
assert.ok(badWorld.checks.some(([name,ok])=>name==='Sleep state coherent'&&!ok));

const audio={snapshot:()=>({context:'world',scene:'overworld',trackId:'track',playing:true,blocked:false})};
assert.deepEqual(audioDiagnosticSnapshot(audio),audio.snapshot());
console.log('domain diagnostics regression: OK');
