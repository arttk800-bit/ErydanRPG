# Runtime smoke for shell composition, return navigation and structural screens.
extends Node

const BootstrapScene = preload("res://app/bootstrap.tscn")
var failures := 0

func _ready() -> void:
	var app = BootstrapScene.instantiate()
	app.set_meta("skip_test_redirect", true)
	add_child(app)
	await get_tree().process_frame
	var shell = app.get_node("GameShell")
	var map_surface = app.get_node("MapSurface")
	var regional_map = app.get_node("MapSurface/MapViewport/RegionalMap")
	_expect(app.get_node("MainMenu").visible and not shell.visible, "main menu owns startup composition")
	var actions: Control = app.get_node("MainMenu/Center/Actions")
	var viewport_center := get_viewport().get_visible_rect().size * 0.5
	_expect(actions.get_global_rect().get_center().distance_to(viewport_center) < 2.0, "main menu is centered in logical safe area")
	_expect(app.get_node("GameShell/Layout/ContentHost/Screens/Character/Body/Empty").get_script() == null, "character placeholder has no toast script")
	_expect(app.get_node("GameShell/SystemMenu/Content").get_children().filter(func(node): return node.name == "MainMenu").size() == 1, "system menu has one main menu action")
	app.call("_start_gameplay")
	await get_tree().process_frame
	_expect(shell.visible and shell.get_node("Layout/Top").visible and shell.get_node("Layout/BottomNav").visible, "world shows shell and bottom navigation")
	_expect(regional_map.get_viewport() != app.get_viewport(), "map camera is isolated in a subviewport")
	_expect(regional_map.has_method("_process") and regional_map.get_node("HUD/Journey/Margin/Content/Actions/Follow") != null, "map has live travel presentation and follow control")
	var touch_press := InputEventScreenTouch.new()
	touch_press.index = 0
	touch_press.position = Vector2(320, 280)
	touch_press.pressed = true
	app.call("_input", touch_press)
	var touch_release := InputEventScreenTouch.new()
	touch_release.index = 0
	touch_release.position = touch_press.position
	touch_release.pressed = false
	app.call("_input", touch_release)
	_expect(regional_map.diagnostic_snapshot().input_counts.touch_press == 1, "root forwards touch input into map subviewport")
	shell.toggle_system_menu()
	app.call("_input", touch_press)
	_expect(regional_map.diagnostic_snapshot().input_counts.touch_press == 1, "system menu blocks map input")
	shell.toggle_system_menu()
	app.call("_show_structural_screen", "character")
	shell.handle_back()
	_expect(shell.active_screen() == "world" and map_surface.visible, "character Back returns to world")
	app.call("_show_structural_screen", "character")
	app.call("_open_settings", true)
	shell.handle_back()
	_expect(shell.active_screen() == "character", "settings Back returns to opening screen")
	app.call("_show_world")
	shell.handle_back()
	_expect(shell.get_node("SystemMenu").visible, "world Back opens system menu")
	shell.handle_back()
	_expect(not shell.get_node("SystemMenu").visible, "Back closes open system menu first")
	_expect(app.get_node("GameShell/Layout/ContentHost/Screens/Settings/Sections").get_child_count() == 5, "settings renders info and four structural sections")
	var events: Array = Diagnostics.snapshot().events
	_expect(events.any(func(event): return event.event == "ui.screen_changed"), "navigation emits diagnostics")
	app.call("_show_main_menu")
	_expect(not map_surface.visible and regional_map.diagnostic_snapshot().touches_active == 0, "hidden map clears input gestures")
	app.notification(NOTIFICATION_WM_GO_BACK_REQUEST)
	_expect(app.get_node("ExitDialog").visible, "main menu Back opens exit confirmation")
	app.queue_free()
	if failures == 0: print("godot ui stabilization integration: OK")
	get_tree().quit(0 if failures == 0 else 1)

func _expect(condition: bool, label: String) -> void:
	if not condition:
		failures += 1
		push_error("ASSERT FAILED: " + label)
