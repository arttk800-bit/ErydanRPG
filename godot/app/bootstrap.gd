# ============================================================================
# RUNTIME BOOTSTRAP
# Composes the first playable World -> Map -> Roads -> Travel vertical slice.
# Presentation forwards actions; domain modules remain authoritative.
# ============================================================================
extends Control

const LocalImport = preload("res://packages/local_import.gd")
const GameModuleCatalog = preload("res://modules/game_module_catalog.gd")

@onready var status: Label = $TopBar/Status
@onready var regional_map = $RegionalMap

var _state: Dictionary = {
	"meta": {"state_version": 1, "world_id": "vertical-slice", "world_name": "Эйрдан"},
	"world": {}
}

func _ready() -> void:
	if "--package-installer-test" in OS.get_cmdline_user_args():
		get_tree().change_scene_to_file("res://tests/package_installer_test.tscn")
		return
	$TopBar/Reload.pressed.connect(_reload_runtime)
	$TopBar/Import.pressed.connect(_import_package)
	$TopBar/Diagnostics.pressed.connect(_export_diagnostics)
	Diagnostics.register_provider(&"bootstrap", _diagnostic_snapshot)
	_reload_data()
	_start_gameplay()

func _start_gameplay() -> void:
	var region := DataRegistry.region("forest")
	if region.is_empty():
		status.text = "Ошибка: данные Центральных земель не загружены"
		return
	if Modules.snapshot().registered == 0:
		var registered := GameModuleCatalog.register_foundation(Modules)
		if not registered.ok:
			status.text = "Ошибка регистрации модулей: %s" % registered.get("errors", [])
			return
	var configured := Modules.configure({})
	if not configured.ok:
		status.text = "Ошибка конфигурации: %s" % configured.get("errors", [])
		return
	var roads := {"forest": region.roads}
	var started := Modules.start({"state": _state, "roads": roads})
	if not started.ok:
		status.text = "Ошибка запуска: %s" % started.get("errors", [])
		return
	regional_map.setup(region, Modules.instance("world"), Modules.instance("roads"), Modules.instance("travel"))
	status.text = "Центральные земли · нажмите на точку для путешествия"
	Diagnostics.info("runtime.vertical_slice_ready", {"region": "forest", "modules": started.active})

func _reload_runtime() -> void:
	_reload_data()
	Modules.stop()
	_start_gameplay()

func _import_package() -> void:
	var err := LocalImport.choose_package(_on_file_selected)
	if err != OK: status.text = "Не удалось открыть выбор файла: %s" % err

func _on_file_selected(ok: bool, paths: PackedStringArray, _filter_index: int) -> void:
	if not ok or paths.is_empty(): return
	var result := Packages.install_archive(paths[0])
	if result.ok:
		_reload_runtime()
	else:
		status.text = "Пакет отклонён: %s" % result.get("errors", result.get("error", "unknown error"))

func _export_diagnostics() -> void:
	var filters := PackedStringArray(["*.json;Eirdan diagnostics;application/json"])
	var err := DisplayServer.file_dialog_show("Export Eirdan diagnostics", "", "eirdan-diagnostics.json", false, DisplayServer.FILE_DIALOG_MODE_SAVE_FILE, filters, _on_diagnostics_destination)
	if err != OK: status.text = "Не удалось открыть сохранение диагностики: %s" % err

func _on_diagnostics_destination(ok: bool, paths: PackedStringArray, _filter_index: int) -> void:
	if not ok or paths.is_empty(): return
	var file := FileAccess.open(paths[0], FileAccess.WRITE)
	if file == null:
		status.text = "Не удалось записать диагностику."
		return
	file.store_string(Diagnostics.export_json())
	file.flush()
	Diagnostics.info("diagnostics.exported", {"path": paths[0]})
	status.text = "Диагностика экспортирована."

func _diagnostic_snapshot() -> Dictionary:
	return {"scene": "regional_vertical_slice", "modules": Modules.snapshot(), "world": _state.get("world", {}).duplicate(true)}

func _reload_data() -> void:
	DataRegistry.reload_active_packages(Packages.active_packages())
