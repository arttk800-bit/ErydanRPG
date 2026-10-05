// ============================================================================
// CAMPAIGN MODULE ADAPTER
// Connects the campaign module to its screen composition without exposing UI
// internals to the generic module runtime.
// ============================================================================
import {mountGameScreen} from '../app/game-screen.js';

export function mount(state,{onChange}={}){return mountGameScreen(state,onChange)}
