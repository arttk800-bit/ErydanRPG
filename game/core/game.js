// Eirdan core coordinator. Systems are attached here as they are migrated.
export const EirdanGame={modules:new Map(),register(name,api){this.modules.set(name,api);return api},get(name){return this.modules.get(name)}};
