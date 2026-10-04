import {validate} from './validate-domain.mjs';
validate({required:['game/combat/actions.js','game/combat/damage.js','game/ai/ai-controller.js','game/simulation/runner.js','game/simulation/mirror.js'],roots:['game/combat','game/ai','game/simulation','game/systems/combat']});
