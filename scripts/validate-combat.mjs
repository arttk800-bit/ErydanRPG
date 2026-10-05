// ============================================================================
// COMBAT VALIDATION ENTRYPOINT
// Selects the combat source boundary; other disabled domains are not checked.
// ============================================================================
import {validate} from './validate-domain.mjs';
import {DOMAIN_VALIDATION} from './domain-config.mjs';
validate(DOMAIN_VALIDATION.combat);
