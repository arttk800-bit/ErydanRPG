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
	_reload_data()
	_refresh()

func _refresh() -> void:
	var active := Packages.active_packages()
	var speed = DataRegistry.resolve("travel.walk_speed_kmh", "?")
	var damage = DataRegistry.resolve("items.iron_sword.damage", "?")
	var speed_source := _final_source(DataRegistry.provenance("travel.walk_speed_kmh"))
	var damage_source := _final_source(DataRegistry.provenance("items.iron_sword.damage"))
	status.text = "Runtime: Godot %s\nАктивных пакетов: %d\nСкорость пешком: %s км/ч  [%s]\nУрон железного меча: %s  [%s]\nДиагностика: включена" % [
		Engine.get_version_info().get("string", "unknown"),
		active.size(), speed, speed_source, damage, damage_source
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
		_reload_data()
		_refresh()
		Diagnostics.info("runtime.package_applied", {"id": result.package.id, "version": result.package.version})
	else:
		status.text = "Пакет отклонён на этапе %s:\n%s" % [result.get("stage", "unknown"), result.get("errors", result.get("error", "unknown error"))]

func _export_diagnostics() -> void:
	var filters := PackedStringArray(["*.json;Eirdan diagnostics;application/json"])
	var err := DisplayServer.file_dialog_show(
		"Export Eirdan diagnostics",
		"",
		"eirdan-diagnostics.json",
		false,
		DisplayServer.FILE_DIALOG_MODE_SAVE_FILE,
		filters,
		_on_diagnostics_destination
	)
	if err != OK:
		Diagnostics.error("diagnostics.file_dialog_failed", {"error": err})
		status.text = "Не удалось открыть сохранение диагностики: %s" % err

func _on_diagnostics_destination(ok: bool, paths: PackedStringArray, _filter_index: int) -> void:
	if not ok or paths.is_empty(): return
	var path := paths[0]
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		Diagnostics.error("diagnostics.write_failed", {"path": path, "error": FileAccess.get_open_error()})
		status.text = "Не удалось записать диагностику."
		return
	file.store_string(Diagnostics.export_json())
	file.flush()
	Diagnostics.info("diagnostics.exported", {"path": path})
	status.text = "Диагностика экспортирована."

func _diagnostic_snapshot() -> Dictionary:
	return {"scene": "bootstrap", "active_packages": Packages.active_packages().size()}

func _reload_data() -> void:
	DataRegistry.reload_active_packages(Packages.active_packages())

func _final_source(entries: Array[Dictionary]) -> String:
	if entries.is_empty(): return "нет данных"
	return str(entries.back().get("source", "unknown"))
