# APK release contract and integrity checks; independent of transport and UI.
extends RefCounted

const APP_ID := "org.eirdan.runtime"
const MAX_APK_BYTES := 512 * 1024 * 1024

static func secure_url(value: Variant) -> bool:
	if not value is String: return false
	if not value.begins_with("https://"): return false
	var authority: String = value.trim_prefix("https://").split("/")[0]
	return not authority.is_empty() and not "@" in authority and not " " in value and not "\n" in value and not "\r" in value

static func validate(value: Variant, current_code: int, sdk: int = 0) -> Dictionary:
	if not value is Dictionary: return {"ok": false, "error": "manifest_not_object"}
	if value.get("format") != "eirdan-runtime-update" or value.get("format_version") != 1:
		return {"ok": false, "error": "manifest_format"}
	if value.get("application_id") != APP_ID or value.get("abi") != "arm64-v8a":
		return {"ok": false, "error": "incompatible_application"}
	for key in ["version_code", "min_sdk", "size_bytes"]:
		var number: Variant = value.get(key)
		if not (number is int or number is float): return {"ok": false, "error": "invalid_" + key}
		if not is_finite(float(number)) or float(number) != floor(float(number)) or number <= 0 or number > 2147483647:
			return {"ok": false, "error": "invalid_" + key}
	if value.size_bytes > MAX_APK_BYTES: return {"ok": false, "error": "apk_too_large"}
	if sdk > 0 and value.min_sdk > sdk: return {"ok": false, "error": "android_too_old"}
	if not value.get("version_name") is String or value.version_name.is_empty():
		return {"ok": false, "error": "version_name_missing"}
	if not secure_url(value.get("apk_url")): return {"ok": false, "error": "https_required"}
	var hash: Variant = value.get("sha256")
	if not hash is String or hash.length() != 64: return {"ok": false, "error": "invalid_sha256"}
	for character in hash:
		if not character in "0123456789abcdef": return {"ok": false, "error": "invalid_sha256"}
	return {"ok": true, "available": int(value.version_code) > current_code, "release": value.duplicate(true)}

static func verify_file(path: String, release: Dictionary) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null: return {"ok": false, "error": "apk_missing"}
	var size := file.get_length()
	file.close()
	if size != int(release.size_bytes): return {"ok": false, "error": "apk_size_mismatch"}
	if FileAccess.get_sha256(path) != release.sha256: return {"ok": false, "error": "apk_hash_mismatch"}
	return {"ok": true}
