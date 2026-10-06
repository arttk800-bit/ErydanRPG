# ============================================================================
# LOCAL PACKAGE IMPORT
# Opens the platform file picker; Android uses the Storage Access Framework.
# ============================================================================
class_name EirdanLocalImport
extends RefCounted

static func choose_package(callback: Callable) -> Error:
	var filters := PackedStringArray([
		"*.zip;Eirdan package;application/zip"
	])
	return DisplayServer.file_dialog_show(
		"Import Eirdan package",
		"",
		"",
		false,
		DisplayServer.FILE_DIALOG_MODE_OPEN_FILE,
		filters,
		callback
	)
