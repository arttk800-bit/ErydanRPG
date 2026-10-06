# Android-only adapter. OS owns user consent and actual APK installation.
extends RefCounted

const APP_ID := "org.eirdan.runtime"
const CERT_SHA256 := "f32adefd89e71bbbdb0749184a5311f2c8e55eab0613db35afd3934ec4605ecb"

func available() -> bool:
	return OS.get_name() == "Android" and Engine.has_singleton("AndroidRuntime") and Engine.has_singleton("JavaClassWrapper")

func identity() -> Dictionary:
	if not available(): return {"ok": false, "error": "android_only"}
	var java = Engine.get_singleton("JavaClassWrapper")
	var activity = Engine.get_singleton("AndroidRuntime").getActivity()
	var sdk = java.wrap("android.os.Build$VERSION")
	var info = activity.getPackageManager().getPackageInfo(APP_ID, 0)
	if java.get_exception() != null or info == null: return {"ok": false, "error": "installed_identity_unavailable"}
	return {"ok": true, "version_code": int(info.versionCode), "sdk": int(sdk.SDK_INT)}

func verify_archive(path: String, release: Dictionary) -> Dictionary:
	if not available(): return {"ok": false, "error": "android_only"}
	var java = Engine.get_singleton("JavaClassWrapper")
	var activity = Engine.get_singleton("AndroidRuntime").getActivity()
	# GET_SIGNATURES is also supported below API 28; this runtime has one fixed signer.
	var info = activity.getPackageManager().getPackageArchiveInfo(ProjectSettings.globalize_path(path), 64)
	if java.get_exception() != null or info == null: return {"ok": false, "error": "apk_metadata_unreadable"}
	if str(info.packageName) != APP_ID or int(info.versionCode) != int(release.version_code):
		return {"ok": false, "error": "apk_identity_mismatch"}
	var signatures = info.signatures
	if signatures == null or signatures.size() != 1: return {"ok": false, "error": "apk_signer_missing"}
	var cert: String = signatures[0].toCharsString()
	if java.get_exception() != null: return {"ok": false, "error": "apk_signer_unreadable"}
	var hash := HashingContext.new()
	hash.start(HashingContext.HASH_SHA256)
	hash.update(cert.hex_decode())
	if hash.finish().hex_encode() != CERT_SHA256: return {"ok": false, "error": "apk_signer_mismatch"}
	return {"ok": true}

func request_install(path: String) -> Dictionary:
	if not available(): return {"ok": false, "error": "android_only"}
	var java = Engine.get_singleton("JavaClassWrapper")
	var activity = Engine.get_singleton("AndroidRuntime").getActivity()
	var sdk_class = java.wrap("android.os.Build$VERSION")
	var sdk := int(sdk_class.SDK_INT)
	if java.get_exception() != null: return {"ok": false, "error": "android_sdk_unavailable"}
	if sdk >= 26:
		var allowed: bool = activity.getPackageManager().canRequestPackageInstalls()
		if java.get_exception() != null: return {"ok": false, "error": "install_permission_unavailable"}
		if not allowed:
			var intent_class = java.wrap("android.content.Intent")
			var uri_class = java.wrap("android.net.Uri")
			var intent = intent_class.Intent()
			intent.setAction("android.settings.MANAGE_UNKNOWN_APP_SOURCES")
			intent.setData(uri_class.parse("package:" + APP_ID))
			activity.startActivity(intent)
			if java.get_exception() != null: return {"ok": false, "error": "install_settings_failed"}
			return {"ok": true, "permission_required": true}
	# Godot's Android openURI uses its bundled FileProvider + read URI permission.
	var err := OS.shell_open(ProjectSettings.globalize_path(path))
	return {"ok": err == OK, "permission_required": false, "error": "" if err == OK else "installer_open_failed"}
