# ============================================================================
# RUNTIME BOOTSTRAP
# Composes the first playable World -> Map -> Roads -> Travel vertical slice.
# Presentation forwards actions; domain modules remain authoritative.
# ============================================================================
extends Control

const LocalImport = preload("res://packages/local_import.gd")
const GameModuleCatalog = preload("res://modules/game_module_catalog.gd")
const AndroidUpdater = preload("res://update/android_updater.gd")
const UpdateDialog = preload("res://update/update_dialog.gd")
const SimulationRuntime = preload("res://simulation/simulation_runtime.gd")
const EirdanTheme = preload("res://ui/eirdan_theme.gd")

@onready var status: Label = $HUD/TopBar/Status
@onready var regional_map = $RegionalMap

var _simulation_runtime: Node

var _state: Dictionary = {
	"meta": {"state_version": 1, "world_id": "vertical-slice", "world_name": "Эйрдан"},
	"world": {}
}

func _ready() -> void:
	theme = EirdanTheme.build()
	if "--updater-test" in OS.get_cmdline_user_args():
		get_tree().change_scene_to_file.call_deferred("res://tests/updater_test.tscn")
		return
	if "--package-installer-test" in OS.get_cmdline_user_args():
		get_tree().change_scene_to_file.call_deferred("res://tests/package_installer_test.tscn")
		return
	$HUD/TopBar/Reload.pressed.connect(_reload_runtime)
	$HUD/TopBar/Import.pressed.connect(_import_package)
	$HUD/TopBar/Save.pressed.connect(_save_game)
	$HUD/TopBar/Load.pressed.connect(_load_game)
	$HUD/TopBar/Diagnostics.pressed.connect(_export_diagnostics)
	var updater := AndroidUpdater.new()
	add_child(updater)
	var update_dialog := UpdateDialog.new()
	update_dialog.updater = updater
	update_dialog.save_callback = _save_for_update
	add_child(update_dialog)
	$HUD/TopBar/Update.pressed.connect(func():
		regional_map.set_process_input(false)
		update_dialog.popup_centered()
	)
	update_dialog.visibility_changed.connect(func():
		if not update_dialog.visible: regional_map.set_process_input(true)
	)
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
	var world = Modules.instance("world")
	_initialize_new_world_if_needed(region, world)
	var simulation = Modules.instance("simulation")
	var travel = Modules.instance("travel")
	_simulation_runtime = SimulationRuntime.new()
	add_child(_simulation_runtime)
	_simulation_runtime.setup(simulation, travel, region)
	regional_map.setup(region, world, Modules.instance("roads"), travel, simulation, DataRegistry.region_asset(str(region.region_id), "background"))
	status.text = "Центральные земли · нажмите на точку для путешествия"
	Diagnostics.info("runtime.vertical_slice_ready", {"region": "forest", "modules": started.active})

func _initialize_new_world_if_needed(region: Dictionary, world) -> void:
	var position: Dictionary = world.current_position()
	if not str(position.get("point_id", "")).is_empty(): return
	var start: Dictionary = {}
	for point in region.get("points", []):
		if point is Dictionary and str(point.get("id", "")) == "veligrad":
			start = point
			break
	if not start.is_empty():
		world.initialize_at(str(region.region_id), start)

func _reload_runtime() -> void:
	_reload_data()
	_stop_simulation_runtime()
	Modules.stop()
	_start_gameplay()

func _save_game() -> void:
	var result := SaveStore.save_state(_state)
	if result.ok:
		var saved_meta: Dictionary = result.state.get("meta", {})
		_state["meta"] = saved_meta.duplicate(true)
		status.text = "Мир сохранён"
	else:
		status.text = "Ошибка сохранения: %s" % result.get("errors", [])

func _load_game() -> void:
	var world_id := str(_state.get("meta", {}).get("world_id", ""))
	var result := SaveStore.load_state(world_id)
	if not result.ok:
		status.text = "Ошибка загрузки: %s" % result.get("errors", [])
		return
	_stop_simulation_runtime()
	Modules.stop()
	_state = result.state
	_reload_data()
	_start_gameplay()
	status.text = "Мир загружен"

func _stop_simulation_runtime() -> void:
	if _simulation_runtime == null: return
	_simulation_runtime.shutdown()
	_simulation_runtime.queue_free()
	_simulation_runtime = null

func _save_for_update() -> Dictionary:
	var result := SaveStore.save_state(_state)
	if result.ok: _state["meta"] = result.state.get("meta", {}).duplicate(true)
	return {"ok": result.ok}

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
