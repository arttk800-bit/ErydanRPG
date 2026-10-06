# ============================================================================
# RUNTIME BOOTSTRAP
# Presents infrastructure status and delegates package/diagnostic actions.
# ============================================================================
extends Control

const LocalImport = preload("res://packages/local_import.gd")

@onready var status: Label = $Panel/Status

func _ready() -> void:
	if "--package-installer-test" in OS.get_cmdline_user_args():
		get_tree().change_scene_to_file("res://tests/package_installer_test.tscn")
		return
	$Panel/Reload.pressed.connect(_refresh)
	$Panel/Import.pressed.connect(_import_package)
	$Panel/Diagnostics.pressed.connect(_export_diagnostics)
	Diagnostics.register_provider(&"bootstrap", _diagnostic_snapshot)
	Diagnostics.info("runtime.ready")
	_refresh()

func _refresh() -> void:
	var active := Packages.active_packages()
	status.text = "Runtime: Godot %s\nАктивных пакетов: %d\nДиагностика: включена" % [
		Engine.get_version_info().get("string", "unknown"),
		active.size()
	]

func _import_package() -> void:
	var err := LocalImport.choose_package(_on_file_selected)
	if err != OK:
		Diagnostics.error("packages.file_dialog_failed", {"error": err})
		status.text = "Не удалось открыть выбор файла: %s" % err

func _on_file_selected(ok: bool, paths: PackedStringArray, _filter_index: int) -> void:
	if not ok or paths.is_empty(): return
	var path := paths[0]
	Diagnostics.info("packages.local_file_selected", {"path": path})
	var result := Packages.install_archive(path)
	if result.ok:
		status.text = "Пакет установлен: %s@%s" % [result.package.id, result.package.version]
	else:
		status.text = "Пакет отклонён на этапе %s:\n%s" % [result.get("stage", "unknown"), result.get("errors", result.get("error", "unknown error"))]

func _export_diagnostics() -> void:
	var path := "user://eirdan-diagnostics.json"
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		status.text = "Не удалось записать диагностику."
		return
	file.store_string(Diagnostics.export_json())
	Diagnostics.info("diagnostics.exported", {"path": path})
	status.text = "Диагностика сохранена:\n%s" % path

func _diagnostic_snapshot() -> Dictionary:
	return {"scene": "bootstrap", "active_packages": Packages.active_packages().size()}
