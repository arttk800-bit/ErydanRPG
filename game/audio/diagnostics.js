// ============================================================================
// AUDIO DIAGNOSTICS
// Read-only snapshot adapter; never duplicates playback or selection rules.
// ============================================================================
export function audioDiagnosticSnapshot(audio){return audio?.snapshot?.()||{context:null,trackId:null,playing:false,blocked:false}}
