export const RUNTIME_SCRIPTS=[
  "legacy-00.js",
  "legacy-01.js",
  "legacy-02.js",
  "legacy-03.js",
  "legacy-04.js",
  "legacy-05.js",
  "alpha14c-fixes-script.js",
  "alpha14f-real-clash-defiant.js",
  "alpha14g-diagnostics.js",
  "alpha14m-stall-guard.js",
  "alpha14n-battle-lifecycle.js",
  "alpha14o-seed-repro-stall-trace.js",
  "alpha14p-melee-loop-fix.js",
  "legacy-13.js",
  "legacy-14.js",
  "legacy-15.js",
  "legacy-16.js",
  "legacy-17.js",
  "legacy-18.js",
  "legacy-19.js",
  "legacy-20.js",
  "alpha14a-ui-script.js",
  "legacy-22.js",
  "alpha14e-final-fix.js",
  "alpha14i-runtime-fixes.js",
  "alpha14j-ai-skills-movement.js",
  "alpha14k-log-runtime-fix.js",
  "alpha14l-ai-audit-cleanup.js"
];
export async function loadLegacyRuntime(base='./js/'){
 for(const name of RUNTIME_SCRIPTS){await new Promise((ok,fail)=>{const s=document.createElement('script');s.src=base+name;s.onload=ok;s.onerror=()=>fail(new Error('Failed to load '+name));document.body.appendChild(s);});}
}
