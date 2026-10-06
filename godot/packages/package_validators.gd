# ============================================================================
# PACKAGE VALIDATORS
# Owns the runtime registry of domain package validators.
# PackageManager orchestrates validation without knowing domain-specific rules.
# ============================================================================
extends Node

var _validators: Dictionary = {}

func _ready() -> void:
	Diagnostics.register_provider(&"package_validators", snapshot)
	Diagnostics.info("package_validators.ready", {"count": _validators.size()})

func register_validator(id: StringName, validator: Callable) -> void:
	if id.is_empty() or not validator.is_valid():
		Diagnostics.error("package_validators.registration_rejected", {"id": str(id)})
		return
	_validators[id] = validator
	Diagnostics.info("package_validators.registered", {"id": str(id)})

func unregister_validator(id: StringName) -> void:
	_validators.erase(id)
	Diagnostics.info("package_validators.unregistered", {"id": str(id)})

func validate(manifest: Dictionary, payload_path: String) -> Dictionary:
	var errors: Array[String] = []
	for id in _validators:
		var result = _validators[id].call(manifest, payload_path)
		if result is not Dictionary:
			errors.append("%s: validator returned invalid result" % id)
			continue
		if not result.get("ok", false):
			for error in result.get("errors", ["validation failed"]):
				errors.append("%s: %s" % [id, error])
	return {"ok": errors.is_empty(), "errors": errors}

func snapshot() -> Dictionary:
	var ids: Array[String] = []
	for id in _validators:
		ids.append(str(id))
	ids.sort()
	return {"count": ids.size(), "validators": ids}
