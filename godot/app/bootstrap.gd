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
const RemotePackageService = preload("res://packages/remote_package_service.gd")
const PackageDialog = preload("res://packages/package_dialog.gd")

@onready var status = $Toast
@onready var world_screen = $WorldScreen
@onready var save_browser = $GameShell/Layout/ContentHost/Screens/SaveBrowser
@onready var settings_screen = $GameShell/Layout/ContentHost/Screens/Settings
@onready var map_surface = $MapSurface
@onready var map_viewport: SubViewport = $MapSurface/MapViewport
@onready var regional_map = $MapSurface/MapViewport/RegionalMap
@onready var main_menu = $MainMenu
@onready var game_shell = $GameShell

var _simulation_runtime: Node
var _package_service
var _package_dialog
var _aux_return_screen := "world"

var _state: Dictionary = {
	"meta": {"state_version": 1, "world_id": "vertical-slice", "world_name": "Эйрдан"},
	"world": {}
}

func _ready() -> void:
	theme = EirdanTheme.build()
	if "--updater-test" in OS.get_cmdline_user_args():
		get_tree().change_scene_to_file.call_deferred("res://tests/updater_test.tscn")
		return
	if "--ui-stabilization-test" in OS.get_cmdline_user_args() and not bool(get_meta("skip_test_redirect", false)):
		get_tree().change_scene_to_file.call_deferred("res://tests/ui_stabilization_test.tscn")
		return
	if "--package-installer-test" in OS.get_cmdline_user_args():
		get_tree().change_scene_to_file.call_deferred("res://tests/package_installer_test.tscn")
		return
	main_menu.action_requested.connect(_on_main_menu_action)
	game_shell.system_action.connect(_on_system_action)
	game_shell.back_requested.connect(_handle_shell_back)
	game_shell.world_requested.connect(func(): _show_world())
	game_shell.character_requested.connect(func(): _show_structural_screen("character"))
	game_shell.inventory_requested.connect(func(): _show_structural_screen("inventory"))
	game_shell.journal_requested.connect(func(): _show_structural_screen("journal"))
	_setup_updater()
	_setup_packages()
	world_screen.bind_map_view(map_surface, regional_map)
	save_browser.save_selected.connect(_load_world)
	save_browser.back_requested.connect(_return_from_aux_screen)
	settings_screen.back_requested.connect(_return_from_aux_screen)
	$NewWorldDialog.confirmed.connect(_create_named_world)
	$ExitDialog.confirmed.connect(func(): get_tree().quit())
	Diagnostics.register_provider(&"bootstrap", _diagnostic_snapshot)
	_reload_data()
	_show_main_menu()

func _input(event: InputEvent) -> void:
	if not map_surface.visible or not regional_map.is_processing_input(): return
	if game_shell.active_screen() != "world" or game_shell.system_menu.visible: return
	var update_dialog = get_meta("update_dialog", null)
	if update_dialog != null and update_dialog.visible: return
	if event is InputEventScreenTouch or event is InputEventScreenDrag or event is InputEventMouseButton or event is InputEventMouseMotion:
		map_viewport.push_input(event, false)

func _notification(what: int) -> void:
	if what != NOTIFICATION_WM_GO_BACK_REQUEST: return
	var update_dialog = get_meta("update_dialog", null)
	if update_dialog != null and update_dialog.visible:
		update_dialog.hide()
		Diagnostics.info("ui.back", {"handled_by": "update_dialog"})
		return
	if _package_dialog != null and _package_dialog.visible:
		_package_dialog.hide()
		Diagnostics.info("ui.back", {"handled_by": "package_dialog"})
		return
	if $NewWorldDialog.visible:
		$NewWorldDialog.hide()
		Diagnostics.info("ui.back", {"handled_by": "new_world_dialog"})
		return
	if $ExitDialog.visible:
		$ExitDialog.hide()
		Diagnostics.info("ui.back", {"handled_by": "exit_dialog"})
		return
	if not main_menu.visible:
		var before: String = str(game_shell.active_screen())
		game_shell.handle_back()
		Diagnostics.info("ui.back", {"handled_by": "game_shell", "screen_before": before, "screen_after": game_shell.active_screen()})
		return
	$ExitDialog.popup_centered()
	Diagnostics.info("ui.back", {"handled_by": "main_menu", "exit_confirmation": true})

func _start_gameplay() -> void:
	main_menu.visible = false
	world_screen.set_active(true)
	game_shell.set_world_active(true)
	game_shell.show_screen("world")
	var region := DataRegistry.region("forest")
	if region.is_empty():
		status.show_message("Ошибка: данные Центральных земель не загружены", 0.0)
		return
	if Modules.snapshot().registered == 0:
		var registered := GameModuleCatalog.register_foundation(Modules)
		if not registered.ok:
			status.show_message("Ошибка регистрации модулей: %s" % registered.get("errors", []), 0.0)
			return
	var configured := Modules.configure({})
	if not configured.ok:
		status.show_message("Ошибка конфигурации: %s" % configured.get("errors", []), 0.0)
		return
	var roads := {"forest": region.roads}
	var started := Modules.start({"state": _state, "roads": roads})
	if not started.ok:
		status.show_message("Ошибка запуска: %s" % started.get("errors", []), 0.0)
		return
	var world = Modules.instance("world")
	_initialize_new_world_if_needed(region, world)
	var simulation = Modules.instance("simulation")
	var travel = Modules.instance("travel")
	var travel_events = Modules.instance("travel_events")
	_simulation_runtime = SimulationRuntime.new()
	add_child(_simulation_runtime)
	_simulation_runtime.setup(simulation, travel, travel_events, region)
	regional_map.setup(region, world, Modules.instance("roads"), travel, travel_events, simulation, DataRegistry.region_asset(str(region.region_id), "background"))
	status.clear()
	Diagnostics.info("runtime.vertical_slice_ready", {"region": "forest", "modules": started.active})

func _setup_updater() -> void:
	var updater := AndroidUpdater.new()
	add_child(updater)
	var update_dialog := UpdateDialog.new()
	update_dialog.updater = updater
	update_dialog.save_callback = _save_for_update
	add_child(update_dialog)
	set_meta("update_dialog", update_dialog)

func _setup_packages() -> void:
	_package_service = RemotePackageService.new()
	add_child(_package_service)
	_package_dialog = PackageDialog.new()
	add_child(_package_dialog)
	_package_dialog.bind(_package_service)
	_package_dialog.local_import_requested.connect(_import_package)
	_package_service.operation_finished.connect(_on_remote_package_operation)

func _open_packages() -> void:
	regional_map.set_input_active(false)
	_package_dialog.open()
	_package_dialog.visibility_changed.connect(func():
		if not _package_dialog.visible and map_surface.visible: regional_map.set_input_active(true)
	, CONNECT_ONE_SHOT)

func _on_remote_package_operation(result: Dictionary) -> void:
	if not result.get("ok", false) or result.get("action") != "install": return
	if result.get("apply") == "scene" and not main_menu.visible: _reload_runtime()
	_package_dialog.refresh_installed()
	var package: Dictionary = result.get("package", {})
	status.show_message("Пакет установлен: %s" % package.get("title", package.get("id", "")))

func _on_main_menu_action(action: String) -> void:
	match action:
		"new_game":
			$NewWorldDialog/Content/Name.text = ""
			$NewWorldDialog.popup_centered()
		"continue": _continue_last_save()
		"load": _open_save_browser(false)
		"updates": _open_updates()
		"settings": _open_settings(false)

func _create_named_world() -> void:
	var world_name: String = str($NewWorldDialog/Content/Name.text).strip_edges()
	if world_name.is_empty(): world_name = "Эйрдан"
	var world_id := "world-%d" % Time.get_unix_time_from_system()
	_state = {"meta": {"state_version": 1, "world_id": world_id, "world_name": world_name}, "world": {}}
	Diagnostics.info("world.created", {"world_id": world_id, "world_name": world_name})
	_start_gameplay()

func _continue_last_save() -> void:
	var saves: Array = SaveStore.list_saves()
	if saves.is_empty():
		status.show_message("Нет доступных сохранений")
		return
	var selected: Dictionary = saves[0]
	var world_id := str(selected.get("world_id", ""))
	if world_id.is_empty():
		status.show_message("Сохранение не содержит идентификатор мира")
		return
	_load_world(world_id)

func _load_world(world_id: String) -> void:
	var result := SaveStore.load_state(world_id)
	if not result.ok:
		status.show_message("Ошибка загрузки: %s" % result.get("errors", []), 0.0)
		return
	_stop_simulation_runtime()
	Modules.stop()
	_state = result.state
	_reload_data()
	_start_gameplay()
	status.show_message("Мир загружен")

func _on_system_action(action: String) -> void:
	match action:
		"save": _save_game()
		"load": _open_save_browser(true)
		"update": _open_updates()
		"packages": _open_packages()
		"diagnostics": _export_diagnostics()
		"settings": _open_settings(true)
		"main_menu": _show_main_menu()

func _show_main_menu() -> void:
	_stop_simulation_runtime()
	Modules.stop()
	world_screen.set_active(false)
	game_shell.set_shell_visible(false, false)
	main_menu.visible = true
	main_menu.set_continue_available(not SaveStore.list_saves().is_empty())
	status.clear()

func _show_world() -> void:
	world_screen.set_active(true)
	game_shell.set_shell_visible(true, true)
	game_shell.show_screen("world")
	status.clear()

func _show_structural_screen(screen_id: String) -> void:
	world_screen.set_active(false)
	game_shell.set_shell_visible(true, true)
	game_shell.show_screen(screen_id)
	status.clear()

func _return_to_world() -> void:
	_show_world()

func _handle_shell_back() -> void:
	if game_shell.active_screen() in ["save_browser", "settings"]:
		_return_from_aux_screen()
	else:
		_return_to_world()

func _open_save_browser(from_game: bool) -> void:
	_aux_return_screen = game_shell.active_screen() if from_game else "main_menu"
	world_screen.set_active(false)
	main_menu.visible = false
	game_shell.set_shell_visible(true, from_game)
	game_shell.show_screen("save_browser")
	save_browser.set_meta("return_to_game", from_game)
	save_browser.refresh(SaveStore.list_saves())
	status.clear()

func _open_settings(from_game: bool) -> void:
	_aux_return_screen = game_shell.active_screen() if from_game else "main_menu"
	world_screen.set_active(false)
	main_menu.visible = false
	game_shell.set_shell_visible(true, from_game)
	game_shell.show_screen("settings")
	settings_screen.set_meta("return_to_game", from_game)
	status.clear()

func _return_from_aux_screen() -> void:
	var screen = save_browser if save_browser.visible else settings_screen
	if not bool(screen.get_meta("return_to_game", false)):
		_show_main_menu()
		return
	if _aux_return_screen == "world": _show_world()
	else: _show_structural_screen(_aux_return_screen)

func _open_updates() -> void:
	var update_dialog = get_meta("update_dialog", null)
	if update_dialog == null: return
	regional_map.set_input_active(false)
	update_dialog.popup_centered()
	update_dialog.visibility_changed.connect(func():
		if not update_dialog.visible and map_surface.visible: regional_map.set_input_active(true)
	, CONNECT_ONE_SHOT)

func _initialize_new_world_if_needed(region: Dictionary, world) -> void:
	var position: Dictionary = world.current_position()
	if not str(position.get("point_id", "")).is_empty(): return
	var start: Dictionary = {}
	for point in region.get("points", []):
		if point is Dictionary and str(point.get("id", "")) == "veligrad":
			start = point
			break
	if not start.is_empty(): world.initialize_at(str(region.region_id), start)

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
		status.show_message("Мир сохранён")
	else:
		status.show_message("Ошибка сохранения: %s" % result.get("errors", []), 0.0)

func _load_game() -> void:
	var world_id := str(_state.get("meta", {}).get("world_id", ""))
	if world_id.is_empty():
		status.show_message("Нет активного мира для загрузки")
		return
	_load_world(world_id)

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
	if err != OK: status.show_message("Не удалось открыть выбор файла: %s" % err, 0.0)

func _on_file_selected(ok: bool, paths: PackedStringArray, _filter_index: int) -> void:
	if not ok or paths.is_empty(): return
	var result := Packages.install_archive(paths[0])
	if result.ok:
		_reload_runtime()
		if _package_dialog != null: _package_dialog.refresh_installed()
	else: status.show_message("Пакет отклонён: %s" % result.get("errors", result.get("error", "unknown error")), 0.0)

func _export_diagnostics() -> void:
	var filters := PackedStringArray(["*.json;Eirdan diagnostics;application/json"])
	var err := DisplayServer.file_dialog_show("Export Eirdan diagnostics", "", "eirdan-diagnostics.json", false, DisplayServer.FILE_DIALOG_MODE_SAVE_FILE, filters, _on_diagnostics_destination)
	if err != OK: status.show_message("Не удалось открыть сохранение диагностики: %s" % err, 0.0)

func _on_diagnostics_destination(ok: bool, paths: PackedStringArray, _filter_index: int) -> void:
	if not ok or paths.is_empty(): return
	var file := FileAccess.open(paths[0], FileAccess.WRITE)
	if file == null:
		status.show_message("Не удалось записать диагностику.", 0.0)
		return
	file.store_string(Diagnostics.export_json())
	file.flush()
	Diagnostics.info("diagnostics.exported", {"path": paths[0]})
	status.show_message("Диагностика экспортирована.")

func _diagnostic_snapshot() -> Dictionary:
	return {"scene": "regional_vertical_slice", "active_screen": game_shell.active_screen(), "modules": Modules.snapshot(), "world": _state.get("world", {}).duplicate(true)}

func _reload_data() -> void:
	DataRegistry.reload_active_packages(Packages.active_packages())
